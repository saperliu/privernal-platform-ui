<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue';
import {
  ElAlert as __forwarded_ElAlert,
  ElButton as __forwarded_ElButton,
  ElCard as __forwarded_ElCard,
  ElDialog as __forwarded_ElDialog,
  ElDrawer as __forwarded_ElDrawer,
  ElForm as __forwarded_ElForm,
  ElFormItem as __forwarded_ElFormItem,
  ElInput as __forwarded_ElInput,
  ElInputNumber as __forwarded_ElInputNumber,
  ElPopconfirm as __forwarded_ElPopconfirm,
  ElRadioButton as __forwarded_ElRadioButton,
  ElRadioGroup as __forwarded_ElRadioGroup,
  ElSelect as __forwarded_ElSelect,
  ElSwitch as __forwarded_ElSwitch,
  ElTag as __forwarded_ElTag
} from 'element-plus';
import dayjs from 'dayjs';
import { findDynamicFormDetail, findDynamicFormList } from '@/service/api/dynamic/dynamic-form';
import {
  createLinkageRule,
  deleteLinkageRule,
  dryRunLinkageRule,
  fetchLinkageLogs,
  fetchLinkageRules,
  previewCronNext,
  updateLinkageRule,
  updateLinkageRuleStatus
} from '@/service/api/dynamic/advanced';
import { collectFormFieldOptions } from '@/components/business/form-field-options';
import ConditionGroups from './condition-groups.vue';

const props = defineProps<{
  form: { formId: string; tableCode: string; fieldOptions: Array<{ label: string; value: string }> };
}>();
const rules = ref<AdvancedNamespace.LinkageRule[]>([]);
const drawerVisible = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);
const dryRunVisible = ref(false);
const dryRunDataId = ref('');
const dryRunResult = ref<AdvancedNamespace.DryRunResult | null>(null);
const dryRunLoading = ref(false);
const logVisible = ref(false);
const logRows = ref<Array<Record<string, any>>>([]);
const logTotal = ref(0);
const logPage = ref(1);
const logRuleId = ref<string | null>(null);

/** 目标表单候选（动作的 targetFormId） */
const formOptions = ref<Array<{ label: string; value: string }>>([]);

/** 目标表单字段下拉缓存：动作的目标字段/定位条件字段与所选目标表单同口径，按 formId 懒加载 */
const targetFields = reactive<Record<string, { loading: boolean; options: Array<{ label: string; value: string }> }>>(
  {}
);

async function ensureTargetFields(formId: string) {
  if (!formId || targetFields[formId]) return;
  // 目标=本表单时直接复用设计器解析好的字段，免一次详情请求
  if (formId === props.form.formId) {
    targetFields[formId] = {
      loading: false,
      options: props.form.fieldOptions.map(option => ({ label: option.label, value: option.value }))
    };
    return;
  }
  targetFields[formId] = { loading: true, options: [] };
  try {
    const { data, error } = await findDynamicFormDetail(formId);
    if (error === null && data) {
      targetFields[formId] = {
        loading: false,
        options: collectFormFieldOptions((data as any)?.metaData).map(option => ({
          label: option.label,
          value: option.value
        }))
      };
    } else {
      // 失败清缓存允许重试；下拉兜底出本表单字段会诱导配错，宁可留空提示
      delete targetFields[formId];
      window.$message?.warning('目标表单字段加载失败，请重新打开动作配置重试');
    }
  } catch {
    delete targetFields[formId];
  }
}

function targetFieldOptionsOf(action: AdvancedNamespace.LinkageAction) {
  return targetFields[action.config?.targetFormId]?.options ?? [];
}

/** 切换目标表单后清掉以旧表单口径选择的字段/条件行，避免残留无效字段编码 */
function handleTargetFormChange(action: AdvancedNamespace.LinkageAction) {
  const config = action.config ?? {};
  (config.set ?? []).forEach((item: Record<string, any>) => {
    item.field = '';
  });
  (config.fields ?? []).forEach((item: Record<string, any>) => {
    item.field = '';
  });
  (config.conditionModel?.groups ?? []).forEach((group: any) => {
    (group.rows ?? []).forEach((row: any) => {
      row.field = '';
    });
  });
  ensureTargetFields(config.targetFormId);
}

const EVENT_OPTIONS = [
  { label: '新增数据', value: 'CREATE' },
  { label: '更新数据', value: 'UPDATE' },
  { label: '删除数据', value: 'DELETE' },
  { label: '流程完成（生效）', value: 'EFFECTIVE' },
  { label: '定时触发', value: 'TIMER' },
  { label: '数据到期（按日期字段）', value: 'DATE_FIELD' }
];

/** 条件组模型工厂与两层条件树互转（保存/回显） */
function newConditionModel(): AdvancedNamespace.ConditionModel {
  return { groupLogic: 'AND', groups: [{ logic: 'AND', rows: [] }] };
}

function isLeafNode(node: any) {
  if (node === null || node === undefined) return false;
  return node.field !== undefined && !Array.isArray(node.children);
}

