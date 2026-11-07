<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { delSystemUserAppMenu, findSystemUserAppMenuList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-user-app-menu-modal.vue';
import SystemUserAppMenuModal from './system-user-app-menu-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'SystemUserAppMenuList' });
withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: SystemUserAppMenuNamespace.SystemUserAppMenuForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemUserAppMenuNamespace.SystemUserAppMenuForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/**
 * 查询类型把筛选项都声明成了必填，但本页所有筛选项后端按「空串/null 即不过滤」处理，
 * 这里按可选建模；ListFilter 的 keyword 是必填，用交叉类型补齐。
 */
type FormFilterModel = Partial<SystemUserAppMenuNamespace.SystemUserAppMenuQuery> & { keyword: string };
const defaultPageNum = 1;
const defaultPageSize = 10;
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

function setTableData(data: SystemUserAppMenuNamespace.SystemUserAppMenuPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: FormFilterModel) {
  startLoading();
  // 后端对空串/缺省的状态都不加过滤条件，这里把字符串筛选项补成空串再发请求
  const { data } = await findSystemUserAppMenuList({
    ...dataQuery,
    userId: dataQuery.userId ?? '',
    menuId: dataQuery.menuId ?? '',
    organizationId: dataQuery.organizationId ?? ''
  } as SystemUserAppMenuNamespace.SystemUserAppMenuQuery);
  let result: SystemUserAppMenuNamespace.SystemUserAppMenuPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemUserAppMenuNamespace.SystemUserAppMenuForm>[]> = ref([
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
    key: 'userId',
    title: '用户的ID',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.userId} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'menuId',
    title: '关联的菜单',
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
    key: 'organizationId',
    title: '组织ID',
    align: 'left',
    ellipsis: true
  }
]);

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemUserAppMenuNamespace.SystemUserAppMenuForm | null>(null);

function setEditData(data: SystemUserAppMenuNamespace.SystemUserAppMenuForm | null) {
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
  delSystemUserAppMenu(checkedRowKeys.value).then(res => {
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
function tableColumnClick(row: SystemUserAppMenuNamespace.SystemUserAppMenuForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}

/** 重置搜索 */
function resetForm() {
  clearSearch();
}

/** 清空模糊搜索：分页回到首页，其余筛选项回到不过滤的空值 */
function clearSearch() {
  formFilter.pageNum = defaultPageNum;
  formFilter.keyword = '';
  formFilter.keywords = [];
  formFilter.userId = '';
  formFilter.menuId = '';
  getTableData(formFilter);
}

/** 模糊搜索 */
function keywordSearch() {
  if (formFilter.keyword !== null && formFilter.keyword !== undefined) {
    formFilter.keywords = formFilter.keyword.split(' ');
  }
  getTableData(formFilter);
}

/**
 * 显示详情关闭的回调函数
 *
 * @param value 弹窗内是否发生了数据变更
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
  rows: SystemUserAppMenuNamespace.SystemUserAppMenuForm[],
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
          permission-add="system:userAppMenu:add"
          permission-remove="system:userAppMenu:remove"
          permission-import="system:userAppMenu:import"
          permission-export="system:userAppMenu:export"
          operation-title="用户关联菜单"
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
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">用户的ID</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.userId" placeholder="请输入用户的ID" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">关联的菜单</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.menuId" placeholder="请输入关联的菜单" size="small" />
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

        <SystemUserAppMenuModal
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
