<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, reactive, ref } from 'vue';
import { commonGroupLabels } from '@/constants';
import { delSystemCommonGroup, findSystemCommonGroupList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-common-group-modal.vue';
import SystemCommonGroupModal from './system-common-group-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
  /** 查询数据的条件 */
  query?: SystemCommonGroupNamespace.SystemCommonGroupQuery;
  /** 已经选择的数据 */
  listData?: any[];
}
defineOptions({ name: 'SystemCommonGroupList' });
const props = withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: '',
  listData: () => []
});
interface Emits {
  (e: 'change', data: SystemCommonGroupNamespace.SystemCommonGroupForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemCommonGroupNamespace.SystemCommonGroupForm[]>([]);
const checkedRowKeys = ref<string[]>([]);

// 返回props.listData里对象的id的集合
const checkedDefaultRowKeys = computed(() => props.listData.map(item => item.commonGroupId));

checkedRowKeys.value = checkedDefaultRowKeys.value;

/** 本地筛选模型：ListFilter 的关键字为必填字符串，查询类型里它是可选的 */
type FormFilterModel = SystemCommonGroupNamespace.SystemCommonGroupQuery & { keyword: string };
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

function setTableData(data: SystemCommonGroupNamespace.SystemCommonGroupPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemCommonGroupNamespace.SystemCommonGroupQuery) {
  startLoading();
  const { data } = await findSystemCommonGroupList(dataQuery);
  let result: SystemCommonGroupNamespace.SystemCommonGroupPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemCommonGroupNamespace.SystemCommonGroupForm>[]> = ref([
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
  {
    key: 'name',
    title: '组名',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.name} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'code',
    title: '组编码',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'groupType',
    title: '类型',
    align: 'left',
    ellipsis: true,
    render: row => {
      if (row.groupType) {
        return <span>{commonGroupLabels[row.groupType]}</span>;
      }
      return <span></span>;
    }
  },
  // {
  //   key: 'moduleType',
  //   title: '模块类型',
  //       align: 'left',
  //   ellipsis: true,
  // },
  {
    key: 'description',
    title: '描述',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'remark',
    title: '备注',
    align: 'left',
    ellipsis: true
  }
]) as Ref<DataTable.Column<SystemCommonGroupNamespace.SystemCommonGroupForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemCommonGroupNamespace.SystemCommonGroupForm | null>(null);

function setEditData(data: SystemCommonGroupNamespace.SystemCommonGroupForm | null) {
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
  delSystemCommonGroup(checkedRowKeys.value).then(res => {
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
function tableColumnClick(row: SystemCommonGroupNamespace.SystemCommonGroupForm) {
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
  for (const field of Object.keys(formFilter)) {
    if (field === 'pageNum') {
      formFilter.pageNum = defaultPageNum;
    } else if (field !== 'pageSize') {
      Reflect.set(formFilter, field, null);
    }
  }

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
  rows: SystemCommonGroupNamespace.SystemCommonGroupForm[],
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
          permission-add="system:commonGroup:add"
          permission-remove="system:commonGroup:remove"
          permission-import="system:commonGroup:import"
          permission-export="system:commonGroup:export"
          operation-title="公共组"
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
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">组名</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.name" placeholder="请输入组名" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">组编码</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.code" placeholder="请输入组编码" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">描述</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.description" placeholder="请输入描述" size="small" />
              </div>
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
          @update:checked-row-keys="handleChangeChecked"
        />

        <SystemCommonGroupModal
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