function rowsFromLeaves(nodes: any[]): AdvancedNamespace.ConditionRow[] {
  return nodes.map((leaf: any) => ({
    field: leaf.field ?? '',
    cmp: leaf.cmp ?? 'EQ',
    value: Array.isArray(leaf.value) ? JSON.stringify(leaf.value) : String(leaf.value ?? '')
  }));
}

/** 两层条件组模型 → 嵌套条件树；单组时退化为与旧结构一致的单层形态 */
function buildTreeFromModel(model: AdvancedNamespace.ConditionModel | null | undefined) {
  if (!model) return null;
  const groupNodes = model.groups
    .map(group => {
      const leaves = group.rows.filter(row => row.field && row.cmp).map(toConditionLeaf);
      if (!leaves.length) return null;
      if (leaves.length === 1) return leaves[0];
      return { op: group.logic, children: leaves };
    })
    .filter(Boolean);
  if (!groupNodes.length) return null;
  if (groupNodes.length === 1) return groupNodes[0];
  return { op: model.groupLogic, children: groupNodes };
}

function toConditionLeaf(row: { field: string; cmp: string; value: string }) {
  let value: any = row.value;
  if (row.cmp === 'IN') {
    try {
      value = JSON.parse(row.value || '[]');
    } catch {
      value = row.value ? row.value.split(',').map(part => part.trim()) : [];
    }
  } else if (row.value.startsWith('{{')) {
    value = row.value;
  } else if (row.value !== '' && !Number.isNaN(Number(row.value))) {
    value = Number(row.value);
  }
  return { field: row.field, cmp: row.cmp, value };
}

/**
 * 条件树 → 两层条件组编辑模型。兼容旧单层 {op, children:[叶子]} 与单叶子形态；
 * 超过两层的深层嵌套按两层近似展开并提示（保存后原深层结构被覆盖）。
 */
function groupsFromTree(tree: any): AdvancedNamespace.ConditionModel {
  if (!tree || typeof tree !== 'object') return newConditionModel();
  if (isLeafNode(tree)) {
    return { groupLogic: 'AND', groups: [{ logic: 'AND', rows: rowsFromLeaves([tree]) }] };
  }
  const children: any[] = Array.isArray(tree.children) ? tree.children : [];
  if (!children.length) return newConditionModel();
  const leaves = children.filter(isLeafNode);
  const groupNodes = children.filter(node => !isLeafNode(node));
  if (!groupNodes.length) {
    return { groupLogic: 'AND', groups: [{ logic: tree.op === 'OR' ? 'OR' : 'AND', rows: rowsFromLeaves(leaves) }] };
  }
  const hasDeepNesting = groupNodes.some(
    (node: any) => Array.isArray(node.children) && node.children.some((child: any) => !isLeafNode(child))
  );
  if (hasDeepNesting) {
    window.$message?.warning('该规则的条件嵌套超过两层，已按两层近似载入，保存后原深层结构将被覆盖');
  }
  const groups: AdvancedNamespace.ConditionGroup[] = [];
  // 混合子节点按原始顺序还原：裸叶子合并成一个组，插到第一个叶子出现的位置（单行组保存时塌缩为裸叶子）
  const pendingLeaves: any[] = [];
  let leafInsertIndex = -1;
  for (const child of children) {
    if (isLeafNode(child)) {
      if (leafInsertIndex < 0) {
        leafInsertIndex = groups.length;
      }
      pendingLeaves.push(child);
    } else {
      const inner = Array.isArray(child.children) ? (child.children as any[]) : [];
      const innerLeaves = inner.filter(isLeafNode);
      const deepLeaves = inner
        .filter((c: any) => !isLeafNode(c))
        .flatMap((c: any) => (Array.isArray(c.children) ? c.children.filter(isLeafNode) : []));
      groups.push({ logic: child.op === 'OR' ? 'OR' : 'AND', rows: rowsFromLeaves([...innerLeaves, ...deepLeaves]) });
    }
  }
  if (pendingLeaves.length) {
    const leafGroup: AdvancedNamespace.ConditionGroup = {
      logic: tree.op === 'OR' ? 'OR' : 'AND',
      rows: rowsFromLeaves(pendingLeaves)
    };
    groups.splice(leafInsertIndex < 0 ? groups.length : leafInsertIndex, 0, leafGroup);
  }
  return { groupLogic: tree.op === 'OR' ? 'OR' : 'AND', groups };
}

/** DATE_FIELD 的到期字段候选：日期类输入组件（date-picker/datetime 及 filedType 含 date/time 的） */
const dateFieldOptions = computed(() =>
  props.form.fieldOptions
    .filter(option => {
      const t = String((option as any).type ?? '').toLowerCase();
      return t.includes('date') || t.includes('time');
    })
    .map(option => ({ label: option.label, value: option.value }))
);

const draft = ref(buildDraft());

function buildDraft() {
  return {
    ruleCode: '',
    name: '',
    eventType: 'CREATE' as AdvancedNamespace.LinkageRule['eventType'] | 'DATE_FIELD',
    watchFields: [] as string[],
    cron: '0 0 9 * * ?',
    dateField: '',
    offsetDays: 0,
    windowDays: 30,
    targetMode: 'PER_ROW' as 'PER_ROW' | 'WHOLE_TABLE',
    enabled: 'Y' as 'Y' | 'N',
    asyncMode: 'ASYNC' as 'ASYNC' | 'SYNC',
    failPolicy: 'CONTINUE' as 'CONTINUE' | 'ABORT',
    condition: newConditionModel(),
    actions: [] as AdvancedNamespace.LinkageAction[]
  };
}

