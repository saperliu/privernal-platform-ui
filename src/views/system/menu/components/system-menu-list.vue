<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, reactive, ref } from 'vue';
import { ElButton } from 'element-plus';
import { menuTypeColors, menuTypeLabels } from '@/constants';
import { delSystemMenu, findSystemMenuTreeAll } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './menu-action-modal.vue';
import TableActionModal from './menu-action-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
  /** 查询数据的条件 */
  query?: SystemMenuNamespace.SystemMenuQueryParams;
  /** 已经选择的数据 */
  listData?: any[];
}
defineOptions({ name: 'SystemMenuList' });
const props = withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: '',
  query: () => ({ menuTypes: [] }),
  listData: () => []
});

interface Emits {
  (e: 'change', data: SystemMenuNamespace.SystemMenuForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemMenuNamespace.SystemMenuForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
// 返回props.listData里对象的id的集合
const checkedDefaultRowKeys = computed(() => props.listData.map(item => item.menuId));

checkedRowKeys.value = checkedDefaultRowKeys.value;
// ListFilter 的 keyword 是必填 string，查询类型里它是可选的，本地交叉类型补齐
type FormFilterModel = SystemMenuNamespace.SystemMenuQuery & { keyword: string };
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: [],
  menuTypes: props.query.menuTypes
});
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

const rootMenuData = reactive<SystemMenuNamespace.SystemMenuForm>({
  mustMenu: 0,
  component: '',
  dataScope: 0,
  icon: '',
  isCache: 0,
  isFrame: 0,
  menuCode: '',
  menuType: 'M',
  orderNum: 0,
  params: '',
  parentId: '',
  path: '',
  permission: '',
  visible: 0,
  children: [],
  menuName: '',
  organizationId: '',
  status: 1,
  id: ''
});

function setTableData(data: Partial<SystemMenuNamespace.SystemMenuForm> | null) {
  if (data === null) {
    return;
  }
  Object.assign(rootMenuData, data);
  tableData.value = data.children ? data.children : [];
  // tableData.value = data.list;
  // pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemMenuNamespace.SystemMenuQuery) {
  startLoading();
  const { data } = await findSystemMenuTreeAll(dataQuery);
  // 这里只需要一个承载 children 的占位根节点，无需完整菜单表单字段
  const result: Partial<SystemMenuNamespace.SystemMenuForm> = { children: [] };
  if (data) {
    result.children = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemMenuNamespace.SystemMenuForm>[]> = ref([
  {
    type: 'selection',
    align: 'center',
    width: 60
  },
  {
    key: 'index',
    title: '序号',
    width: 60,
    align: 'left'
    // render(_, index) {
    //   return index + 1;
    // }
  },

  {
    key: 'menuName',
    title: '菜单名称',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.menuName} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'menuCode',
    title: '菜单编码',
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
    key: 'path',
    title: '路由地址',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'menuType',
    title: '菜单类型',
    align: 'left',
    ellipsis: true,
    render: row => {
      return (
        <ElButton text disabled color={menuTypeColors[row.menuType]}>
          {menuTypeLabels[row.menuType]}
        </ElButton>
      );
    }
  },
  {
    key: 'permission',
    title: '权限标识',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'orderNum',
    title: '显示顺序',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'remark',
    title: '备注',
    align: 'left',
    ellipsis: true
  }
  // {
  //   key: 'actions',
  //   title: '操作',
  //   fixed: 'right',
  //       align: 'left',
  //   ellipsis: true,,
  //   render: row => {
  //     return (
  //       <ElSpace justify={'center'}>
  //         <div v-permission="'system:menu:edit'">
  //           <ElButton size={'small'} onClick={() => handleEditTable(row.id)}>
  //             编辑
  //           </ElButton>
  //         </div>
  //         <div v-permission="'system:menu:remove'">
  //           <ElPopconfirm onPositiveClick={() => handleDeleteTable(row.id)}>
  //             {{
  //               default: () => '确认删除',
  //               trigger: () => <ElButton size={'small'}>删除</ElButton>
  //             }}
  //           </ElPopconfirm>
  //         </div>
  //       </ElSpace>
  //     );
  //   }
  // }
]) as Ref<DataTable.Column<SystemMenuNamespace.SystemMenuForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemMenuNamespace.SystemMenuForm | null>(null);

function setEditData(data: SystemMenuNamespace.SystemMenuForm | null) {
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
  delSystemMenu(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      init();
    }
  });
}

/**
 * 行的选中的事件
 *
 * @param row
 */
function tableColumnClick(row: SystemMenuNamespace.SystemMenuForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}
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
  rows: SystemMenuNamespace.SystemMenuForm[],
  _meta: { row: object | undefined; action: 'check' | 'uncheck' | 'checkAll' | 'uncheckAll' }
) {
  emit('change', rows);
}

function init() {
  getTableData(formFilter);
}

/** 重置搜索 */
function resetForm() {
  formFilter.menuName = '';
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
          permission-add="system:menu:add"
          permission-remove="system:menu:remove"
          permission-import="system:menu:import"
          permission-export="system:menu:export"
          operation-title="菜单信息"
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
              <div class="col-span-3 flex flex-row items-center justify-end">名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.menuName" size="small" />
              </div>
            </div>
          </template>
          <template #toolbar-extra>
            <ListAdditional v-model:columns="columns" @reload="init"></ListAdditional>
          </template>
        </ListFilter>

        <DataTable
          v-model:checked-row-keys="checkedRowKeys"
          :default-checked-row-keys="checkedDefaultRowKeys"
          remote
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :row-key="rowKey"
          :scroll-x="1200"
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          :bottom-bordered="true"
          :cascade="false"
          striped
          @update:checked-row-keys="handleChangeChecked"
        />

        <TableActionModal
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
          :show-operation="showOperation"
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
  //  //overflow: inherit;
  //}
}
</style>
