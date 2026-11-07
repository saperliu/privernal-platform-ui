<script setup lang="ts">
import { computed, ref } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { EXPRESSION_FUNCTIONS } from 'phoenix-designer';

/**
 * 条件表达式编辑器（EP 适配，对齐 naiveUi 版 condition-editor）。
 * 弹窗内左侧为可引用字段面板，右侧为表达式输入 + 函数列表；
 * 输出的条件结构 { logic, expression, labelMap, relLabel?, relLabelMap? }
 * 由 phoenix-designer 的 evaluateScopeCondition 运行时求值。
 */
export interface ConditionGroup {
  label: string;
  relLabel?: string;
  fields: Array<{ field: string; label: string }>;
}

export interface Props {
  disabled?: boolean;
  /** 条件对象（{expression,...}），空为未设置 */
  modelValue?: any;
  title?: string;
  banner?: string;
  placeholder?: string;
  tips?: string[];
  /** 可引用字段分组（当前表单 / 关联表单） */
  groups?: ConditionGroup[];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  modelValue: undefined,
  title: '条件设置',
  banner: '请设置条件',
  placeholder: '请输入条件表达式，或点击左侧字段插入',
  tips: undefined,
  groups: undefined
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();

const showDialog = ref(false);
const expression = ref('');
const showFnPanel = ref(false);
const fnKeyword = ref('');
const collapsedGroups = ref(new Set<string>());
const textareaRef = ref();

const displayText = computed(() => {
  const expr = props.modelValue?.expression?.trim();
  return expr || '未设置';
});

const groupList = computed(() => props.groups ?? []);

function openDialog() {
  expression.value = props.modelValue?.expression ?? '';
  showFnPanel.value = false;
  fnKeyword.value = '';
  collapsedGroups.value = new Set(groupList.value.slice(0, 1).map(g => g.label));
  showDialog.value = true;
}

function toggleGroup(label: string) {
  const next = new Set(collapsedGroups.value);
  if (next.has(label)) {
    next.delete(label);
  } else {
    next.add(label);
  }
  collapsedGroups.value = next;
}

/** 在光标位置插入文本（无光标上下文时追加到末尾） */
function insertText(text: string) {
  const el = (textareaRef.value?.textarea ?? textareaRef.value?.input) as HTMLTextAreaElement | undefined;
  if (el && typeof el.selectionStart === 'number') {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    expression.value = expression.value.slice(0, start) + text + expression.value.slice(end);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  } else {
    expression.value += text;
  }
}

function insertField(group: ConditionGroup, field: { label: string }) {
  const text = group.relLabel ? `${group.relLabel}.${field.label}` : field.label;
  insertText(text);
}

/** 按分组过滤函数列表 */
const fnGroups = computed(() => {
  const keyword = fnKeyword.value.trim().toLowerCase();
  const matched = EXPRESSION_FUNCTIONS.filter(
    fn => !keyword || fn.name.toLowerCase().includes(keyword) || fn.desc.includes(keyword) || fn.group.includes(keyword)
  );
  return ['数学函数', '文本函数', '时间函数', '逻辑函数', '其他函数']
    .map(label => ({
      label,
      fns: matched.filter(fn => fn.group === label)
    }))
    .filter(group => group.fns.length > 0);
});

function insertFunction(name: string) {
  insertText(`${name}(`);
}

function handleConfirm() {
  const expr = expression.value.trim();
  if (!expr) {
    emit('update:modelValue', undefined);
    showDialog.value = false;
    return;
  }
  const labelMap: Record<string, string> = {};
  const relLabelMap: Record<string, string> = {};
  let relLabel: string | undefined;
  groupList.value.forEach(group => {
    if (group.relLabel) {
      relLabel = group.relLabel;
      group.fields.forEach(field => {
        relLabelMap[field.label] = field.field;
      });
    } else {
      group.fields.forEach(field => {
        labelMap[field.label] = field.field;
      });
    }
  });
  emit('update:modelValue', {
    logic: 'and',
    expression: expr,
    labelMap,
    ...(relLabel ? { relLabel, relLabelMap } : {})
  });
  showDialog.value = false;
}
</script>

<template>
  <div class="phoenix-condition-editor">
    <div
      class="phoenix-condition-editor-box"
      :class="{ 'has-value': Boolean(props.modelValue?.expression), 'is-disabled': props.disabled }"
      @click="!props.disabled && openDialog()"
    >
      <span class="phoenix-condition-editor-text" :title="displayText">{{ displayText }}</span>
      <ElIcon class="phoenix-condition-editor-add">
        <Plus />
      </ElIcon>
    </div>

