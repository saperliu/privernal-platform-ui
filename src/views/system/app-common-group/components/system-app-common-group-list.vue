<script setup lang="tsx">
import type { Ref } from 'vue';
import { onMounted, reactive, ref } from 'vue';
import { ActionTagAdd, ActionTagDelete } from '@/constants';
import { findSystemAppCommonGroupList } from '@/service';
import { useLoading } from '@/hooks';
import SystemCommonGroupList from '@/views/system/common-group/components/system-common-group-list.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'SystemAppCommonGroupList' });
const props = withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: SystemAppCommonGroupNamespace.SystemAppCommonGroupForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<SystemAppCommonGroupNamespace.SystemAppCommonGroupForm[]>([]);
const checkedRowKeys = ref<string[]>([]);

const modalVisibleMenu = ref(false);
const checkedRows = ref<SystemAppCommonGroupNamespace.SystemAppCommonGroupForm[]>([]);

const changeRows = ref<SystemAppCommonGroupNamespace.SystemAppCommonGroupForm[]>([]);
const haveMenuRows = ref<SystemAppCommonGroupNamespace.SystemAppCommonGroupForm[]>([]);

/** ListFilter 的 keyword 是必填 string，查询类型里它是可选，本地交叉补齐 */
type FormFilterModel = SystemAppCommonGroupNamespace.SystemAppCommonGroupQuery & { keyword: string };
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
  appId: '',
  commonGroupId: '',
  organizationId: '',
  status: 1,
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: []
});

const pagination = reactive({
  page: defaultPageNum,
  pageSize: defaultPageSize,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30, 50, 100],
  itemCount: 0,
  prefix(info: DataTable.PaginationInfo) {
    return `总数: ${info.itemCount}条`;
  },
  onChange: (page: number) => {
    pagination.page = page;
    formFilter.pageNum = page;
    formFilter.pageSize = pagination.pageSize ? pagination.pageSize : defaultPageSize;
    getTableData(formFilter);
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = defaultPageNum;
    formFilter.pageNum = pagination.page;
    formFilter.pageSize = pageSize;
    getTableData(formFilter);
  }
});

function setTableData(data: SystemAppCommonGroupNamespace.SystemAppCommonGroupPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemAppCommonGroupNamespace.SystemAppCommonGroupQuery) {
  startLoading();
  const { data } = await findSystemAppCommonGroupList(dataQuery);
  let result: SystemAppCommonGroupNamespace.SystemAppCommonGroupPage = { list: [], total: 0 };
  if (data) {
    result = data;
    data.list.forEach(item2 => {
      haveMenuRows.value.push(item2);
    });
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemAppCommonGroupNamespace.SystemAppCommonGroupForm>[]> = ref([
  {
    type: 'selection',
    align: 'center',
    width: 60
  },
  {
    key: 'index',
    title: '序号',
    align: 'left',
    ellipsis: true,
    width: 60,
    render(_, index) {
      return index + 1;
    }
  },
  {
    key: 'commonGroupName',
    title: '公共组名',
    align: 'left',
    ellipsis: true
  },
  // {
  //   key: 'status',
  //   title: '状态',
  //   align: 'left',
  //   ellipsis: true,
  //   render: row => {
  //     return <DataStatus value={row.status}></DataStatus>;
  //   }
  // },
  {
    key: 'remark',
    title: '备注',
    align: 'left',
    ellipsis: true
  }
]) as Ref<DataTable.Column<SystemAppCommonGroupNamespace.SystemAppCommonGroupForm>[]>;

/** 新增 */
function handleAddTable() {
  modalVisibleMenu.value = true;
}

/** 多行删除 */
function handleDeleteRows() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error('请选择要删除的数据！');
    return;
  }
  checkedRows.value.forEach(item => {
    if (item !== undefined && item.actionTag === ActionTagAdd) {
      changeRows.value = changeRows.value.filter(item2 => item2.commonGroupId !== item.commonGroupId);
      tableData.value = tableData.value.filter(item2 => item2.commonGroupId !== item.commonGroupId);
    } else if (item !== undefined) {
      // 打上删除标签
      item.actionTag = ActionTagDelete;
      changeRows.value.push(item);
      // 递归循环children 删除里面menuId相同的数据
      tableData.value = tableData.value.filter(item2 => item2.commonGroupId !== item.commonGroupId);
    }
    checkedRowKeys.value = checkedRowKeys.value.filter(item2 => item2 !== item.id);
    haveMenuRows.value = haveMenuRows.value.filter(item2 => item2.commonGroupId !== item.commonGroupId);
  });
  emit('change', changeRows.value);
  // delSystemAppCommonGroup(checkedRowKeys.value).then(res => {
  //   if (res.error === null) {
  //     checkedRowKeys.value = [];
  //     message.success('删除成功');
  //     search();
  //   }
  // });
}

/** 重置搜索 */
function resetForm() {
  clearSearch();
}

/** 清空模糊搜索 */
function clearSearch() {
  /** 查询模型是 interface（无隐式索引签名），交叉一层 Record 取可写视图，用于按 key 批量清空 */
  const filterFields = formFilter as FormFilterModel & Record<string, unknown>;
  for (const field in filterFields) {
    if (field === 'pageNum') {
      formFilter.pageNum = defaultPageNum;
    } else if (field !== 'pageSize') {
      filterFields[field] = null;
    }
  }

  getTableData(formFilter);
}

