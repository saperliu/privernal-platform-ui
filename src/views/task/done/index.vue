<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { ElButton, ElSpace, ElTag } from 'element-plus';
import { findFlowDoneList } from '@/service';
import { useLoading } from '@/hooks';
import WorkflowDetailModal from '@/components/business/workflow-detail-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<FlowNamespace.HisTask[]>([]);
const checkedRowKeys = ref<string[]>([]);
const moduleId = ref('');
const showFlow = ref(false);
type FormFilterModel = FlowNamespace.TaskQuery & { keyword: string };

const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  flowName: '',
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
function setTableData(data: FlowNamespace.Page<FlowNamespace.HisTask>) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: FlowNamespace.TaskQuery) {
  startLoading();
  const { data } = await findFlowDoneList(dataQuery);
  let result: FlowNamespace.Page<FlowNamespace.HisTask> = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);

  endLoading();
}

const cooperateTypeMap: Record<number, string> = {
  1: '审批',
  2: '转办',
  3: '委派',
  4: '会签',
  5: '票签',
  6: '加签',
  7: '减签'
};

const columns: Ref<DataTable.Column<FlowNamespace.HisTask>[]> = ref([
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
    key: 'flowName',
    title: '流程名称',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'nodeName',
    title: '当前节点',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'targetNodeName',
    title: '目标节点',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'approver',
    title: '审批人',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'cooperateType',
    title: '协作类型',
    align: 'left',
    ellipsis: true,
    render: row => {
      const label = cooperateTypeMap[row.cooperateType ?? 0] || '未知';
      return <ElTag size="small">{label}</ElTag>;
    }
  },
  {
    key: 'message',
    title: '审批意见',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'createTime',
    title: '创建时间',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'updateTime',
    title: '审批时间',
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
        <ElSpace class="justify-start">
          <ElButton text size={'small'} type="primary" onClick={(events: Event) => handleEditTable(row, events)}>
            详情
          </ElButton>
        </ElSpace>
      );
    }
  }
]) as Ref<DataTable.Column<FlowNamespace.HisTask>[]>;

function handleEditTable(row: FlowNamespace.HisTask, events: Event) {
  events.stopPropagation();
  moduleId.value = row.businessId;
  showFlow.value = true;
}

/** 重置搜索 */
function resetForm() {
  clearSearch();
}

/** 清空模糊搜索 */
function clearSearch() {
  const ff = formFilter as Record<string, any>;
  for (const field in formFilter) {
    if (field === 'pageNum') {
      ff[field] = defaultPageNum;
    } else if (field !== 'pageSize') {
      ff[field] = null;
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

function search() {
  getTableData(formFilter);
}

search();
</script>

<template>
  <div class="main-space overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="workflow:task:add"
          permission-remove="workflow:task:remove"
          permission-import="workflow:task:import"
          permission-export="workflow:task:export"
          operation-title="已完成"
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
    <WorkflowDetailModal v-model:visible="showFlow" :process-business-key="moduleId" />
  </div>
</template>

<style lang="scss" scoped>
.main-space {
}
</style>
