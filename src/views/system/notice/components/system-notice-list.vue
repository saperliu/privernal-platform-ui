<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { delSystemNotice, findSystemNoticeList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-notice-modal.vue';
import SystemNoticeModal from './system-notice-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
}
defineOptions({ name: 'SystemNoticeList' });
withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true
});
interface Emits {
  (e: 'change', data: SystemNoticeNamespace.SystemNoticeForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemNoticeNamespace.SystemNoticeForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/** 本地筛选模型：ListFilter 的关键字为必填字符串，查询类型里它是可选的；name 是本页附加的模糊筛选字段 */
type FormFilterModel = SystemNoticeNamespace.SystemNoticeQuery & { keyword: string; name?: string };
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

function setTableData(data: SystemNoticeNamespace.SystemNoticePage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemNoticeNamespace.SystemNoticeQuery) {
  startLoading();
  const { data } = await findSystemNoticeList(dataQuery);
  let result: SystemNoticeNamespace.SystemNoticePage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemNoticeNamespace.SystemNoticeForm>[]> = ref([
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
    key: 'noticeTitle',
    title: '公告标题',
    align: 'left',
    ellipsis: true,
    render: row => {
      return (
        <TableColumnLink value={row} name={row.noticeTitle} onClick={() => tableColumnClick(row)}></TableColumnLink>
      );
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
    key: 'noticeType',
    title: '公告类型',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'content',
    title: '内容简介',
    align: 'left',
    ellipsis: true
  },

  {
    key: 'detailUrl',
    title: '详情链接',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'remark',
    title: '备注',
    align: 'left',
    ellipsis: true
  }
]) as Ref<DataTable.Column<SystemNoticeNamespace.SystemNoticeForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemNoticeNamespace.SystemNoticeForm | null>(null);

function setEditData(data: SystemNoticeNamespace.SystemNoticeForm | null) {
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
  delSystemNotice(checkedRowKeys.value).then(res => {
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
function tableColumnClick(row: SystemNoticeNamespace.SystemNoticeForm) {
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

/**
 * 回调推送选择的数据
 *
 * @param keys
 * @param rows
 * @param meta
 */
function handleChangeChecked(
  _keys: Array<string | number>,
  rows: SystemNoticeNamespace.SystemNoticeForm[],
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
          permission-add="system:notice:add"
          permission-remove="system:notice:remove"
          permission-import="system:notice:import"
          permission-export="system:notice:export"
          operation-title="通知"
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
              <div class="col-span-3 flex flex-row items-center justify-end">通知标题</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.noticeTitle" size="small" />
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">内容</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.content" size="small" />
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

        <SystemNoticeModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />
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
