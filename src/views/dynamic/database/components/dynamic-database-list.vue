<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { delDynamicDatabase, findDynamicDatabaseList } from '@/service';
import { useBoolean, useDeptOrgNames, useLoading } from '@/hooks';
import { orderByColumn } from '@/utils';
import type { ModalType } from './dynamic-database-modal.vue';
import DynamicDatabaseModal from './dynamic-database-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'DynamicDatabaseList' });
withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: DynamicDatabaseNamespace.DynamicDatabaseForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { deptName, orgName } = useDeptOrgNames();
const tableData = ref<DynamicDatabaseNamespace.DynamicDatabaseForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/** ListFilter 的 keyword 是必填 string，查询类型里它是可选，本地交叉补齐 */
type FormFilterModel = DynamicDatabaseNamespace.DynamicDatabaseQuery & { keyword: string };
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

function setTableData(data: DynamicDatabaseNamespace.DynamicDatabasePage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: DynamicDatabaseNamespace.DynamicDatabaseQuery) {
  startLoading();
  const { data } = await findDynamicDatabaseList(dataQuery);
  let result: DynamicDatabaseNamespace.DynamicDatabasePage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<DynamicDatabaseNamespace.DynamicDatabaseForm>[]> = ref([
  {
    type: 'selection',
    width: 60,
    align: 'center'
  },
  {
    key: 'index',
    title: '序号',
    align: 'left',
    width: 60,
    render(_, index) {
      return index + 1;
    }
  },

  {
    key: 'databaseName',
    title: '数据库名称',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'databaseType',
    title: '数据库类型',
    align: 'left',
    width: 110,
    ellipsis: true
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
    key: 'departmentId',
    title: '所属部门',
    align: 'left',
    ellipsis: true,
    render: row => deptName(row.departmentId)
  },
  {
    key: 'organizationId',
    title: '所属组织',
    align: 'left',
    ellipsis: true,
    render: row => orgName(row.organizationId)
  },
  {
    key: 'url',
    title: '连接地址',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'userName',
    title: '用户名',
    align: 'left',
    width: 110,
    ellipsis: true
  },
  {
    key: 'remark',
    title: '备注',
    align: 'left',
    ellipsis: true
  }
]) as Ref<DataTable.Column<DynamicDatabaseNamespace.DynamicDatabaseForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<DynamicDatabaseNamespace.DynamicDatabaseForm | null>(null);

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
  delDynamicDatabase(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      search();
    }
  });
}

/**
 * 某列的排序处理
 *
 * @param sorter
 */
function handleUpdateSorter(sorter: DataTable.SortState) {
  orderByColumn(sorter, formFilter, columns);
  getTableData(formFilter);
}

/** 重置搜索 */
function resetForm() {
  clearSearch();
}

/** 清空模糊搜索 */
function clearSearch() {
  /** 查询模型是 interface（无隐式索引签名），交叉一层 Record 取可写视图，用于按 key 批量清空 */
  const filterFields = formFilter as FormFilterModel & Record<string, unknown>;
  for (const field in filterFields) {
    if (field === 'pageNum') {
      formFilter.pageNum = defaultPageNum;
    } else if (field !== 'pageSize') {
      filterFields[field] = null;
    }
  }

  getTableData(formFilter);
}

/** 模糊搜索 */
function keywordSearch() {
  if (formFilter.keyword !== null && formFilter.keyword !== '' && formFilter.keyword !== undefined) {
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
function handleChangeChecked(
  _keys: Array<string | number>,
  rows: DynamicDatabaseNamespace.DynamicDatabaseForm[],
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
          permission-add="dynamic:database:add"
          permission-remove="dynamic:database:remove"
          permission-import="dynamic:database:import"
          permission-export="dynamic:database:export"
          operation-title="动态数据库"
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
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">数据库名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.databaseName" placeholder="请输入数据库名称" size="small" />
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
          @update:sorter="handleUpdateSorter"
        />

        <DynamicDatabaseModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />
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