/** 模糊搜索 */
function keywordSearch() {
  if (formFilter.keyword !== null) {
    formFilter.keywords = formFilter.keyword.split(' ');
  }
  getTableData(formFilter);
}

/**
 * 回调推送选择的数据
 *
 * @param keys
 * @param rows
 * @param meta
 */
function handleChangeChecked(
  _keys: Array<string | number>,
  rows: SystemAppCommonGroupNamespace.SystemAppCommonGroupForm[],
  _meta: { row: object | undefined; action: 'check' | 'uncheck' | 'checkAll' | 'uncheckAll' }
) {
  // emit('change', rows);
  checkedRows.value = rows;
}

/**
 * 选择的菜单数据
 *
 * @param rows
 */
function handleSubAddTable(rows: SystemCommonGroupNamespace.SystemCommonGroupForm[]) {
  // 移除tableData里newAdd是ture的数据
  tableData.value = tableData.value.filter(item => item.actionTag !== ActionTagAdd);
  changeRows.value = changeRows.value.filter(item => item.actionTag !== ActionTagAdd);
  haveMenuRows.value = haveMenuRows.value.filter(item => item.actionTag !== ActionTagAdd);

  console.log('---------', rows, haveMenuRows);
  // 添加到子表数据里，是所有数据，并且包含之前的数据
  rows.forEach(value => {
    if (value !== undefined) {
      const temp: SystemAppCommonGroupNamespace.SystemAppCommonGroupForm = {
        id: '',
        organizationId: '',
        appId: props.parentId,
        commonGroupId: '',
        commonGroupName: '',
        status: 1,
        actionTag: ActionTagAdd
      };
      Object.assign(temp, value);
      temp.commonGroupId = value.id;
      temp.commonGroupName = value.name;
      temp.appId = props.parentId;

      const flag = haveMenuRows.value.find(item => item.commonGroupId === value.id);
      if (!flag) {
        // 判断是否是恢复的，比如：先删除，再添加回来。这样的不需要提交给后台。
        const newAdd = changeRows.value.find(item => item.commonGroupId === value.id);
        console.log('------newAdd---', newAdd);
        if (newAdd && newAdd.actionTag === ActionTagDelete) {
          // 则是之前删除的，则不需要提交给后台。
          changeRows.value = changeRows.value.filter(item => item.commonGroupId !== value.id);
          temp.actionTag = '';
          tableData.value.push(temp);
          haveMenuRows.value.push(temp);
        } else {
          tableData.value.push(temp);
          haveMenuRows.value.push(temp);
          changeRows.value.push(temp);
        }
      }
    }
  });
  // pagination.itemCount = tableData.value.length;
  console.log('------changeRows---', changeRows.value);
  // 返回给form表单
  emit('change', changeRows.value);
}

/**
 * 编辑后，保存
 *
 * @param row
 */
// function handleEditRow(row: SystemCommonGroupNamespace.SystemCommonGroupForm) {
//   // 去掉 changeRows 里的 id 相同的数据
//   changeRows.value = changeRows.value.filter(item => item.id !== row.id);
//   changeRows.value.push(row);
//   emit('change', changeRows.value);
// }

function search() {
  if (formFilter.appId !== '') {
    getTableData(formFilter);
  }
}

onMounted(() => {
  formFilter.appId = props.parentId;
  search();
});
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:appCommonGroup:add"
          permission-remove="system:appCommonGroup:remove"
          permission-import="system:appCommonGroup:import"
          permission-export="system:appCommonGroup:export"
          operation-title="应用公共组"
          :show-operation="showOperation"
          :show-export="false"
          :show-import="false"
          @add="handleAddTable"
          @delete="handleDeleteRows"
          @keyword-search="keywordSearch"
          @keyword-clear="clearSearch"
          @search="search"
          @reset="resetForm"
        >
          <template #filter>
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px"></div>
          </template>
          <template #toolbar-extra>
            <ListAdditional v-model:columns="columns" @reload="search"></ListAdditional>
          </template>
        </ListFilter>

        <DataTable
          v-model:checked-row-keys="checkedRowKeys"
          remote
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :row-key="rowKey"
          :scroll-x="1200"
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          :bottom-bordered="true"
          striped
          @update:checked-row-keys="handleChangeChecked"
        />

        <!--        <system-app-common-group-modal-->
        <!--          v-model:visible="visible"-->
        <!--          :type="modalType"-->
        <!--          :edit-data="editData"-->
        <!--          @closed="handleClose"-->
        <!--        />-->
      </div>
    </ElCard>

    <ElDrawer v-model="modalVisibleMenu" size="90%" title="添加公共组" resizable class="privernal-drawer">
      <template #header>
        <ElSpace :size="24" justify="space-between" align="center">
          <div>添加公共组</div>
        </ElSpace>
      </template>
      <SystemCommonGroupList
        :show-operation="false"
        :list-data="haveMenuRows"
        @change="handleSubAddTable"
      ></SystemCommonGroupList>
      <template #footer>
        <ElSpace class="w-full pt-16px" :size="24" justify="end">
          <ElButton class="w-72px" @click="modalVisibleMenu = false">取消</ElButton>
          <ElButton class="w-72px" type="primary" @click="modalVisibleMenu = false">确定</ElButton>
        </ElSpace>
      </template>
    </ElDrawer>
  </div>
</template>

<style lang="scss" scoped>
.main-space {
  // 解决数据table底边在最下面的问题
  //:deep(.n-scrollbar) {
  //  overflow: inherit;
  //}
}
</style>
