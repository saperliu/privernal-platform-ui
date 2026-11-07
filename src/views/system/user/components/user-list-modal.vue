<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref, watch } from 'vue';
import type { TreeInstance } from 'element-plus';
import { genderLabels, userStatusColors, userStatusLabels } from '@/constants';
import { delSystemUser, findSystemDepartmentTree, findSystemUserAllList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './user-action-modal.vue';
import TableActionModal from './user-action-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();

const departmentData = ref();
const tableData = ref<SystemUserNamespace.SystemUserForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/** `ListFilter` 的 `keyword` 是必填 string，`SystemUserQuery` 里它是可选，这里按控件口径收紧 */
type FormFilterModel = SystemUserNamespace.SystemUserQuery & { keyword: string };
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({ pageNum: defaultPageNum, pageSize: defaultPageSize, keyword: '' });
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

function setTableData(data: SystemUserNamespace.SystemUserPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemUserNamespace.SystemUserQuery) {
  startLoading();
  let result: SystemUserNamespace.SystemUserPage = { list: [], total: 0 };
  const { data } = await findSystemUserAllList(dataQuery);
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemUserNamespace.SystemUserForm>[]> = ref([
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
    render(_, index) {
      return index + 1;
    }
  },
  {
    key: 'nickName',
    title: '姓名',
    align: 'left',
    ellipsis: true,
    render: row => {
      return (
        <TableColumnLink value={row} name={row.nickName ?? ''} onClick={() => tableColumnClick(row)}></TableColumnLink>
      );
    }
  },
  {
    key: 'loginName',
    title: '登录名',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'status',
    title: '状态',
    align: 'left',
    ellipsis: true,
    render: row => {
      return (
        <DataStatus
          value={row.status}
          dataStatusLabelList={userStatusLabels}
          dataStatusColorList={userStatusColors}
        ></DataStatus>
      );
    }
  },
  {
    key: 'gender',
    title: '性别',
    align: 'left',
    ellipsis: true,
    render: row => {
      if (row.gender) {
        return <span>{genderLabels[row.gender]}</span>;
      }
      return <span></span>;
    }
  },
  {
    key: 'phone',
    title: '手机号码',
    align: 'left',
    ellipsis: true
  },
  // {
  //   key: 'email',
  //   title: '邮箱',
  //       align: 'left',
  //   ellipsis: true,
  // },

  {
    key: 'remark',
    title: '备注',
    ellipsis: true,
    align: 'left'
  }
  // {
  //   key: 'actions',
  //   title: '操作',
  //       align: 'left',
  //   ellipsis: true,,
  //   fixed: 'right',
  //   render: row => {
  //     return (
  //       <ElSpace justify={'center'}>
  //         <div v-permission="'system:user:edit'">
  //           <ElButton size={'small'} onClick={() => handleEditTable(row.id)}>
  //             编辑
  //           </ElButton>
  //         </div>
  //         <div v-permission="'system:user:remove'">
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
]) as Ref<DataTable.Column<SystemUserNamespace.SystemUserForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemUserNamespace.SystemUserForm | null>(null);

function setEditData(data: SystemUserNamespace.SystemUserForm | null) {
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
  delSystemUser(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      init();
    }
  });
}

// 窗口关闭刷新列表
watch(visible, newValue => {
  if (!newValue) {
    getTableData(formFilter);
  }
});

function init() {
  getTableData(formFilter);
}

/** 重置搜索 */
function resetForm() {
  formFilter.loginName = '';
  formFilter.nickName = '';
  formFilter.phone = '';
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
function tableColumnClick(row: SystemUserNamespace.SystemUserForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}

function handleClose(value: boolean) {
  if (value) {
    getTableData(formFilter);
  }
}

const departmentTreeRef = ref<TreeInstance>();
/** 当前选中的部门 id（空串表示未选） */
const selectedDeptId = ref('');

/** 查询组织树 */
async function findDepartmentTree() {
  const { data } = await findSystemDepartmentTree({ deptName: '', pageSize: 10, pageNum: 1 });
  if (data !== null) {
    departmentData.value = data.children;
  }
}

/**
 * 点击部门树节点（单选，再次点击取消）
 *
 * @param data 节点数据
 */
function selectTreeNode(data: { id: string | number }) {
  const deptId = `${data.id}`;
  if (selectedDeptId.value === deptId) {
    selectedDeptId.value = '';
    departmentTreeRef.value?.setCurrentKey(undefined);
  } else {
    selectedDeptId.value = deptId;
  }
  formFilter.departmentId = selectedDeptId.value;
  getTableData(formFilter);
}

findDepartmentTree();
// 初始化
init();
</script>

<template>
  <div class="main-space overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-90% flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:user:add"
          permission-remove="system:user:remove"
          permission-import="system:user:import"
          permission-export="system:user:export"
          operation-title="用户"
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
              <div class="col-span-3 flex flex-row items-center justify-end">登录名</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.loginName" />
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">姓名</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.nickName" />
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">电话号码</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.phone" />
              </div>
            </div>
          </template>
          <template #toolbar-extra>
            <ListAdditional v-model:columns="columns" @reload="init"></ListAdditional>
          </template>
        </ListFilter>

        <div class="h-full flex flex-row">
          <div class="mr-5 w-20%">
            <div class="dt-title mb-3 mt-1 h-8 b-b b-b-gray-200 b-b-solid">部门</div>
            <ElTree
              ref="departmentTreeRef"
              node-key="id"
              :props="{ label: 'deptName', children: 'children' }"
              :data="departmentData"
              default-expand-all
              highlight-current
              @node-click="selectTreeNode"
            />
          </div>

          <DataTable
            v-model:checked-row-keys="checkedRowKeys"
            remote
            :columns="columns"
            :data="tableData"
            :loading="loading"
            :pagination="pagination"
            :row-key="rowKey"
            flex-height
            class="flex-1-hidden"
            size="small"
            :bordered="false"
            :bottom-bordered="true"
            striped
          />
        </div>

        <TableActionModal
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
          :department-id="formFilter.departmentId ?? undefined"
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
  //  height: 90%;
  //}
}
.dt-title {
  padding-bottom: 5px;
  font-size: var(--n-font-size);
  color: var(--n-th-text-color);
  font-weight: 500;
}
</style>
