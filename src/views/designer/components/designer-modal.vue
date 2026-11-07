<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElInput } from 'element-plus';
import {
  findDynamicFormByCode,
  findDynamicFormDraft,
  findSystemAppListByOrg,
  saveDynamicFormDetail,
  saveDynamicFormDraft,
  updateDynamicFormDetail
} from '@/service';
import { getQueryString } from '@/utils';
import FormDesigner from '@/views/designer/components/form-designer.vue';
import ListDesign from '@/views/designer/components/list-design.vue';
import FlowDesignPanel from '@/views/designer/components/flow-design-panel.vue';
import AdvancedPanel from '@/views/designer/components/advanced/advanced-panel.vue';
import CustomViewPanel from '@/views/designer/components/custom-view-panel.vue';
/**
 * 后端代码（Groovy 后台脚本）默认样例：以注释形式内置在编辑器中，
 * 涉及表单数据更新/删除、表数据统计、字段回写与常用校验逻辑，放开对应注释即可使用；
 * 完整语法手册（for/while/switch/集合/日期等）见「后端代码」页签旁问号链接的示例页
 */
const BACK_SCRIPT_SAMPLE = `// ========== 后端代码样例（Groovy，随表单数据保存时执行） ==========
// 可用变量：
//   daoService   数据操作服务：saveOrUpdate / deleteById / deleteByIds / findByPage / findById / querySql
//   requestData  本次提交的表单数据（Map，含 tableCode 与全部字段值）
// 更多语法（for / while / switch / 集合 / 日期）请点「后端代码」旁的 ? 查看示例手册
//
// ---------- 1. 更新本表单数据（根据提交内容回写字段，如状态与提交时间） ----------
// def id = requestData.id
// def row = daoService.findById(requestData.tableCode, id)
// row.status = 'SUBMITTED'
// row.submitTime = new Date().format('yyyy-MM-dd HH:mm:ss')
// daoService.saveOrUpdate(requestData.tableCode, row)
//
// ---------- 2. for 循环：遍历子表明细并逐行校验 ----------
// def details = requestData.order_items ?: []
// for (item in details) {
//     if (!item.price || item.price <= 0) { throw new RuntimeException('明细单价必须大于 0') }
// }
//
// ---------- 3. switch 分支：按状态回写文案 ----------
// switch (requestData.status) {
//     case 'SUBMITTED': requestData.statusText = '已提交'; break
//     case ['APPROVING', 'REVIEWING']: requestData.statusText = '审批中'; break
//     case 'PASS': requestData.statusText = '已通过'; break
//     default: requestData.statusText = '未知状态'
// }
//
// ---------- 4. while 循环：分页拉取关联表数据 ----------
// def pageNum = 1
// def all = []
// while (true) {
//     def page = daoService.findByPage('order_detail', [pageNum: pageNum, pageSize: 200, orderId: requestData.id])
//     def list = (page?.list ?: [])
//     all.addAll(list)
//     if (list.size() < 200) { break }
//     pageNum++
// }
//
// ---------- 5. 更新其它表单数据（如：同步客户表的最近联系时间） ----------
// def customer = daoService.findById('customer_info', requestData.customerId)
// if (customer != null) {
//     customer.lastContactTime = new Date().format('yyyy-MM-dd HH:mm:ss')
//     daoService.saveOrUpdate('customer_info', customer)
// }
//
// ---------- 6. 删除关联数据（如：作废单据时清理明细子表） ----------
// def page = daoService.findByPage('order_detail', [pageNum: 1, pageSize: 200, orderId: requestData.id])
// def detailIds = (page.list ?: []).collect { it.id }
// if (detailIds) { daoService.deleteByIds('order_detail', detailIds) }
//
// ---------- 7. 表数据统计（如：提交量控制，超限拦截）
// 注：统计 SQL 使用固定文本，不要拼接 requestData 的值 ----------
// def countRows = daoService.querySql('order_info', 'SELECT COUNT(1) AS total FROM order_info WHERE deleted_flag = 0')
// def total = countRows ? (countRows[0].total ?: 0) : 0
// if (total > 1000) { throw new RuntimeException('当日提交量已达上限，请明天再试') }
//
// ---------- 8. 其它常用逻辑 ----------
// // 业务字段校验（不满足直接抛错，事务回滚，数据不入库）
// if (!requestData.amount || requestData.amount <= 0) { throw new RuntimeException('金额必须大于 0') }
// // 流程审批通过后联动回写（表单开启工作流后 flowStatus 随流程流转更新）
// if (requestData.flowStatus == 'PASS' && requestData.id) {
//     def audit = daoService.findById(requestData.tableCode, requestData.id)
//     audit.auditTime = new Date().format('yyyy-MM-dd HH:mm:ss')
//     daoService.saveOrUpdate(requestData.tableCode, audit)
// }
`;

