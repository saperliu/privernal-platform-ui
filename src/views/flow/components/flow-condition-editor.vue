<script setup lang="ts">
/**
 * 网关「节点流转条件」编辑器（挂设计器边属性面板 skip-condition 插槽）。
 * 布局与 phoenix-designer 的隐藏条件弹窗同款：左侧可引用字段分组（当前表单/系统字段/组织机构/角色），
 * 中部表达式编辑区（横幅 + 文本域 + 提示 + fx 插入函数），右侧函数列表面板（fx 开关）。
 *
 * 存储契约：表达式面向业务人员用字段显示名编写，保存为
 *   form.conditionType = 'wfexpr'
 *   form.conditionValue = JSON.stringify({ expr, labelMap })   // labelMap: 显示名 → 数据字段名
 * 设计器 Skip 面板内部 watcher 组装 skipCondition = 'wfexpr@@' + conditionValue 随流程保存；
 * 后端 FlowExprConditionStrategy 按 wfexpr 前缀用 Groovy 求值决定网关走向。
 *
 * 约束：字符串字面量一律单引号（Groovy 兼容，且避免 JSON 转义膨胀）。
 */
import { computed, ref } from 'vue';
import {
  ElButton as __forwarded_ElButton,
  ElDialog as __forwarded_ElDialog,
  ElInput as __forwarded_ElInput
} from 'element-plus';
import { EXPRESSION_FUNCTIONS } from 'phoenix-designer';
import { findDynamicFormByCode, findSystemRoleList } from '@/service';

interface ConditionFieldItem {
  /** 字段显示名（表单配置的 label / 系统名） */
  label: string;
  /** 数据字段名（表达式求值时引用的键） */
  field: string;
}

interface ConditionFieldGroup {
  label: string;
  fields: ConditionFieldItem[];
}

interface ExpressionFunctionDef {
  name: string;
  args: string;
  desc: string;
  group: string;
}

const props = defineProps<{
  /** 设计器边属性面板的表单对象（conditionType/conditionValue 读写在此） */
  form: Record<string, any>;
  disabled?: boolean;
  /** 流程绑定的表单编码，用于拉取可引用字段 */
  tableCode?: string;
}>();
const showModal = ref(false);
const expression = ref('');
const fnPanelVisible = ref(false);
const fnKeyword = ref('');
const expandedGroups = ref<Set<string>>(new Set());
const textareaRef = ref();

/** 表单字段（当前表单的输入组件） */
const formFields = ref<ConditionFieldItem[]>([]);
const roleNames = ref<string[]>([]);

const SYSTEM_FIELDS: ConditionFieldItem[] = [
  { label: '数据标题', field: 'title' },
  { label: '创建时间', field: 'createdTime' },
  { label: '修改时间', field: 'updatedTime' }
];

/** 组织机构保留变量（后端 FlowExprConditionStrategy 的键约定） */
const CONTEXT_FIELDS: ConditionFieldItem[] = [
  { label: '发起人', field: '__initiator' },
  { label: '发起人姓名', field: '__initiator_name' },
  { label: '发起人部门', field: '__initiator_dept' },
  { label: '发起人组织', field: '__initiator_org' }
];

const tips = [
  '支持运算符：+ - * / > < >= <= == != && ||',
  "字符串请用单引号，例：设备=='设备A'",
  '点击左侧字段名可插入；条件在流程到达网关时按表单数据求值',
  '例：当报销金额大于 10000 时进入这条线，则设置为：报销金额>10000'
];

const groups = computed<ConditionFieldGroup[]>(() => {
  const list: ConditionFieldGroup[] = [
    { label: '当前表单', fields: formFields.value },
    { label: '系统字段', fields: SYSTEM_FIELDS },
    { label: '组织机构', fields: CONTEXT_FIELDS }
  ];
  if (roleNames.value.length) {
    list.push({ label: '角色', fields: [] });
  }
  return list;
});

