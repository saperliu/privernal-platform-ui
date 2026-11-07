<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue';
import { ElTag } from 'element-plus';
import { findOpenApiCallLogList, findOpenApiCallLogStat } from '@/service';
import { useLoading } from '@/hooks';

defineOptions({ name: 'SystemOpenapiCallLogList' });

const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<SystemOpenapiNamespace.OpenApiCallLogForm[]>([]);
const statData = ref<SystemOpenapiNamespace.OpenApiCallStatForm[]>([]);
const groupByDay = ref(true);

const defaultPageNum = 1;
const defaultPageSize = 20;
type FormFilterModel = SystemOpenapiNamespace.OpenApiCallLogQuery & { keyword: string };

const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: [],
  accessKey: '',
  tableCode: '',
  result: undefined,
  beginTime: '',
  endTime: ''
});

const pagination = reactive({
  page: defaultPageNum,
  pageSize: defaultPageSize,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0,
  prefix(info: DataTable.PaginationInfo) {
    return `总数: ${info.itemCount}条`;
  },
  onChange: (page: number) => {
    pagination.page = page;
    formFilter.pageNum = page;
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

const resultOptions = [
  { label: '成功 SUCCESS', value: 'SUCCESS' },
  { label: '被拒 DENIED', value: 'DENIED' },
  { label: '失败 FAILED', value: 'FAILED' },
  { label: '限流 RATE_LIMITED', value: 'RATE_LIMITED' }
];

type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger';

function resultTagType(result?: string): TagType {
  if (result === 'SUCCESS') {
    return 'success';
  }
  if (result === 'RATE_LIMITED') {
    return 'warning';
  }
  if (result === 'DENIED') {
    return 'info';
  }
  return 'danger';
}

const statColumns: DataTable.Column<SystemOpenapiNamespace.OpenApiCallStatForm>[] = [
  { key: 'groupKey', title: '分组', minWidth: 180 },
  { key: 'totalCount', title: '总调用', width: 110 },
  { key: 'successCount', title: '成功', width: 100 },
  { key: 'failCount', title: '失败/被拒', width: 120 },
  {
    key: 'avgCostMs',
    title: '平均耗时(ms)',
    width: 140,
    render: row => (row.avgCostMs === null || row.avgCostMs === undefined ? '-' : Math.round(row.avgCostMs))
  }
];

const columns = ref<DataTable.Column<SystemOpenapiNamespace.OpenApiCallLogForm>[]>([
  { key: 'createdTime', title: '调用时间', width: 170, render: row => row.createdTime || '-' },
  {
    key: 'accessKey',
    title: 'AccessKey',
    minWidth: 170,
    render: row => <span class="font-mono">{row.accessKey}</span>
  },
  { key: 'action', title: '动作', width: 110 },
  { key: 'tableCode', title: '表', minWidth: 150, render: row => row.tableCode || '-' },
  { key: 'httpMethod', title: '方法', width: 80 },
  { key: 'endpoint', title: '接口', minWidth: 220, ellipsis: true },
  {
    key: 'result',
    title: '结果',
    width: 120,
    render: row => (
      <ElTag size="small" type={resultTagType(row.result)}>
        {row.result}
      </ElTag>
    )
  },
  { key: 'statusCode', title: 'HTTP', width: 80 },
  { key: 'errorCode', title: '错误码', width: 140, render: row => row.errorCode || '-' },
  { key: 'costMs', title: '耗时(ms)', width: 100, render: row => row.costMs ?? '-' },
  { key: 'clientIp', title: '来源IP', width: 130, render: row => row.clientIp || '-' },
  {
    key: 'errorMsg',
    title: '失败原因',
    minWidth: 200,
    ellipsis: true,
    render: row => row.errorMsg || '-'
  }
]);

function compactQuery() {
  const query: SystemOpenapiNamespace.OpenApiCallLogQuery = { ...formFilter };
  if (!query.beginTime) {
    delete query.beginTime;
  }
  if (!query.endTime) {
    delete query.endTime;
  }
  return query;
}

async function getTableData() {
  startLoading();
  const { data, error } = await findOpenApiCallLogList(compactQuery());
  if (error === null && data) {
    tableData.value = data.list || [];
    pagination.itemCount = data.total || 0;
  }
  endLoading();
}

async function getStatData() {
  const { data, error } = await findOpenApiCallLogStat(compactQuery(), groupByDay.value);
  if (error === null) {
    statData.value = data || [];
  }
}

function search() {
  formFilter.pageNum = defaultPageNum;
  pagination.page = defaultPageNum;
  getTableData();
  getStatData();
}

function resetForm() {
  formFilter.accessKey = '';
  formFilter.tableCode = '';
  formFilter.result = undefined;
  formFilter.beginTime = '';
  formFilter.endTime = '';
  search();
}

onMounted(() => {
  search();
});

function toggleGroup() {
  groupByDay.value = !groupByDay.value;
  getStatData();
  window.$message?.info(groupByDay.value ? '已按天统计' : '已按凭证统计');
}
</script>

<template>
  <div class="h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add=""
          permission-remove=""
          permission-export=""
          permission-import=""
          :show-add="false"
          :show-remove="false"
          operation-title="调用统计"
          :show-export="false"
          :show-import="false"
          @keyword-search="search"
          @keyword-clear="search"
          @search="search"
          @reset="resetForm"
        >
          <template #button>
            <ElButton size="small" text @click="toggleGroup">
              {{ groupByDay ? '按天统计' : '按凭证统计' }}
            </ElButton>
          </template>

          <template #filter>
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px">
              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">AccessKey</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.accessKey" placeholder="请输入 AccessKey" size="small" />
              </div>

              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">表编码</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.tableCode" placeholder="请输入表编码" size="small" />
              </div>

              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">结果</div>
              <div class="col-span-7">
                <ElSelect v-model="formFilter.result" size="small" clearable placeholder="请选择结果">
                  <ElOption v-for="opt in resultOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
              </div>

              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">起始</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.beginTime" placeholder="2026-10-01 00:00:00" size="small" />
              </div>
            </div>
          </template>
        </ListFilter>

        <DataTable
          :columns="statColumns"
          :data="statData"
          size="small"
          :bordered="false"
          class="mb-12px max-h-220px"
          :max-height="220"
        />

        <DataTable
          remote
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: any) => row.id"
          :scroll-x="1700"
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          striped
        />
      </div>
    </ElCard>
  </div>
</template>
