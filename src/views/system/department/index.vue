<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { ElButton, ElSpace } from 'element-plus';
import { delSystemDepartment, findSystemDepartmentAllTree } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import DepartmentActionModal from '@/views/system/department/components/department-action-modal.vue';
import type { ModalType } from './components/department-action-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const rootDeptData = reactive<SystemDepartmentNamespace.SystemDepartmentTable>({
  systemType: '',
  children: [],
  deptCode: '',
  deptName: '',
  index: 0,
  leaderId: '',
  orderNum: 0,
  organizationId: '',
  status: 1,
  id: ''
});
const tableData = ref<SystemDepartmentNamespace.SystemDepartmentTable[]>([]);
const checkedRowKeys = ref<string[]>([]);
/** 本地筛选模型：keyword 为 ListFilter 必填 string */
type FormFilterModel = SystemDepartmentNamespace.SystemDepartmentQuery & { keyword: string };
const formFilter = reactive<FormFilterModel>({ pageNum: 1, pageSize: 10, keyword: '', keywords: [] });
const showOperation = ref<boolean>(true);

function setTableData(data: SystemDepartmentNamespace.SystemDepartmentTable | null) {
  Object.assign(rootDeptData, data);
  tableData.value = data?.children ?? [];
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemDepartmentNamespace.SystemDepartmentQuery) {
  startLoading();
  const { data } = await findSystemDepartmentAllTree(dataQuery);
  setTableData(data);

  endLoading();
}

const columns: Ref<DataTable.Column<SystemDepartmentNamespace.SystemDepartmentTable>[]> = ref([
  {
    type: 'selection',
    align: 'center',
    width: 60
  },
  {
    key: 'deptName',
    title: '组织名称',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.deptName} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'leaderName',
    title: '主管',
    ellipsis: true,
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
    title: '备注',
    align: 'left',
    ellipsis: true
  },

  {
    key: 'actions',
    title: '操作',
    fixed: 'right',
    width: 300,
    align: 'left',
    className: 'table-action-title',
    render: row => {
      return (
        <ElSpace alignment="start">
          <div v-permission="'system:department:add'">
            <ElButton text size={'small'} type="primary" onClick={(events: Event) => handleAddChild(row, events)}>
              新增子组织
            </ElButton>
          </div>
        </ElSpace>
      );
    }
  }
]) as Ref<DataTable.Column<SystemDepartmentNamespace.SystemDepartmentTable>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemDepartmentNamespace.SystemDepartmentTable | null>(null);

function setEditData(data: SystemDepartmentNamespace.SystemDepartmentTable | null) {
  editData.value = data;
}

function handleAddTable() {
  setEditData(rootDeptData);
  openModal();
  setModalType('add');
}

function handleAddChild(item: SystemDepartmentNamespace.SystemDepartmentTable, events: Event) {
  events.stopPropagation();

  setEditData(item);
  setModalType('add');
  openModal();
}

function handleDeleteRows() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error('请选择要删除的数据！');
    return;
  }
  delSystemDepartment(checkedRowKeys.value).then(res => {
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
function tableColumnClick(row: SystemDepartmentNamespace.SystemDepartmentTable) {
  setEditData(row);
  setModalType('view');
  openModal();
}

function init() {
  getTableData(formFilter);
}

/** 重置搜索 */
function resetForm() {
  formFilter.deptName = '';
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
  formFilter.keywords = formFilter.keyword!.split(' ');
  getTableData(formFilter);
}

function handleClose(value: boolean) {
  if (value) {
    getTableData(formFilter);
  }
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
          permission-add="system:department:add"
          permission-remove="system:department:remove"
          permission-import="system:department:import"
          permission-export="system:department:export"
          operation-title="组织"
          :show-operation="showOperation"
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
                <ElInput v-model="formFilter.deptName" size="small" />
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
          :row-key="rowKey"
          :scroll-x="1200"
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          :bottom-bordered="true"
          striped
        />

        <DepartmentActionModal
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
          :dept-data="rootDeptData"
          @closed="handleClose"
        ></DepartmentActionModal>
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