/** 函数清单来自 phoenix-designer（与后端 FlowExprConditionStrategy 绑定的同名函数一致），角色函数由本组件追加 */
const fnGroups = computed(() => {
  const fns: ExpressionFunctionDef[] = [
    ...(EXPRESSION_FUNCTIONS as unknown as ExpressionFunctionDef[]),
    { name: 'HAS_ROLE', args: '角色名', desc: '发起人是否拥有该角色', group: '逻辑函数' }
  ];
  const keyword = fnKeyword.value.trim().toLowerCase();
  const matched = fns.filter(
    fn => !keyword || fn.name.toLowerCase().includes(keyword) || fn.desc.includes(keyword) || fn.group.includes(keyword)
  );
  const order = ['数学函数', '文本函数', '时间函数', '逻辑函数', '其他函数'];
  return order
    .map(group => ({ label: group, fns: matched.filter(fn => fn.group === group) }))
    .filter(group => group.fns.length > 0);
});

const summary = computed(() => {
  if (props.form?.conditionType !== 'wfexpr') return '未设置';
  try {
    const parsed = JSON.parse(props.form.conditionValue || '{}');
    return parsed.expr || '未设置';
  } catch {
    return props.form.conditionValue || '未设置';
  }
});

async function loadFields() {
  if (formFields.value.length) return;
  if (!props.tableCode) return;
  try {
    const res = await findDynamicFormByCode(props.tableCode);
    const inputComponents = ((res.data as any)?.metaData?.inputComponents ?? []) as Array<any>;
    formFields.value = inputComponents
      .filter((c: any) => c.field)
      .map((c: any) => ({ field: c.field, label: c.componentProps?.label || c.field }));
  } catch {
    formFields.value = [];
  }
}

async function loadRoles() {
  if (roleNames.value.length) return;
  try {
    const res = await findSystemRoleList({ pageNum: 1, pageSize: 500 } as any);
    const rows = (res.data as any)?.list ?? res.data ?? [];
    roleNames.value = rows.map((r: any) => String(r.roleName || r.roleKey || '')).filter(Boolean);
  } catch {
    roleNames.value = [];
  }
}

function openModal() {
  // 旧版运算符条件（gt@@field|value 等）不回显进编辑器，确认后将被 wfexpr 覆盖
  expression.value = '';
  if (props.form?.conditionType === 'wfexpr') {
    try {
      expression.value = JSON.parse(props.form.conditionValue || '{}').expr || '';
    } catch {
      expression.value = props.form.conditionValue || '';
    }
  }
  fnPanelVisible.value = false;
  fnKeyword.value = '';
  expandedGroups.value = new Set(groups.value.slice(0, 1).map(group => group.label));
  loadFields();
  loadRoles();
  showModal.value = true;
}

function toggleGroup(label: string) {
  const next = new Set(expandedGroups.value);
  if (next.has(label)) {
    next.delete(label);
  } else {
    next.add(label);
  }
  expandedGroups.value = next;
}

function insertToken(token: string) {
  const el = (textareaRef.value as any)?.textareaElRef as HTMLTextAreaElement | undefined;
  if (el && typeof el.selectionStart === 'number') {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    expression.value = expression.value.slice(0, start) + token + expression.value.slice(end);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  } else {
    expression.value += token;
  }
}

/** 当前表单/系统/组织机构字段按显示名插入（保存时经 labelMap 翻译回数据字段名） */
function insertField(_group: ConditionFieldGroup, item: ConditionFieldItem) {
  insertToken(item.label);
}

/** 角色组：点击角色名插入完整的 HAS_ROLE 调用 */
function insertRole(name: string) {
  insertToken(`HAS_ROLE('${name}')`);
}

function insertFunction(name: string) {
  insertToken(`${name}(`);
}

/** 分组字段显示名 → 数据字段名（角色组是完整函数调用，不参与映射） */
function buildLabelMap(): Record<string, string> {
  const labelMap: Record<string, string> = {};
  [...groups.value.slice(0, 3)].forEach(group => {
    group.fields.forEach(item => {
      if (item.label !== item.field) {
        labelMap[item.label] = item.field;
      }
    });
  });
  return labelMap;
}

function handleClear() {
  expression.value = '';
  writeForm('');
  showModal.value = false;
}

