<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import {
  ElButton as __forwarded_ElButton,
  ElSelect as __forwarded_ElSelect,
  ElSpace as __forwarded_ElSpace
} from 'element-plus';
import { approveFlowTask, findFlowTodoList, rejectFlowTask, transferFlowTask } from '@/service';
import { useLoading } from '@/hooks';
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;

const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<FlowNamespace.Task[]>([]);
const checkedRowKeys = ref<string[]>([]);
const showModal = ref<boolean>(false);
const processType = ref<string>('a');
const currentTask = ref<FlowNamespace.Task | null>(null);

/** 审批操作表单 */
const handleForm = reactive({
  reason: '',
  nextUserId: '',
  rejectType: 'LAST'
});

/** 驳回方式：LAST 退回上一节点 / START 退回发起人 / TARGET 退回指定节点 */
const rejectOptionList = [
  { label: '退回上一节点', value: 'LAST' },
  { label: '退回发起人', value: 'START' },
  { label: '退回指定节点', value: 'TARGET' }
];

const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FlowNamespace.TaskQuery>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  flowName: '',
  businessId: '',
  keywords: []
});
const keyword = ref('');

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
    getTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = defaultPageNum;
    formFilter.pageNum = pagination.page;
    formFilter.pageSize = pageSize;
    getTableData();
  }
});

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData() {
  startLoading();

  const { data } = await findFlowTodoList(formFilter);
  tableData.value = data?.list || [];
  pagination.itemCount = data?.total || 0;
  endLoading();
}

const columns: Ref<DataTable.Column<FlowNamespace.Task>[]> = ref([
  {
    type: 'selection',
    align: 'center'
  },
  {
    key: 'index',
    title: '序号',
    align: 'left',
    ellipsis: true,
    render(_, index) {
      return index + 1;
    }
  },
  {
    key: 'nodeName',
    title: '任务名称',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'flowName',
    title: '所属流程',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'businessId',
    title: '业务单号',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'createTime',
    title: '到达时间',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'actions',
    title: '操作',
    align: 'left',
    ellipsis: true,
    fixed: 'right',
    className: 'table-action-title',
    render: row => {
      return (
        <ElSpace>
          <ElButton text size={'small'} type="primary" onClick={() => handleEditTable(row, 'a')}>
            同意
          </ElButton>
          <ElButton text size={'small'} type="primary" onClick={() => handleEditTable(row, 'c')}>
            不同意
          </ElButton>
          <ElButton text size={'small'} type="primary" onClick={() => handleEditTable(row, 'e')}>
            转交
          </ElButton>
        </ElSpace>
      );
    }
  }
]) as Ref<DataTable.Column<FlowNamespace.Task>[]>;

function handleEditTable(row: FlowNamespace.Task, type: string) {
  currentTask.value = row;
  handleForm.reason = '';
  handleForm.nextUserId = '';
  handleForm.rejectType = 'LAST';
  processType.value = type;
  showModal.value = true;
}

async function saveTask() {
  if (!currentTask.value) return;
  const taskId = currentTask.value.id;
  showModal.value = false;
  startLoading();
  if (processType.value === 'a') {
    await approveFlowTask({ taskId, message: handleForm.reason });
    window.$message?.success('审批成功');
  }
  if (processType.value === 'c') {
    await rejectFlowTask({ taskId, message: handleForm.reason, rejectType: handleForm.rejectType });
    window.$message?.success('审批成功');
  }
  if (processType.value === 'e') {
    await transferFlowTask({ taskId, message: handleForm.reason, userIds: [handleForm.nextUserId] });
    window.$message?.success('转交成功');
  }
  endLoading();
  search();
}

function cancelModel() {
  showModal.value = false;
}

/** 重置搜索 */
function resetForm() {
  clearSearch();
}

/** 清空模糊搜索 */
function clearSearch() {
  keyword.value = '';
  for (const field of Object.keys(formFilter) as Array<keyof FlowNamespace.TaskQuery>) {
    if (field === 'pageNum') {
      formFilter.pageNum = defaultPageNum;
    } else if (field !== 'pageSize') {
      (formFilter as Record<string, unknown>)[field] = null;
    }
  }

  getTableData();
}

/** 模糊搜索 */
function keywordSearch() {
  if (keyword.value) {
    formFilter.keywords = keyword.value.split(' ');
  }
  getTableData();
}

function search() {
  getTableData();
}

// 初始化
search();
</script>

<template>
  <div class="main-space overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="keyword"
          permission-add="workflow:task:add"
          permission-remove="workflow:task:remove"
          permission-import="workflow:task:import"
          permission-export="workflow:task:export"
          operation-title="待办任务"
          :show-operation="true"
          :show-export="false"
          :show-import="false"
          :show-add="false"
          :show-remove="false"
          @keyword-search="keywordSearch"
          @keyword-clear="clearSearch"
          @search="search"
          @reset="resetForm"
        >
          <template #filter>
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px">
              <div class="col-span-3 flex flex-row items-center justify-end">流程名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.flowName" />
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">业务单号</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.businessId" />
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
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          :bottom-bordered="true"
          striped
        />
      </div>
    </ElCard>
    <ElDialog v-model="showModal" :mask-closable="false" class="w-70%">
      <ElCard>
        <template #header>
          <div>审批</div>
        </template>
        <ElSpace direction="vertical">
          <div>
            审批意见
            <ElInput v-model="handleForm.reason"></ElInput>
          </div>
          <div v-if="processType === 'c'">
            <div>
              驳回选择
              <ElSelect v-model="handleForm.rejectType">
                <ElOption v-for="opt in rejectOptionList" :key="opt.value" :label="opt.label" :value="opt.value" />
              </ElSelect>
            </div>
          </div>
          <div v-if="processType === 'e'">
            <div>转交人员</div>
            <SelectPerson v-model:value="handleForm.nextUserId"></SelectPerson>
          </div>
        </ElSpace>
        <template #footer>
          <ElSpace justify="end">
            <ElButton type="primary" class="m-l-2" @click="saveTask">确定</ElButton>
            <ElButton @click="cancelModel">取消</ElButton>
          </ElSpace>
        </template>
      </ElCard>
    </ElDialog>
  </div>
</template>

<style scoped></style>
