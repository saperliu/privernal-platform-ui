<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { ElButton, ElSpace } from 'element-plus';
import { delSystemRole, findSystemRoleList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import AppAuthorizeModal from '@/views/system/role/components/app-authorize-modal.vue';
import type { ModalType } from './components/table-action-modal.vue';
import TableActionModal from './components/table-action-modal.vue';
import AuthPersonModal from './components/auth-person-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemRoleNamespace.SystemRoleForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
type FormFilterModel = SystemRoleNamespace.SystemRoleQuery & { keyword: string };
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  systemType: 'SYSTEM',
  keyword: '',
  keywords: []
});
const pagination = reactive({
  page: defaultPageNum,
  pageSize: defaultPageSize,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30, 50, 100],
  itemCount: 100,
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

function setTableData(data: SystemRoleNamespace.SystemRolePage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemRoleNamespace.SystemRoleQuery) {
  startLoading();
  const { data } = await findSystemRoleList(dataQuery);
  let result: SystemRoleNamespace.SystemRolePage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemRoleNamespace.SystemRoleForm>[]> = ref([
  {
    type: 'selection',
    align: 'center',
    width: 60
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
    key: 'roleName',
    title: '角色名称',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.roleName} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  // {
  //   key: 'systemType',
  //   title: '角色的类型',
  //       align: 'left',
  //   ellipsis: true,
  // },
  // {
  //   key: 'dataScope',
  //   title: '数据权限',
  //       align: 'left',
  //   ellipsis: true,
  //   render: row => {
  //     const tagTypes: Record<string, DataTable.ThemeColor> = {
  //       '10': 'primary',
  //       '20': 'success',
  //       '30': 'info',
  //       '40': 'warning'
  //     };
  //     return <ElTag type={tagTypes[row.dataScope]}>{dataScopeLabels[row.dataScope]}</ElTag>;
  //   }
  // },
  {
    key: 'status',
    title: '状态',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <DataStatus value={row.status}></DataStatus>;
    }
  },
  // {
  //   key: 'classificationId',
  //   title: '角色分类ID',
  //       align: 'left',
  //   ellipsis: true,
  // },
  {
    key: 'remark',
    title: '备注',
    ellipsis: true,
    align: 'left'
  },
  {
    key: 'deptName',
    title: '所属部门',
    align: 'left',
    ellipsis: true
  },
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
          <div v-permission="'system:role:edit'">
            <ElButton text size={'small'} type="primary" onClick={(events: Event) => handleAuthTable(row, events)}>
              功能授权
            </ElButton>
          </div>
          <div v-permission="'system:role:edit'">
            <ElButton text size={'small'} type="primary" onClick={(events: Event) => handleAuthPerson(row, events)}>
              人员管理
            </ElButton>
          </div>
        </ElSpace>
      );
    }
  }
]) as Ref<DataTable.Column<SystemRoleNamespace.SystemRoleForm>[]>;

const modalType = ref<ModalType>('add');
const visibleAuth = ref<boolean>(false);
const visiblePerson = ref<boolean>(false);

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemRoleNamespace.SystemRoleForm | null>(null);
const roleData = ref<SystemRoleNamespace.SystemRoleForm | null>(null);

function setEditData(data: SystemRoleNamespace.SystemRoleForm | null) {
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
  delSystemRole(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      search();
    }
  });
}

function handleAuthTable(data: SystemRoleNamespace.SystemRoleForm, events: Event) {
  events.stopPropagation();
  visibleAuth.value = true;
  roleData.value = data;
}

function handleAuthPerson(data: SystemRoleNamespace.SystemRoleForm, events: Event) {
  events.stopPropagation();
  visiblePerson.value = true;
  roleData.value = data;
}

function search() {
  getTableData(formFilter);
}

/** 重置搜索 */
function resetForm() {
  formFilter.roleName = '';
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
function tableColumnClick(row: SystemRoleNamespace.SystemRoleForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}

function handleClose(value: boolean) {
  if (value) {
    getTableData(formFilter);
  }
}

function handleTabsUpdateValue(value: string | number) {
  formFilter.systemType = String(value);
  getTableData(formFilter);
}

/** 当前角色类型 tab（ElTabs 需 v-model 受控，naive 的 update:value 事件不生效） */
const activeTab = ref('SYSTEM');
// 初始化
search();
</script>

<template>
  <div class="main-space overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:role:add"
          permission-remove="system:role:remove"
          permission-import="system:role:import"
          permission-export="system:role:export"
          operation-title="角色"
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
                <ElInput v-model="formFilter.roleName" size="small" />
              </div>
            </div>
          </template>
          <template #toolbar-extra>
            <ListAdditional v-model:columns="columns" @reload="search"></ListAdditional>
          </template>
        </ListFilter>

        <ElTabs v-model="activeTab" @tab-change="handleTabsUpdateValue">
          <ElTabPane name="SYSTEM" label="系统默认" class="h-full">
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
          </ElTabPane>
          <ElTabPane name="NORMAL" label="自定义" class="h-full">
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
          </ElTabPane>
        </ElTabs>

        <TableActionModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />
        <!--        <auth-function-modal v-model:visible="visibleAuth" :edit-data="roleData" @closed="handleClose" />-->
        <AuthPersonModal v-model:visible="visiblePerson" :edit-data="roleData" />
        <AppAuthorizeModal v-model:visible="visibleAuth" :edit-data="roleData"></AppAuthorizeModal>
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
:deep(.n-tabs) {
  height: 100%;
}
:deep(.n-data-table) {
  height: 100%;
}
</style>
