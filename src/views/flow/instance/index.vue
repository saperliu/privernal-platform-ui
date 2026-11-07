<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { ElButton, ElDatePicker, ElSpace, ElTag, ElInput as __forwarded_ElInput } from 'element-plus';
import { findMyFlowInstanceList, revokeFlowInstance, terminateFlowInstance } from '@/service';
import { useLoading } from '@/hooks';
import { formatDateTime } from '@/utils';
import { isBtnVisible, useFlowBtnPerms } from '../components/btn-perm';
import FlowFormModal from '../components/flow-form-modal.vue';
import FlowListLayout from '../components/flow-list-layout.vue';
import FlowRecordModal from '../components/flow-record-modal.vue';
import { type FlowTone, flowStatusLabels, flowStatusTones } from '../components/flow-labels';

/** warm-flow 流程状态 */
const runningStatus = ['0', '1', '9', '11'];

/** FlowTone（naive 语义色）→ ElTag 允许的 type：default 走中性灰、error 走红 */
function tagType(tone: FlowTone | undefined): 'primary' | 'success' | 'info' | 'warning' | 'danger' {
  if (tone === 'error') return 'danger';
  if (tone === undefined || tone === 'default') return 'info';
  return tone;
}

const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<FlowNamespace.Instance[]>([]);

const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FlowNamespace.InstanceQuery>({
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

/** 发起时间范围（时间戳数组），查询时转为 yyyy-MM-dd 字符串 */
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
  const { data } = await findMyFlowInstanceList(formFilter);
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

/** 撤销：发起人撤回运行中的流程，业务数据回到草稿态 */
function handleRevoke(row: FlowNamespace.Instance) {
  window.$dialog?.warning({
    title: '撤销确认',
    content: `确定撤销「${row.flowName}」吗？撤销后业务数据回到草稿状态，可修改后重新提交。`,
    positiveText: '撤销',
    negativeText: '取消',
    onPositiveClick: async () => {
      await revokeFlowInstance(row.id, '发起人撤销');
      window.$message?.success('已撤销');
      getTableData();
    }
  });
}

/** 终止：提前结束流程 */
function handleTerminate(row: FlowNamespace.Instance) {
  window.$dialog?.error({
    title: '终止确认',
    content: `确定终止「${row.flowName}」吗？终止后流程提前结束，业务数据标记为已取消。`,
    positiveText: '终止',
    negativeText: '取消',
    onPositiveClick: async () => {
      await terminateFlowInstance(row.id, '终止流程');
      window.$message?.success('已终止');
      getTableData();
    }
  });
}

/** 流程记录：弹窗内按实例自行拉取，这里只传入行摘要 */
const showRecord = ref(false);
const recordRow = ref<FlowNamespace.Instance | null>(null);

function handleShowRecord(row: FlowNamespace.Instance) {
  recordRow.value = row;
  showRecord.value = true;
}

/** 申请单：发起人查看自己提报的业务数据 */
const showForm = ref(false);
const formRow = ref<FlowNamespace.Instance | null>(null);

function handleShowForm(row: FlowNamespace.Instance) {
  formRow.value = row;
  showForm.value = true;
}

/** 申请单按钮显隐：发起人不是节点办理人，按全局配置判定，未配置时默认显示 */
function canViewForm(row: FlowNamespace.Instance) {
  return isBtnVisible(btnPermByFlow.value.get(row.flowCode || ''), undefined, 'viewForm');
}

const columns: Ref<DataTable.Column<FlowNamespace.Instance>[]> = ref([
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
        <span class="min-w-0 flex items-center text-12px color-gray">
          <span class="truncate">当前节点：{row.nodeName || '-'}</span>
          <ElTag class="ml-6px flex-shrink-0" size="small" type={tagType(flowStatusTones[row.flowStatus])}>
            {flowStatusLabels[row.flowStatus] ?? row.flowStatus}
          </ElTag>
        </span>
      </div>
    )
  },
  {
    key: 'createTime',
    title: '发起时间',
    width: 170,
    align: 'center',
    render: row => <span class="whitespace-nowrap text-13px">{formatDateTime(row.createTime)}</span>
  },
  {
    key: 'action',
    title: '操作',
    width: 280,
    align: 'center',
    render: row => {
      const running = runningStatus.includes(row.flowStatus);
      return (
        <ElSpace alignment="center" size="small">
          {canViewForm(row) ? (
            <ElButton size="small" onClick={() => handleShowForm(row)}>
              申请单
            </ElButton>
          ) : null}
          <ElButton size="small" onClick={() => handleShowRecord(row)}>
            流程记录
          </ElButton>
          {running ? (
            <ElButton size="small" type="warning" onClick={() => handleRevoke(row)}>
              撤销
            </ElButton>
          ) : null}
          {running ? (
            <ElButton size="small" type="danger" onClick={() => handleTerminate(row)}>
              终止
            </ElButton>
          ) : null}
        </ElSpace>
      );
    }
  }
]);

getTableData();

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInput = __forwarded_ElInput;
</script>

<template>
  <div class="h-full overflow-hidden">
    <FlowListLayout active="instance" :total="pagination.itemCount" @search="onSearch" @clear="onClear">
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
          <span class="whitespace-nowrap text-13px color-gray">发起时间</span>
          <ElDatePicker v-model="timeRange" type="daterange" clearable class="w-280px" />
        </div>
      </template>

      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: FlowNamespace.Instance) => row.id"
        flex-height
        class="min-h-0 flex-1"
        remote
      />
    </FlowListLayout>

    <FlowRecordModal
      v-model:show="showRecord"
      :instance-id="recordRow?.id ?? null"
      :flow-name="recordRow?.flowName"
      :business-title="recordRow?.businessTitle"
      :flow-status="recordRow?.flowStatus"
    />

    <FlowFormModal
      v-model:show="showForm"
      :business-id="formRow?.businessId ?? null"
      :flow-name="formRow?.flowName"
      :business-title="formRow?.businessTitle"
    />
  </div>
</template>