const backScript = ref({ script: BACK_SCRIPT_SAMPLE, transactional: true });

const code = getQueryString(window.location.search, 'code');

const dynamicForm = reactive({
  id: '',
  metaData: {} as Record<string, any>,
  tableName: '新建表单',
  appId: '',
  tableCode: '',
  isWorkflow: 0,
  workflowCode: ''
});

/** 组织内可选应用（保存后后端自动生成该应用的菜单与权限标识） */
const appOptions = ref<Array<{ label: string; value: string }>>([]);

async function loadAppOptions() {
  const { data, error } = await findSystemAppListByOrg();
  if (!error) {
    // 所属应用只放业务应用：系统应用（系统管理/平台管理）不是表单的归属载体
    appOptions.value = (data || [])
      .filter(item => item.type !== 'SYSTEM')
      .map(item => ({
        label: item.appName,
        value: item.id
      }));
  }
}

const activeTab = ref('form');
const saving = ref(false);
const draftSaving = ref(false);
const designerRef = ref<InstanceType<typeof FormDesigner>>();

/** 功能区页签（工作台顶栏中的分段控件） */
const primaryTabs = [
  { key: 'form', label: '表单设计' },
  { key: 'flow', label: '流程设计' },
  { key: 'list', label: '列表设计' },
  { key: 'custom', label: '自定义页面' },
  { key: 'advanced', label: '高级设置' }
];

/**
 * 首次进入才挂载（等价于原 NTabs 的 display-directive="show:lazy"）：
 * 流程/列表页签各自要发请求，未点过就不该占用后端
 */
const visited = reactive<Record<string, boolean>>({
  form: true,
  flow: false,
  list: false,
  custom: false,
  advanced: false
});

const flowEnabled = computed(() => dynamicForm.isWorkflow === 1);

/** ===== 自定义页面（在线 Vue 代码）：随保存/草稿链持久化到 metaData.customView ===== */

const emptyCustomViewPage = () => ({ enabled: false, source: '' });
const emptyCustomView = () => ({ list: emptyCustomViewPage(), edit: emptyCustomViewPage() });
const customView = ref(emptyCustomView());

/** 后端 metaData 里的 customView 可能缺键/旧版本无此键，统一补全形状 */
function normalizeCustomView(raw: any) {
  const view = { ...emptyCustomView(), ...(raw ?? {}) };
  view.list = { ...emptyCustomViewPage(), ...(view.list ?? {}) };
  view.edit = { ...emptyCustomViewPage(), ...(view.edit ?? {}) };
  return view;
}

/** 所属应用名称（已保存后应用不可改，只做只读展示） */
const appName = computed(() => appOptions.value.find(item => item.value === dynamicForm.appId)?.label ?? '');

function switchTab(key: string) {
  activeTab.value = key;
  visited[key] = true;
}

/**
 * 表单名称/编码的权威值在外层（顶栏），属性面板绑定的是根节点 props.label/props.code。
 * 保存时把权威值同步进根节点：否则再次编辑时面板显示节点上的旧值/空——“名称编码不回填”的根因。
 * （旧版读取 componentProps.* 的位置在新版设计器里已迁移到 props，读它恒为 undefined）
 */