    <ElDialog
      v-model="showDialog"
      :title="props.title"
      :width="showFnPanel ? '1180px' : '860px'"
      append-to-body
      class="phoenix-condition-editor-dialog"
    >
      <div class="phoenix-condition-editor-body">
        <div class="phoenix-condition-editor-fields">
          <template v-for="group in groupList" :key="group.label">
            <div class="phoenix-condition-editor-group-title" @click="toggleGroup(group.label)">
              <i class="phoenix-group-arrow" :class="{ 'is-collapsed': collapsedGroups.has(group.label) }" />
              <span class="phoenix-condition-editor-group-label" :title="group.label">
                {{ group.label }}
              </span>
            </div>
            <template v-if="!collapsedGroups.has(group.label)">
              <div
                v-for="field in group.fields"
                :key="group.label + field.field"
                class="phoenix-condition-editor-field"
                :title="`${field.label}（${field.field}）`"
                @click="insertField(group, field)"
              >
                {{ field.label }}
              </div>
              <div v-if="!group.fields.length" class="phoenix-condition-editor-empty">该表单暂无可引用字段</div>
            </template>
          </template>
          <div v-if="!groupList.length" class="phoenix-condition-editor-empty">暂无可引用字段</div>
        </div>

        <div class="phoenix-condition-editor-main">
          <div class="phoenix-condition-editor-banner">{{ props.banner }}</div>
          <ElInput ref="textareaRef" v-model="expression" type="textarea" :rows="6" :placeholder="props.placeholder" />
          <div class="phoenix-condition-editor-main-bottom">
            <div class="phoenix-condition-editor-tips">
              <div v-for="tip in props.tips ?? []" :key="tip" class="phoenix-condition-editor-tip">
                {{ tip }}
              </div>
            </div>
            <ElButton
              size="small"
              :type="showFnPanel ? 'primary' : 'default'"
              :plain="showFnPanel"
              class="phoenix-condition-editor-fx"
              @click="showFnPanel = !showFnPanel"
            >
              插入函数
            </ElButton>
          </div>
        </div>

