<script setup lang="tsx">
import type { Component } from 'vue';
import { computed, reactive, ref, watch } from 'vue';
import type { ComponentSize, SelectInstance } from 'element-plus';
import { ElTag, ElSelect as __forwarded_ElSelect } from 'element-plus';
import { ListCircleOutline as __forwarded_ListCircleOutline } from '@vicons/ionicons5';

export interface Props {
  /** 组件的值 */
  value: any;
  /** 值字段 */
  valueField?: string;
  /** 标签字段 */
  labelField?: string;
  /** 父级id,联动的上级的ID */
  parentId?: any;
  parentField?: string;
  /** 组件是否多选 */
  multiple?: boolean;
  /** 组件是否禁用 */
  disabled?: boolean;
  /** 组件是否弹出列表选择窗口 */
  showList?: boolean;
  /** 组件是否显示列表窗口的增/删/等按钮 */
  showOperation?: boolean;
  /** 组件的大小 */
  size?: ComponentSize;
  /** 占位符 */
  placeholder?: string;
  /** 数据回显的字段名 */
  name?: string;
  /** 组件 */
  listComponent?: Component;
  /** 查询的函数 */
  queryListFn: (params: Record<string, any>) => Promise<any>;
  /** 查询详细的函数 */
  queryDetailFn: (value: any) => Promise<any>;
  /** 列表查询的外部传参 :listQueryParameter={ 查询条件：查询值 } */
  listQueryParameter?: any;
}

defineOptions({ name: 'SelectCommonComponent' });
const props = withDefaults(defineProps<Props>(), {
  value: '',
  parentId: '',
  parentField: '',
  multiple: false,
  showList: false,
  showOperation: false,
  size: 'default',
  valueField: 'id',
  labelField: 'label',
  placeholder: '',
  listComponent: ElTag,
  name: '',
  queryDetailFn() {
    return Promise.resolve([]);
  },
  queryListFn() {
    return Promise.resolve([]);
  }
});

interface Emits {
  (e: 'update:value', visible: any): void;

  (e: 'scroll', data: any): void;

  (e: 'select-change', data: any): void;

  (e: 'update:name', data: any): void;
  (e: 'update', data: any): void;
  (e: 'updateValue', data: any): void;
  (e: 'updateName', data: any): void;

  (e: 'clear', data: any): void;
}

const emit = defineEmits<Emits>();
const selectInstRef = ref<SelectInstance | null>(null);

/** 列表查询条件（parentField 会以动态字段名写入） */
interface SystemFilter {
  pageNum: number;
  pageSize: number;
  keyword: string;
  keywords: any[];
  [field: string]: any;
}

const formSystemFilter = reactive<SystemFilter>({ pageNum: 1, pageSize: 10, keyword: '', keywords: [] });
const dataList = ref<any[]>([]);

const selectValue = computed({
  get() {
    return props.value;
  },
  set(value) {
    emit('update:value', value);
  }
});

const listVisible = ref(false);
const drawerWidth = ref('90%');
const selectClassList = ref<any[]>([]);

/**
 * 搜索关键字
 *
 * @param value
 */
function handleSearch(value: string) {
  console.log('---common component search-------', value);
  handleQueryStdSystemList(value);
}

/** 显示列表 */
function showDataList() {
  listVisible.value = true;
}

function handleChangeClass(rows: any[]) {
  selectClassList.value = rows;
}

/**
 * 选择框的值改变的事件
 *
 * @param value
 * @param option
 */
function updateValue(value: any, option: any) {
  console.log('--- updateValue-------', value, option);
  // 单条选择时，回显使用
  if (option !== null) {
    emit('update:name', option[props.labelField]);
    emit('updateName', option[props.labelField]);
  }
  emit('updateValue', value);
  emit('update:value', value);
  emit('update', value);
  emit('select-change', option);

  if (value) {
    formSystemFilter.pageNum = 1;
  }
}