function syncRootSchemaIdentity(metaData: Record<string, any>) {
  const root = metaData.schemas?.[0];
  if (!root) return;
  root.props ??= {};
  if (dynamicForm.tableName) root.props.label = dynamicForm.tableName;
  if (dynamicForm.tableCode) root.props.code = dynamicForm.tableCode;
}

/**
 * 保存前的名称/编码对齐与必填校验（仅新表单需要）
 *
 * @returns 校验是否通过
 */
function alignIdentityBeforeSave(): boolean {
  // 新表单（/designer 直进）：名称/编码的权威值来自顶栏输入；用户若在属性面板改过，
  // 以面板值为准（面板绑定的就是根节点 props.label/code）
  const rootSchema = dynamicForm.metaData.schemas?.[0];
  if (!dynamicForm.id && rootSchema?.props) {
    if (!dynamicForm.tableName && rootSchema.props.label) dynamicForm.tableName = rootSchema.props.label;
    if (!dynamicForm.tableCode && rootSchema.props.code) dynamicForm.tableCode = rootSchema.props.code;
  }
  // 首次保存的必备项：名称/编码/所属应用（保存即建表、生成菜单，缺一不可）
  if (!dynamicForm.id && (!dynamicForm.tableName || !dynamicForm.tableCode || !dynamicForm.appId)) {
    window.$message?.error('请填写表单名称与表单编码，并在右上角选择所属应用后重试');
    return false;
  }
  syncRootSchemaIdentity(dynamicForm.metaData);
  return true;
}

/**
 * 点击保存按钮操作
 *
 * @param e 表单设计器产出的页面配置
 */
async function handleSubmit(e: Record<string, any>) {
  dynamicForm.metaData = e;
  dynamicForm.metaData.backScript = backScript.value;
  dynamicForm.metaData.customView = customView.value;

  if (!alignIdentityBeforeSave()) return;

  saving.value = true;
  // 首次入库才会生成列配置，而新列的 show_list 默认为空、运行时列表按 show_list===1 才出列
  const isNewForm = dynamicForm.id === '';
  try {
    const res = isNewForm
      ? await saveDynamicFormDetail(dynamicForm as any)
      : await updateDynamicFormDetail(dynamicForm as any);
    if (res.error === null) {
      window.$message?.success(
        isNewForm
          ? '保存成功，已自动生成应用菜单与权限标识。请到「列表设计」勾选要显示的列，否则列表页不显示任何列'
          : '保存成功，已自动生成应用菜单与权限标识'
      );
      if (isNewForm && (res as any).data?.id) {
        dynamicForm.id = (res as any).data.id;
      }
    } else {
      window.$message?.error('保存失败');
    }
  } finally {
    saving.value = false;
  }
}

/**
 * 存草稿：内容只进版本快照（不生效、不改物理表结构），
 * 之后在「form的历史版本」页发布草稿才会生效
 *
 * @param e 表单设计器产出的页面配置
 */
async function handleSaveDraft(e: Record<string, any>) {
  if (!e) {
    window.$message?.error('草稿内容为空');
    return;
  }
  if (dynamicForm.id === '') {
    window.$message?.error('表单首次保存后才能存草稿');
    return;
  }
  dynamicForm.metaData = e;
  dynamicForm.metaData.backScript = backScript.value;
  dynamicForm.metaData.customView = customView.value;
  // 与保存同口径：草稿的根节点同步权威名称/编码（再次编辑回填靠它）
  syncRootSchemaIdentity(dynamicForm.metaData);

  draftSaving.value = true;
  try {
    const res = await saveDynamicFormDraft(dynamicForm as any);
    if (res.error === null) {
      window.$message?.success('草稿已保存（未生效），可在「form的历史版本」页发布');
    } else {
      window.$message?.error('草稿保存失败');
    }
  } finally {
    draftSaving.value = false;
  }
}

/**
 * 查询表单数据
 *
 * @param codeForm 表单编码
 */
