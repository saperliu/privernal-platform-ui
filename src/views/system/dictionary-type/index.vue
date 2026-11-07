<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { ElButton } from 'element-plus';
import { delSystemDictionaryType, findSystemDictionaryTypeList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './components/system-dictionary-type-modal.vue';
import SystemDictionaryTypeModal from './components/system-dictionary-type-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemDictionaryTypeNamespace.SystemDictionaryTypeForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
// ListFilter 的 keyword 是必填 string；名称筛选字段后端查询类型未声明，本地交叉类型补齐
type FormFilterModel = SystemDictionaryTypeNamespace.SystemDictionaryTypeQuery & { keyword: string; name?: string };
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: []
});
const showOperation = ref<boolean>(true);
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

function setTableData(data: SystemDictionaryTypeNamespace.SystemDictionaryTypePage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemDictionaryTypeNamespace.SystemDictionaryTypeQuery) {
  startLoading();
  const { data } = await findSystemDictionaryTypeList(dataQuery);
  let result: SystemDictionaryTypeNamespace.SystemDictionaryTypePage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemDictionaryTypeNamespace.SystemDictionaryTypeForm>[]> = ref([
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
    key: 'dictName',
    title: '名称',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.dictName} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'dictType',
    title: '编码',
    align: 'left',
    ellipsis: true
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
  {
    key: 'action',
    title: '操作',
    width: 110,
    align: 'center',
    render: row => {
      return (
        <ElButton size="small" type="primary" plain onClick={() => tableColumnClick(row)}>
          字典数据
        </ElButton>
      );
    }
  }
]) as Ref<DataTable.Column<SystemDictionaryTypeNamespace.SystemDictionaryTypeForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemDictionaryTypeNamespace.SystemDictionaryTypeForm | null>(null);

function setEditData(data: SystemDictionaryTypeNamespace.SystemDictionaryTypeForm | null) {
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
  delSystemDictionaryType(checkedRowKeys.value).then(res => {
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
function tableColumnClick(row: SystemDictionaryTypeNamespace.SystemDictionaryTypeForm) {
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
  <div class="main-space overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:dictionaryType:add"
          permission-remove="system:dictionaryType:remove"
          permission-import="system:dictionaryType:import"
          permission-export="system:dictionaryType:export"
          operation-title="字典类型"
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

        <SystemDictionaryTypeModal
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
