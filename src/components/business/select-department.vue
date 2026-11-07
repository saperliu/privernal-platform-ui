<script setup lang="tsx">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { ComponentSize } from 'element-plus';
import { ElSelect as __forwarded_ElSelect } from 'element-plus';
import { ListCircleOutline as __forwarded_ListCircleOutline } from '@vicons/ionicons5';
import { findSystemDepartmentDetail, findSystemDepartmentList } from '@/service';
import { isArray } from '@/utils';

export interface Props {
  /** 标题 */
  title?: string;
  /** 组件的值 */
  value: any;
  /** 组件是否多选 */
  multiple?: boolean;
  /** 组件的大小 */
  size?: ComponentSize;
  /** 组件是否禁用 */
  disabled?: boolean;

  placeholder?: string;
}

defineOptions({ name: 'SelectDepartment' });
const props = withDefaults(defineProps<Props>(), {
  value: '',
  multiple: false,
  disabled: false,
  size: 'default',
  placeholder: '请选择部门',
  title: '选择部门'
});

interface Emits {
  (e: 'update:value', visible: any): void;

  (e: 'update', visible: any): void;
}

const emit = defineEmits<Emits>();

const selectValue = computed({
  get() {
    return props.value;
  },
  set(value) {
    emit('update:value', value);
    emit('update', value);
  }
});

const checkValue = computed({
  get() {
    if (props.value) {
      if (props.multiple && isArray(props.value)) {
        return props.value;
      }
      return [props.value];
    }
    return [];
  },
  set() {}
});

const options = ref<Array<any>>([]);
const showListModal = ref<boolean>(false);
type FormFilterModel = SystemDepartmentNamespace.SystemDepartmentQuery;
const deptFilter = reactive<FormFilterModel>({ pageNum: 1, pageSize: 10 });

function handleSearch(value: string) {
  deptFilter.deptName = value;
  deptFilter.pageNum = 1;
  queryDepartmentList();
}

/** 显示部门的列表 */
function showDepartmentList() {
  if (!props.disabled) {
    showListModal.value = true;
  }
}

async function queryDepartmentList() {
  const { data } = await findSystemDepartmentList(deptFilter);
  if (data && data.list.length > 0) {
    options.value = data.list;
  }
  findOtherSystemDeptById(props.value);
}

/**
 * 多选列表返回的数据
 *
 * @param value
 */
function getSelectDept(value: any) {
  console.log('---getSelectDept-----', value);
  if (props.multiple) {
    const list = value.selected.map((item: any) => item.id);
    selectValue.value = selectValue.value.concat(list);
  } else {
    selectValue.value = value.selected[0].id;
  }
}

/**
 * 查询单个数据，并添加到列表中，防止数据多，单条无法回显的问题
 *
 * @param newValue
 */
async function findOtherSystemDeptById(newValue: any) {
  if (newValue === null || newValue === undefined || newValue === '') {
    return;
  }
  if (props.multiple) {
    if (Array.isArray(newValue)) {
      // 是数组
      newValue.map(async item => {
        let flag = false;
        options.value.forEach(item1 => {
          if (item === item1.id) {
            flag = true;
          }
        });
        if (!flag) {
          const { data } = await findSystemDepartmentDetail(item);
          if (data !== null) {
            options.value.push(data);
          }
        }
        return item;
      });
    } else {
      let flag = false;
      options.value.forEach(item => {
        if (item.id === newValue) {
          flag = true;
        }
      });
      if (!flag) {
        const { data } = await findSystemDepartmentDetail(newValue);
        if (data !== null) {
          options.value.push(data);
        }
      }
    }
  } else {
    let flag = false;
    options.value.forEach(item => {
      if (item.id === newValue) {
        flag = true;
      }
    });
    if (!flag) {
      const { data } = await findSystemDepartmentDetail(newValue);
      if (data !== null) {
        options.value.push(data);
      }
    }
  }
}

watch(
  () => props.value,
  newValue => {
    console.log('---getSelect department--watch---', newValue, props.value);
    queryDepartmentList();
  }
);

onMounted(() => {
  queryDepartmentList();
});

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ListCircleOutline = __forwarded_ListCircleOutline;
</script>

<template>
  <div class="privernal-main">
    <!-- options prop + props 字段映射为 EP 2.13 原生能力，替代原 NSelect 的 value-field/label-field -->
    <ElSelect
      v-model="selectValue"
      :multiple="props.multiple"
      filterable
      remote
      clearable
      :remote-method="handleSearch"
      :options="options"
      :props="{ label: 'deptName', value: 'id' }"
      :size="props.size"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
    >
      <!--
 EP 2.13 的 ElSelect 只渲染 #prefix 插槽（suffix 区没有 renderSlot），列表图标必须放前缀；
           stop 防止冒泡到 wrapper 的 click 同时打开下拉 
-->
      <template #prefix>
        <ElIcon
          class="privernal-dept-arrow cursor-pointer"
          title="从部门树中选择"
          @mousedown.stop.prevent
          @click.stop.prevent="showDepartmentList"
        >
          <component :is="ListCircleOutline" />
        </ElIcon>
      </template>
    </ElSelect>

    <TransferDepartment
      v-if="showListModal"
      v-model:visible="showListModal"
      :multiple="props.multiple"
      :title="props.title"
      :selected-data="checkValue"
      @closed="getSelectDept"
    ></TransferDepartment>
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
