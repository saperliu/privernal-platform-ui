<script setup lang="tsx">
import type { Ref } from 'vue';
import { h, onMounted, reactive, ref } from 'vue';
import { ElSelect, ElButton as __forwarded_ElButton, ElSpace as __forwarded_ElSpace } from 'element-plus';
import {
  ActionTagAdd,
  ActionTagDelete,
  ActionTagEdit,
  dataRelationOptions,
  menuTypeColors,
  menuTypeLabels
} from '@/constants';
import { findSystemCommonGroupMenuTree } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import { orderByColumn } from '@/utils';
import SystemMenuList from '@/views/system/menu/components/system-menu-list.vue';
import type { ModalType } from './system-common-group-menu-modal.vue';
import SystemCommonGroupMenuModal from './system-common-group-menu-modal.vue';
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'SystemCommonGroupMenuList' });
const props = withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible } = useBoolean();
const modalVisibleMenu = ref(false);

const checkedRows = ref<SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm[]>([]);
const changeRows = ref<SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm[]>([]);
const haveMenuRows = ref<SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm[]>([]);

const tableData = ref<SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
type FormFilterModel = SystemCommonGroupMenuNamespace.SystemCommonGroupMenuQuery & { keyword: string };
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  commonGroupId: props.parentId,
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
/** 树形接口只返回根节点集合，外层包装节点除 children 外没有真实字段 */
type MenuTreeResult = Pick<SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm, 'children'>;

function setTableData(data: MenuTreeResult | null) {
  // tableData.value = data.list;
  // pagination.itemCount = data.total;
  if (data === null) {
    tableData.value = [];
    return;
  }
  Object.assign(rootMenuData, data);
  tableData.value = data.children ? data.children : [];
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemCommonGroupMenuNamespace.SystemCommonGroupMenuQuery) {
  startLoading();
  const { data } = await findSystemCommonGroupMenuTree(dataQuery);
  const result: MenuTreeResult = { children: [] };
  if (data) {
    result.children = data;
    // 递归得到data的children里的所有功能列表
    data.forEach(item2 => {
      if (item2.children) {
        getChildren(item2);
      }
      haveMenuRows.value.push(item2);
    });
  }
  setTableData(result);
  endLoading();
}

function getChildren(data: SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm) {
  if (data.children) {
    data.children.forEach(item => {
      haveMenuRows.value.push(item);
      getChildren(item);
    });
  }
}
const columns: Ref<DataTable.Column<SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm>[]> = ref([
  {
    type: 'selection',
    width: 60,
    align: 'center'
  },
  {
    key: 'menuName',
    title: '菜单名称',
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
    key: 'status',
    title: '状态',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <DataStatus value={row.status}></DataStatus>;
    }
  },
  // {
  // 	key: 'mustMenu',
  // 	title: '角色必选功能',
  // 	align: 'left',
  // 	render: row => {
  // 		return h(
  // 			NSelect,
  // 			{
  // 				options: dataRelationOptions,
  // 				value: row.mustMenu,
  // 				showButton: false,
  // 				disabled: !props.showOperation,
  // 				onUpdateValue: value => {
  // 					row.mustMenu = value;
  // 					row.actionTag = ActionTagEdit;
  // 					handleEditRow(row);
  // 				}
  // 			},
  // 			{
  // 				default: () => '',
  // 				suffix: () => ''
  // 			}
  // 		);
  // 	}
  // },
  {
    key: 'visibleMenu',
    title: '是否显示(菜单)',
    align: 'left',
    render: row => {
      return h(ElSelect, {
        options: dataRelationOptions,
        modelValue: Number(row.visibleMenu),
        disabled: !props.showOperation,
        'onUpdate:modelValue': (value: number) => {
          row.visibleMenu = value;
          row.actionTag = ActionTagEdit;
          handleEditRow(row);
        }
      });
    }
  }
]) as Ref<DataTable.Column<SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm>[]>;

const modalType = ref<ModalType>('add');

const editData = ref<SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm | null>(null);

/** 新增 */
function handleAddTable() {
  // openModal();
  // setModalType('add');
  modalVisibleMenu.value = true;
}

