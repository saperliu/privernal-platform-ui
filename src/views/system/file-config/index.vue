<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { delSystemFileConfig, findSystemFileConfigList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './components/system-file-config-modal.vue';
import SystemFileConfigModal from './components/system-file-config-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemFileConfigNamespace.SystemFileConfigForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
type FormFilterModel = SystemFileConfigNamespace.SystemFileConfigQuery & { keyword: string };
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

function setTableData(data: SystemFileConfigNamespace.SystemFileConfigPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemFileConfigNamespace.SystemFileConfigQuery) {
  startLoading();
  const { data } = await findSystemFileConfigList(dataQuery);
  let result: SystemFileConfigNamespace.SystemFileConfigPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemFileConfigNamespace.SystemFileConfigForm>[]> = ref([
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
    key: 'title',
    title: '标题',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'name',
    title: '名称',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.name} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'type',
    title: '类型: OSS，LOCAL,MINIO',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'endpoint',
    title: '存储地址',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'accessId',
    title: '存储的ID',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'accessKey',
    title: '存储的KEY',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'bucket',
    title: '桶',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'storePath',
    title: '存储的目录',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'netPath',
    title: '网络访问的地址',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'remark',
    title: '备注',
    align: 'left',
    ellipsis: true
  }
]) as Ref<DataTable.Column<SystemFileConfigNamespace.SystemFileConfigForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemFileConfigNamespace.SystemFileConfigForm | null>(null);

function setEditData(data: SystemFileConfigNamespace.SystemFileConfigForm | null) {
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
  delSystemFileConfig(checkedRowKeys.value).then(res => {
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
function tableColumnClick(row: SystemFileConfigNamespace.SystemFileConfigForm) {
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
          permission-add="system:fileConfig:add"
          permission-remove="system:fileConfig:remove"
          permission-import="system:fileConfig:import"
          permission-export="system:fileConfig:export"
          operation-title="文件配置"
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
              <div class="col-span-2 flex flex-row items-center justify-end">文件配置名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.name" size="small" />
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">类型</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.type" size="small" />
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

        <SystemFileConfigModal
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
