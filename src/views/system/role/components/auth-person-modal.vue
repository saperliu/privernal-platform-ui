<script setup lang="tsx">
import type { Ref, VNode } from 'vue';
import { computed, reactive, ref, watch } from 'vue';
import { ElPopconfirm, ElTag, ElButton as __forwarded_ElButton, ElSpace as __forwarded_ElSpace } from 'element-plus';
import { PlusOutlined as __forwarded_PlusOutlined } from '@vicons/antd';
import { userStatusColors, userStatusLabels } from '@/constants';
import {
  delSystemRoleUser,
  findSystemRoleUserDeptList,
  findSystemUserByRole,
  saveSystemRoleUserBatch,
  saveSystemRoleUserDeptBatch
} from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import TransferPerson from '@/components/business/transfer-person.vue';
import TransferDepartment from '@/components/business/transfer-department.vue';
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const PlusOutlined = __forwarded_PlusOutlined;

/** 带 key 的选项（原全局 Common.OptionWithKey，迁移后该命名空间已不存在，与 transfer-person.vue 保持同构） */
interface OptionWithKey<K> {
  key: string;
  label: string;
  value: K;
}

/** 穿梭框确认后回传的选择结果（原全局 Common.SelectDataWithKey） */
interface SelectDataWithKey<T> {
  selected: T[];
  addList: T[];
  delList: T[];
}

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 编辑的表格行数据 */
  editData: SystemRoleNamespace.SystemRoleForm | null;
}

defineOptions({ name: 'AuthPersonModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
}
const { bool: visiblePerson, setTrue: openModal } = useBoolean();
const { bool: visibleDepartment, setTrue: openDeptModal } = useBoolean();
const emit = defineEmits<Emits>();
const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});
type RoleUserDeptFilterModel = SystemRoleUserDeptNamespace.SystemRoleUserDeptQuery;
const roleUserDeptFilter = reactive<RoleUserDeptFilterModel>({
  pageNum: 1,
  pageSize: 9999,
  roleUserId: '',
  deptName: ''
});
// 用户列表
type FormFilterModel = SystemRoleUserNamespace.SystemRoleUserQuery;
const formFilter = reactive<FormFilterModel>({
  pageNum: 1,
  pageSize: 10,
  roleId: '',
  nickName: ''
});
const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<SystemRoleUserNamespace.SystemRoleUserForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
const roleUserId = ref<string>('');
const selectDeptData = ref<Array<SystemDepartmentNamespace.SystemDepartmentForm>>([]);
const userDeptMap = reactive(new Map<string, VNode[]>());
const roleUserData = ref<SystemRoleUserNamespace.SystemRoleUserForm>({
  id: '',
  roleId: '',
  status: 1,
  userDTOList: [],
  userId: ''
});
const pagination = reactive({
  page: 1,
  pageSize: 10,
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
    findAuthAllUser(formFilter);
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    formFilter.pageNum = pagination.page;
    formFilter.pageSize = pageSize;
    findAuthAllUser(formFilter);
  }
});

