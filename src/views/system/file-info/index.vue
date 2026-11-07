<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { delSystemFileInfo, findSystemFileInfoListPage } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './components/system-file-info-modal.vue';
import SystemFileInfoModal from './components/system-file-info-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemFileInfoNamespace.SystemFileInfoForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/** ListFilter 的 keyword 是必填 string，查询类型里它是可选，本地交叉补齐 */
type FormFilterModel = SystemFileInfoNamespace.SystemFileInfoQuery & { keyword: string };
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

function setTableData(data: SystemFileInfoNamespace.SystemFileInfoPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemFileInfoNamespace.SystemFileInfoQuery) {
  startLoading();
  const { data } = await findSystemFileInfoListPage(dataQuery);
  let result: SystemFileInfoNamespace.SystemFileInfoPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemFileInfoNamespace.SystemFileInfoForm>[]> = ref([
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
    key: 'newName',
    title: '新名称',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.newName} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'sourceId',
    title: '来源ID',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'sourceStage',
    title: '来源编码',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'module',
    title: '文件所属模块',
    align: 'left',
    ellipsis: true
  },

  {
    key: 'originalName',
    title: '原名称',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'imageUrl',
    title: '图片访问地址',
    align: 'left',
    ellipsis: true,
    render: row => {
      return (
        // <ElButton size={'small'} color={dataStatusColors[row.status]}>
        // 	{dataStatusLabels[row.status]}
        // </ElButton>
        <ElImage src={row.imageUrl} />
      );
    }
  },

  {
    key: 'fileSize',
    title: '文件大小(字节数)',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'fileStoreType',
    title: '文件存储类型',
    align: 'left',
    ellipsis: true
  }
]) as Ref<DataTable.Column<SystemFileInfoNamespace.SystemFileInfoForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemFileInfoNamespace.SystemFileInfoForm | null>(null);

function setEditData(data: SystemFileInfoNamespace.SystemFileInfoForm | null) {
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
  delSystemFileInfo(checkedRowKeys.value).then(res => {
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
function tableColumnClick(row: SystemFileInfoNamespace.SystemFileInfoForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}

/** 重置搜索 */
function resetForm() {
  formFilter.originalName = '';
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

function search() {
  getTableData(formFilter);
}

// 初始化
search();
</script>

<template>
  <div class="main-space overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:fileInfo:add"
          permission-remove="system:fileInfo:remove"
          permission-import="system:fileInfo:import"
          permission-export="system:fileInfo:export"
          operation-title="文件信息"
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
              <div class="col-span-3 flex flex-row items-center justify-end">来源Id</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.sourceId" size="small" />
              </div>
              <div class="col-span-3 flex flex-row items-center justify-end">来源编码</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.sourceStage" size="small" />
              </div>
              <div class="col-span-3 flex flex-row items-center justify-end">文件信息名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.originalName" size="small" />
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
        />

        <SystemFileInfoModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />
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
