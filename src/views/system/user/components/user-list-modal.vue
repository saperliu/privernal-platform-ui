<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref, watch } from 'vue';
import type { TreeInstance } from 'element-plus';
import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElSpace,
  ElSwitch
} from 'element-plus';
import { genderLabels, userStatusColors, userStatusLabels } from '@/constants';
import {
  delFlowDelegate,
  delSystemUser,
  findFlowDelegateList,
  findSystemDepartmentTree,
  findSystemUserAllList,
  handoverFlowTasks,
  saveFlowDelegate,
  updateFlowDelegate,
  updateSystemUserDetail
} from '@/service';
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

/** ===== R2-17 离职移交：勾选一个用户作为移交人，把其名下全部待办转办给接收人 ===== */
const showHandover = ref(false);
const handoverFrom = ref<SystemUserNamespace.SystemUserForm | null>(null);
const handoverTarget = ref('');
const handoverDeactivate = ref(false);
const handoverSubmitting = ref(false);
const handoverUserOptions = ref<Array<{ label: string; value: string }>>([]);
const handoverUserLoading = ref(false);

function openHandover() {
  const checked = checkedRowKeys.value;
  const row = checked.length === 1 ? tableData.value.find(item => item.id === checked[0]) : null;
  if (!row) {
    window.$message?.warning('请先勾选一个要移交的用户');
    return;
  }
  handoverFrom.value = row;
  handoverTarget.value = '';
  handoverDeactivate.value = false;
  handoverUserOptions.value = [];
  showHandover.value = true;
  searchHandoverUsers('');
}

async function searchHandoverUsers(keyword: string) {
  handoverUserLoading.value = true;
  try {
    const { data } = await findSystemUserAllList({ pageNum: 1, pageSize: 50, keyword: keyword || '' } as any);
    handoverUserOptions.value = (data?.list ?? [])
      .filter(item => item.id !== handoverFrom.value?.id)
      .map(item => ({
        label: item.nickName && item.loginName ? `${item.nickName}（${item.loginName}）` : item.nickName || item.loginName || item.id,
        value: item.id
      }));
  } finally {
    handoverUserLoading.value = false;
  }
}

async function submitHandover() {
  if (!handoverFrom.value || !handoverTarget.value) {
    window.$message?.warning('请选择接收人');
    return;
  }
  handoverSubmitting.value = true;
  try {
    const { data, error } = await handoverFlowTasks(handoverFrom.value.id, handoverTarget.value, '离职移交');
    if (error !== null) return;
    window.$message?.success(`移交完成：成功 ${data?.success ?? 0} 条，失败 ${data?.failed ?? 0} 条`);
    if (handoverDeactivate.value && handoverFrom.value) {
      // 停用离职用户（沿用用户编辑接口，仅改状态）
      const { error: editError } = await updateSystemUserDetail({ ...handoverFrom.value, status: 3 } as any);
      if (editError === null) {
        window.$message?.success(`已停用用户 ${handoverFrom.value.nickName || handoverFrom.value.loginName}`);
      }
    }
    showHandover.value = false;
    init();
  } finally {
    handoverSubmitting.value = false;
  }
}

/** ===== R2-17 流程代理：代理人规则管理（被代理人的新待办会把代理人一并加入办理人） ===== */
const showDelegate = ref(false);
const delegateRows = ref<FlowNamespace.UserDelegate[]>([]);
const delegateLoading = ref(false);
const delegateUserOptions = ref<Array<{ label: string; value: string }>>([]);
const delegateUserLoading = ref(false);
const delegateForm = ref<FlowNamespace.UserDelegate>({
  userId: '',
  agentId: '',
  status: '1'
});
const delegateSaving = ref(false);
/** 编辑态规则 id（空=新增） */
const delegateEditingId = ref('');

function openDelegate() {
  showDelegate.value = true;
  resetDelegateForm();
  loadDelegates();
}

function resetDelegateForm() {
  delegateEditingId.value = '';
  delegateForm.value = { userId: '', agentId: '', status: '1' };
}

