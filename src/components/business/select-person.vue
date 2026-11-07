<script setup lang="tsx">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { ComponentSize } from 'element-plus';
import { ElSelect as __forwarded_ElSelect } from 'element-plus';
import { ListCircleOutline as __forwarded_ListCircleOutline } from '@vicons/ionicons5';
import { findSystemUserByOrganizationId, findSystemUserDetail, findSystemUserList } from '@/service';
import { isArray } from '@/utils';

export interface Props {
  /** 标题 */
  title?: string;
  /** 组件的值 */
  value: any;
  /** 组件是否多选 */
  multiple?: boolean;
  /** 组件是否禁用 */
  disabled?: boolean;
  /** 组件的大小 */
  size?: ComponentSize;
  placeholder?: string;
  /** 字段类型或者业务类型 */
  customType?: string;
  /** 组织ID，在企业创建时，查询人员，因为不是同一个组织查询不出来。 */
  organizationId?: string;
}

defineOptions({ name: 'SelectPerson' });
const props = withDefaults(defineProps<Props>(), {
  value: '',
  multiple: false,
  organizationId: undefined,
  size: 'default',
  placeholder: '请选择人员',
  title: '选择人员'
});

interface Emits {
  (e: 'update:value', visible: any): void;
  (e: 'update', visible: any): void;
  (e: 'person-selected', data: any, customType?: string): void;
}

const emit = defineEmits<Emits>();

/** 人员选项（后端原始记录，label=nickName、value=id 由 ElOption 映射） */
const options = ref<Array<any>>([]);

const selectValue = computed({
  get() {
    return props.value;
  },
  set(value) {
    if (value !== null) {
      if (isArray(value)) {
        const tempList = options.value.filter(item => value.includes(item.id));
        emit('person-selected', tempList, props.customType);
      } else {
        const tempList = options.value.filter(item => value === item.id);
        emit('person-selected', tempList, props.customType);
      }
    } else {
      emit('person-selected', options.value, props.customType);
    }
    emit('update:value', value);
    emit('update', value);
  }
});

const checkValue = computed(() => {
  if (props.value) {
    if (props.multiple && isArray(props.value)) {
      return props.value;
    }
    return [props.value];
  }
  return [];
});

type FormFilterModel = SystemUserNamespace.SystemUserQuery;
const personFilter = reactive<FormFilterModel>({ pageNum: 1, pageSize: 50 });

/** 远程搜索（EP ElSelect：remote + remote-method，naive 的 @search 在 EP 不触发） */
function handleSearch(value: string) {
  personFilter.nickName = value;
  personFilter.pageNum = 1;
  queryDepartmentList();
}

/** 显示人员的列表弹窗 */
const showListModal = ref<boolean>(false);
function showDepartmentList() {
  if (!props.disabled) {
    showListModal.value = true;
  }
}

async function queryDepartmentList() {
  const { data } = await findSystemUserList(personFilter);
  if (data && data.list.length > 0) {
    options.value = data.list;
  }
  findOtherSystemUserById(props.value);
}

/**
 * 查询单个数据，并添加到列表中，防止数据多，单条无法回显的问题
 *
 * @param newValue
 */
async function findOtherSystemUserById(newValue: any) {
  if (newValue === null || newValue === undefined || newValue === '') {
    return;
  }
  const ids = Array.isArray(newValue) ? newValue : [newValue];
  ids.forEach(async item => {
    const exists = options.value.some(option => option.id === item);
    if (exists) return;
    if (props.organizationId !== undefined) {
      const { data } = await findSystemUserByOrganizationId(props.organizationId, item);
      if (data !== null) {
        options.value.push(data);
      }
    } else {
      const { data } = await findSystemUserDetail(item);
      if (data !== null) {
        options.value.push(data);
      }
    }
  });
}

function getSelectPerson(value: any) {
  if (props.multiple) {
    const list = value.selected.map((item: any) => item.key);
    selectValue.value = selectValue.value.concat(list);
    const tempList = options.value.filter(item => selectValue.value.includes(item.id));
    emit('person-selected', value.concat(tempList), props.customType);
  } else {
    selectValue.value = value.selected[0].key;
  }
}

watch(
  () => props.value,
  () => {
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
    <ElSelect
      v-model="selectValue"
      :multiple="props.multiple"
      filterable
      remote
      clearable
      :remote-method="handleSearch"
      :size="props.size"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      class="w-full"
    >
      <!--
 前缀图标：点击弹出人员穿梭框。必须 stop：ElSelect 在 wrapper 上监听 click 切换下拉，
           事件冒泡上去会同时打开下拉与弹窗 
-->
      <template #prefix>
        <ElIcon
          class="select-person-trigger cursor-pointer"
          title="从列表中选择人员"
          @mousedown.stop.prevent
          @click.stop.prevent="showDepartmentList"
        >
          <component :is="ListCircleOutline" />
        </ElIcon>
      </template>
      <ElOption v-for="item in options" :key="item.id" :label="item.nickName" :value="item.id" />
    </ElSelect>

    <TransferPerson
      v-if="showListModal"
      v-model:visible="showListModal"
      :title="props.title"
      :multiple="props.multiple"
      :selected-data="checkValue"
      @closed="getSelectPerson"
    ></TransferPerson>
  </div>
</template>

<style lang="scss" scoped>
.privernal-main {
  width: 100%;
}
</style>
