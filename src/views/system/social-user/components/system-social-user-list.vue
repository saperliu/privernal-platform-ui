<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { delSystemSocialUser, findSystemSocialUserList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-social-user-modal.vue';
import SystemSocialUserModal from './system-social-user-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
}
defineOptions({ name: 'SystemSocialUserList' });
// props 只用于对外声明（组件内部不读，DataTable 的列配置也不吃这些开关）
withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true
});
interface Emits {
  (e: 'change', data: SystemSocialUserNamespace.SystemSocialUserForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemSocialUserNamespace.SystemSocialUserForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/**
 * `name` 是模板里那个「名称」输入框实际写入的键（后端 SystemSocialUserFilterDTO 并没有 name 字段，
 * 该输入框目前对结果不起作用，是否该换成别的列待产品确认）；`keyword` 在 ListFilter 里是必填
 * string，所以这里把它收紧成非可选，避免 v-model 传 `string | undefined`。
 */
type FormFilterModel = SystemSocialUserNamespace.SystemSocialUserQuery & { keyword: string; name?: string };
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

function setTableData(data: SystemSocialUserNamespace.SystemSocialUserPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemSocialUserNamespace.SystemSocialUserQuery) {
  startLoading();
  const { data } = await findSystemSocialUserList(dataQuery);
  let result: SystemSocialUserNamespace.SystemSocialUserPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemSocialUserNamespace.SystemSocialUserForm>[]> = ref([
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
    key: 'uuid',
    title: '第三方系统的唯一ID',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.uuid} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'source',
    title: '第三方用户来源;GITHUB、GITEE、QQ',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'appCode',
    title: '应用的编码;区分哪个应用登录',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'accessToken',
    title: '用户的授权令牌',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'expireIn',
    title: '第三方用户的授权令牌的有效期',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'refreshToken',
    title: '刷新令牌',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'openId',
    title: '第三方用户的;open;id',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'uid',
    title: '第三方用户的;ID',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'accessCode',
    title: '个别平台的授权信息',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'unionId',
    title: '第三方用户的;union;id',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'scope',
    title: '第三方用户授予的权限',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'tokenType',
    title: '个别平台的授权信息',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'idToken',
    title: 'id;token',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'macAlgorithm',
    title: '小米平台用户的附带属性',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'macKey',
    title: '小米平台用户的附带属性',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'code',
    title: '用户的授权code',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'oauthToken',
    title: 'Twitter平台用户的附带属性',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'oauthTokenSecret',
    title: 'Twitter平台用户的附带属性',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'remark',
    title: '',
    align: 'left',
    ellipsis: true
  },

  {
    key: 'organizationId',
    title: '所属组织',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'departmentId',
    title: '所属部门',
    align: 'left',
    ellipsis: true
  }
]) as Ref<DataTable.Column<SystemSocialUserNamespace.SystemSocialUserForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemSocialUserNamespace.SystemSocialUserForm | null>(null);

function setEditData(data: SystemSocialUserNamespace.SystemSocialUserForm | null) {
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
  delSystemSocialUser(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      search();
    }
  });
}

/**
 * 单独某列的点击的处理
 *
 * @param row
 */
function tableColumnClick(row: SystemSocialUserNamespace.SystemSocialUserForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}

/** 重置搜索 */
function resetForm() {
  formFilter.name = '';
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
 * 显示详情关闭的回调函数
 *
 * @param value
 */
function handleClose(value: boolean) {
  if (value) {
    getTableData(formFilter);
  }
}

/**
 * 回调推送选择的数据
 *
 * @param keys
 * @param rows
 * @param meta
 */
function handleChangeChecked(
  _keys: Array<string | number>,
  rows: SystemSocialUserNamespace.SystemSocialUserForm[],
  _meta: { row: object | undefined; action: 'check' | 'uncheck' | 'checkAll' | 'uncheckAll' }
) {
  emit('change', rows);
}

function search() {
  getTableData(formFilter);
}

// 初始化
search();
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:socialUser:add"
          permission-remove="system:socialUser:remove"
          permission-import="system:socialUser:import"
          permission-export="system:socialUser:export"
          operation-title="社交用户"
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
                <ElInput v-model="formFilter.name" size="small" />
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
          @update:checked-row-keys="handleChangeChecked"
        />

        <SystemSocialUserModal
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
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