function findForm(codeForm: string) {
  findDynamicFormByCode(codeForm).then(res => {
    if (res.error === null && res.data) {
      backScript.value = res.data.metaData?.backScript ?? { script: BACK_SCRIPT_SAMPLE, transactional: true };
      customView.value = normalizeCustomView(res.data.metaData?.customView);
      dynamicForm.metaData = res.data.metaData ?? {};
      designerRef.value?.setData(res.data.metaData);
      dynamicForm.id = res.data.id;
      dynamicForm.tableCode = res.data.tableCode || dynamicForm.tableCode;
      dynamicForm.tableName = res.data.tableName || dynamicForm.tableName;
      // 后端序列化把 isWorkflow 变成字符串（"1"），严格比较 === 1 会恒为假，这里归一化
      dynamicForm.isWorkflow = Number(res.data.isWorkflow ?? 0);
      dynamicForm.workflowCode = res.data.workflowCode ?? '';
      dynamicForm.appId = res.data.appId ?? '';
      loadDraftIfPresent();
    }
  });
}

/**
 * 存在未发布草稿时提示载入：草稿是设计态内容，生效定义仍以已发布版本为准
 */
function loadDraftIfPresent() {
  if (dynamicForm.id === '') {
    return;
  }
  findDynamicFormDraft(dynamicForm.id).then(res => {
    const draft = (res as any).data;
    if (!draft?.metaData) {
      return;
    }
    window.$dialog?.info({
      title: '发现未发布草稿',
      content: '该表单存在未发布的设计草稿，是否载入设计器继续编辑？取消则继续编辑当前生效版本。',
      positiveText: '载入草稿',
      negativeText: '取消',
      onPositiveClick: () => {
        backScript.value = draft.metaData?.backScript ?? { script: BACK_SCRIPT_SAMPLE, transactional: true };
        customView.value = normalizeCustomView(draft.metaData?.customView);
        dynamicForm.metaData = draft.metaData;
        designerRef.value?.setData(draft.metaData);
        window.$message?.success('已载入草稿');
      }
    });
  });
}

/**
 * 流程开启 / 关闭，统一持久化
 *
 * @param payload 目标流程状态
 */
async function handleFlowToggle(payload: { isWorkflow: number; workflowCode: string }) {
  dynamicForm.isWorkflow = payload.isWorkflow;
  dynamicForm.workflowCode = payload.workflowCode;
  if (dynamicForm.id !== '') {
    const res = await updateDynamicFormDetail(dynamicForm as any);
    if (res.error === null) {
      window.$message?.success(payload.isWorkflow === 1 ? '流程开启成功' : '流程已关闭');
    }
  }
}

// ---------------- 顶栏 ↔ 属性面板 实时双向同步 ----------------
// 顶栏名称/编码（dynamicForm.tableName/tableCode）与属性面板（根节点 props.label/code）
// 是同一内容的不同表达，两侧任一处编辑都实时反映到另一侧。
// live 引用 = 设计器内部 reactive pageSchema（ready 事件给出）。
const livePageSchema = computed<any>(() => designerRef.value?.getPageSchemaLive?.());

// 顶栏 → 属性面板：名称实时；编码仅新表单（存量表编码=物理表名不可改，保存时以外层为准覆盖面板）
watch(
  () => [dynamicForm.tableName, dynamicForm.tableCode] as const,
  ([name, barCode]) => {
    const root = livePageSchema.value?.schemas?.[0];
    if (!root?.props) return;
    if (name && root.props.label !== name) root.props.label = name;
    if (!dynamicForm.id && barCode && root.props.code !== barCode) root.props.code = barCode;
  }
);

// 属性面板 → 顶栏：用户在面板改名称/编码实时回顶栏；编码回写仅新表单（存量表以外层 tableCode 为准）
watch(
  () => {
    const root = livePageSchema.value?.schemas?.[0];
    return { label: root?.props?.label, code: root?.props?.code, id: dynamicForm.id };
  },
  ({ label, code: panelCode, id }) => {
    if (label && label !== dynamicForm.tableName) dynamicForm.tableName = label;
    if (!id && panelCode && panelCode !== dynamicForm.tableCode) dynamicForm.tableCode = panelCode;
  },
  { deep: false }
);