function setTableData(data: SystemRoleUserNamespace.SystemRoleUserPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function findAuthAllUser(dataQuery: SystemRoleUserNamespace.SystemRoleUserQuery) {
  startLoading();
  let result: SystemRoleUserNamespace.SystemRoleUserPage = { list: [], total: 0 };
  const { data } = await findSystemUserByRole(dataQuery);
  if (data && data.list.length > 0) {
    const dataList = data.list;

    data.list = dataList.map((item, index) => {
      const user: SystemRoleUserNamespace.SystemRoleUserTable = {
        index: index + 1,
        ...item
      };
      return user;
    });
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemRoleUserNamespace.SystemRoleUserTable>[]> = ref([
  // {
  //   type: 'selection',
  //   align: 'center'
  // },
  {
    type: 'expand',
    render: rowData => {
      const list = userDeptMap.get(rowData.id);
      return list?.length ? <ElSpace>{list}</ElSpace> : <span class="text-13px text-gray-400">暂无服务部门</span>;
    }
  },
  {
    key: 'index',
    title: '序号',
    width: 60,
    align: 'left'
  },
  {
    key: 'nickName',
    title: '姓名',
    align: 'left',
    ellipsis: true
  },
  // {
  //   key: 'loginName',
  //   title: '登录名',
  //   align: 'left',
  //   ellipsis: true
  // },
  {
    key: 'phone',
    title: '手机号码',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'departmentName',
    title: '部门',
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
    key: 'actions',
    title: '操作',
    align: 'left',
    ellipsis: true,
    fixed: 'right',
    className: 'table-action-title',
    render: row => {
      return (
        <ElSpace>
          <ElButton text size={'small'} type="primary" onClick={() => handleAuthDept(row)}>
            添加服务部门
          </ElButton>
          <ElPopconfirm
            title="确认删除该成员吗？"
            confirm-button-text="确认"
            cancel-button-text="取消"
            onConfirm={() => handleDeleteUser(row)}
          >
            {{
              reference: () => (
                <ElButton text size={'small'} type="primary">
                  删除
                </ElButton>
              )
            }}
          </ElPopconfirm>
        </ElSpace>
      );
    }
  }
]) as Ref<DataTable.Column<SystemRoleUserNamespace.SystemRoleUserTable>[]>;

/**
 * 打开服务部门窗口
 *
 * @param user
 */
async function handleAuthDept(user: SystemRoleUserNamespace.SystemRoleUserTable) {
  roleUserId.value = user.id;
  roleUserData.value = user;
  if (roleUserDeptFilter.roleUserId !== user.id) {
    roleUserDeptFilter.roleUserId = `${user.id}`;
  }
  // 查询此用户已经设置的服务部门，回填数据
  const { data } = await findSystemRoleUserDeptList(roleUserDeptFilter);
  if (data !== null) {
    // 穿梭框按「部门表单」消费选中数据：以服务部门 id 作为节点 key，deptName 作为显示文本
    selectDeptData.value = data.list.map(item => ({
      id: item.departmentId,
      deptCode: '',
      deptName: item.deptName,
      orderNum: 0,
      leaderId: '',
      systemType: '',
      status: item.status,
      organizationId: item.organizationId
    }));
  }

  openDeptModal();
}
function handleDeleteUser(user: SystemRoleUserNamespace.SystemRoleUserTable) {
  if (user) {
    delSystemRoleUser([user.id]).then(res => {
      if (res.error === null) {
        window.$message?.success('删除成功');
        findAuthAllUser(formFilter);
      } else {
        window.$message?.error('删除失败！');
      }
    });
  }
}
function handleSelectPerson() {
  openModal();
}

/**
 * 保存选择的人员
 *
 * @param data
 */
function saveSelectPerson(data: SelectDataWithKey<OptionWithKey<SystemUserNamespace.SystemUserForm>>) {
  const users: SystemUserNamespace.SystemUserForm[] = data.selected.map(obj => {
    return obj.value;
  });
  const roleUserForm: SystemRoleUserNamespace.SystemRoleUserForm = {
    userDTOList: users,
    roleId: props.editData?.id ? props.editData?.id : undefined,
    id: '',
    userId: '',
    status: 1
  } as SystemRoleUserNamespace.SystemRoleUserForm;
  saveSystemRoleUserBatch(roleUserForm).then(res => {
    if (res.error === null) {
      window.$message?.success('添加角色成员成功');
      visiblePerson.value = false;
      findAuthAllUser(formFilter);
    } else {
      window.$message?.error('添加角色成员失败');
    }
  });
}

/**
 * 保存选择的部门
 *
 * @param data
 */
function saveSelectDept(data: SelectDataWithKey<SystemDepartmentNamespace.SystemDepartmentForm>) {
  window.console.log('----saveSelectDept---', data);
  const users: SystemDepartmentNamespace.SystemDepartmentForm[] = data.selected;

  const RoleUserDeptForm: SystemRoleUserDeptNamespace.SystemRoleUserDeptForm = {
    deptName: '',
    organizationId: '',
    departmentDTOList: users,
    addDepartmentDTOList: data.addList,
    delDepartmentDTOList: data.delList,
    roleUserId: roleUserId.value ? roleUserId.value : '',
    departmentId: '',
    id: '',
    status: 1
  };
  saveSystemRoleUserDeptBatch(RoleUserDeptForm).then(res => {
    if (res.error === null) {
      window.$message?.success('设置服务部门成功');
      visibleDepartment.value = false;
    } else {
      window.$message?.error('设置服务部门失败');
    }
  });
}

/**
 * 展开行的时候查询此用户已经设置的服务部门
 *
 * @param row 展开的用户行
 */
function handleExpandRow(row: SystemRoleUserNamespace.SystemRoleUserTable) {
  if (roleUserDeptFilter.roleUserId !== row.id) {
    roleUserDeptFilter.roleUserId = `${row.id}`;
    findAuthAllDept(roleUserDeptFilter);
  }
}

async function findAuthAllDept(dataQuery: SystemRoleUserDeptNamespace.SystemRoleUserDeptQuery) {
  const { data } = await findSystemRoleUserDeptList(dataQuery);
  let nameList: VNode[] = [];
  if (data && data.list.length > 0) {
    const dataList = data.list;
    nameList = dataList.map(item => {
      return <ElTag type={'success'}>{item.deptName}</ElTag>;
    });
  }
  userDeptMap.set(dataQuery.roleUserId, nameList);
}
watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      formFilter.roleId = props.editData?.id ? props.editData?.id : '';
      findAuthAllUser(formFilter);
    }
  }
);
</script>

<template>
  <ElDialog
    v-model="modalVisible"
    :close-on-click-modal="false"
    title="角色成员列表"
    width="900px"
    class="role-person-dialog"
  >
    <div class="flex-col gap-12px">
      <div class="flex items-center justify-between">
        <ElButton type="primary" size="small" @click="handleSelectPerson">
          <ElIcon size="20" class="mr-4px text-20px"><component :is="PlusOutlined" /></ElIcon>
          添加人员
        </ElButton>
        <span class="text-13px text-gray-400">展开行可查看该成员的服务部门</span>
      </div>
      <div class="role-person-table">
        <DataTable
          v-model:checked-row-keys="checkedRowKeys"
          remote
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :row-key="rowKey"
          striped
          @expand-change="handleExpandRow"
        />
      </div>
    </div>
  </ElDialog>

  <TransferPerson
    v-if="visiblePerson"
    v-model:visible="visiblePerson"
    :selected-data="[]"
    title="添加人员"
    :multiple="true"
    @closed="saveSelectPerson"
  ></TransferPerson>

  <TransferDepartment
    v-if="visibleDepartment"
    v-model:visible="visibleDepartment"
    title="添加服务部门"
    :selected-data="selectDeptData"
    :multiple="true"
    @closed="saveSelectDept"
  ></TransferDepartment>
</template>

<style lang="scss" scoped>
/* 表格区固定高度、内部滚动：弹窗本体不再套 overflow，避免整窗滚动导致标题/按钮一起滚走 */
.role-person-table {
  height: 430px;
  overflow: auto;
}
</style>
