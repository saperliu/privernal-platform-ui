<script setup lang="ts">
import { ElOption, ElSelect } from 'element-plus';
import { useRelationSelect } from './use-relation';

/**
 * 关联表单（phoenix-designer EP 适配，补齐 naiveUi 版的 relation-backfill）。
 * 选择被关联表单记录后，按映射把多个字段内容回填到本表单；
 * 与 relation-attr 的差异：选择后总是执行回填，且支持「数据范围」过滤。
 */
export interface Props {
  /** 组件的值（被关联记录 id） */
  modelValue?: any;
  /** 当前表单数据（设计器节点渲染时自动注入，用于数据范围过滤与回填） */
  model?: Record<string, any>;
  /** 关联配置（formCode/displayField/filter/mappings，由 ERelationConfig 编辑） */
  relation?: any;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  model: undefined,
  relation: undefined,
  placeholder: '请选择',
  clearable: true,
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
}>();

const { loading, selectOptions, handleChange } = useRelationSelect(props, emit, {
  backfill: true
});
</script>

<template>
  <ElSelect
    :model-value="props.modelValue"
    :placeholder="props.placeholder"
    :loading="loading"
    :clearable="props.clearable"
    :disabled="props.disabled"
    filterable
    @update:model-value="handleChange"
  >
    <ElOption v-for="item in selectOptions" :key="item.value" :label="item.label" :value="item.value" />
  </ElSelect>
</template>
