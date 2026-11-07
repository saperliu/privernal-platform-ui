<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ElOption, ElSelect } from 'element-plus';
import { pluginManager } from 'phoenix-designer';
import { postJson, unwrapPageList } from '../shared/http';

/**
 * 人员选择（phoenix-designer EP 适配，补齐 naiveUi 版的 user-select）。
 * 数据来自 pluginManager.global.userListUrl（登录态接口），
 * 支持通过 labelField/valueField 自定义选项字段，multiple 多选由 EP 原生支持。
 */
export interface Props {
  /** 组件的值（单选为字符串，多选为数组） */
  modelValue?: any;
  /** 人员列表接口，不传时用全局 userListUrl */
  apiUrl?: string;
  /** 选项显示字段，默认 nickName */
  labelField?: string;
  /** 选项取值字段，默认 id */
  valueField?: string;
  placeholder?: string;
  /** 是否多选 */
  multiple?: boolean;
  /** 多选时超出折叠的 tag 数量 */
  maxTagCount?: number;
  clearable?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  apiUrl: '',
  labelField: 'nickName',
  valueField: 'id',
  placeholder: '请选择人员',
  multiple: false,
  maxTagCount: undefined,
  clearable: true,
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
}>();

const selectValue = computed({
  get() {
    return props.modelValue;
  },
  set(value: any) {
    emit('update:modelValue', value);
    emit('change', value);
  }
});

const options = ref<Array<{ label: string; value: string }>>([]);
const loading = ref(false);

function resolveUrl() {
  return props.apiUrl || pluginManager.global.userListUrl || '/back/system/user/list';
}

function toOption(item: Record<string, any>) {
  let label = item[props.labelField];
  if (label === null || label === undefined || label === '') {
    label = item[props.valueField];
  }
  return { label: String(label), value: String(item[props.valueField]) };
}

async function queryUserList() {
  loading.value = true;
  try {
    const res = await postJson(resolveUrl(), { pageNum: 1, pageSize: 9999 });
    options.value = unwrapPageList(res).map(toOption);
  } catch (error) {
    console.error('[phoenix]加载人员列表失败：', error);
    options.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  queryUserList();
});

watch(
  () => [props.apiUrl, props.labelField, props.valueField],
  () => {
    queryUserList();
  }
);
</script>

<template>
  <ElSelect
    v-model="selectValue"
    :multiple="props.multiple"
    :max-collapse-tags="props.multiple ? (props.maxTagCount ?? 1) : undefined"
    collapse-tags-tooltip
    :placeholder="props.placeholder"
    :loading="loading"
    :clearable="props.clearable"
    :disabled="props.disabled"
    filterable
  >
    <ElOption v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
  </ElSelect>
</template>
