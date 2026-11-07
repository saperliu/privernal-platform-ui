<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { ActionTagAdd, ActionTagDelete } from '@/constants';
import { findSystemAppWorkflowList } from '@/service';
import { useLoading } from '@/hooks';
import { orderByColumn } from '@/utils';
import FlowDefinitionPicker from '@/views/flow/components/flow-definition-picker.vue';
import type { PickerRow } from '@/views/flow/components/flow-definition-picker.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'SystemAppWorkflowList' });
const props = withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: SystemAppWorkflowNamespace.SystemAppWorkflowForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<SystemAppWorkflowNamespace.SystemAppWorkflowForm[]>([]);
const checkedRowKeys = ref<string[]>([]);

const modalVisibleForm = ref(false);
const checkedRows = ref<SystemAppWorkflowNamespace.SystemAppWorkflowForm[]>([]);

const changeRows = ref<SystemAppWorkflowNamespace.SystemAppWorkflowForm[]>([]);
const haveFormRows = ref<SystemAppWorkflowNamespace.SystemAppWorkflowForm[]>([]);
const pickerListData = computed<PickerRow[]>(() =>
  haveFormRows.value.map(item => ({
    id: item.workflowFormId,
    name: item.name,
    tableName: item.name
  }))
);

type FormFilterModel = SystemAppWorkflowNamespace.SystemAppWorkflowQuery & { keyword: string };
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
  appId: '',
  workflowFormId: '',
  organizationId: '',
  status: 1,
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