function newAction(type: AdvancedNamespace.LinkageAction['type']) {
  if (type === 'DATA_UPDATE') {
    return {
      type,
      config: { targetFormId: '', set: [], conditionTree: null, conditionModel: newConditionModel() },
      stopOnFail: false
    };
  }
  if (type === 'DATA_CREATE') {
    return { type, config: { targetFormId: '', fields: [] }, stopOnFail: false };
  }
  if (type === 'DATA_DELETE') {
    return {
      type,
      config: { targetFormId: '', conditionTree: null, conditionModel: newConditionModel() },
      stopOnFail: false
    };
  }
  return {
    type,
    config: { receiverType: 'USERS', userIds: [], fieldCode: '', title: '', content: '' },
    stopOnFail: false
  };
}

async function load() {
  const { data, error } = await fetchLinkageRules(props.form.formId);
  if (!error && data) {
    rules.value = data;
  }
}

async function loadFormOptions() {
  const { data } = await findDynamicFormList({ pageNum: 1, pageSize: 200 } as any);
  // 列表接口返回 {list:[...]}（TableResult），兼容 records/数组两种历史形态
  const rows: any[] = Array.isArray(data) ? data : ((data as any)?.list ?? (data as any)?.records ?? []);
  formOptions.value = rows
    .filter((item: any) => item.tableCode)
    .map((item: any) => ({ label: `${item.tableName || item.tableCode}`, value: item.id }));
}

function openCreate() {
  editingId.value = null;
  draft.value = buildDraft();
  // 编码与名称都自动生成，业务人员可直接保存后再改名（名称形如「联动规则_1027-143005」）
  draft.value.ruleCode = `rule_${Date.now().toString(36)}`;
  draft.value.name = `联动规则_${dayjs().format('MMDD-HHmmss')}`;
  drawerVisible.value = true;
}

function openEdit(rule: AdvancedNamespace.LinkageRule) {
  editingId.value = rule.id!;
  const eventConfig = safeParse(rule.eventConfig);
  draft.value = {
    ruleCode: rule.ruleCode,
    name: rule.name,
    eventType: rule.eventType,
    watchFields: eventConfig?.watchFields ?? [],
    cron: eventConfig?.cron ?? '0 0 9 * * ?',
    dateField: eventConfig?.fieldCode ?? '',
    offsetDays: eventConfig?.offsetDays ?? 0,
    windowDays: eventConfig?.windowDays ?? 30,
    targetMode: (eventConfig?.targetMode as 'PER_ROW' | 'WHOLE_TABLE') ?? 'PER_ROW',
    enabled: rule.enabled ?? 'Y',
    asyncMode: rule.asyncMode ?? 'ASYNC',
    failPolicy: rule.failPolicy ?? 'CONTINUE',
    condition: groupsFromTree(safeParse(rule.conditionTree)),
    actions: safeParseActions(rule.actions)
  };
  // 回显动作已有目标表单时预热字段缓存，目标字段/条件下拉才能立刻出选项
  draft.value.actions.forEach(action => {
    if (action.config?.targetFormId) {
      ensureTargetFields(action.config.targetFormId);
    }
  });
  drawerVisible.value = true;
}

function safeParse(text: string | null | undefined) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function safeParseActions(text: string): AdvancedNamespace.LinkageAction[] {
  let parsed: AdvancedNamespace.LinkageAction[] = [];
  try {
    const json = JSON.parse(text || '[]');
    parsed = Array.isArray(json) ? json : [];
  } catch {
    parsed = [];
  }
  // DATA_DELETE / DATA_UPDATE 回显：优先解析持久化的 conditionTree，为空时兜底旧扁平 conditions
  for (const action of parsed) {
    if (action.type === 'DATA_DELETE' || action.type === 'DATA_UPDATE') {
      action.config ??= {};
      const rawTree = action.config.conditionTree;
      const treeObj = typeof rawTree === 'string' ? safeParse(rawTree) : (rawTree ?? null);
      if (treeObj && (isLeafNode(treeObj) || (Array.isArray(treeObj.children) && treeObj.children.length))) {
        action.config.conditionModel = groupsFromTree(treeObj);
      } else if (action.config.conditionModel?.groups?.length) {
        // 条件树为空但存档里有编辑模型（如字段未选完的行）：原样保留，不丢弃
      } else if (
        action.type === 'DATA_DELETE' &&
        Array.isArray(action.config.conditions) &&
        action.config.conditions.length
      ) {
        action.config.conditionModel = {
          groupLogic: 'AND',
          groups: [{ logic: 'AND', rows: rowsFromLeaves(action.config.conditions) }]
        };
      } else {
        action.config.conditionModel = newConditionModel();
      }
    }
  }
  return parsed;
}

