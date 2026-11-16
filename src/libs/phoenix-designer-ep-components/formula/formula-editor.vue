<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { evaluateFormulaField, findSchemas, useDesignerContext } from 'phoenix-designer';

/**
 * 公式编辑器（R2-11）：formula 组件属性面板的「计算公式」编辑器（EFormulaEditor）。
 * 左侧可引用字段面板（排除公式字段自身），右侧表达式输入 + 运算符面板 + 实时试算；
 * 语法与服务端 FormulaEvaluator 一致：{列编码} 引用，SpEL 算子集合（四则/比较/逻辑/三元/+拼接）。
 */
export interface Props {
  disabled?: boolean;
  /** 表达式字符串 */
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  modelValue: ''
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const showDialog = ref(false);
const expression = ref('');
const sampleResult = ref<{ ok: boolean; text: string } | null>(null);
const textareaRef = ref();

/** 自身公式字段编码（字段面板排除，防自引用） */
const selfField = (() => {
  try {
    const designer = useDesignerContext();
    const selected = designer?.state?.selectedNode;
    return selected?.field ? String(selected.field) : '';
  } catch {
    return '';
  }
})();

/** 当前画布表单的可输入字段（排除公式自身；公式引用其它公式按后端口径也支持） */
const currentFields = computed(() => {
  try {
    const designer = useDesignerContext();
    const schemas = designer?.pageSchema?.schemas ?? [];
    const matched = findSchemas(schemas as any[], schema => Boolean(schema?.input && schema?.field));
    const list = Array.isArray(matched) ? matched : [];
    return list
      .filter(schema => String(schema.field) !== selfField)
      .map(schema => ({
        field: String(schema.field),
        label: String(schema.label ?? schema.field)
      }));
  } catch {
    return [];
  }
});

const operatorChips = [
  { label: '加/拼接 +', text: ' + ' },
  { label: '减 -', text: ' - ' },
  { label: '乘 *', text: ' * ' },
  { label: '除 /', text: ' / ' },
  { label: '大于 >', text: ' > ' },
  { label: '小于 <', text: ' < ' },
  { label: '大于等于 >=', text: ' >= ' },
  { label: '小于等于 <=', text: ' <= ' },
  { label: '等于 ==', text: ' == ' },
  { label: '不等于 !=', text: ' != ' },
  { label: '且 &&', text: ' && ' },
  { label: '或 ||', text: ' || ' },
  { label: '三元 ?:（示例）', text: '{amount} > 100 ? {amount} * 0.95 : {amount}' }
];

const tips = [
  '公式语法与服务端一致：{数据字段} 引用本行字段值，如 {price} * {qty} * 0.9',
  '文本公式（开启「文本公式」开关后）：文本 + 字段 即拼接，如 \'订单-\' + {code}',
  '算子支持四则/比较/且或/三元；服务端保存时权威重算（受限 SpEL，无函数调用）',
  '点击左侧字段名插入引用；数值公式在依赖未填时保存会报错，属预期行为'
];

function openDialog() {
  expression.value = props.modelValue ?? '';
  sampleResult.value = null;
  showDialog.value = true;
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
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  } else {
    expression.value += text;
  }
}

/** 试算：按空值口径跑一遍（文本公式可出样例；数值公式依赖未填显示提示） */
function tryEvaluate() {
  if (!expression.value.trim()) {
    sampleResult.value = null;
    return;
  }
  const result = evaluateFormulaField(expression.value, {}, { textMode: false });
  const textResult = evaluateFormulaField(expression.value, {}, { textMode: true });
  if (result.ok) {
    sampleResult.value = { ok: true, text: `试算（空值口径）= ${result.value}` };
  } else if (textResult.ok) {
    sampleResult.value = { ok: true, text: `试算（文本口径样例）= ${textResult.value}` };
  } else {
    sampleResult.value = { ok: false, text: '表达式语法正确；数值公式需依赖字段填写后才能算出结果' };
  }
}

function confirm() {
  const trimmed = expression.value.trim();
  if (trimmed) {
    try {
      evaluateFormulaField(trimmed, {}, { textMode: true });
    } catch {
      ElMessage.error('表达式无法解析，请检查语法');
      return;
    }
  }
  emit('update:modelValue', trimmed);
  showDialog.value = false;
}
</script>

<template>
  <div class="phoenix-formula-editor">
    <el-input
      :model-value="props.modelValue"
      :disabled="props.disabled"
      readonly
      placeholder="未设置，点击右侧按钮配置公式"
      @click="!props.disabled && openDialog()"
    >
      <template #append>
        <el-button :disabled="props.disabled" @click="openDialog">配置公式</el-button>
      </template>
    </el-input>

    <el-dialog v-model="showDialog" title="计算公式" width="760px" :close-on-click-modal="false" append-to-body>
      <div class="editor-layout">
        <div class="field-panel">
          <div class="panel-title">可引用字段</div>
          <el-scrollbar max-height="380px">
            <div
              v-for="item in currentFields"
              :key="item.field"
              class="field-item"
              :title="item.field"
              @click="insertText(`{${item.field}}`)"
            >
              {{ item.label }}
              <span class="field-code">{{ item.field }}</span>
            </div>
            <div v-if="!currentFields.length" class="field-empty">表单暂无可输入字段</div>
          </el-scrollbar>
        </div>
        <div class="expression-panel">
          <el-input
            ref="textareaRef"
            v-model="expression"
            type="textarea"
            :rows="4"
            placeholder="如：{price} * {qty} * 0.9"
          />
          <div class="operator-panel">
            <el-tag
              v-for="chip in operatorChips"
              :key="chip.label"
              class="operator-chip"
              effect="plain"
              @click="insertText(chip.text)"
            >
              {{ chip.label }}
            </el-tag>
          </div>
          <div v-if="sampleResult" class="sample-result" :class="{ 'is-error': !sampleResult.ok }">
            {{ sampleResult.text }}
          </div>
          <div class="tips">
            <div v-for="tip in tips" :key="tip" class="tip-line">{{ tip }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="tryEvaluate">试算</el-button>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="confirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.phoenix-formula-editor {
  width: 100%;
}

.editor-layout {
  display: flex;
  gap: 12px;
  min-height: 320px;
}

.field-panel {
  width: 220px;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 4px;
  padding: 8px;

  .panel-title {
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
    margin-bottom: 6px;
  }

  .field-item {
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;

    &:hover {
      background-color: var(--el-fill-color-light, #f5f7fa);
    }

    .field-code {
      font-size: 11px;
      color: var(--el-text-color-placeholder, #a8abb2);
      max-width: 90px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .field-empty {
    font-size: 12px;
    color: var(--el-text-color-placeholder, #a8abb2);
    padding: 12px 8px;
  }
}

.expression-panel {
  flex: 1;
  min-width: 0;
}

.operator-panel {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .operator-chip {
    cursor: pointer;
  }
}

.sample-result {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-color-success, #67c23a);
  background-color: var(--el-color-success-light-9, #f0f9eb);
  padding: 6px 10px;
  border-radius: 4px;

  &.is-error {
    color: var(--el-text-color-secondary, #909399);
    background-color: var(--el-fill-color-light, #f5f7fa);
  }
}

.tips {
  margin-top: 8px;

  .tip-line {
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
    line-height: 1.8;
  }
}
</style>
