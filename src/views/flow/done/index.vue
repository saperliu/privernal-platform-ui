<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { ElButton, ElDatePicker, ElSpace, ElInput as __forwarded_ElInput } from 'element-plus';
import { findFlowDoneList, retrieveFlowTask } from '@/service';
import { useLoading } from '@/hooks';
import { formatDateTime } from '@/utils';
import { isBtnVisible, useFlowBtnPerms } from '../components/btn-perm';
import FlowFormModal from '../components/flow-form-modal.vue';
import FlowListLayout from '../components/flow-list-layout.vue';
import FlowRecordModal from '../components/flow-record-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<FlowNamespace.HisTask[]>([]);

const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FlowNamespace.TaskQuery>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  flowName: '',
  businessId: '',
  keywords: [],
  timeStart: '',
  timeEnd: ''
});

/** 按钮配置（flow_form_btn_perm）：申请单按钮显隐由客户配置控制 */
const { byFlow: btnPermByFlow, reload: loadBtnConfigs } = useFlowBtnPerms();

/** 办理时间范围（时间戳数组），查询时转为 yyyy-MM-dd 字符串 */
const timeRange = ref<[number, number] | null>(null);

function applyTimeRange() {
  if (timeRange.value?.[0] && timeRange.value?.[1]) {
    const fmt = (ts: number) => {
      const d = new Date(ts);
      const p = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    };
    formFilter.timeStart = fmt(timeRange.value[0]);
    formFilter.timeEnd = fmt(timeRange.value[1]);
  } else {
    formFilter.timeStart = '';
    formFilter.timeEnd = '';
  }
}

const pagination = reactive<DataTable.PaginationProps>({
  page: defaultPageNum,
  pageSize: defaultPageSize,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30, 50, 100],
  itemCount: 0,
  prefix: info => `总数: ${info.itemCount}条`,
  onChange: (page: number) => {
    pagination.page = page;
    formFilter.pageNum = page;
    formFilter.pageSize = pagination.pageSize || defaultPageSize;
    getTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = defaultPageNum;
    formFilter.pageNum = defaultPageNum;
    formFilter.pageSize = pageSize;
    getTableData();
  }
});

async function getTableData() {
  startLoading();
  const { data } = await findFlowDoneList(formFilter);
  tableData.value = data?.list || [];
  pagination.itemCount = data?.total || 0;
  endLoading();
  await loadBtnConfigs(tableData.value);
}

/** 查询：条件默认为空直接分页展示，填写后按条件查询 */
function onSearch() {
  applyTimeRange();
  pagination.page = defaultPageNum;
  formFilter.pageNum = defaultPageNum;
  getTableData();
}

/** 清空：重置全部条件并查询 */
function onClear() {
  formFilter.flowName = '';
  formFilter.businessId = '';
  timeRange.value = null;
  formFilter.timeStart = '';
  formFilter.timeEnd = '';
  onSearch();
}

/** 拿回：已办任务取回到待办（下一节点未办理时可用） */
function handleRetrieve(row: FlowNamespace.HisTask) {
  window.$dialog?.info({
    title: '拿回确认',
    content: `确定拿回「${row.flowName} - ${row.nodeName}」任务吗？拿回后任务回到你的待办。`,
    positiveText: '拿回',
    negativeText: '取消',
    onPositiveClick: async () => {
      await retrieveFlowTask({ taskId: row.taskId, message: '拿回任务' });
      window.$message?.success('拿回成功');
      getTableData();
    }
  });
}

/** 流程记录：弹窗内按实例自行拉取，这里只传入行摘要 */
const showRecord = ref(false);
const recordRow = ref<FlowNamespace.HisTask | null>(null);

function handleShowRecord(row: FlowNamespace.HisTask) {
  recordRow.value = row;
  showRecord.value = true;
}

/** 申请单：只读查看该业务数据（办理人已无待办，仍应能看到自己办过的内容） */
const showForm = ref(false);
const formRow = ref<FlowNamespace.HisTask | null>(null);

function handleShowForm(row: FlowNamespace.HisTask) {
  formRow.value = row;
  showForm.value = true;
}