/** 多行删除 */
function handleDeleteRows() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error('请选择要删除的数据！');
    return;
  }

  // 删除新增的
  checkedRows.value.forEach(item => {
    if (item !== undefined && item.actionTag === ActionTagAdd) {
      changeRows.value = changeRows.value.filter(item2 => item2.menuId !== item.menuId);
      tableData.value = tableData.value.filter(item2 => item2.menuId !== item.menuId);
    } else if (item !== undefined) {
      // 打上删除标签
      item.actionTag = ActionTagDelete;
      changeRows.value.push(item);
      // 递归循环children 删除里面menuId相同的数据
      tableData.value = tableData.value.filter(item2 => item2.menuId !== item.menuId);
      tableData.value.forEach(item2 => {
        if (item2.children) {
          item2.children = item2.children.filter(item3 => item3.menuId !== item.menuId);
          deleteChildren(item2, item.menuId);
        }
      });
    }
    checkedRowKeys.value = checkedRowKeys.value.filter(item2 => item2 !== item.id);
    haveMenuRows.value = haveMenuRows.value.filter(item2 => item2.menuId !== item.menuId);
  });
  emit('change', changeRows.value);

  // delSystemCommonGroupMenu(checkedRowKeys.value).then(res => {
  //   if (res.error === null) {
  //     checkedRowKeys.value = [];
  //     message.success('删除成功');
  //     search();
  //   }
  // });
}
function deleteChildren(item: SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm, id: string) {
  if (item.children) {
    item.children = item.children.filter(item5 => item5.menuId !== id);
    item.children.forEach(item2 => {
      if (item2.children) {
        item2.children = item2.children.filter(item3 => item3.menuId !== id);
        deleteChildren(item2, id);
      }
    });
  }
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
  for (const field of Object.keys(formFilter)) {
    if (field === 'pageNum') {
      Reflect.set(formFilter, field, defaultPageNum);
    } else if (field !== 'pageSize') {
      Reflect.set(formFilter, field, null);
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
  rows: SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm[],
  _meta: { row: object | undefined; action: 'check' | 'uncheck' | 'checkAll' | 'uncheckAll' }
) {
  // emit('change', rows);

  checkedRows.value = rows;
}

/**
 * 选择的菜单数据
 *
 * @param rows
 */
function handleSubAddTable(rows: SystemMenuNamespace.SystemMenuForm[]) {
  // 移除tableData里newAdd是ture的数据
  tableData.value = tableData.value.filter(item => item.actionTag !== ActionTagAdd);
  changeRows.value = changeRows.value.filter(item => item.actionTag !== ActionTagAdd);
  haveMenuRows.value = haveMenuRows.value.filter(item => item.actionTag !== ActionTagAdd);

  console.log('---------', rows, haveMenuRows);
  // 添加到子表数据里，是所有数据，并且包含之前的数据
  rows.forEach(value => {
    if (value !== undefined) {
      const temp: SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm = {
        id: '',
        organizationId: '',
        menuName: '',
        menuType: '',
        menuId: '',
        commonGroupId: '',
        status: 1,
        visibleMenu: 1,
        mustMenu: 1,
        children: [],
        actionTag: ActionTagAdd
      };
      Object.assign(temp, value);
      temp.menuId = value.id;
      temp.children = [];
      const flag = haveMenuRows.value.find(item => item.menuId === value.id);
      if (!flag) {
        // 判断是否是恢复的，比如：先删除，再添加回来。这样的不需要提交给后台。
        const newAdd = changeRows.value.find(item => item.menuId === value.id);
        console.log('------newAdd---', newAdd);
        if (newAdd && newAdd.actionTag === ActionTagDelete) {
          // 则是之前删除的，则不需要提交给后台。
          changeRows.value = changeRows.value.filter(item => item.menuId !== value.id);
          temp.actionTag = '';
          tableData.value.push(temp);
          haveMenuRows.value.push(temp);
        } else {
          tableData.value.push(temp);
          haveMenuRows.value.push(temp);
          changeRows.value.push(temp);
        }
      }
    }
  });
  // pagination.itemCount = tableData.value.length;
  console.log('------changeRows---', changeRows.value);
  // 返回给form表单
  emit('change', changeRows.value);
}

/**
 * 编辑后，保存
 *
 * @param row
 */
function handleEditRow(row: SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm) {
  // 去掉 changeRows 里的 id 相同的数据
  changeRows.value = changeRows.value.filter(item => item.id !== row.id);
  changeRows.value.push(row);
  emit('change', changeRows.value);
}

function search() {
  if (formFilter.commonGroupId !== '') {
    getTableData(formFilter);
  }
}

onMounted(() => {
  formFilter.commonGroupId = props.parentId;
  search();
});
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:commonGroupMenu:add"
          permission-remove="system:commonGroupMenu:remove"
          permission-import="system:commonGroupMenu:import"
          permission-export="system:commonGroupMenu:export"
          operation-title="组关联的权限"
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
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px"></div>
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

        <SystemCommonGroupMenuModal
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
          @closed="handleClose"
        />
      </div>
    </ElCard>

    <ElDrawer v-model="modalVisibleMenu" size="90%" title="添加菜单" resizable class="privernal-drawer">
      <template #header>
        <ElSpace :size="24" justify="space-between" align="center">
          <div>添加菜单</div>
        </ElSpace>
      </template>
      <SystemMenuList :show-operation="false" :list-data="haveMenuRows" @change="handleSubAddTable"></SystemMenuList>
      <template #footer>
        <ElSpace class="w-full pt-16px" :size="24" justify="end">
          <ElButton class="w-72px" @click="modalVisibleMenu = false">取消</ElButton>
          <ElButton class="w-72px" type="primary" @click="modalVisibleMenu = false">确定</ElButton>
        </ElSpace>
      </template>
    </ElDrawer>
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
