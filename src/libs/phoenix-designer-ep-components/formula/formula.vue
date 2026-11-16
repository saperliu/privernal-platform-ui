<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { FORM_CONTEXT_KEY, usePageManager } from 'phoenix-designer';
import { evaluateFormulaField } from 'phoenix-designer';

/**
 * 公式字段（R2-11）：只读展示服务端权威求值字段的实时预览。
 * 表达式 {列编码} 引用本行字段（与服务端 FormulaEvaluator 同语法），
 * 渲染端按 formData 实时试算回写（保存时服务端权威重算，防篡改语义不变）。
 * props.textType 开启文本公式（拼接语义，未填引用按空串参与）。
 */
export interface Props {
  /** 组件的值（formData[field]） */
  modelValue?: any;
  /** 计算表达式（{列编码} 引用） */
  expression?: string;
  /** 文本公式（拼接语义） */
  textType?: boolean;
  /** 依赖未就绪时的占位提示 */
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  expression: '',
  textType: false,
  placeholder: '依赖字段填写后自动计算',
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
}>();

const { isDesignMode } = usePageManager();

/** 表单根 provide 的 formData（子表行内为行数据对象，公式引用解析到行内） */
const formData = inject<Record<string, any> | null>(FORM_CONTEXT_KEY as any, null);

const previewing = ref(false);

const result = computed(() => evaluateFormulaField(props.expression ?? '', formData ?? {}, { textMode: props.textType }));

const display = computed(() => {
  if (isDesignMode.value) {
    // 设计态：无真实填报数据，展示表达式本身的试算样例（空值口径）
    const sample = evaluateFormulaField(props.expression ?? '', {}, { textMode: props.textType });
    if (!props.expression) return '公式未配置';
    return sample.ok ? String(sample.value) : '公式预览';
  }
  if (!props.expression) return '公式未配置';
  if (result.value.ok) return formatValue(result.value.value);
  return props.placeholder;
});

function formatValue(value: any): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // 保留浮点精度但去掉浮点误差尾数（0.1*3 → 0.30000000000000004 → 0.3）
    const rounded = Number(value.toPrecision(12));
    return String(rounded);
  }
  return String(value ?? '');
}

// 填报态：依赖变化实时回写（保存时服务端权威重算，此处只为展示与提交预览）
watch(
  () => result.value,
  ({ ok, value }) => {
    if (isDesignMode.value || previewing.value) return;
    if (ok && value !== props.modelValue) {
      previewing.value = true;
      emit('update:modelValue', value);
      emit('change', value);
      Promise.resolve().then(() => {
        previewing.value = false;
      });
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="phoenix-formula" :class="{ 'is-empty': !result.ok && !isDesignMode }">
    {{ display }}
  </div>
</template>

<style lang="scss" scoped>
.phoenix-formula {
  width: 100%;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 4px;
  background-color: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-regular, #606266);
  font-size: 14px;
  line-height: 32px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &.is-empty {
    color: var(--el-text-color-placeholder, #a8abb2);
  }
}
</style>
