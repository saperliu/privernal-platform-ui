<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { ElButton, ElSpace } from 'element-plus';
import { delSystemPosition, findSystemPositionList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './components/position-form-modal.vue';
import PositionFormModal from './components/position-form-modal.vue';
import ListPersonModal from './components/list-person-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemPositionNamespace.SystemPositionForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
// ListFilter 的 keyword 是必填 string；备注筛选字段后端查询类型未声明，本地交叉类型补齐
type FormFilterModel = SystemPositionNamespace.SystemPositionQuery & { keyword: string; remark?: string };
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: []
});
const visiblePerson = ref<boolean>(false);
const positionData = ref<SystemPositionNamespace.SystemPositionForm | null>(null);
const pagination = reactive({
  page: defaultPageNum,
  pageSize: defaultPageSize,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30, 50, 100],
  itemCount: 100,
  prefix(info: DataTable.PaginationInfo) {
    return `总数: ${info.itemCount}条`;
  },
  onChange: (page: number) => {
    pagination.page = page;
    formFilter.pageNum = page;
    formFilter.pageSize = pagination.pageSize ? pagination.pageSize : 10;
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

function setTableData(data: SystemPositionNamespace.SystemPositionPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemPositionNamespace.SystemPositionQuery) {
  startLoading();
  const { data } = await findSystemPositionList(dataQuery);
  let result: SystemPositionNamespace.SystemPositionPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemPositionNamespace.SystemPositionForm>[]> = ref([
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
    key: 'positionName',
    title: '岗位名称',
    align: 'left',
    ellipsis: true,
    render: row => {
      return (
        <TableColumnLink value={row} name={row.positionName} onClick={() => tableColumnClick(row)}></TableColumnLink>
      );
    }
  },
  {
    key: 'positionCode',
    title: '岗位编码',
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
  // {
  //   key: 'orderNum',
  //   title: '排序值',
  //   align: 'left',
  //   ellipsis: true
  // },
  {
    key: 'remark',
    title: '备注',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'actions',
    title: '操作',
    align: 'left',
    fixed: 'right',
    className: 'table-action-title',
    width: 300,
    render: row => {
      return (
        <ElSpace>
          <div v-permission="'system:position:edit'">
            <ElButton text size={'small'} type="primary" onClick={(events: Event) => handlePersonTable(row, events)}>
              添加人员
            </ElButton>
          </div>
        </ElSpace>
      );
    }
  }
]) as Ref<DataTable.Column<SystemPositionNamespace.SystemPositionForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemPositionNamespace.SystemPositionForm | null>(null);

function setEditData(data: SystemPositionNamespace.SystemPositionForm | null) {
  editData.value = data;
}

function handleAddTable() {
  openModal();
  setModalType('add');
}

function handleDeleteRows() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error('请选择要删除的数据！');
    return;
  }
  delSystemPosition(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      search();
    }
  });
}

function handlePersonTable(data: SystemPositionNamespace.SystemPositionForm, event: Event) {
  event.stopPropagation();
  visiblePerson.value = true;
  positionData.value = data;
}

function search() {
  getTableData(formFilter);
}

/** 重置搜索 */
function resetForm() {
  formFilter.positionName = '';
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
 * 单独某列的点击的处理
 *
 * @param row
 */
function tableColumnClick(row: SystemPositionNamespace.SystemPositionForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}
function handleClose(value: boolean) {
  if (value) {
    getTableData(formFilter);
  }
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
          permission-add="system:position:add"
          permission-remove="system:position:remove"
          permission-import="system:position:import"
          permission-export="system:position:export"
          operation-title="岗位"
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
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">备注</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.remark" placeholder="请输入备注" size="small" />
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

        <PositionFormModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />

        <ListPersonModal v-model:visible="visiblePerson" :edit-data="positionData" />
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
