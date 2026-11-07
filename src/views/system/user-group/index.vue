<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { ElButton, ElSpace } from 'element-plus';
import { delSystemUserGroup, findSystemUserGroupList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './components/system-user-group-modal.vue';
import SystemUserGroupModal from './components/system-user-group-modal.vue';
import ListPersonModal from './components/list-person-modal.vue';
const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const visiblePerson = ref<boolean>(false);
const groupData = ref<SystemUserGroupNamespace.SystemUserGroupForm | null>(null);

const tableData = ref<SystemUserGroupNamespace.SystemUserGroupForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
type FormFilterModel = SystemUserGroupNamespace.SystemUserGroupQuery & { keyword: string };
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
    formFilter.pageSize = pagination.pageSize ? pagination.pageSize : 10;
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

function setTableData(data: SystemUserGroupNamespace.SystemUserGroupPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemUserGroupNamespace.SystemUserGroupQuery) {
  startLoading();
  const { data } = await findSystemUserGroupList(dataQuery);
  let result: SystemUserGroupNamespace.SystemUserGroupPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemUserGroupNamespace.SystemUserGroupForm>[]> = ref([
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
    key: 'groupCode',
    title: '组编码',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'remark',
    title: '备注',
    align: 'left',
    ellipsis: true
  },
  // {
  //   key: 'groupType',
  //   title: '类型;SYSTEM 系统默认 CUSTOM 用户创建',
  //       align: 'left',
  //   ellipsis: true,
  // },
  // {
  //   key: 'organizationId',
  //   title: '组织ID',
  //       align: 'left',
  //   ellipsis: true,
  // },
  // {
  //   key: 'departmentId',
  //   title: '部门ID',
  //       align: 'left',
  //   ellipsis: true,
  // }
  {
    key: 'actions',
    title: '操作',
    align: 'left',
    ellipsis: true,
    fixed: 'right',
    className: 'table-action-title',
    width: 300,
    render: row => {
      return (
        <ElSpace>
          <div v-permission="'system:userGroup:edit'">
            <ElButton text size={'small'} type="primary" onClick={(events: Event) => handlePersonTable(row, events)}>
              添加人员
            </ElButton>
          </div>
        </ElSpace>
      );
    }
  }
]) as Ref<DataTable.Column<SystemUserGroupNamespace.SystemUserGroupForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemUserGroupNamespace.SystemUserGroupForm | null>(null);

function setEditData(data: SystemUserGroupNamespace.SystemUserGroupForm | null) {
  editData.value = data;
}

/** 新增 */
function handleAddTable() {
  openModal();
  setModalType('add');
}

/** 多行删除 */
function handleDeleteRows() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error('请选择要删除的数据！');
    return;
  }
  delSystemUserGroup(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      init();
    }
  });
}

/**
 * 单独某列的点击的处理
 *
 * @param row
 */
function tableColumnClick(row: SystemUserGroupNamespace.SystemUserGroupForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}

/**
 * 显示详情关闭的回调函数
 *
 * @param value
 */
function handleClose(value: boolean) {
  if (value) {
    getTableData(formFilter);
  }
}

function init() {
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
function handlePersonTable(data: SystemUserGroupNamespace.SystemUserGroupForm, event: Event) {
  event.stopPropagation();
  visiblePerson.value = true;
  groupData.value = data;
}

// 初始化
init();
</script>

<template>
  <div class="main-space overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:userGroup:add"
          permission-remove="system:userGroup:remove"
          permission-import="system:userGroup:import"
          permission-export="system:userGroup:export"
          operation-title="用户组"
          :show-operation="true"
          :show-export="false"
          :show-import="false"
          @add="handleAddTable"
          @delete="handleDeleteRows"
          @keyword-search="keywordSearch"
          @keyword-clear="clearSearch"
          @search="init"
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
            <ListAdditional v-model:columns="columns" @reload="init"></ListAdditional>
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

        <SystemUserGroupModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />

        <ListPersonModal v-model:visible="visiblePerson" :edit-data="groupData" />
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
