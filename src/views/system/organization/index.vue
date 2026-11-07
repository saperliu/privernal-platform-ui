<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { ElButton, ElSpace } from 'element-plus';
import { delSystemOrganization, findSystemOrganizationList, synSystemOrganization } from '@/service';
import { useBodyLoading, useBoolean, useLoading } from '@/hooks';
import { orderByColumn } from '@/utils';
import type { ModalType } from './components/table-action-modal.vue';
import TableActionModal from './components/table-action-modal.vue';
import AppListModal from './components/app-list-modal.vue';
const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { startBodyLoading, endBodyLoading } = useBodyLoading();
const tableData = ref<SystemOrganizationNamespace.SystemOrganizationForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
const visibleAuth = ref<boolean>(false);
const orgData = ref<SystemOrganizationNamespace.SystemOrganizationForm | null>(null);
type FormFilterModel = SystemOrganizationNamespace.SystemOrganizationQuery & { keyword: string };
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

function setTableData(data: SystemOrganizationNamespace.SystemOrganizationPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemOrganizationNamespace.SystemOrganizationQuery) {
  startLoading();
  const { data } = await findSystemOrganizationList(dataQuery);
  let result: SystemOrganizationNamespace.SystemOrganizationPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemOrganizationNamespace.SystemOrganizationForm>[]> = ref([
  {
    type: 'selection',
    fixed: 'left',
    align: 'center',
    width: 60
  },
  {
    key: 'index',
    title: '序号',
    width: 60,
    align: 'left',
    fixed: 'left',
    render(_, index) {
      return index + 1;
    }
  },
  {
    key: 'organizationName',
    title: '企业名称',
    ellipsis: true,
    fixed: 'left',
    align: 'left',
    sortOrder: false,
    sorter: true,
    render: row => {
      return (
        <TableColumnLink
          value={row}
          name={row.organizationName}
          onClick={() => tableColumnClick(row)}
        ></TableColumnLink>
      );
    }
  },
  {
    key: 'organizationCode',
    title: '企业编码',
    ellipsis: true,
    sortOrder: false,
    sorter: true,
    align: 'left'
  },
  {
    key: 'leaderName',
    title: '管理员',
    align: 'left'
  },
  {
    key: 'status',
    title: '状态',
    align: 'left',
    render: row => {
      return <DataStatus value={row.status}></DataStatus>;
    }
  },
  {
    key: 'remark',
    title: '描述',
    ellipsis: true,
    align: 'left'
  },
  {
    key: 'actions',
    title: '操作',
    align: 'left',
    fixed: 'right',
    className: 'table-action-title',
    width: 450,
    render: row => {
      return (
        <ElSpace alignment={'start'}>
          <div v-permission="'system:organization:edit'">
            <ElButton text size={'small'} type="primary" onClick={(events: Event) => handleFunction(row, events)}>
              授权应用
            </ElButton>
          </div>
          <div v-permission="'system:organization:edit'">
            <ElButton text size={'small'} type="primary" onClick={(events: Event) => handleSynTable(row.id, events)}>
              同步钉钉组织
            </ElButton>
          </div>
        </ElSpace>
      );
    }
  }
]) as Ref<DataTable.Column<SystemOrganizationNamespace.SystemOrganizationForm>[]>;

// <div v-permission="'system:organization:edit'">
//   <ElButton
//     quaternary
//     size={'small'}
//     type="primary"
//     onClick={(events: Event) => handleSynDict(row.id, events)}
//   >
//     同步域值
//   </ElButton>
// </div>
// <div v-permission="'system:organization:edit'">
//   <ElButton
//     quaternary
//     size={'small'}
//     type="primary"
//     onClick={(events: Event) => handleSynWorkflow(row.id, events)}
//   >
//     同步流程和表单
//   </ElButton>
// </div>
const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemOrganizationNamespace.SystemOrganizationForm | null>(null);

function setEditData(data: SystemOrganizationNamespace.SystemOrganizationForm | null) {
  editData.value = data;
}

function handleAddTable() {
  openModal();
  setModalType('add');
}

function handleSynTable(rowId: string, events: Event) {
  events.stopPropagation();
  startBodyLoading();
  synSystemOrganization(rowId).then(res => {
    if (res.error === null) {
      window.$message?.success('同步成功');
      search();
    } else {
      window.$message?.error('同步失败！');
    }
    endBodyLoading();
  });
}

function handleDeleteRows() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error('请选择要删除的数据！');
    return;
  }
  startLoading();
  delSystemOrganization(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      search();
    }
    endLoading();
  });
}

/**
 * 某列的排序处理
 *
 * @param sorter
 */
function handleUpdateSorter(sorter: DataTable.SortState) {
  orderByColumn(sorter, formFilter, columns);
  getTableData(formFilter);
}

/**
 * 单独某列的点击的处理
 *
 * @param row
 */
function tableColumnClick(row: SystemOrganizationNamespace.SystemOrganizationForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}
function handleClose(value: boolean) {
  if (value) {
    getTableData(formFilter);
  }
}
function handleFunction(data: SystemOrganizationNamespace.SystemOrganizationForm, events: Event) {
  visibleAuth.value = true;
  orgData.value = data;
  events.stopPropagation();
}
/** 重置搜索 */
function resetForm() {
  clearSearch();
}

/** 清空模糊搜索 */
function clearSearch() {
  for (const field of Object.keys(formFilter)) {
    if (field === 'pageNum') {
      Reflect.set(formFilter, field, defaultPageNum);
    } else if (field !== 'pageSize') {
      Reflect.set(formFilter, field, null);
    }
  }

  getTableData(formFilter);
}

/** 模糊搜索 */
function keywordSearch() {
  if (formFilter.keyword !== null && formFilter.keyword !== '' && formFilter.keyword !== undefined) {
    formFilter.keywords = formFilter.keyword.split(' ');
  }
  getTableData(formFilter);
}

/** 列表查询 */
function search() {
  getTableData(formFilter);
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
          permission-add="system:organization:add"
          permission-remove="system:organization:remove"
          permission-import="system:organization:import"
          permission-export="system:organization:export"
          operation-title="企业"
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
              <div class="col-span-3 flex flex-row items-center justify-end">名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.organizationName" size="small" />
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">编码</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.organizationCode" size="small" />
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
          striped
          :bordered="false"
          :bottom-bordered="true"
          @update:sorter="handleUpdateSorter"
        />
        <TableActionModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />

        <!--        <org-function-modal v-model:visible="visibleAuth" :edit-data="orgData" />-->

        <!--                <app-authorize-modal v-model:visible="visibleAuth" :edit-data="orgData" />-->
        <AppListModal
          v-model:visible="visibleAuth"
          :show-operation="false"
          :edit-data="orgData"
          @closed="handleClose"
        />
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
