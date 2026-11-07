<script setup lang="tsx">
import type { Ref } from 'vue';
import { h, onMounted, reactive, ref } from 'vue';
import { ElSelect } from 'element-plus';
import {
  ActionTagAdd,
  ActionTagDelete,
  ActionTagEdit,
  dataRelationOptions,
  menuTypeColors,
  menuTypeLabels
} from '@/constants';
import { findSystemAppMenuTree } from '@/service';
import { useLoading } from '@/hooks';
import SystemMenuList from '@/views/system/menu/components/system-menu-list.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'SystemAppMenuList' });
const props = withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: SystemAppMenuNamespace.SystemAppMenuForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const modalVisibleMenu = ref(false);

const tableData = ref<SystemAppMenuNamespace.SystemAppMenuForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
const checkedRows = ref<SystemAppMenuNamespace.SystemAppMenuForm[]>([]);

const changeRows = ref<SystemAppMenuNamespace.SystemAppMenuForm[]>([]);
const haveMenuRows = ref<SystemAppMenuNamespace.SystemAppMenuForm[]>([]);

/** ListFilter 的 keyword 是必填，查询类型里它是可选，用本地交叉类型补齐 */
type FormFilterModel = SystemAppMenuNamespace.SystemAppMenuQuery & { keyword: string };
const defaultPageNum = 1;
const defaultPageSize = 999;
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  appId: props.parentId,
  keyword: '',
  keywords: []
});

const pagination = reactive({
  page: defaultPageNum,
  pageSize: defaultPageSize,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30, 50, 100, 999],
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
function setTableData(data: SystemAppMenuNamespace.SystemAppMenuForm) {
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

async function getTableData(dataQuery: SystemAppMenuNamespace.SystemAppMenuQuery) {
  startLoading();
  const { data } = await findSystemAppMenuTree(dataQuery);
  // 合成的根节点，仅用于把菜单树挂到 children 上（setTableData 只消费 children）
  const result: SystemAppMenuNamespace.SystemAppMenuForm = {
    id: '',
    appId: dataQuery.appId || '',
    menuId: '',
    status: 1,
    mustMenu: 0,
    visibleMenu: 0,
    organizationId: '',
    menuName: '',
    menuType: '',
    actionTag: '',
    children: []
  };
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

function getChildren(data: SystemAppMenuNamespace.SystemAppMenuForm) {
  if (data.children) {
    data.children.forEach(item => {
      haveMenuRows.value.push(item);
      getChildren(item);
    });
  }
}

const columns: Ref<DataTable.Column<SystemAppMenuNamespace.SystemAppMenuForm>[]> = ref([
  {
    type: 'selection',
    width: 60,
    align: 'center'
  },
  // {
  //   key: 'index',
  //   title: '序号',
  //   align: 'left',
  //   ellipsis: true,
  //   width: 60,
  //   render(_, index) {
  //     return index + 1;
  //   }
  // },

  // {
  //   key: 'appId',
  //   title: '应用的ID',
  //   align: 'left',
  //   ellipsis: true
  // },
  {
    key: 'menuName',
    title: '关联的菜单',
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
  {
    key: 'mustMenu',
    title: '应用必选功能',
    align: 'left',
    render: row => {
      return h(ElSelect, {
        options: dataRelationOptions,
        modelValue: Number(row.mustMenu),
        disabled: !props.showOperation,
        'onUpdate:modelValue': (value: number) => {
          row.mustMenu = value;
          row.actionTag = ActionTagEdit;
          handleEditRow(row);
        }
      });
    }
  },
  {
    key: 'visibleMenu',
    title: '是否显示功能',
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
]) as Ref<DataTable.Column<SystemAppMenuNamespace.SystemAppMenuForm>[]>;

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
  // delSystemAppMenu(checkedRowKeys.value).then(res => {
  //   if (res.error === null) {
  //     checkedRowKeys.value = [];
  //     message.success('删除成功');
  //     search();
  //   }
  // });
}

function deleteChildren(item: SystemAppMenuNamespace.SystemAppMenuForm, id: string) {
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

/** 重置搜索 */
function resetForm() {
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
  if (formFilter.keyword !== null) {
    formFilter.keywords = formFilter.keyword.split(' ');
  }
  getTableData(formFilter);
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
  rows: SystemAppMenuNamespace.SystemAppMenuForm[],
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
      const temp: SystemAppMenuNamespace.SystemAppMenuForm = {
        children: [],
        id: '',
        organizationId: '',
        menuName: '',
        menuType: '',
        menuId: '',
        appId: '',
        status: 1,
        visibleMenu: 1,
        mustMenu: 0,
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
function handleEditRow(row: SystemAppMenuNamespace.SystemAppMenuForm) {
  // 去掉 changeRows 里的 id 相同的数据
  changeRows.value = changeRows.value.filter(item => item.id !== row.id);
  changeRows.value.push(row);
  emit('change', changeRows.value);
}
function search() {
  if (formFilter.appId !== '') {
    getTableData(formFilter);
  }
}

onMounted(() => {
  formFilter.appId = props.parentId;
  search();
});
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:appMenu:add"
          permission-remove="system:appMenu:remove"
          permission-import="system:appMenu:import"
          permission-export="system:appMenu:export"
          operation-title="应用关联的菜单"
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
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">备注</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.remark" placeholder="请输入备注" size="small" />
              </div>

              <!--              <el-grid-item :span="3" class="flex flex-row items-center justify-end ml-10px">关联的菜单</el-grid-item>-->
              <!--              <el-grid-item :span="7">-->
              <!--                <el-input v-model="formFilter.menuId" placeholder="请输入关联的菜单" size="small" />-->
              <!--              </el-grid-item>-->
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

        <!--        <system-app-menu-modal-->
        <!--          v-model:visible="visible"-->
        <!--          :type="modalType"-->
        <!--          :edit-data="editData"-->
        <!--          @closed="handleClose"-->
        <!--        />-->
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
