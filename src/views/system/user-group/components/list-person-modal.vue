<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, reactive, ref, watch } from 'vue';
import { ElPopconfirm, ElButton as __forwarded_ElButton, ElSpace as __forwarded_ElSpace } from 'element-plus';
import { PlusOutlined as __forwarded_PlusOutlined } from '@vicons/antd';
import { userStatusColors, userStatusLabels } from '@/constants';
import { delSystemUserGroupUser, findSystemUserByGroup, saveSystemUserGroupBatch } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import TransferPerson from '@/components/business/transfer-person.vue';
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const PlusOutlined = __forwarded_PlusOutlined;

/** 带 key 的选项（原全局 Common.OptionWithKey，迁移后该命名空间已不存在，按本地用法补类型） */
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

/** 成员列表行：接口在用户组关系行上附带用户展示字段，关系类型未声明这些字段 */
type MemberRow = SystemUserGroupUserNamespace.SystemUserGroupUserTable & {
  /** 昵称 */
  nickName?: string | null;
  /** 用户手机号码 */
  phone?: string | null;
  /** 用户状态 */
  status: SystemUserNamespace.SystemUserForm['status'];
};

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 编辑的表格行数据 */
  editData: SystemUserGroupNamespace.SystemUserGroupForm | null;
}

defineOptions({ name: 'ListPersonModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
}
const { bool: visiblePerson, setTrue: openModal } = useBoolean();
const drawerWidth = ref('90%');
const emit = defineEmits<Emits>();
const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});

// 用户列表
type FormFilterModel = SystemUserGroupUserNamespace.SystemUserGroupUserQuery;
const formFilter = reactive<FormFilterModel>({
  pageNum: 1,
  pageSize: 10,
  groupId: '',
  nickName: ''
});
const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<SystemUserGroupUserNamespace.SystemUserGroupUserForm[]>([]);
const checkedRowKeys = ref<string[]>([]);

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

function setTableData(data: SystemUserGroupUserNamespace.SystemUserGroupUserPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function findAuthAllUser(dataQuery: SystemUserGroupUserNamespace.SystemUserGroupUserQuery) {
  startLoading();
  let result: SystemUserGroupUserNamespace.SystemUserGroupUserPage = { list: [], total: 0 };
  const { data } = await findSystemUserByGroup(dataQuery);
  if (data && data.list.length > 0) {
    const dataList = data.list;

    data.list = dataList.map((item, index) => {
      const user: SystemUserGroupUserNamespace.SystemUserGroupUserTable = {
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

const columns: Ref<DataTable.Column<MemberRow>[]> = ref([
  // {
  //   type: 'selection',
  //   width: 60,
  //   align: 'center'
  // },
  {
    key: 'index',
    title: '序号',
    width: 60,
    align: 'left',
    ellipsis: true
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
  // {
  //   key: 'email',
  //   title: '邮箱',
  //       align: 'left',
  //   ellipsis: true,
  // },
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
          <div v-permission="'system:position:edit'">
            <ElPopconfirm
              title="确认移除该成员吗？"
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
          </div>
        </ElSpace>
      );
    }
  }
]) as Ref<DataTable.Column<MemberRow>[]>;

function handleDeleteUser(user: SystemUserGroupUserNamespace.SystemUserGroupUserForm) {
  if (user) {
    delSystemUserGroupUser([user.id]).then(res => {
      if (res.error === null) {
        window.$message?.success('删除成功');
        findAuthAllUser(formFilter);
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
  const roleUserForm: SystemUserGroupUserNamespace.SystemUserGroupUserForm = {
    userDTOList: users,
    groupId: props.editData?.id ? props.editData?.id : undefined,
    id: '',
    userId: '',
    status: 1
  } as SystemUserGroupUserNamespace.SystemUserGroupUserForm;
  saveSystemUserGroupBatch(roleUserForm).then(res => {
    if (res.error === null) {
      window.$message?.success('添加用户组成员成功');
      visiblePerson.value = false;
      findAuthAllUser(formFilter);
    }
  });
}

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      formFilter.groupId = props.editData?.id ? props.editData?.id : '';
      findAuthAllUser(formFilter);
    }
  }
);
</script>

<template>
  <ElDrawer v-model="modalVisible" :size="drawerWidth" resizable class="privernal-drawer" title="用户组成员列表">
    <ElSpace class="main">
      <div class="flex-row pt-5px">
        <ElButton type="primary" size="small" @click="handleSelectPerson">
          <ElIcon size="20" class="mr-4px text-20px"><component :is="PlusOutlined" /></ElIcon>
          添加人员
        </ElButton>
      </div>
      <DataTable
        v-model:checked-row-keys="checkedRowKeys"
        remote
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="rowKey"
        :max-height="350"
      />
    </ElSpace>
  </ElDrawer>

  <TransferPerson
    v-if="visiblePerson"
    v-model:visible="visiblePerson"
    :selected-data="[]"
    @closed="saveSelectPerson"
  ></TransferPerson>
</template>

<style lang="scss" scoped>
.privernal-header-left {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: end;
  align-items: center;
}
:deep(.n-drawer-header__main) {
  width: 100%;
}
</style>
