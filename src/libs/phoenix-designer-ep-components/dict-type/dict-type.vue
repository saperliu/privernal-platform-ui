<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElOption as __forwarded_ElOption, ElSelect as __forwarded_ElSelect } from 'element-plus';
import { findSystemDictionaryTypeList } from '@/service/api';

/**
 * 字典类型编辑器（注册名 EDictTypeEditor）：select/radio/checkbox 属性面板
 * 的「字典类型」控件（props.dictType）。选项=系统字典类型列表（仅正常状态），
 * 运行时渲染链路（applyDictOptions）按该类型拉取字典项注入 options。
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

interface DictTypeOption {
  label: string;
  value: string;
}

const loading = ref(false);
const options = ref<DictTypeOption[]>([]);

async function loadOptions() {
  loading.value = true;
  try {
    const { data, error } = await findSystemDictionaryTypeList({
      pageNum: 1,
      pageSize: 500
    } as any);
    const list = error ? [] : data?.list ?? [];
    // status 语义按平台 DataStatus 常量：1=启用（typings 注释「0正常 1停用」已陈旧）
    options.value = (list as any[])
      .filter(item => Number(item.status) === 1)
      .map(item => ({
        label: `${item.dictName}(${item.dictType})`,
        value: String(item.dictType)
      }));
  } finally {
    loading.value = false;
  }
}

function handleUpdate(value: any) {
  emit('update:modelValue', value || undefined);
}

onMounted(loadOptions);

// 模板绑定显式转发（规避编译产物 setup 绑定缺失，同 ETitleFieldsEditor 口径）
const ElSelect = __forwarded_ElSelect;
const ElOption = __forwarded_ElOption;
</script>

<template>
  <ElSelect
    :model-value="props.modelValue"
    :disabled="props.disabled"
    :loading="loading"
    clearable
    filterable
    placeholder="选择字典类型"
    size="small"
    @update:model-value="handleUpdate"
  >
    <ElOption v-for="opt in options" :key="opt.value" :label="opt.label" :value="opt.value" />
  </ElSelect>
</template>

<style scoped></style>
