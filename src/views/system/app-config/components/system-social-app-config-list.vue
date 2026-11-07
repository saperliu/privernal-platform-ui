<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { delSystemSocialAppConfig, findSystemSocialAppConfigList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-social-app-config-modal.vue';
import SystemSocialAppConfigModal from './system-social-app-config-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
}
defineOptions({ name: 'SystemSocialAppConfigList' });
withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true
});
interface Emits {
  (e: 'change', data: SystemSocialAppConfigNamespace.SystemSocialAppConfigForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemSocialAppConfigNamespace.SystemSocialAppConfigForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/**
 * `ListFilter` 的 `keyword` 是必填 string，查询类型里它是可选，这里按控件口径收紧；
 * `name` 是重置逻辑用到的历史字段，本地补成可选，避免动 `src/typings`。
 */
type FormFilterModel = SystemSocialAppConfigNamespace.SystemSocialAppConfigQuery & { keyword: string; name?: string };
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

function setTableData(data: SystemSocialAppConfigNamespace.SystemSocialAppConfigPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemSocialAppConfigNamespace.SystemSocialAppConfigQuery) {
  startLoading();
  const { data } = await findSystemSocialAppConfigList(dataQuery);
  let result: SystemSocialAppConfigNamespace.SystemSocialAppConfigPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemSocialAppConfigNamespace.SystemSocialAppConfigForm>[]> = ref([
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
    key: 'appId',
    title: 'appId',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.appId} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'secret',
    title: '密钥',
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
    key: 'appName',
    title: '应用的名称;解绑时区分解绑哪一个',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'appUrl',
    title: '应用的url',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'examineUser',
    title: '是否需要审核用户',
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
    title: '部门',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'roleId',
    title: '角色',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'deptId',
    title: '部门',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'source',
    title: '来源',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'agentId',
    title: '创建应用的agentId',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'corpId',
    title: '创建应用的企业ID',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'scheme',
    title: '创建应用的scheme',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'createBy',
    title: '',
    align: 'left',
    ellipsis: true
  },

  {
    key: 'updateBy',
    title: '',
    align: 'left',
    ellipsis: true
  },

  {
    key: 'clubId',
    title: '俱乐部',
    align: 'left',
    ellipsis: true
  },

  {
    key: 'deleteBy',
    title: '删除人',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'deleteFlag',
    title: '删除标识',
    align: 'left',
    ellipsis: true
  }
]) as Ref<DataTable.Column<SystemSocialAppConfigNamespace.SystemSocialAppConfigForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemSocialAppConfigNamespace.SystemSocialAppConfigForm | null>(null);

function setEditData(data: SystemSocialAppConfigNamespace.SystemSocialAppConfigForm | null) {
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
  delSystemSocialAppConfig(checkedRowKeys.value).then(res => {
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
function tableColumnClick(row: SystemSocialAppConfigNamespace.SystemSocialAppConfigForm) {
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
  rows: SystemSocialAppConfigNamespace.SystemSocialAppConfigForm[],
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
          permission-add="system:appConfig:add"
          permission-remove="system:appConfig:remove"
          permission-import="system:appConfig:import"
          permission-export="system:appConfig:export"
          operation-title="应用配置"
          :show-operation="showOperation"
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
              <div class="col-span-3 flex flex-row items-center justify-end">第三方应用配置(小程序)名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.appName" size="small" />
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">编码</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.appCode" size="small" />
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

        <SystemSocialAppConfigModal
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
