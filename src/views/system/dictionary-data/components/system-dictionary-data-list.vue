<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { delSystemDictionaryData, findSystemDictionaryDataList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-dictionary-data-modal.vue';
import SystemDictionaryDataModal from './system-dictionary-data-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;

  refCom?: boolean;
}
defineOptions({ name: 'SystemCommonGroupList' });
const props = withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  refCom: false,
  parentId: ''
});

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemDictionaryDataNamespace.SystemDictionaryDataForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/** 本地筛选模型：ListFilter 的关键字为必填字符串，查询类型里它是可选的；name 是本页附加的模糊筛选字段 */
type FormFilterModel = SystemDictionaryDataNamespace.SystemDictionaryDataQuery & { keyword: string; name?: string };
const defaultPageNum = 1;
const defaultPageSize = 10;
/** refCom（被引用组件）场景下按父级字典类型过滤，无父级时用一个不存在的类型保证查空 */
const defaultDictType = props.refCom ? props.parentId || 'none' : '';
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  dictType: defaultDictType,
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

function setTableData(data: SystemDictionaryDataNamespace.SystemDictionaryDataPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemDictionaryDataNamespace.SystemDictionaryDataQuery) {
  startLoading();
  const { data } = await findSystemDictionaryDataList(dataQuery);
  let result: SystemDictionaryDataNamespace.SystemDictionaryDataPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemDictionaryDataNamespace.SystemDictionaryDataForm>[]> = ref([
  {
    type: 'selection',
    align: 'center',
    width: 60
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
    key: 'dictLabel',
    title: '标签',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.dictLabel} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'dictValue',
    title: '键值',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'dictTypeName',
    title: '类型',
    align: 'left',
    ellipsis: true
  },

  {
    key: 'dictSort',
    title: '排序',
    align: 'left',
    ellipsis: true
  },
  // {
  //   key: 'cssClass',
  //   title: '样式属性',
  //       align: 'left',
  //   ellipsis: true,
  // },
  // {
  //   key: 'listClass',
  //   title: '表格回显样式',
  //       align: 'left',
  //   ellipsis: true,
  // },
  // {
  //   key: 'isDefault',
  //   title: '是否默认',
  //       align: 'left',
  //   ellipsis: true,
  // },
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
  }
]) as Ref<DataTable.Column<SystemDictionaryDataNamespace.SystemDictionaryDataForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemDictionaryDataNamespace.SystemDictionaryDataForm | null>(null);

function setEditData(data: SystemDictionaryDataNamespace.SystemDictionaryDataForm | null) {
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
  delSystemDictionaryData(checkedRowKeys.value).then(res => {
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
function tableColumnClick(row: SystemDictionaryDataNamespace.SystemDictionaryDataForm) {
  setEditData(row);
  setModalType('view');
  openModal();
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

function init() {
  getTableData(formFilter);
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
  formFilter.keywords = formFilter.keyword!.split(' ');
  getTableData(formFilter);
}

// 初始化
init();
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:dictionaryData:add"
          permission-remove="system:dictionaryData:remove"
          permission-import="system:dictionaryData:import"
          permission-export="system:dictionaryData:export"
          operation-title="字典数据"
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
                <ElInput v-model="formFilter.name" size="small" />
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
          :pagination="pagination"
          :row-key="rowKey"
          :scroll-x="1200"
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          :bottom-bordered="true"
          striped
        />

        <SystemDictionaryDataModal
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
