<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { ElButton, ElPopconfirm, ElSpace, ElTag } from 'element-plus';
import { findMyFlowInstanceList, revokeFlowInstance } from '@/service';
import { useLoading } from '@/hooks';
import WorkflowDetailModal from '@/components/business/workflow-detail-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<FlowNamespace.Instance[]>([]);
const checkedRowKeys = ref<string[]>([]);
const moduleId = ref('');
const showFlow = ref(false);
const defaultPageNum = 1;
const defaultPageSize = 20;
type FormFilterModel = FlowNamespace.InstanceQuery & { keyword: string };
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

function setTableData(data: FlowNamespace.Page<FlowNamespace.Instance>) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: FlowNamespace.InstanceQuery) {
  startLoading();
  const { data } = await findMyFlowInstanceList(dataQuery);
  let result: FlowNamespace.Page<FlowNamespace.Instance> = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const flowStatusMap: Record<string, { label: string; type: 'primary' | 'info' | 'success' | 'warning' | 'danger' }> = {
  '0': { label: '待提交', type: 'info' },
  '1': { label: '审批中', type: 'info' },
  '2': { label: '通过', type: 'success' },
  '4': { label: '终止', type: 'warning' },
  '5': { label: '作废', type: 'danger' },
  '6': { label: '撤销', type: 'warning' },
  '8': { label: '已完成', type: 'success' },
  '9': { label: '已退回', type: 'danger' },
  '11': { label: '拿回', type: 'info' }
};

const columns: Ref<DataTable.Column<FlowNamespace.Instance>[]> = ref([
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
    key: 'flowStatus',
    title: '状态',
    align: 'left',
    ellipsis: true,
    render: row => {
      const status = flowStatusMap[row.flowStatus] || { label: '未知', type: 'info' as const };
      return <ElTag type={status.type}>{status.label}</ElTag>;
    }
  },
  {
    key: 'createTime',
    title: '创建时间',
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
      if (row.flowStatus === '0' || row.flowStatus === '1') {
        return (
          <ElSpace>
            <ElPopconfirm
              title="确认撤销该流程？"
              confirm-button-text="确认"
              cancel-button-text="取消"
              onConfirm={(events: Event) => handleRevoke(row, events)}
            >
              {{
                reference: () => (
                  <ElButton text size={'small'} type="primary">
                    撤销
                  </ElButton>
                )
              }}
            </ElPopconfirm>
            <ElButton text size={'small'} type="primary" onClick={(events: Event) => handleEditTable(row, events)}>
              详情
            </ElButton>
          </ElSpace>
        );
      }
      return (
        <ElSpace>
          <ElButton text size={'small'} type="primary" onClick={(events: Event) => handleEditTable(row, events)}>
            详情
          </ElButton>
        </ElSpace>
      );
    }
  }
]) as Ref<DataTable.Column<FlowNamespace.Instance>[]>;

function handleEditTable(row: FlowNamespace.Instance, events: Event) {
  events.stopPropagation();
  moduleId.value = row.businessId;
  showFlow.value = true;
}

function handleRevoke(row: FlowNamespace.Instance, events: Event) {
  events.stopPropagation();
  revokeFlowInstance(row.id, '发起人撤销').then(res => {
    if (res.error === null) {
      window.$message?.success('撤销成功');
      search();
    } else {
      window.$message?.error('撤销失败！');
    }
  });
}

function resetForm() {
  clearSearch();
}

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
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">流程编码</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.flowCode" />
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