/** 列表选择的确认 */
function handleSelectClass() {
  emit('select-change', selectClassList.value);
  if (selectClassList.value !== null && selectClassList.value.length > 0) {
    if (props.multiple) {
      emit('update:value', selectClassList.value);
      emit('updateValue', selectClassList.value);
      emit('update', selectClassList.value);
    } else {
      emit('update:value', selectClassList.value[0].id);
      emit('updateValue', selectClassList.value[0].id);
      emit('update', selectClassList.value[0].id);
    }
  }
  listVisible.value = false;
}

/** 查询数据列表 */
async function findOtherSystemList() {
  if (props.parentField !== null && props.parentField !== '') {
    formSystemFilter[props.parentField] = props.parentId;
  }
  let queryDataParameter = formSystemFilter;
  if (props.listQueryParameter) {
    queryDataParameter = {
      ...queryDataParameter,
      ...props.listQueryParameter
    };
  }
  const { data } = await props.queryListFn(queryDataParameter);
  if (data) {
    dataList.value = data.list;
  } else {
    dataList.value = [];
  }
}

/**
 * 查询单个数据，并添加到列表中，防止数据多，单条无法回显的问题
 *
 * @param newValue
 */
async function findOtherSystemListById(newValue: any) {
  if (newValue === null || newValue === undefined || newValue === '' || newValue.length === 0) {
    return;
  }
  const { data } = await props.queryDetailFn(newValue);
  if (data !== null) {
    dataList.value.push(data);
  }
}

/** 选择框的模糊搜索 */
function handleQueryStdSystemList(val: string) {
  formSystemFilter.keywords = [val];
  formSystemFilter.pageNum = 1;
  findOtherSystemList();
}

function handleClear() {
  emit('clear', true);
}

watch(
  () => props.disabled,
  newValue => {
    if (!newValue) {
      // 禁用时不查询列表，只是显示已经查询了当前值的翻译
      findOtherSystemList();
    }
  }
);

watch(
  () => props.parentId,
  newValue => {
    if (newValue) {
      // 当联动时，父级值变了，重新查询列表可选项
      findOtherSystemList();
    }
  }
);

watch(
  () => props.listQueryParameter,
  newValue => {
    if (newValue) {
      // 参数修改了
      findOtherSystemList();
    }
  }
);

findOtherSystemList();

findOtherSystemListById(props.value);

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ListCircleOutline = __forwarded_ListCircleOutline;
</script>

<template>
  <div class="privernal-main">
    <ElSelect
      ref="selectInstRef"
      v-model="selectValue"
      :multiple="props.multiple"
      filterable
      remote
      clearable
      :remote-method="handleSearch"
      :options="dataList"
      :props="{ value: props.valueField, label: props.labelField }"
      :size="props.size"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      @change="(v: any) => updateValue(v, dataList.find((o: any) => o[props.valueField] === v) ?? null)"
      @clear="handleClear"
    >
      <!-- 列表图标放前缀并 stop：ElSelect 在 wrapper 上监听 click 切换下拉，冒泡会同时打开下拉与抽屉 -->
      <template v-if="props.showList && !props.disabled" #prefix>
        <ElIcon class="cursor-pointer" title="从列表中选择" @mousedown.stop.prevent @click.stop.prevent="showDataList">
          <component :is="ListCircleOutline" />
        </ElIcon>
      </template>
    </ElSelect>

    <ElDrawer v-if="props.showList" v-model="listVisible" :size="drawerWidth" class="privernal-drawer">
      <component
        :is="props.listComponent"
        :show-operation="props.showOperation"
        :multiple="props.multiple"
        @change="handleChangeClass"
      />
      <template #footer>
        <ElSpace class="w-full pt-16px" :size="24" justify="end">
          <ElButton class="w-72px" @click="listVisible = false">取消</ElButton>
          <ElButton class="w-72px" type="primary" @click="handleSelectClass">确定</ElButton>
        </ElSpace>
        <div></div>
      </template>
    </ElDrawer>
  </div>
</template>

<style lang="scss" scoped>
.privernal-main {
  width: 100%;
}

.footer {
  display: flex;
  flex-direction: row;
  justify-content: end;
  margin-top: 10px;
  padding-right: 10px;
}
</style>