/** 动作级条件写回动作配置：DATA_DELETE 强制非空；DATA_UPDATE 留空=作用于目标表全部数据 */
function writeBackActionConditions() {
  for (const action of draft.value.actions) {
    if (action.type === 'DATA_DELETE' || action.type === 'DATA_UPDATE') {
      action.config.conditionTree = buildTreeFromModel(action.config.conditionModel);
      if (!action.config.conditionTree && action.type === 'DATA_DELETE') {
        window.$message?.warning('DATA_DELETE 动作必须配置删除条件（禁配无条件的删除）');
        return false;
      }
    }
  }
  return true;
}

/** 按事件类型组装 eventConfig；返回 null 表示校验未过（已提示） */
function buildEventConfig(): Record<string, any> | null {
  const eventConfig: Record<string, any> = {};
  if (draft.value.eventType === 'UPDATE' && draft.value.watchFields.length) {
    eventConfig.watchFields = draft.value.watchFields;
  }
  if (draft.value.eventType === 'TIMER') {
    eventConfig.cron = draft.value.cron;
    eventConfig.targetMode = draft.value.targetMode;
  }
  if (draft.value.eventType === 'DATE_FIELD') {
    if (!draft.value.dateField) {
      window.$message?.warning('数据到期规则必须选择到期日期字段');
      return null;
    }
    eventConfig.fieldCode = draft.value.dateField;
    eventConfig.offsetDays = draft.value.offsetDays ?? 0;
    eventConfig.windowDays = draft.value.windowDays ?? 30;
  }
  return eventConfig;
}

async function save() {
  if (!draft.value.name || !draft.value.ruleCode) {
    window.$message?.warning('请填写规则名称与编码');
    return;
  }
  if (!draft.value.actions.length) {
    window.$message?.warning('至少配置一个动作');
    return;
  }
  const tree = buildTreeFromModel(draft.value.condition);
  const eventConfig = buildEventConfig();
  if (!eventConfig) {
    return;
  }
  if (!writeBackActionConditions()) {
    return;
  }
  saving.value = true;
  try {
    const payload: AdvancedNamespace.LinkageRule = {
      id: editingId.value ?? undefined,
      formId: props.form.formId,
      ruleCode: draft.value.ruleCode,
      name: draft.value.name,
      eventType: draft.value.eventType,
      enabled: draft.value.enabled,
      asyncMode: draft.value.asyncMode,
      failPolicy: draft.value.failPolicy,
      eventConfig: Object.keys(eventConfig).length ? JSON.stringify(eventConfig) : null,
      conditionTree: tree ? JSON.stringify(tree) : null,
      actions: JSON.stringify(draft.value.actions)
    };
    const { error } = editingId.value ? await updateLinkageRule(payload) : await createLinkageRule(payload);
    if (!error) {
      window.$message?.success('规则已保存，实时生效');
      drawerVisible.value = false;
      await load();
    }
  } finally {
    saving.value = false;
  }
}

async function toggle(rule: AdvancedNamespace.LinkageRule) {
  const { error } = await updateLinkageRuleStatus(rule.id!, rule.enabled === 'Y' ? 'N' : 'Y');
  if (!error) {
    await load();
  } else {
    await load();
  }
}

async function remove(rule: AdvancedNamespace.LinkageRule) {
  const { error } = await deleteLinkageRule(rule.id!);
  if (!error) {
    window.$message?.success('已删除');
    await load();
  }
}

const currentDryRunRule = ref<AdvancedNamespace.LinkageRule | null>(null);

async function openDryRun(rule: AdvancedNamespace.LinkageRule) {
  dryRunDataId.value = '';
  dryRunResult.value = null;
  dryRunVisible.value = true;
  currentDryRunRule.value = rule;
}

async function doDryRun() {
  if (!currentDryRunRule.value?.id || !dryRunDataId.value) {
    window.$message?.warning('请填写要试跑的数据 ID');
    return;
  }
  dryRunLoading.value = true;
  try {
    const { data, error } = await dryRunLinkageRule(currentDryRunRule.value.id, dryRunDataId.value);
    if (!error && data) {
      dryRunResult.value = data;
    }
  } finally {
    dryRunLoading.value = false;
  }
}

const cronPreview = ref<string[]>([]);

async function previewCron() {
  const { data, error } = await previewCronNext(draft.value.cron, 3);
  if (!error && data) {
    cronPreview.value = data;
  } else {
    cronPreview.value = [];
    window.$message?.warning('cron 无法解析：须为 6 位秒级表达式');
  }
}

async function openLogs(rule: AdvancedNamespace.LinkageRule | null) {
  logRuleId.value = rule?.id ?? null;
  logPage.value = 1;
  logVisible.value = true;
  await loadLogs();
}

async function loadLogs() {
  const { data, error } = await fetchLinkageLogs({
    ruleId: logRuleId.value ?? undefined,
    formId: logRuleId.value ? undefined : props.form.formId,
    pageNum: logPage.value,
    pageSize: 15
  });
  if (!error && data) {
    logRows.value = data.rows ?? [];
    logTotal.value = Number(data.total ?? 0);
  }
}

function eventLabel(value: string) {
  return EVENT_OPTIONS.find(option => option.value === value)?.label ?? value;
}

