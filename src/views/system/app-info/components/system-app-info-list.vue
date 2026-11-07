<script setup lang="tsx">
import type { Ref } from 'vue';
import { onMounted, reactive, ref } from 'vue';
import { ElButton as __forwarded_ElButton } from 'element-plus';
import { delSystemAppInfo, exportAppPackage, findSystemAppInfoList, findSystemAppListByOrgId } from '@/service';
import { useAuth, useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-app-info-modal.vue';
import AppPackageImportModal from './app-package-import-modal.vue';
import SystemAppInfoModal from './system-app-info-modal.vue';

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）；列配置里的 TSX 也用它，必须先于其声明
const ElButton = __forwarded_ElButton;

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;

  /** 已经选择的数据 */
  listData?: SystemAppInfoNamespace.SystemAppInfoForm[];

  /** 组织ID */
  organizationId?: string;
}
defineOptions({ name: 'SystemAppInfoList' });
const props = withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: '',
  listData: () => []
});
interface Emits {
  (e: 'change', data: SystemAppInfoNamespace.SystemAppInfoForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { bool: importVisible, setTrue: openImportModal } = useBoolean();
const { hasAuth } = useAuth();
const tableData = ref<SystemAppInfoNamespace.SystemAppInfoForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
const checkedDefaultRowKeys = ref<string[]>([]);

/**
 * `keyword` 在 ListFilter 里是必填 string，这里收紧成非可选，避免 v-model 传 `string | undefined`。
 */
type FormFilterModel = SystemAppInfoNamespace.SystemAppInfoQuery & { keyword: string };
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

function setTableData(data: SystemAppInfoNamespace.SystemAppInfoPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemAppInfoNamespace.SystemAppInfoQuery) {
  startLoading();
  const { data } = await findSystemAppInfoList(dataQuery);
  let result: SystemAppInfoNamespace.SystemAppInfoPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

/** 导出应用包：应用元数据打包下载，仅在拥有导出权限时显示 */
const operationColumn = {
  key: 'operation',
  title: '操作',
  align: 'left',
  width: 120,
  render(row: SystemAppInfoNamespace.SystemAppInfoForm) {
    if (!hasAuth('system:appPackage:export')) {
      return null;
    }
    return (
      <ElButton size="small" type="primary" plain onClick={() => handleExportPackage(row)}>
        导出应用包
      </ElButton>
    );
  }
} as DataTable.Column<SystemAppInfoNamespace.SystemAppInfoForm>;

const columns: Ref<DataTable.Column<SystemAppInfoNamespace.SystemAppInfoForm>[]> = ref([
  {
    type: 'selection',
    width: 60,
    align: 'center'
  },
  {
    key: 'index',
    title: '序号',
    align: 'left',
    ellipsis: true,
    width: 60,
    render(_, index) {
      return index + 1;
    }
  },

  // {
  //   key: 'appKey',
  //   title: '应用KEY',
  //   align: 'left',
  //   ellipsis: true
  // },
  {
    key: 'appName',
    title: '名称',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.appName} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'code',
    title: '编码',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'type',
    title: '类型',
    align: 'left',
    ellipsis: true,
    render: row => {
      const typeLabels: Record<string, string> = { SYSTEM: '系统应用', BUSINESS: '业务应用' };
      return typeLabels[row.type] || row.type || '业务应用';
    }
  },
  {
    key: 'status',
    title: '状态',
    align: 'left',
    ellipsis: true,
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
  ...(props.showOperation ? [operationColumn] : [])
]) as Ref<DataTable.Column<SystemAppInfoNamespace.SystemAppInfoForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemAppInfoNamespace.SystemAppInfoForm | null>(null);

function setEditData(data: SystemAppInfoNamespace.SystemAppInfoForm | null) {
  editData.value = data;
}

/** 新增 */
function handleAddTable() {
  openModal();
  setModalType('add');
}

/** 导出应用包：应用及其表单、列表配置、流程定义与节点权限元数据 */
function handleExportPackage(row: SystemAppInfoNamespace.SystemAppInfoForm) {
  exportAppPackage(row.id).then(res => {
    if (res.error !== null || !res.data) {
      return;
    }
    const pkg = res.data;
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const href = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${(pkg.app.code || row.code || 'app').toLowerCase()}-package.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(href);
    window.$message?.success(`已导出应用包：${pkg.forms.length} 个表单，${pkg.flows.length} 个流程`);
  });
}

/** 多行删除 */
function handleDeleteRows() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error('请选择要删除的数据！');
    return;
  }
  delSystemAppInfo(checkedRowKeys.value).then(res => {
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
function tableColumnClick(row: SystemAppInfoNamespace.SystemAppInfoForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}

/** 重置搜索 */
function resetForm() {
  clearSearch();
}

/** 清空模糊搜索 */
function clearSearch() {
  for (const field of Object.keys(formFilter)) {
    if (field === 'pageNum') {
      formFilter.pageNum = defaultPageNum;
    } else if (field === 'keyword') {
      formFilter.keyword = '';
    } else if (field !== 'pageSize') {
      Reflect.set(formFilter, field, null);
    }
  }

  getTableData(formFilter);
}

/** 模糊搜索 */
function keywordSearch() {
  if (formFilter.keyword) {
    formFilter.keywords = formFilter.keyword.split(' ');
  }
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

const selectAllRows = ref<SystemAppInfoNamespace.SystemAppInfoForm[]>([]);
function handleChangeChecked(
  keys: Array<string | number>,
  rows: SystemAppInfoNamespace.SystemAppInfoForm[],
  meta: { row: object | undefined; action: 'check' | 'uncheck' | 'checkAll' | 'uncheckAll' }
) {
  const selectRows = rows.filter(item => {
    return item !== undefined;
  });

  if (meta.action === 'checkAll' || meta.action === 'check') {
    selectAllRows.value = [...selectAllRows.value, ...selectRows];
  } else if (meta.action === 'uncheckAll' || meta.action === 'uncheck') {
    selectAllRows.value = selectAllRows.value.filter(item => {
      return keys.findIndex(i => i === item.id) >= 0;
    });
  }
  if (keys.length === 0) {
    selectAllRows.value = [];
  }
  // selectAllRows 去掉 id 重复的数据
  selectAllRows.value = selectAllRows.value.filter((item, index, arr) => {
    return arr.findIndex(i => i.id === item.id) === index;
  });
  selectAllRows.value = selectAllRows.value.filter(item => {
    return item !== undefined;
  });

  emit('change', selectAllRows.value);
}

function search() {
  getTableData(formFilter);
}
// 初始化
search();

onMounted(() => {
  if (props.organizationId) {
    findSystemAppListByOrgId({ pageNum: 1, pageSize: 100, organizationId: props.organizationId }).then(result => {
      if (result.error === null && result.data !== null) {
        result.data.forEach(item => {
          checkedDefaultRowKeys.value.push(item.id);
          checkedRowKeys.value = checkedDefaultRowKeys.value;
        });
      }
    });
  }
});
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:appInfo:add"
          permission-remove="system:appInfo:remove"
          permission-import="system:appInfo:import"
          permission-export="system:appInfo:export"
          operation-title="应用信息"
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
          <template #button>
            <ElButton v-if="hasAuth('system:appPackage:import')" text size="small" @click="openImportModal">
              <icon-mdi-tray-arrow-down class="mr-4px text-20px" />
              导入应用包
            </ElButton>
          </template>

          <template #filter>
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px">
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">应用KEY</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.appKey" placeholder="请输入应用KEY" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.appName" placeholder="请输入名称" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">编码</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.code" placeholder="请输入编码" size="small" />
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

        <SystemAppInfoModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />

        <AppPackageImportModal v-model:visible="importVisible" @success="search" />
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