onMounted(() => {
  loadAppOptions();
  if (code) findForm(code);
});
</script>

<template>
  <div class="designer-workbench">
    <!-- 工作台顶栏：身份信息 + 功能区切换 + 当前功能区操作，单行不占版面 -->
    <header class="workbench-bar">
      <div class="bar-identity">
        <span class="identity-mark">
          <SvgIcon local-icon="logo-fill" class="text-15px" />
        </span>
        <!-- 新表单：名称/编码直接在顶栏填写（列表"新增"直进设计器的落地） -->
        <template v-if="!dynamicForm.id">
          <ElInput
            v-model="dynamicForm.tableName"
            size="small"
            placeholder="表单名称"
            class="identity-input"
            :maxlength="100"
          />
          <ElInput
            v-model="dynamicForm.tableCode"
            size="small"
            placeholder="表单编码（自动加企业前缀）"
            class="identity-input identity-input-code"
            :maxlength="60"
          />
        </template>
        <template v-else>
          <span class="identity-name" :title="dynamicForm.tableName">{{ dynamicForm.tableName }}</span>
          <span class="identity-code">{{ dynamicForm.tableCode }}</span>
        </template>
      </div>

      <span class="bar-divider" aria-hidden="true"></span>

      <nav class="bar-tabs">
        <button
          v-for="tab in primaryTabs"
          :key="tab.key"
          type="button"
          class="bar-tab"
          :class="{ 'is-active': activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <span class="bar-spacer"></span>

      <div class="bar-actions">
        <button type="button" class="flow-state" :class="flowEnabled ? 'is-on' : 'is-off'" @click="switchTab('flow')">
          <span class="flow-state-dot"></span>
          {{ flowEnabled ? '流程已开启' : '未开启流程' }}
        </button>

        <ElSelect
          v-if="!dynamicForm.id"
          v-model="dynamicForm.appId"
          size="small"
          filterable
          placeholder="选择所属应用"
          class="bar-app"
        >
          <ElOption v-for="opt in appOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
        <span v-else-if="appName" class="bar-chip" :title="`所属应用：${appName}`">{{ appName }}</span>
      </div>
    </header>

    <section class="workbench-body">
      <div v-show="activeTab === 'form'" class="workbench-pane">
        <FormDesigner
          ref="designerRef"
          :back-script="backScript"
          :saving="saving"
          :draft-saving="draftSaving"
          @submit="handleSubmit"
          @draft="handleSaveDraft"
        />
      </div>
      <div v-if="visited.flow" v-show="activeTab === 'flow'" class="workbench-pane is-padded">
        <FlowDesignPanel
          :table-code="dynamicForm.tableCode"
          :table-name="dynamicForm.tableName"
          :form-id="dynamicForm.id"
          :is-workflow="dynamicForm.isWorkflow"
          :workflow-code="dynamicForm.workflowCode"
          @toggle="handleFlowToggle"
        />
      </div>
      <div v-if="visited.list" v-show="activeTab === 'list'" class="workbench-pane is-padded">
        <ListDesign :form-id="dynamicForm.id" :meta-data="dynamicForm.metaData" />
      </div>
      <div v-if="visited.custom" v-show="activeTab === 'custom'" class="workbench-pane is-padded">
        <CustomViewPanel
          v-model="customView"
          :meta-data="dynamicForm.metaData"
          :table-code="dynamicForm.tableCode"
          :table-name="dynamicForm.tableName"
        />
      </div>
      <div v-if="visited.advanced" v-show="activeTab === 'advanced'" class="workbench-pane is-padded">
        <AdvancedPanel :dynamic-form="dynamicForm" />
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.designer-workbench {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  color: var(--ds-text);
  background: var(--ds-canvas);
}

.workbench-bar {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
  height: 52px;
  padding: 0 16px;
  background: var(--ds-surface);
  border-bottom: 1px solid var(--ds-border);
}

.bar-identity {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  min-width: 0;
  max-width: 40%;
}

