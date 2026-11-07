<script setup lang="ts">
import { computed } from 'vue';
import { ElOption as __forwarded_ElOption, ElSelect as __forwarded_ElSelect } from 'element-plus';
import { findSchemas, useDesignerContext } from 'phoenix-designer';

/**
 * 数据标题字段编辑器（EP 适配，对齐 naiveUi 版 form/title-fields）。
 * 注册为 ETitleFieldsEditor 后，表单根节点的属性面板会出现「数据标题」配置：
 * 选择若干可输入字段，运行时按所选字段的值拼接列表页的数据标题。
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

/** 当前画布表单的可输入字段（label(field) 形式的选项） */
const fieldOptions = computed(() => {
  try {
    const designer = useDesignerContext();
    const schemas = designer?.pageSchema?.schemas ?? [];
    const found = findSchemas(schemas as any[], (schema: any) => Boolean(schema?.input && schema?.field));
    return (Array.isArray(found) ? found : []).map(schema => ({
      label: `${schema.label ?? schema.field}(${schema.field})`,
      value: String(schema.field)
    }));
  } catch {
    return [];
  }
});

function handleUpdate(value: any) {
  emit('update:modelValue', value && value.length ? value : undefined);
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElOption = __forwarded_ElOption;
</script>

<template>
  <ElSelect
    :model-value="props.modelValue ?? []"
    :disabled="props.disabled"
    clearable
    filterable
    multiple
    :max-collapse-tags="2"
    collapse-tags
    placeholder="选择用于拼接数据标题的字段"
    size="small"
    @update:model-value="handleUpdate"
  >
    <ElOption v-for="opt in fieldOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
  </ElSelect>
</template>

<style scoped></style>