async function loadDelegates() {
  delegateLoading.value = true;
  try {
    const { data } = await findFlowDelegateList({});
    delegateRows.value = data ?? [];
  } finally {
    delegateLoading.value = false;
  }
}

async function searchDelegateUsers(keyword: string) {
  delegateUserLoading.value = true;
  try {
    const { data } = await findSystemUserAllList({ pageNum: 1, pageSize: 50, keyword: keyword || '' } as any);
    delegateUserOptions.value = (data?.list ?? []).map(item => ({
      label: item.nickName && item.loginName ? `${item.nickName}（${item.loginName}）` : item.nickName || item.loginName || item.id,
      value: item.id
    }));
  } finally {
    delegateUserLoading.value = false;
  }
}

async function submitDelegate() {
  if (!delegateForm.value.userId || !delegateForm.value.agentId) {
    window.$message?.warning('请选择被代理人与代理人');
    return;
  }
  delegateSaving.value = true;
  try {
    const payload: FlowNamespace.UserDelegate = { ...delegateForm.value };
    const { error } = delegateEditingId.value
      ? await updateFlowDelegate({ ...payload, id: delegateEditingId.value })
      : await saveFlowDelegate(payload);
    if (error !== null) return;
    window.$message?.success(delegateEditingId.value ? '代理规则已更新' : '代理规则已创建');
    resetDelegateForm();
    loadDelegates();
  } finally {
    delegateSaving.value = false;
  }
}

function editDelegate(row: FlowNamespace.UserDelegate) {
  delegateEditingId.value = String(row.id ?? '');
  delegateForm.value = {
    userId: row.userId,
    agentId: row.agentId,
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status ?? '1',
    remark: row.remark
  };
}

async function removeDelegate(row: FlowNamespace.UserDelegate) {
  const { error } = await delFlowDelegate([String(row.id)]);
  if (error !== null) return;
  window.$message?.success('已删除');
  loadDelegates();
}

async function toggleDelegate(row: FlowNamespace.UserDelegate) {
  const { error } = await updateFlowDelegate({ ...row, status: row.status === '1' ? '0' : '1' });
  if (error !== null) return;
  loadDelegates();
}

function delegateUserLabel(id: string): string {
  const hit = delegateUserOptions.value.find(item => item.value === id);
  return hit?.label ?? id;
}