.identity-mark {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: rgb(var(--primary-color));
  background: rgb(var(--primary-color) / 10%);
  border-radius: 7px;
}

.identity-name {
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-code {
  flex-shrink: 0;
  padding: 2px 7px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--ds-text-weak);
  background: var(--ds-canvas);
  border: 1px solid var(--ds-border);
  border-radius: 5px;
}

.bar-divider {
  flex-shrink: 0;
  width: 1px;
  height: 20px;
  background: var(--ds-border);
}

/* 新表单模式：顶栏名称/编码输入（窄条与身份栏同高） */
.identity-input {
  width: 150px;

  &.identity-input-code {
    width: 210px;
    :deep(.n-input__input-el) {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
  }
}

/* 功能区切换：分段控件，选中项浮起而非仅靠下划线 */
.bar-tabs {
  display: flex;
  flex-shrink: 0;
  gap: 2px;
  padding: 3px;
  background: var(--ds-canvas);
  border: 1px solid var(--ds-border);
  border-radius: 9px;
}

.bar-tab {
  height: 28px;
  padding: 0 14px;
  font-size: 13px;
  color: var(--ds-text-sub);
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  transition:
    color 0.16s ease,
    background-color 0.16s ease,
    box-shadow 0.16s ease;

  &:hover {
    color: var(--ds-text);
    background: var(--ds-hover);
  }

  &.is-active {
    font-weight: 500;
    color: rgb(var(--primary-color));
    background: var(--ds-surface);
    box-shadow:
      var(--ds-shadow-xs),
      0 0 0 1px var(--ds-border);
  }
}

.bar-spacer {
  flex: 1;
}

.bar-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
}

.flow-state {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--ds-text-sub);
  cursor: pointer;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 13px;
  transition: border-color 0.16s ease;

  &:hover {
    border-color: var(--ds-border-strong);
  }
}

.flow-state-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.flow-state.is-on .flow-state-dot {
  background: #18a058;
  box-shadow: 0 0 0 3px rgb(24 160 88 / 16%);
}

.flow-state.is-off .flow-state-dot {
  background: rgb(120 130 148 / 60%);
}

.bar-app {
  width: 168px;
}

.bar-chip {
  max-width: 160px;
  overflow: hidden;
  font-size: 12px;
  color: var(--ds-text-weak);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.workbench-pane {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;

  > * {
    flex: 1;
    min-height: 0;
  }

  &.is-padded {
    padding: 12px;
  }
}
</style>

<style lang="scss">
/* ===== phoenix-designer 动作配置弹窗高度修复（弹窗传送至 body，须全局样式） =====
   现象：选择「自定义函数」后左侧组件树与中间 monaco 编辑器被内容撑得非常高。
   原因：主体容器 .phoenix-modal-action-main 高度 100% 依附着自适应高度的弹窗卡片，
   左侧树与编辑器按内容自然高度展开。这里给主体容器固定视口高度，
   并让左面板内部滚动、右面板编辑器自适应剩余空间。 */
.phoenix-modal-n .phoenix-modal-main {
  overflow: hidden;
}

.phoenix-modal-n .phoenix-modal-action-main {
  height: calc(100vh - 240px);
  min-height: 420px;
}

.phoenix-modal-n .phoenix-modal-left-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 左侧功能按钮+组件树区域：占据剩余空间，树内部滚动（替代缺失的 h-0 flex-1 约束） */
.phoenix-modal-n .phoenix-modal-left-panel > div:first-child {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.phoenix-modal-n .phoenix-modal-left-panel > div:first-child > div:last-child {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.phoenix-modal-n .phoenix-modal-action-select {
  flex-shrink: 0;
  max-height: 40%;
}

.phoenix-modal-n .phoenix-modal-right-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 右侧标题行不压缩，monaco 编辑器（.phoenix-editor）占满剩余空间 */
.phoenix-modal-n .phoenix-modal-right-panel > .pb-2 {
  flex-shrink: 0;
}

.phoenix-modal-n .phoenix-modal-right-panel .phoenix-editor {
  flex: 1;
  min-height: 0;
}
</style>
