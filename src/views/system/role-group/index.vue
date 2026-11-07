<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { delSystemRoleGroup, findSystemRoleGroupList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './components/role-group-action-modal.vue';
import TableActionModal from './components/role-group-action-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemRoleGroupNamespace.SystemRoleGroupForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
type FormFilterModel = SystemRoleGroupNamespace.SystemRoleGroupQuery & { keyword: string };
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
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

function setTableData(data: SystemRoleGroupNamespace.SystemRoleGroupPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemRoleGroupNamespace.SystemRoleGroupQuery) {
  startLoading();
  const { data } = await findSystemRoleGroupList(dataQuery);
  let result: SystemRoleGroupNamespace.SystemRoleGroupPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemRoleGroupNamespace.SystemRoleGroupForm>[]> = ref([
  {
    type: 'selection',
    width: 60,
    align: 'center'
  },
  {
    key: 'index',
    title: '序号',
    width: 60,
    align: 'left',
    ellipsis: true,
    render(_, index) {
      return index + 1;
    }
  },
  {
    key: 'groupName',
    title: '组名',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.groupName} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'departmentName',
    title: '部门',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'remark',
    title: '备注',
    align: 'left',
    ellipsis: true
  }
  // {
  //   key: 'actions',
  //   title: '操作',
  //       align: 'left',
  //   ellipsis: true,,
  //   fixed: 'right',
  //   width: 300,
  //   render: row => {
  //     return (
  //       <ElSpace justify={'center'}>
  //         <div v-permission="'system:roleGroup:edit'">
  //           <ElButton size={'small'} onClick={() => handleEditTable(row.id)}>
  //             编辑
  //           </ElButton>
  //         </div>
  //         <div v-permission="'system:roleGroup:remove'">
  //           <ElPopconfirm onPositiveClick={() => handleDeleteTable(row.id)}>
  //             {{
  //               default: () => '确认删除',
  //               trigger: () => <ElButton size={'small'}>删除</ElButton>
  //             }}
  //           </ElPopconfirm>
  //         </div>
  //       </ElSpace>
  //     );
  //   }
  // }
]) as Ref<DataTable.Column<SystemRoleGroupNamespace.SystemRoleGroupForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemRoleGroupNamespace.SystemRoleGroupForm | null>(null);

function setEditData(data: SystemRoleGroupNamespace.SystemRoleGroupForm | null) {
  editData.value = data;
}

function handleAddTable() {
  openModal();
  setModalType('add');
}

function handleDeleteRows() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error('请选择要删除的数据！');
    return;
  }
  delSystemRoleGroup(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      search();
    }
  });
}

function search() {
  getTableData(formFilter);
}

/** 重置搜索 */
function resetForm() {
  formFilter.groupName = '';
  clearSearch();
}
/** 清空模糊搜索 */
function clearSearch() {
  formFilter.keywords = [];
  formFilter.keyword = '';
  getTableData(formFilter);
}

/** 模糊搜索 */
function keywordSearch() {
  formFilter.keywords = formFilter.keyword.split(' ');
  getTableData(formFilter);
}

/**
 * 单独某列的点击的处理
 *
 * @param row
 */
function tableColumnClick(row: SystemRoleGroupNamespace.SystemRoleGroupForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}

function handleClose(value: boolean) {
  if (value) {
    getTableData(formFilter);
  }
}

// 初始化
search();
</script>

<template>
  <div class="main-space overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:roleGroup:add"
          permission-remove="system:roleGroup:remove"
          permission-import="system:roleGroup:import"
          permission-export="system:roleGroup:export"
          operation-title="角色组"
          :show-operation="true"
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
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px">
              <div class="col-span-2 flex flex-row items-center justify-end">名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.groupName" size="small" />
              </div>
            </div>
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
        />

        <TableActionModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />
      </div>
    </ElCard>
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