/** 代理规则列定义（TSX 须在 script 内） */
const delegateColumns: Ref<DataTable.Column<FlowNamespace.UserDelegate>[]> = ref([
  {
    key: 'userId',
    title: '被代理人',
    minWidth: 130,
    align: 'left',
    ellipsis: true,
    render: row => delegateUserLabel(row.userId)
  },
  {
    key: 'agentId',
    title: '代理人',
    minWidth: 130,
    align: 'left',
    ellipsis: true,
    render: row => delegateUserLabel(row.agentId)
  },
  {
    key: 'startTime',
    title: '开始',
    width: 100,
    align: 'center',
    render: row => <span class="whitespace-nowrap text-12px">{row.startTime || '立即'}</span>
  },
  {
    key: 'endTime',
    title: '结束',
    width: 100,
    align: 'center',
    render: row => <span class="whitespace-nowrap text-12px">{row.endTime || '长期'}</span>
  },
  {
    key: 'status',
    title: '状态',
    width: 80,
    align: 'center',
    render: row => (row.status === '1' ? '启用' : '停用')
  },
  {
    key: 'op',
    title: '操作',
    width: 170,
    align: 'center',
    render: row => (
      <ElSpace size="small">
        <ElButton size="small" text type="primary" onClick={() => editDelegate(row)}>
          编辑
        </ElButton>
        <ElButton size="small" text type="warning" onClick={() => toggleDelegate(row)}>
          {row.status === '1' ? '停用' : '启用'}
        </ElButton>
        <ElButton size="small" text type="danger" onClick={() => removeDelegate(row)}>
          删除
        </ElButton>
      </ElSpace>
    )
  }
]);
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
            <div class="mr-8px flex items-center gap-8px">
              <ElButton size="small" type="warning" plain @click="openHandover">离职移交</ElButton>
              <ElButton size="small" type="primary" plain @click="openDelegate">流程代理</ElButton>
            </div>
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

    <!-- R2-17 离职移交：勾选用户的待办全部转办给接收人 -->
    <ElDialog v-model="showHandover" title="离职移交" class="w-520px" :close-on-click-modal="false">
      <ElForm label-width="110" label-position="left">
        <ElFormItem label="移交人">
          <ElInput
            :model-value="handoverFrom ? `${handoverFrom.nickName || handoverFrom.loginName}（${handoverFrom.id}）` : ''"
            disabled
          />
        </ElFormItem>
        <ElFormItem label="接收人">
          <ElSelect
            v-model="handoverTarget"
            :loading="handoverUserLoading"
            filterable
            remote
            clearable
            placeholder="输入姓名搜索后选择"
            :remote-method="searchHandoverUsers"
          >
            <ElOption v-for="opt in handoverUserOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="同时停用账号">
          <ElSwitch v-model="handoverDeactivate" />
          <span class="ml-8px text-12px color-gray">移交完成后把移交人账号停用（状态改为停用）</span>
        </ElFormItem>
        <div class="text-12px color-gray">
          把移交人名下<b>全部待办任务</b>转办给接收人（单条失败不影响其余）；已办记录与流程历史不受影响。
          勾选「同时停用账号」后，平台将自动回收其全部角色授权（含服务部门授权）、失效其流程代理规则并强制下线（R1-8 权限治理联动）。
        </div>
      </ElForm>
      <template #footer>
        <ElButton @click="showHandover = false">取消</ElButton>
        <ElButton type="primary" :loading="handoverSubmitting" @click="submitHandover">执行移交</ElButton>
      </template>
    </ElDialog>

    <!-- R2-17 流程代理：被代理人的新待办会把代理人一并加入办理人 -->
    <ElDialog v-model="showDelegate" title="流程代理" class="w-720px" :close-on-click-modal="false">
      <div v-loading="delegateLoading" class="mb-12px">
        <DataTable
          :data="delegateRows"
          :columns="delegateColumns"
          :row-key="(row: FlowNamespace.UserDelegate) => String(row.id)"
          class="min-h-100px"
        />
      </div>
      <ElDivider title-placement="left">{{ delegateEditingId ? '编辑规则' : '新增规则' }}</ElDivider>
      <ElForm label-width="110" label-position="left">
        <div class="grid grid-cols-2 gap-x-12px">
          <ElFormItem label="被代理人">
            <ElSelect
              v-model="delegateForm.userId"
              :loading="delegateUserLoading"
              filterable
              remote
              clearable
              placeholder="搜索选择（待办原办理人）"
              :remote-method="searchDelegateUsers"
            >
              <ElOption v-for="opt in delegateUserOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="代理人">
            <ElSelect
              v-model="delegateForm.agentId"
              :loading="delegateUserLoading"
              filterable
              remote
              clearable
              placeholder="搜索选择（一并加入办理人）"
              :remote-method="searchDelegateUsers"
            >
              <ElOption v-for="opt in delegateUserOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>
        </div>
        <div class="grid grid-cols-2 gap-x-12px">
          <ElFormItem label="开始时间">
            <ElDatePicker v-model="delegateForm.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="空=立即生效" class="w-full" />
          </ElFormItem>
          <ElFormItem label="结束时间">
            <ElDatePicker v-model="delegateForm.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="空=长期有效" class="w-full" />
          </ElFormItem>
        </div>
        <ElFormItem label="说明">
          <ElInput v-model="delegateForm.remark" placeholder="备注（如休假代理）" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton v-if="delegateEditingId" @click="resetDelegateForm">取消编辑</ElButton>
        <ElButton type="primary" :loading="delegateSaving" @click="submitDelegate">
          {{ delegateEditingId ? '保存修改' : '创建规则' }}
        </ElButton>
      </template>
    </ElDialog>
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