onMounted(() => {
  load();
  loadFormOptions();
});

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElAlert = __forwarded_ElAlert;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElCard = __forwarded_ElCard;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDialog = __forwarded_ElDialog;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDrawer = __forwarded_ElDrawer;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElForm = __forwarded_ElForm;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElFormItem = __forwarded_ElFormItem;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInput = __forwarded_ElInput;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInputNumber = __forwarded_ElInputNumber;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElPopconfirm = __forwarded_ElPopconfirm;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElRadioButton = __forwarded_ElRadioButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElRadioGroup = __forwarded_ElRadioGroup;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSwitch = __forwarded_ElSwitch;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTag = __forwarded_ElTag;

/** 执行记录状态 → 标签色 */
function logStatusTagType(status: string): 'success' | 'warning' | 'info' {
  if (status === 'SUCCESS') return 'success';
  if (status === 'PARTIAL') return 'warning';
  return 'info';
}

/** 日志表列 */
const logColumns = computed<DataTable.Column[]>(() => [
  { title: '时间', key: 'start_time', width: 160 },
  { title: '事件', key: 'event_type', width: 90 },
  { title: '规则', key: 'rule_code', width: 140 },
  { title: '数据ID', key: 'data_id', width: 220, ellipsis: { tooltip: true } },
  {
    title: '条件',
    key: 'condition_pass',
    width: 70,
    render: (row: any) => (row.condition_pass === 'Y' ? '命中' : '未中')
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render: (row: any) => h(ElTag, { size: 'small', type: logStatusTagType(row.status) }, { default: () => row.status })
  },
  { title: '来源', key: 'source_tag', width: 90 },
  { title: '深度', key: 'depth', width: 60 },
  { title: '耗时', key: 'cost_ms', width: 70, render: (row: any) => `${row.cost_ms ?? '-'}ms` },
  { title: '错误', key: 'error_msg', ellipsis: { tooltip: true } }
]);
</script>