/** 申请单按钮显隐：按办理过的节点取配置，未配置时默认显示 */
function canViewForm(row: FlowNamespace.HisTask) {
  return isBtnVisible(btnPermByFlow.value.get(row.flowCode || ''), row.nodeCode, 'viewForm');
}

/** 流转结果后缀：通过/退回，其他状态不显示 */
function skipTypeSuffix(skipType?: string) {
  if (skipType === 'PASS') return '（通过）';
  if (skipType === 'REJECT') return '（退回）';
  return '';
}

const columns: Ref<DataTable.Column<FlowNamespace.HisTask>[]> = ref([
  {
    key: 'flowName',
    title: '标题',
    minWidth: 180,
    align: 'left',
    ellipsis: { tooltip: true },
    // 标题兜底链：业务数据标题（表单数据标题，未配置时由后端默认取第一个输入字段）→ 任务流程名 → 实例流程名
    render: row => <span class="font-500">{row.businessTitle || row.flowName || row.instanceFlowName}</span>
  },
  {
    key: 'content',
    title: '内容',
    align: 'left',
    render: row => (
      <div class="min-w-0 w-full flex flex-col">
        <span class="truncate text-13px">{row.businessTitle || row.nodeName}</span>
        <span class="truncate text-12px color-gray">
          {row.nodeName}
          {row.targetNodeName ? ` → ${row.targetNodeName}` : ''}
          {skipTypeSuffix(row.skipType)}
          {row.message ? ` · ${row.message}` : ''}
        </span>
      </div>
    )
  },
  {
    key: 'updateTime',
    title: '办理时间',
    width: 170,
    align: 'center',
    render: row => <span class="whitespace-nowrap text-13px">{formatDateTime(row.updateTime || row.createTime)}</span>
  },
  {
    key: 'action',
    title: '操作',
    width: 210,
    align: 'center',
    render: row => (
      <ElSpace alignment="center" size="small">
        {canViewForm(row) ? (
          <ElButton size="small" onClick={() => handleShowForm(row)}>
            申请单
          </ElButton>
        ) : null}
        <ElButton size="small" onClick={() => handleShowRecord(row)}>
          流程记录
        </ElButton>
        <ElButton size="small" type="warning" onClick={() => handleRetrieve(row)}>
          拿回
        </ElButton>
      </ElSpace>
    )
  }
]);

getTableData();

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInput = __forwarded_ElInput;
</script>

<template>
  <div class="h-full overflow-hidden">
    <FlowListLayout active="done" :total="pagination.itemCount" @search="onSearch" @clear="onClear">
      <template #filter>
        <div class="flex items-center gap-8px">
          <span class="whitespace-nowrap text-13px color-gray">流程名称</span>
          <ElInput
            v-model="formFilter.flowName"
            placeholder="请输入"
            clearable
            class="w-200px"
            @keyup.enter="onSearch"
          />
        </div>
        <div class="flex items-center gap-8px">
          <span class="whitespace-nowrap text-13px color-gray">业务单号</span>
          <ElInput
            v-model="formFilter.businessId"
            placeholder="请输入"
            clearable
            class="w-200px"
            @keyup.enter="onSearch"
          />
        </div>
        <div class="flex items-center gap-8px">
          <span class="whitespace-nowrap text-13px color-gray">办理时间</span>
          <ElDatePicker v-model="timeRange" type="daterange" clearable class="w-280px" />
        </div>
      </template>

      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: FlowNamespace.HisTask) => row.id"
        flex-height
        class="min-h-0 flex-1"
        remote
      />
    </FlowListLayout>

    <FlowRecordModal
      v-model:show="showRecord"
      :instance-id="recordRow?.instanceId ?? null"
      :flow-name="recordRow?.flowName"
      :business-title="recordRow?.businessTitle"
    />

    <FlowFormModal
      v-model:show="showForm"
      :business-id="formRow?.businessId ?? null"
      :flow-name="formRow?.flowName"
      :business-title="formRow?.businessTitle"
    />
  </div>
</template>
