<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, reactive, ref, watch } from 'vue';
import { ElPopconfirm, ElButton as __forwarded_ElButton, ElSpace as __forwarded_ElSpace } from 'element-plus';
import { PlusOutlined as __forwarded_PlusOutlined } from '@vicons/antd';
import { userStatusColors, userStatusLabels } from '@/constants';
import { delSystemUserPosition, findSystemUserByPosition, saveSystemUserPositionBatch } from '@/service';
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

/** 成员列表行：接口在岗位关系行上附带用户展示字段，关系类型未声明这些字段 */
type MemberRow = SystemUserPositionNamespace.SystemUserPositionTable & {
  /** 昵称 */
  nickName?: string | null;
  /** 用户手机号码 */
  phone?: string | null;
  /** 用户状态 */
  status: SystemUserNamespace.SystemUserForm['status'];
};

/** 批量添加岗位成员只提交关系表必要字段，organizationId/departmentId/isMain 由后端补全（不进请求体） */
type BatchSaveForm = Partial<SystemUserPositionNamespace.SystemUserPositionForm> & { status?: number };

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 编辑的表格行数据 */
  editData: SystemPositionNamespace.SystemPositionForm | null;
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
type FormFilterModel = SystemUserPositionNamespace.SystemUserPositionQuery;
const formFilter = reactive<FormFilterModel>({
  pageNum: 1,
  pageSize: 10,
  positionId: '',
  nickName: ''
});
const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<SystemUserPositionNamespace.SystemUserPositionForm[]>([]);
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

function setTableData(data: SystemUserPositionNamespace.SystemUserPositionPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function findAuthAllUser(dataQuery: SystemUserPositionNamespace.SystemUserPositionQuery) {
  startLoading();
  let result: SystemUserPositionNamespace.SystemUserPositionPage = { list: [], total: 0 };
  const { data } = await findSystemUserByPosition(dataQuery);
  if (data) {
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
    ellipsis: true,
    render(_, index) {
      return index + 1;
    }
  },
  {
    key: 'nickName',
    title: '姓名',
    width: 150,
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

function handleDeleteUser(user: SystemUserPositionNamespace.SystemUserPositionForm) {
  if (user) {
    delSystemUserPosition([user.id]).then(res => {
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
  const roleUserForm: BatchSaveForm = {
    userDTOList: users,
    positionId: props.editData?.id ? props.editData?.id : undefined,
    id: '',
    userId: '',
    status: 1
  };
  saveSystemUserPositionBatch(roleUserForm as SystemUserPositionNamespace.SystemUserPositionForm).then(res => {
    if (res.error === null) {
      window.$message?.success('添加岗位成员成功');
      visiblePerson.value = false;
      findAuthAllUser(formFilter);
    }
  });
}

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      formFilter.positionId = props.editData?.id ? props.editData?.id : '';
      findAuthAllUser(formFilter);
    }
  }
);
</script>

<template>
  <ElDrawer v-model="modalVisible" :size="drawerWidth" resizable class="privernal-drawer" title="岗位成员列表">
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
        striped
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