<template>
  <div class="linkage-panel">
    <div class="panel-head">
      <span class="head-hint">
        规则 = 事件 + 条件 + 有序动作；业务提交后异步执行（SYNC 模式同事务）；级联深度默认
        1（动作产生的变更不再触发联动）
      </span>
      <div class="head-ops">
        <ElButton size="small" @click="openLogs(null)">执行记录</ElButton>
        <ElButton type="primary" size="small" @click="openCreate">新建规则</ElButton>
      </div>
    </div>

    <ElCard v-for="rule in rules" :key="rule.id" size="small" class="rule-card">
      <div class="rule-row">
        <div class="rule-meta">
          <ElTag size="small" :bordered="false">{{ eventLabel(rule.eventType) }}</ElTag>
          <ElTag v-if="rule.asyncMode === 'SYNC'" size="small" type="warning" :bordered="false">SYNC 同事务</ElTag>
          <span class="rule-name">{{ rule.name }}</span>
          <span class="rule-code">{{ rule.ruleCode }}</span>
        </div>
        <div class="rule-ops">
          <ElButton size="small" @click="openDryRun(rule)">试跑</ElButton>
          <ElButton size="small" @click="openLogs(rule)">日志</ElButton>
          <ElButton size="small" @click="openEdit(rule)">编辑</ElButton>
          <ElSwitch
            :model-value="rule.enabled"
            size="small"
            active-value="Y"
            inactive-value="N"
            @change="toggle(rule)"
          />
          <ElPopconfirm
            title="删除后规则立即失效，确认删除？"
            confirm-button-text="确认"
            cancel-button-text="取消"
            @confirm="remove(rule)"
          >
            <template #reference>
              <ElButton size="small" type="danger">删除</ElButton>
            </template>
          </ElPopconfirm>
        </div>
      </div>
    </ElCard>
    <div v-if="!rules.length" class="empty-hint">还没有联动规则</div>

    <!-- 规则编辑抽屉：宽度对齐表单编辑页的弹出效果，分区块卡片化布局 -->
    <ElDrawer
      v-model="drawerVisible"
      size="72%"
      :title="editingId ? '编辑规则' : '新建规则'"
      class="linkage-rule-drawer"
    >
      <ElForm label-position="left" label-width="110">
        <div class="drawer-section">
          <div class="drawer-section__title">基本信息</div>
          <div class="basic-grid">
            <ElFormItem label="规则名称">
              <ElInput v-model="draft.name" placeholder="如：金额超万通知审批人" />
            </ElFormItem>
            <ElFormItem label="规则编码">
              <ElInput v-model="draft.ruleCode" :disabled="!!editingId" placeholder="[a-z][a-z0-9_]" />
              <span v-if="editingId" class="hint">保存后编码不可改（它是调度与判重键）</span>
            </ElFormItem>
            <ElFormItem label="触发事件" class="basic-grid__full">
              <ElRadioGroup v-model="draft.eventType" :disabled="!!editingId">
                <ElRadioButton v-for="option in EVENT_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
          </div>
          <ElFormItem v-if="draft.eventType === 'EFFECTIVE'" label="说明">
            <span class="hint">
              流程实例完成（状态回写为已完成）时触发；同一流程的完成会同时产生一次 UPDATE 事件，UPDATE
              规则与生效触发的规则会各触发一次
            </span>
          </ElFormItem>
          <ElFormItem v-if="draft.eventType === 'DATE_FIELD'" label="说明">
            <span class="hint">
              数据里的日期字段到期时触发（方案甲：仅注册未来
              {{ 30 }} 天窗口内到期的行，每日自动重算）；字段清空或行删除自动取消任务
            </span>
          </ElFormItem>
          <ElFormItem v-if="draft.eventType === 'TIMER'" label="Cron 表达式">
            <ElInput v-model="draft.cron" placeholder="6 位秒级：秒 分 时 日 月 周" class="w-220px" />
            <ElButton size="small" class="ml-2" @click="previewCron">下 3 次触发</ElButton>
            <span v-if="cronPreview.length" class="hint">即将触发：{{ cronPreview.join(' / ') }}</span>
          </ElFormItem>
          <ElFormItem v-if="draft.eventType === 'TIMER'" label="作用对象">
            <ElRadioGroup v-model="draft.targetMode">
              <ElRadioButton value="PER_ROW">逐条（条件按行判定）</ElRadioButton>
              <ElRadioButton value="WHOLE_TABLE">整表一次（条件应为空）</ElRadioButton>
            </ElRadioGroup>
            <span class="hint">按服务器时区触发；每表单最多 5 条</span>
          </ElFormItem>
          <ElFormItem v-if="draft.eventType === 'DATE_FIELD'" label="到期字段">
            <ElSelect v-model="draft.dateField" clearable placeholder="选择该表的日期字段（数据到期按它计算）">
              <ElOption v-for="opt in dateFieldOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
            <span class="hint">数据写入/更新时自动按此字段值+偏移天数注册到期任务</span>
          </ElFormItem>
          <ElFormItem v-if="draft.eventType === 'DATE_FIELD'" label="偏移天数">
            <ElInputNumber v-model="draft.offsetDays" :min="-3650" :max="3650" class="w-180px">
              <template #suffix>天</template>
            </ElInputNumber>
            <span class="hint">0=字段值当天到期；正数=提前 N 天提醒</span>
          </ElFormItem>
          <ElFormItem v-if="draft.eventType === 'DATE_FIELD'" label="注册窗口">
            <ElInputNumber v-model="draft.windowDays" :min="1" :max="365" class="w-180px">
              <template #suffix>天</template>
            </ElInputNumber>
            <span class="hint">只注册窗口内到期的数据（配额保护）；每日重算兜底补注册/取消</span>
          </ElFormItem>
          <ElAlert v-if="draft.eventType === 'DATE_FIELD'" type="info" :bordered="false">
            到期任务随数据写入自动注册；每日凌晨差量重算兜底补注册/取消。已到期超一天的历史数据不再提醒。
          </ElAlert>
          <ElFormItem v-if="draft.eventType === 'UPDATE'" label="监听字段">
            <ElSelect
              v-model="draft.watchFields"
              multiple
              clearable
              placeholder="不选=任意变更都触发；只监听业务字段时必须选（避免状态回写误触发）"
            >
              <ElOption
                v-for="opt in form.fieldOptions.map(o => ({ label: o.label, value: o.value }))"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            <span class="hint">
              注意：流程完成回写会同时产生一次 UPDATE
              事件——只关心业务字段的规则请显式勾选监听字段，避免流程完成回写造成的重复触发
            </span>
          </ElFormItem>
        </div>

        <div class="drawer-section">
          <div class="drawer-section__title">触发条件</div>
          <span class="drawer-section__sub">条件组灵活组合，留空=恒触发</span>
          <ElFormItem label="条件配置">
            <div class="condition-block">
              <ConditionGroups
                :model="draft.condition"
                :field-options="form.fieldOptions.map(o => ({ label: o.label, value: o.value }))"
                value-placeholder="值；支持 &#123;&#123;字段&#125;&#125; 事件字段引用"
              />
              <span class="hint">组内条件先组合，再按「条件组之间」的逻辑汇总；如 (A 且 B) 或 (C 且 D)</span>
            </div>
          </ElFormItem>
        </div>

        <div class="drawer-section">
          <div class="drawer-section__title">执行方式</div>
          <div class="basic-grid">
            <ElFormItem label="模式">
              <ElRadioGroup v-model="draft.asyncMode">
                <ElRadioButton value="ASYNC">异步（默认，失败不影响业务）</ElRadioButton>
                <ElRadioButton value="SYNC">同事务（仅数据动作，失败整体回滚）</ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
            <ElFormItem label="失败策略">
              <ElRadioGroup v-model="draft.failPolicy">
                <ElRadioButton value="CONTINUE">继续后续动作</ElRadioButton>
                <ElRadioButton value="ABORT">中止并告警</ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
          </div>
        </div>

        <div class="drawer-section">
          <div class="drawer-section__title">动作</div>
          <span class="drawer-section__sub">按顺序执行</span>
          <div v-for="(action, index) in draft.actions" :key="index" class="action-card">
            <div class="action-head">
              <ElTag size="small">{{ action.type }}</ElTag>
              <ElButton size="small" quaternary type="danger" @click="draft.actions.splice(index, 1)">移除</ElButton>
            </div>

            <!-- DATA_UPDATE -->
            <template v-if="action.type === 'DATA_UPDATE'">
              <ElFormItem label="目标表单" label-width="90">
                <ElSelect
                  v-model="action.config.targetFormId"
                  placeholder="选择目标表单"
                  @change="handleTargetFormChange(action)"
                >
                  <ElOption v-for="opt in formOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
              </ElFormItem>
              <div class="condition-block">
                <div class="condition-block__label">定位条件</div>
                <ConditionGroups
                  :model="action.config.conditionModel"
                  :field-options="targetFieldOptionsOf(action)"
                  value-placeholder="值；支持 &#123;&#123;字段&#125;&#125; 事件字段引用"
                />
                <span class="hint">
                  留空=作用于目标表全部数据（上限 1000 行）；添加条件可精确定位到某一条数据，条件值支持
                  &#123;&#123;字段&#125;&#125; 引用事件数据
                </span>
              </div>
              <div v-for="(set, setIndex) in action.config.set" :key="setIndex" class="mapping-row">
                <ElSelect v-model="set.field" placeholder="目标字段" class="map-field">
                  <ElOption
                    v-for="opt in targetFieldOptionsOf(action)"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
                <ElSelect v-model="set.valueFrom" class="map-from">
                  <ElOption
                    v-for="opt in [
                      { label: '常量', value: 'CONSTANT' },
                      { label: '事件字段', value: 'EVENT_FIELD' },
                      { label: '当前时间', value: 'NOW' }
                    ]"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
                <ElInput v-if="set.valueFrom !== 'NOW'" v-model="set.value" placeholder="值/源字段" class="map-value" />
                <ElButton size="small" quaternary type="danger" @click="action.config.set.splice(setIndex, 1)">
                  删
                </ElButton>
              </div>
              <ElButton
                size="small"
                dashed
                @click="action.config.set.push({ field: '', valueFrom: 'CONSTANT', value: '' })"
              >
                + SET 字段
              </ElButton>
            </template>

            <!-- DATA_CREATE -->
            <template v-else-if="action.type === 'DATA_CREATE'">
              <ElFormItem label="目标表单" label-width="90">
                <ElSelect
                  v-model="action.config.targetFormId"
                  placeholder="选择目标表单"
                  @change="handleTargetFormChange(action)"
                >
                  <ElOption v-for="opt in formOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
              </ElFormItem>
              <div v-for="(mapping, mapIndex) in action.config.fields" :key="mapIndex" class="mapping-row">
                <ElSelect v-model="mapping.field" placeholder="目标字段" class="map-field">
                  <ElOption
                    v-for="opt in targetFieldOptionsOf(action)"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
                <ElSelect v-model="mapping.valueFrom" class="map-from">
                  <ElOption
                    v-for="opt in [
                      { label: '常量', value: 'CONSTANT' },
                      { label: '事件字段', value: 'EVENT_FIELD' },
                      { label: '当前时间', value: 'NOW' }
                    ]"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
                <ElInput
                  v-if="mapping.valueFrom !== 'NOW'"
                  v-model="mapping.value"
                  placeholder="值/源字段"
                  class="map-value"
                />
                <ElButton size="small" quaternary type="danger" @click="action.config.fields.splice(mapIndex, 1)">
                  删
                </ElButton>
              </div>
              <ElButton
                size="small"
                dashed
                @click="action.config.fields.push({ field: '', valueFrom: 'CONSTANT', value: '' })"
              >
                + 字段映射
              </ElButton>
            </template>

            <!-- DATA_DELETE -->
            <template v-else-if="action.type === 'DATA_DELETE'">
              <ElFormItem label="目标表单" label-width="90">
                <ElSelect
                  v-model="action.config.targetFormId"
                  placeholder="选择目标表单"
                  @change="handleTargetFormChange(action)"
                >
                  <ElOption v-for="opt in formOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
              </ElFormItem>
              <div class="condition-block">
                <ConditionGroups
                  :model="action.config.conditionModel"
                  :field-options="targetFieldOptionsOf(action)"
                  value-placeholder="值"
                />
                <span class="hint">必填：定位要删除的目标行（禁配无条件的删除，保存后可试跑预览影响行数）</span>
              </div>
            </template>

            <!-- MSG_INNER -->
            <template v-else>
              <ElFormItem label="收件人" label-width="90">
                <ElRadioGroup v-model="action.config.receiverType">
                  <ElRadioButton value="USERS">指定用户</ElRadioButton>
                  <ElRadioButton value="FIELD">人员字段</ElRadioButton>
                </ElRadioGroup>
              </ElFormItem>
              <ElFormItem v-if="action.config.receiverType === 'USERS'" label="用户 ID" label-width="90">
                <ElInput
                  :model-value="(action.config.userIds || []).join(',')"
                  placeholder="多个用英文逗号分隔"
                  @update:model-value="
                    value =>
                      (action.config.userIds = value
                        .split(',')
                        .map(part => part.trim())
                        .filter(Boolean))
                  "
                />
              </ElFormItem>
              <ElFormItem v-else label="人员字段" label-width="90">
                <ElSelect v-model="action.config.fieldCode" placeholder="事件数据里的人员字段">
                  <ElOption
                    v-for="opt in form.fieldOptions.map(o => ({ label: o.label, value: o.value }))"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="标题" label-width="90">
                <ElInput v-model="action.config.title" placeholder="支持占位字段引用" />
              </ElFormItem>
              <ElFormItem label="内容" label-width="90">
                <ElInput v-model="action.config.content" type="textarea" :rows="3" placeholder="支持占位字段引用" />
              </ElFormItem>
            </template>
          </div>
          <div class="action-add">
            <ElButton size="small" dashed @click="draft.actions.push(newAction('DATA_UPDATE'))">+ 数据更新</ElButton>
            <ElButton size="small" dashed @click="draft.actions.push(newAction('DATA_CREATE'))">+ 数据新增</ElButton>
            <ElButton size="small" dashed @click="draft.actions.push(newAction('MSG_INNER'))">+ 站内信</ElButton>
            <ElButton size="small" dashed @click="draft.actions.push(newAction('DATA_DELETE'))">+ 数据删除</ElButton>
          </div>
        </div>
      </ElForm>
      <template #footer>
        <div class="drawer-actions">
          <ElButton @click="drawerVisible = false">取消</ElButton>
          <ElButton type="primary" :loading="saving" @click="save">保存规则</ElButton>
        </div>
      </template>
    </ElDrawer>

    <!-- 试跑 -->
    <ElDialog v-model="dryRunVisible" title="规则试跑（不真正执行）" width="640px">
      <div class="dryrun-row">
        <ElInput v-model="dryRunDataId" placeholder="输入一条现有数据的主键 ID" />
        <ElButton type="primary" :loading="dryRunLoading" @click="doDryRun">试跑</ElButton>
      </div>
      <div v-if="dryRunResult" class="dryrun-result">
        <div class="dryrun-condition">
          条件判定：{{ dryRunResult.conditionPass ? '命中' : '未命中' }}
          <div class="trace">{{ dryRunResult.conditionTrace }}</div>
        </div>
        <div v-for="(action, index) in dryRunResult.actions" :key="index" class="dryrun-action">
          <ElTag size="small">{{ action.type }}</ElTag>
          <pre class="dryrun-pre">{{ action.error ?? JSON.stringify(action.preview, null, 2) }}</pre>
        </div>
      </div>
    </ElDialog>

    <!-- 执行记录 -->
    <ElDialog v-model="logVisible" title="联动执行记录" width="1200px" top="6vh">
      <DataTable
        :columns="logColumns"
        :data="logRows"
        :pagination="{
          page: logPage,
          pageSize: 15,
          itemCount: logTotal,
          onChange: (page: number) => {
            logPage = page;
            loadLogs();
          }
        }"
        size="small"
        :row-key="(row: any) => row.id"
      />
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.linkage-panel {
  max-width: 900px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.head-ops {
  display: flex;
  gap: 8px;
}

.head-hint {
  font-size: 12px;
  color: #999;
}

.rule-card {
  margin-bottom: 8px;
}

.rule-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rule-meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.rule-name {
  font-weight: 500;
}

.rule-code {
  font-family: monospace;
  font-size: 12px;
  color: #999;
}

.rule-ops {
  display: flex;
  gap: 8px;
  align-items: center;
}

.empty-hint {
  padding: 16px;
  color: #999;
  text-align: center;
}

.hint {
  margin-left: 8px;
  font-size: 12px;
  color: #999;
}

.section-title {
  margin: 16px 0 8px;
  font-weight: 600;
}

/* 规则编辑抽屉：分区块卡片布局（宽度 72% 对齐表单编辑页弹出效果） */
.drawer-section {
  padding: 14px 16px 4px;
  margin-bottom: 16px;
  background: #fbfcfe;
  border: 1px solid #eef1f6;
  border-radius: 10px;
}

.drawer-section__title {
  position: relative;
  padding-left: 10px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.drawer-section__title::before {
  position: absolute;
  top: 3px;
  left: 0;
  width: 3px;
  height: 14px;
  content: '';
  background: var(--el-color-primary, #409eff);
  border-radius: 2px;
}

.drawer-section__sub {
  display: block;
  margin: -6px 0 12px 10px;
  font-size: 12px;
  color: #86909c;
}

.basic-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}

.basic-grid__full {
  grid-column: 1 / -1;
}

/* 宽抽屉下字段映射行用满空间 */
.mapping-row .map-field {
  width: 240px;
}

.condition-block {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__label {
    margin-bottom: 4px;
    font-size: 12px;
    color: var(--el-text-color-regular);
  }

  .hint {
    margin-top: 4px;
    margin-left: 0;
  }
}

.action-card {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.action-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.mapping-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.map-field {
  width: 180px;
}

.map-from {
  width: 120px;
}

.map-value {
  flex: 1;
}

.action-add {
  display: flex;
  gap: 8px;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dryrun-row {
  display: flex;
  gap: 8px;
}

.dryrun-result {
  margin-top: 16px;
}

.dryrun-condition {
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #f7f7f7;
  border-radius: 6px;
}

.trace {
  margin-top: 4px;
  font-size: 12px;
  color: #888;
}

.dryrun-action {
  margin-bottom: 12px;
}

.dryrun-pre {
  padding: 8px 12px;
  margin-top: 6px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  background: #f7f7f7;
  border-radius: 6px;
}
</style>
