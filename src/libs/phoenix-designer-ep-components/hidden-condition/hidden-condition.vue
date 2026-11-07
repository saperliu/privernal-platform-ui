<script setup lang="ts">
import { computed } from 'vue';
import { HIDE_EXPRESSION_TIP, findSchemas, useDesignerContext } from 'phoenix-designer';
import ConditionEditor from '../condition-editor/condition-editor.vue';

/**
 * 隐藏条件编辑器（EP 适配，对齐 naiveUi 版 hidden-condition）。
 * 注册为 EHideConditionEditor 后，属性面板会给所有组件追加
 * 「隐藏条件」配置项（满足表达式时运行时隐藏，设计态始终可见）。
 */
export interface Props {
  disabled?: boolean;
  modelValue?: any;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  modelValue: undefined
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();

/** 当前画布表单的可输入字段（表达式里可直接引用） */
const currentFields = computed(() => {
  try {
    const designer = useDesignerContext();
    const schemas = designer?.pageSchema?.schemas ?? [];
    // findSchemas 未传 once，返回的是命中数组；显式收窄以便拿到 ComponentSchema 类型
    const matched = findSchemas(schemas as any[], schema => Boolean(schema?.input && schema?.field));
    const list = Array.isArray(matched) ? matched : [];
    return list.map(schema => ({
      field: String(schema.field),
      label: String(schema.label ?? schema.field)
    }));
  } catch {
    return [];
  }
});

const groups = computed(() => [{ label: '当前表单', fields: currentFields.value }]);

const tips = [HIDE_EXPRESSION_TIP, '点击左侧字段名可插入到表达式；字段也可用英文名（数据字段）引用'];
</script>

<template>
  <ConditionEditor
    :disabled="props.disabled"
    :model-value="props.modelValue"
    title="隐藏条件"
    banner="当满足以下条件时此控件隐藏"
    placeholder="请输入条件表达式，或点击左侧字段插入"
    :tips="tips"
    :groups="groups"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