        <div v-if="showFnPanel" class="phoenix-condition-editor-fn-panel">
          <div class="phoenix-condition-editor-fn-title">函数列表</div>
          <ElInput v-model="fnKeyword" size="small" placeholder="搜索" clearable />
          <div class="phoenix-condition-editor-fn-list">
            <template v-for="group in fnGroups" :key="group.label">
              <div class="phoenix-condition-editor-fn-group">{{ group.label }}</div>
              <div
                v-for="fn in group.fns"
                :key="fn.name"
                class="phoenix-condition-editor-fn-item"
                :title="`${fn.name}(${fn.args})：${fn.desc}`"
                @click="insertFunction(fn.name)"
              >
                <span class="phoenix-condition-editor-fn-name">{{ fn.name }}({{ fn.args }})</span>
                <span class="phoenix-condition-editor-fn-desc">{{ fn.desc }}</span>
              </div>
            </template>
            <div v-if="!fnGroups.length" class="phoenix-condition-editor-empty">未找到匹配函数</div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="phoenix-condition-editor-footer">
          <ElButton size="small" @click="showDialog = false">取消</ElButton>
          <ElButton size="small" type="primary" @click="handleConfirm">确 定</ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.phoenix-condition-editor {
  width: 100%;
}

.phoenix-condition-editor-box {
  align-items: center;
  background: var(--el-fill-color-light, #f7f8fa);
  border: 1px solid var(--el-border-color-light, #e5e7eb);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  font-size: 12px;
  gap: 8px;
  justify-content: space-between;
  padding: 6px 8px;
  width: 100%;

  &.has-value {
    border-color: var(--el-color-primary, #2080f0);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.phoenix-condition-editor-text {
  color: var(--el-text-color-regular, #606266);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phoenix-condition-editor-add {
  color: var(--el-color-primary, #2080f0);
  flex: 0 0 auto;
  font-size: 14px;
}

.phoenix-condition-editor-body {
  display: flex;
  gap: 12px;
  min-height: 400px;
}

.phoenix-condition-editor-fields {
  border: 1px solid var(--el-border-color-light, #e5e7eb);
  border-radius: 4px;
  flex: 0 0 240px;
  max-height: 440px;
  overflow: auto;
  padding: 6px;
}

.phoenix-condition-editor-group-title {
  align-items: center;
  border-radius: 3px;
  color: var(--el-text-color-primary, #303133);
  cursor: pointer;
  display: flex;
  font-size: 13px;
  font-weight: 600;
  gap: 4px;
  padding: 6px 4px;

  &:hover {
    color: var(--el-color-primary, #2080f0);
  }
}

.phoenix-group-arrow {
  border: solid var(--el-color-primary, #2080f0);
  border-width: 0 1.5px 1.5px 0;
  content: '';
  display: inline-block;
  height: 6px;
  padding: 1.5px;
  transform: rotate(45deg);
  transition: transform 0.2s;
  width: 6px;

  &.is-collapsed {
    transform: rotate(-45deg);
  }
}

.phoenix-condition-editor-group-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phoenix-condition-editor-field {
  border-radius: 3px;
  color: var(--el-text-color-primary, #303133);
  cursor: pointer;
  font-size: 13px;
  margin-left: 20px;
  overflow: hidden;
  padding: 5px 8px;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    background: var(--el-color-primary-light-9, #f0f4ff);
    color: var(--el-color-primary, #2080f0);
  }
}

.phoenix-condition-editor-empty {
  color: var(--el-text-color-placeholder, #c0c4cc);
  font-size: 12px;
  padding: 8px;
}

.phoenix-condition-editor-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.phoenix-condition-editor-banner {
  background: var(--el-color-primary-light-9, #eef6ff);
  border-radius: 4px;
  color: var(--el-color-primary, #2080f0);
  font-size: 13px;
  padding: 8px 10px;
}

.phoenix-condition-editor-main-bottom {
  align-items: flex-end;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.phoenix-condition-editor-tips {
  color: var(--el-text-color-secondary, #909399);
  flex: 1;
  font-size: 12px;
  line-height: 1.7;
  min-width: 0;
}

.phoenix-condition-editor-tip::before {
  color: var(--el-text-color-placeholder, #c0c4cc);
  content: '• ';
}

.phoenix-condition-editor-fx {
  flex: 0 0 auto;
}

.phoenix-condition-editor-fn-panel {
  border: 1px solid var(--el-border-color-light, #e5e7eb);
  border-radius: 4px;
  display: flex;
  flex: 0 0 300px;
  flex-direction: column;
  gap: 8px;
  max-height: 440px;
  padding: 10px;
}

.phoenix-condition-editor-fn-title {
  color: var(--el-text-color-primary, #303133);
  font-size: 13px;
  font-weight: 600;
}

.phoenix-condition-editor-fn-list {
  flex: 1;
  overflow: auto;
}

.phoenix-condition-editor-fn-group {
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
  padding: 8px 4px 2px;
}

.phoenix-condition-editor-fn-item {
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 8px;

  &:hover {
    background: var(--el-color-primary-light-9, #f0f4ff);
  }
}

.phoenix-condition-editor-fn-name {
  color: var(--el-color-primary, #2080f0);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}

.phoenix-condition-editor-fn-desc {
  color: var(--el-text-color-regular, #606266);
  font-size: 12px;
}

.phoenix-condition-editor-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
