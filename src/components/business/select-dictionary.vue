<script setup lang="tsx">
import { computed, reactive, ref } from 'vue';
import type { ComponentSize } from 'element-plus';
import { ElSelect as __forwarded_ElSelect } from 'element-plus';
import { findSystemDictionaryDataList } from '@/service';
import { objectAssignList } from '@/utils/constant/object';

export interface Props {
  /** 组件的值 */
  value: any;
  /** 组件是否多选 */
  multiple?: boolean;
  /** 组件是否禁用 */
  disabled?: boolean;
  /** 组件的大小 */
  size?: ComponentSize;
  /** 字典数据作为取值的字段 */
  valueField?: string;
  /** 字典类型 */
  dictType: string;
  placeholder?: string;
  /** 字典存储json时的对象 */
  json?: CommonType.JSONObject<any>;
}

defineOptions({ name: 'SelectDictionary' });
const props = withDefaults(defineProps<Props>(), {
  value: '',
  multiple: false,
  size: 'default',
  dictType: '',
  valueField: 'dictValue',
  json: undefined,
  placeholder: '请选择'
});

interface Emits {
  (e: 'update:value', data: any): void;
  (e: 'update:json', data: any): void;
  (e: 'change', data: any, option: any): void;
}

const emit = defineEmits<Emits>();

/** 后端存的可能是数字（如性别 0/1），字典 dictValue 是字符串，统一按字符串比较 */
const selectValue = computed({
  get() {
    let value = props.value;
    if (value && typeof value === 'object') {
      value = (value as any).selected;
    }
    if (value === null || value === undefined || value === '') {
      return props.multiple ? [] : '';
    }
    return props.multiple ? (value as any[]).map(item => `${item}`) : `${value}`;
  },
  set(value) {
    emit('update:value', value);
  }
});

const options = ref<Array<any>>([]);
const loading = ref(false);
const pageCount = ref<number>(1);

type FormFilterModel = SystemDictionaryDataNamespace.SystemDictionaryDataQuery;
const personFilter = reactive<FormFilterModel>({ dictType: props.dictType, pageNum: 1, pageSize: 100 });

/** 远程搜索（按字典标签过滤） */
function handleSearch(value: string) {
  personFilter.dictLabel = value;
  personFilter.pageNum = 1;
  findSystemDictionaryList();
}

function handleChange(value: any) {
  const option = options.value.find((item: any) => `${(item as any)[props.valueField]}` === `${value}`);
  emit('change', value, option);
  handleDictSelect(value, option);
}

/**
 * 处理选择后的数据，如果使用json由封装数据格式
 *
 * @param val 选择的值
 * @param option 选择的对象
 */
function handleDictSelect(val: any, option: any) {
  if (props.json !== null && props.json !== undefined) {
    const temp: SystemDictionaryDataNamespace.SystemDictionaryDataJson = {
      dictLabel: '',
      dictType: '',
      dictValue: '',
      id: ''
    };
    const list = objectAssignList(temp, option);
    if (props.multiple) {
      const obj = {
        sourceList: list,
        selectList: val
      };
      emit('update:json', obj);
    } else {
      const obj = {
        sourceList: list,
        selected: val
      };
      emit('update:json', obj);
    }
  }
}

async function findSystemDictionaryList() {
  loading.value = true;
  const { data } = await findSystemDictionaryDataList(personFilter);
  if (data && data.list.length > 0) {
    options.value = data.list;
    pageCount.value = Math.ceil(data.total / personFilter.pageSize);
  } else if (!personFilter.dictLabel) {
    options.value = [];
  }
  loading.value = false;
}

findSystemDictionaryList();

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;
</script>

<template>
  <div class="privernal-main">
    <ElSelect
      v-model="selectValue"
      :multiple="props.multiple"
      filterable
      remote
      clearable
      :remote-method="handleSearch"
      :loading="loading"
      :size="props.size"
      :disabled="props.disabled"
      :placeholder="props.placeholder"
      class="w-100%"
      @change="handleChange"
    >
      <ElOption v-for="opt in options" :key="opt.id" :label="opt.dictLabel" :value="`${opt[props.valueField]}`" />
    </ElSelect>
  </div>
</template>

<style lang="scss" scoped>
.privernal-main {
  width: 100%;
}
</style>