function setTableData(data: SystemAppWorkflowNamespace.SystemAppWorkflowPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemAppWorkflowNamespace.SystemAppWorkflowQuery) {
  startLoading();
  const { data } = await findSystemAppWorkflowList(dataQuery);
  let result: SystemAppWorkflowNamespace.SystemAppWorkflowPage = { list: [], total: 0 };
  if (data) {
    result = data;
    data.list.forEach(item2 => {
      haveFormRows.value.push(item2);
    });
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemAppWorkflowNamespace.SystemAppWorkflowForm>[]> = ref([
  {
    type: 'selection',
    width: 60,
    align: 'center'
  },
  {
    key: 'index',
    title: '序号',
    align: 'left',
    width: 60,
    render(_, index) {
      return index + 1;
    }
  },

  // {
  //   key: 'appId',
  //   title: '应用的ID',
  //   align: 'left',
  //   ellipsis: {
  //     tooltip: tableTooltipStyle
  //   }
  // },
  {
    key: 'name',
    title: '流程表单',
    align: 'left',
    ellipsis: true
  }
  // {
  //   key: 'status',
  //   title: '状态',
  //   align: 'left',
  //   render: row => {
  //     return <DataStatus value={row.status}></DataStatus>;
  //   }
  // },
  // {
  //   key: 'remark',
  //   title: '备注',
  //   align: 'left',
  //   ellipsis: {
  //     tooltip: tableTooltipStyle
  //   }
  // },

  // {
  //   key: 'organizationId',
  //   title: '组织ID',
  //   align: 'left',
  //   ellipsis: {
  //     tooltip: tableTooltipStyle
  //   }
  // }
]) as Ref<DataTable.Column<SystemAppWorkflowNamespace.SystemAppWorkflowForm>[]>;

/** 新增 */
function handleAddTable() {
  // openModal();
  // setModalType('add');
  modalVisibleForm.value = true;
}

/** 多行删除 */
function handleDeleteRows() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error('请选择要删除的数据！');
    return;
  }
  checkedRows.value.forEach(item => {
    if (item !== undefined && item.actionTag === ActionTagAdd) {
      changeRows.value = changeRows.value.filter(item2 => item2.workflowFormId !== item.workflowFormId);
      tableData.value = tableData.value.filter(item2 => item2.workflowFormId !== item.workflowFormId);
    } else if (item !== undefined) {
      // 打上删除标签
      item.actionTag = ActionTagDelete;
      changeRows.value.push(item);
      // 递归循环children 删除里面menuId相同的数据
      tableData.value = tableData.value.filter(item2 => item2.workflowFormId !== item.workflowFormId);
    }
    checkedRowKeys.value = checkedRowKeys.value.filter(item2 => item2 !== item.id);
    haveFormRows.value = haveFormRows.value.filter(item2 => item2.workflowFormId !== item.workflowFormId);
  });
  emit('change', changeRows.value);
  // delSystemAppWorkflow(checkedRowKeys.value).then(res => {
  //   if (res.error === null) {
  //     checkedRowKeys.value = [];
  //     message.success('删除成功');
  //     search();
  //   }
  // });
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
      formFilter.pageNum = defaultPageNum;
    } else if (field === 'keyword') {
      formFilter.keyword = '';
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
 * 回调推送选择的数据
 *
 * @param keys
 * @param rows
 * @param meta
 */
function handleChangeChecked(
  _keys: Array<string | number>,
  rows: SystemAppWorkflowNamespace.SystemAppWorkflowForm[],
  _meta: { row: object | undefined; action: 'check' | 'uncheck' | 'checkAll' | 'uncheckAll' }
) {
  checkedRows.value = rows;
}

/**
 * 选择的菜单数据
 *
 * @param rows
 */
function handleSubAddTable(rows: PickerRow[]) {
  // 移除tableData里newAdd是ture的数据
  tableData.value = tableData.value.filter(item => item.actionTag !== ActionTagAdd);
  changeRows.value = changeRows.value.filter(item => item.actionTag !== ActionTagAdd);
  haveFormRows.value = haveFormRows.value.filter(item => item.actionTag !== ActionTagAdd);

  console.log('---------', rows, haveFormRows);
  // 添加到子表数据里，是所有数据，并且包含之前的数据
  rows.forEach(value => {
    if (value !== undefined) {
      const temp: SystemAppWorkflowNamespace.SystemAppWorkflowForm = {
        id: '',
        organizationId: '',
        appId: props.parentId,
        workflowFormId: '',
        name: '',
        status: 1,
        actionTag: ActionTagAdd
      };
      temp.workflowFormId = value.id;
      temp.name = value.tableName;
      temp.appId = props.parentId;

      const flag = haveFormRows.value.find(item => item.workflowFormId === value.id);
      if (!flag) {
        const newAdd = changeRows.value.find(item => item.workflowFormId === value.id);
        console.log('------newAdd---', newAdd);
        if (newAdd && newAdd.actionTag === ActionTagDelete) {
          changeRows.value = changeRows.value.filter(item => item.workflowFormId !== value.id);
          temp.actionTag = '';
          tableData.value.push(temp);
          haveFormRows.value.push(temp);
        } else {
          tableData.value.push(temp);
          haveFormRows.value.push(temp);
          changeRows.value.push(temp);
        }
      }
    }
  });
  console.log('------changeRows---', changeRows.value);
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
          permission-add="system:appWorkflow:add"
          permission-remove="system:appWorkflow:remove"
          permission-import="system:appWorkflow:import"
          permission-export="system:appWorkflow:export"
          operation-title="应用关联的流程单"
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
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.name" placeholder="名称" size="small" />
              </div>

              <!--              <el-grid-item :span="3" class="flex flex-row items-center justify-end ml-10px">-->
              <!--                关联的工作流表单ID-->
              <!--              </el-grid-item>-->
              <!--              <el-grid-item :span="7">-->
              <!--                <el-input-->
              <!--                  v-model="formFilter.workflowFormId"-->
              <!--                  placeholder="请输入关联的工作流表单ID"-->
              <!--                  size="small"-->
              <!--                />-->
              <!--              </el-grid-item>-->

              <!--              <el-grid-item :span="3" class="flex flex-row items-center justify-end ml-10px">备注</el-grid-item>-->
              <!--              <el-grid-item :span="7">-->
              <!--                <el-input v-model="formFilter.remark" placeholder="请输入备注" size="small" />-->
              <!--              </el-grid-item>-->

              <!--              <el-grid-item :span="3" class="flex flex-row items-center justify-end ml-10px">组织ID</el-grid-item>-->
              <!--              <el-grid-item :span="7">-->
              <!--                <el-input v-model="formFilter.organizationId" placeholder="请输入组织ID" size="small" />-->
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
          @update:sorter="handleUpdateSorter"
        />

        <!--        <system-app-workflow-modal-->
        <!--          v-model:visible="visible"-->
        <!--          :type="modalType"-->
        <!--          :edit-data="editData"-->
        <!--          @closed="handleClose"-->
        <!--        />-->
      </div>
    </ElCard>

    <ElDrawer v-model="modalVisibleForm" size="90%" title="添加流程表单" resizable class="privernal-drawer">
      <template #header>
        <ElSpace class="justify-between" :size="24" alignment="center">
          <div>添加流程表单</div>
        </ElSpace>
      </template>
      <FlowDefinitionPicker
        :show-operation="false"
        :list-data="pickerListData"
        @change="handleSubAddTable"
      ></FlowDefinitionPicker>
      <template #footer>
        <ElSpace class="w-full justify-end pt-16px" :size="24">
          <ElButton class="w-72px" @click="modalVisibleForm = false">取消</ElButton>
          <ElButton class="w-72px" type="primary" @click="modalVisibleForm = false">确定</ElButton>
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