/**
 * 写回设计器属性面板的表单模型。
 *
 * `form` 是设计器传入的可变模型对象（存储契约见文件头注释），必须就地写回才能被
 * Skip 面板的 watcher 组装成 skipCondition，因此通过局部引用赋值而非直接改 props 成员。
 */
function writeForm(expr: string) {
  const formModel = props.form;
  if (!formModel) return;
  if (!expr) {
    formModel.conditionType = '';
    formModel.condition = '';
    formModel.conditionValue = '';
    formModel.skipCondition = '';
    return;
  }
  formModel.conditionType = 'wfexpr';
  formModel.condition = '';
  formModel.conditionValue = JSON.stringify({ expr, labelMap: buildLabelMap() });
}

function handleConfirm() {
  const expr = expression.value.trim();
  if (expr.length > 900) {
    window.$message?.error('表达式过长（上限 900 字符）');
    return;
  }
  writeForm(expr);
  showModal.value = false;
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInput = __forwarded_ElInput;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDialog = __forwarded_ElDialog;
</script>

<template>
  <div class="flow-condition-editor">
    <div
      class="flow-condition-editor-box"
      :class="{ 'has-value': props.form?.conditionType === 'wfexpr' }"
      @click="!props.disabled && openModal()"
    >
      <span class="flow-condition-editor-text" :title="summary">{{ summary }}</span>
      <span class="flow-condition-editor-add">＋</span>
    </div>

    <ElDialog
      v-model="showModal"
      title="节点流转条件"
      class="flow-condition-editor-modal"
      :style="{ width: fnPanelVisible ? '1180px' : '860px' }"
    >
      <div class="flow-condition-editor-body">
        <!-- 左侧：可引用字段分组面板 -->
        <div class="flow-condition-editor-fields">
          <template v-for="group in groups" :key="group.label">
            <div class="flow-condition-editor-group-title" @click="toggleGroup(group.label)">
              <span class="flow-condition-editor-arrow" :class="{ 'is-collapsed': !expandedGroups.has(group.label) }">
                ▼
              </span>
              <span class="flow-condition-editor-group-label" :title="group.label">{{ group.label }}</span>
            </div>
            <template v-if="expandedGroups.has(group.label)">
              <template v-if="group.label === '角色'">
                <div
                  v-for="name in roleNames"
                  :key="name"
                  class="flow-condition-editor-field"
                  :title="`插入 HAS_ROLE('${name}')`"
                  @click="insertRole(name)"
                >
                  {{ name }}
                </div>
              </template>
              <template v-else>
                <div
                  v-for="item in group.fields"
                  :key="group.label + item.field"
                  class="flow-condition-editor-field"
                  :title="`${item.label}（${item.field}）`"
                  @click="insertField(group, item)"
                >
                  {{ item.label }}
                </div>
              </template>
              <div v-if="!group.fields.length && group.label !== '角色'" class="flow-condition-editor-empty">
                暂无可引用字段
              </div>
            </template>
          </template>
        </div>

        <!-- 中部：表达式编辑区 -->
        <div class="flow-condition-editor-main">
          <div class="flow-condition-editor-banner">符合以下条件时进入这条连接线下的节点</div>
          <ElInput
            ref="textareaRef"
            v-model="expression"
            type="textarea"
            :autos="{ minRows: 8, maxRows: 14 }"
            placeholder="例：报销金额>10000"
          />
          <div class="flow-condition-editor-main-bottom">
            <div class="flow-condition-editor-tips">
              <div v-for="tip in tips" :key="tip" class="flow-condition-editor-tip">{{ tip }}</div>
            </div>
            <ElButton
              size="small"
              :type="fnPanelVisible ? 'primary' : 'default'"
              :ghost="fnPanelVisible"
              class="flow-condition-editor-fx"
              @click="fnPanelVisible = !fnPanelVisible"
            >
              fx 插入函数
            </ElButton>
          </div>
        </div>

        <!-- 右侧：函数列表面板（fx 开关） -->
        <div v-if="fnPanelVisible" class="flow-condition-editor-fn-panel">
          <div class="flow-condition-editor-fn-title">函数列表</div>
          <ElInput v-model="fnKeyword" size="small" placeholder="搜索" clearable />
          <div class="flow-condition-editor-fn-list">
            <template v-for="group in fnGroups" :key="group.label">
              <div class="flow-condition-editor-fn-group">{{ group.label }}</div>
              <div
                v-for="fn in group.fns"
                :key="fn.name"
                class="flow-condition-editor-fn-item"
                :title="`${fn.name}(${fn.args})：${fn.desc}`"
                @click="insertFunction(fn.name)"
              >
                <span class="flow-condition-editor-fn-name">{{ fn.name }}({{ fn.args }})</span>
                <span class="flow-condition-editor-fn-desc">{{ fn.desc }}</span>
              </div>
            </template>
            <div v-if="!fnGroups.length" class="flow-condition-editor-empty">未找到匹配函数</div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flow-condition-editor-footer">
          <ElButton size="small" @click="handleClear">清除条件</ElButton>
          <ElButton size="small" @click="showModal = false">取 消</ElButton>
          <ElButton size="small" type="primary" @click="handleConfirm">确 定</ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.flow-condition-editor-box {
  align-items: center;
  background: #f7f8fa;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  font-size: 12px;
  gap: 8px;
  justify-content: space-between;
  padding: 6px 8px;
  width: 100%;
}

.flow-condition-editor-box.has-value {
  border-color: #2080f0;
}

.flow-condition-editor-text {
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-condition-editor-add {
  color: #2080f0;
  flex: 0 0 auto;
  font-size: 13px;
}

.flow-condition-editor-body {
  display: flex;
  gap: 12px;
  min-height: 420px;
}

.flow-condition-editor-fields {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  flex: 0 0 240px;
  max-height: 460px;
  overflow: auto;
  padding: 6px;
}

.flow-condition-editor-group-title {
  align-items: center;
  border-radius: 3px;
  color: #303133;
  cursor: pointer;
  display: flex;
  font-size: 13px;
  font-weight: 600;
  gap: 4px;
  padding: 6px 4px;
}

.flow-condition-editor-group-title:hover {
  color: #2080f0;
}

.flow-condition-editor-arrow {
  color: #2080f0;
  font-size: 10px;
  transition: transform 0.2s;
}

.flow-condition-editor-arrow.is-collapsed {
  transform: rotate(-90deg);
}

.flow-condition-editor-group-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-condition-editor-field {
  border-radius: 3px;
  color: #303133;
  cursor: pointer;
  font-size: 13px;
  margin-left: 18px;
  overflow: hidden;
  padding: 5px 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-condition-editor-field:hover {
  background: #f0f4ff;
  color: #2080f0;
}

.flow-condition-editor-empty {
  color: #c0c4cc;
  font-size: 12px;
  padding: 8px;
}

.flow-condition-editor-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.flow-condition-editor-banner {
  background: #eef6ff;
  border-radius: 4px;
  color: #2080f0;
  font-size: 13px;
  padding: 8px 10px;
}

.flow-condition-editor-main-bottom {
  align-items: flex-end;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.flow-condition-editor-tips {
  color: #909399;
  flex: 1;
  font-size: 12px;
  line-height: 1.7;
  min-width: 0;
}

.flow-condition-editor-tip::before {
  color: #c0c4cc;
  content: '• ';
}

.flow-condition-editor-fx {
  flex: 0 0 auto;
}

.flow-condition-editor-fn-panel {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  display: flex;
  flex: 0 0 300px;
  flex-direction: column;
  gap: 8px;
  max-height: 460px;
  padding: 10px;
}

.flow-condition-editor-fn-title {
  color: #303133;
  font-size: 13px;
  font-weight: 600;
}

.flow-condition-editor-fn-list {
  flex: 1;
  overflow: auto;
}

.flow-condition-editor-fn-group {
  color: #909399;
  font-size: 12px;
  padding: 8px 4px 2px;
}

.flow-condition-editor-fn-item {
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 8px;
}

.flow-condition-editor-fn-item:hover {
  background: #f0f4ff;
}

.flow-condition-editor-fn-name {
  color: #2080f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}

.flow-condition-editor-fn-desc {
  color: #606266;
  font-size: 12px;
}

.flow-condition-editor-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
