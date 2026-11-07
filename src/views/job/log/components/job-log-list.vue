<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElDialog, ElTag, ElButton as __forwarded_ElButton } from 'element-plus';
import {
  type ScheduleLogQuery,
  type ScheduleLogRow,
  findScheduleLogList,
  getScheduleLog,
  retryScheduleLog
} from '@/service';
import { useAuth, useLoading } from '@/hooks';
import { formatDateTime } from '@/utils/common';
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

defineOptions({ name: 'JobLogList' });

const { loading, startLoading, endLoading } = useLoading(false);
const { hasAuth } = useAuth();
const tableData = ref<ScheduleLogRow[]>([]);

const statusOptions: CommonType.Option[] = [
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' },
  { label: '超时', value: 'TIMEOUT' },
  { label: '执行中', value: 'RUNNING' },
  { label: '错过窗口跳过', value: 'SKIPPED_MISFIRE' },
  { label: '并发跳过', value: 'SKIPPED_CONCURRENT' },
  { label: '池满跳过', value: 'SKIPPED_POOL' },
  { label: '已取消', value: 'CANCELLED' }
];

const statusTypeMap: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  SUCCESS: 'success',
  FAILED: 'danger',
  TIMEOUT: 'danger',
  RUNNING: 'info',
  SKIPPED_MISFIRE: 'warning',
  SKIPPED_CONCURRENT: 'warning',
  SKIPPED_POOL: 'warning',
  CANCELLED: 'info'
};

const formFilter = reactive({
  pageNum: 1,
  pageSize: 20,
  taskId: '',
  status: undefined as string | undefined,
  fireTimeBegin: undefined as string | undefined,
  fireTimeEnd: undefined as string | undefined
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0,
  prefix(info: DataTable.PaginationInfo) {
    return `共 ${info.itemCount} 条`;
  },
  onChange: (page: number) => {
    pagination.page = page;
    formFilter.pageNum = page;
    getTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    formFilter.pageSize = pageSize;
    formFilter.pageNum = 1;
    pagination.page = 1;
    getTableData();
  }
});

async function getTableData() {
  startLoading();
  try {
    const payload: ScheduleLogQuery = {
      pageNum: formFilter.pageNum,
      pageSize: formFilter.pageSize,
      taskId: formFilter.taskId || undefined,
      status: formFilter.status,
      fireTimeBegin: formFilter.fireTimeBegin || undefined,
      fireTimeEnd: formFilter.fireTimeEnd || undefined
    };
    const { data } = await findScheduleLogList(payload);
    if (data) {
      tableData.value = data.list ?? [];
      pagination.itemCount = data.total ?? 0;
    }
  } finally {
    endLoading();
  }
}

/** 详情弹窗数据：结构化展示（基础信息/重试链/动作快照），替代原先纯文本堆叠的 dialog */
interface LogDetailView {
  id: string;

  taskId: string;

  fireTime: string;

  attempt: number;

  status: string;

  costMs: number | null;

  executor: string;

  resultDigest?: string;

  errorMsg?: string;

  /** 重试链/跳过记录（同任务同计划触发的全部 attempt 行） */
  chain: Array<{ attempt: number; status: string; costMs: number | null; digest: string }>;

  actionSnapshot: string;
}

const detailVisible = ref(false);
const detailView = ref<LogDetailView | null>(null);

function handleDetail(row: ScheduleLogRow) {
  getScheduleLog(row.id).then(async ({ data: log }) => {
    if (!log) return;
    let snapshot = '-';
    try {
      snapshot = log.actionSnapshot ? JSON.stringify(JSON.parse(log.actionSnapshot), null, 2) : '-';
    } catch {
      snapshot = log.actionSnapshot ?? '-';
    }
    // 完整重试链（§12.1）：同任务同计划触发的全部 attempt 行（含 attempt=0 跳过行），全量落库保证不残缺
    const chain: LogDetailView['chain'] = [];
    try {
      const window = (delta: number) => {
        const d = new Date(log.fireTime);
        d.setSeconds(d.getSeconds() + delta);
        const pad = (n: number, len = 2) => String(n).padStart(len, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };
      const { data: chainPage } = await findScheduleLogList({
        pageNum: 1,
        pageSize: 50,
        taskId: log.taskId,
        fireTimeBegin: window(-1),
        fireTimeEnd: window(1)
      } as never);
      const rows = ((chainPage?.list ?? []) as unknown as ScheduleLogRow[]).sort((a, b) => a.attempt - b.attempt);
      if (rows.length > 1 || rows[0]?.attempt === 0) {
        rows.forEach(r => {
          chain.push({
            attempt: r.attempt,
            status: r.status,
            costMs: r.costMs ?? null,
            digest: (r.errorMsg ?? r.resultDigest ?? '-').slice(0, 120)
          });
        });
      }
    } catch {
      // 链查询失败不影响详情展示
    }
    detailView.value = {
      id: String(log.id ?? row.id),
      taskId: log.taskId ?? '-',
      fireTime: formatDateTime(log.fireTime),
      attempt: log.attempt ?? 0,
      status: log.status,
      costMs: log.costMs ?? null,
      executor: log.executor ?? '-',
      resultDigest: log.resultDigest,
      errorMsg: log.errorMsg,
      chain,
      actionSnapshot: snapshot
    };
    detailVisible.value = true;
  });
}

async function handleRetry(row: ScheduleLogRow) {
  const { data } = await retryScheduleLog(row.id);
  if (data) {
    window.$message?.info(data.message ?? '已提交重跑');
    getTableData();
  }
}

const columns = computed<DataTable.Column<ScheduleLogRow>[]>(() => [
  { title: 'ID', key: 'id', width: 80 },
  {
    title: '计划触发时间',
    key: 'fireTime',
    width: 170,
    render: row => (row.fireTime ? formatDateTime(row.fireTime) : '-')
  },
  {
    title: '第几次',
    key: 'attempt',
    width: 80,
    render: row => (
      <ElTag size="small" type={row.attempt === 0 ? 'warning' : 'info'}>
        {row.attempt === 0 ? '跳过' : row.attempt}
      </ElTag>
    )
  },
  {
    title: '状态',
    key: 'status',
    width: 130,
    render: row => (
      <ElTag size="small" type={statusTypeMap[row.status] ?? 'info'}>
        {row.status}
      </ElTag>
    )
  },
  { title: '来源', key: 'source', width: 90 },
  {
    title: '耗时(ms)',
    key: 'costMs',
    width: 90,
    render: row => row.costMs ?? '-'
  },
  {
    title: '结果/错误',
    key: 'digest',
    minWidth: 220,
    ellipsis: true,
    render: row => row.errorMsg ?? row.resultDigest ?? '-'
  },
  { title: '执行器', key: 'executor', width: 190, ellipsis: true },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
    render: row => (
      <ElButton size="small" text type="primary" onClick={() => handleDetail(row)}>
        详情
      </ElButton>
    )
  },
  ...(hasAuth('schedule:log:retry')
    ? [
        {
          title: '重跑',
          key: 'retry',
          width: 80,
          render: (row: ScheduleLogRow) => (
            <ElButton
              size="small"
              type="primary"
              plain
              disabled={row.status === 'SUCCESS'}
              onClick={() => handleRetry(row)}
            >
              重跑
            </ElButton>
          )
        }
      ]
    : [])
]);

function search() {
  formFilter.pageNum = 1;
  pagination.page = 1;
  getTableData();
}

/** 重置全部筛选条件并查询 */
function resetForm() {
  formFilter.taskId = '';
  formFilter.status = undefined;
  formFilter.fireTimeBegin = undefined;
  formFilter.fireTimeEnd = undefined;
  search();
}

/** ListAdditional 刷新入口 */
function init() {
  getTableData();
}

onMounted(() => {
  getTableData();
});
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.taskId"
          permission-add=""
          permission-remove=""
          permission-export=""
          permission-import=""
          operation-title="执行记录"
          :show-operation="false"
          :show-add="false"
          :show-remove="false"
          :show-export="false"
          :show-import="false"
          @keyword-clear="search"
          @search="search"
          @reset="resetForm"
        >
          <template #filter>
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px">
              <div class="col-span-3 flex flex-row items-center justify-end">任务ID</div>
              <div class="col-span-7">
                <ElInput
                  v-model="formFilter.taskId"
                  clearable
                  placeholder="按任务 id 过滤"
                  size="small"
                  @keyup.enter="search"
                />
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">状态</div>
              <div class="col-span-7">
                <ElSelect v-model="formFilter.status" clearable placeholder="请选择" size="small">
                  <ElOption v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">触发时间</div>
              <div class="col-span-17">
                <ElDatePicker
                  v-model="formFilter.fireTimeBegin"
                  type="datetime"
                  clearable
                  placeholder="开始时间"
                  size="small"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
                <span class="mx-8px">至</span>
                <ElDatePicker
                  v-model="formFilter.fireTimeEnd"
                  type="datetime"
                  clearable
                  placeholder="结束时间"
                  size="small"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
              </div>
            </div>
          </template>
          <template #toolbar-extra>
            <ListAdditional v-model:columns="columns" @reload="init"></ListAdditional>
          </template>
        </ListFilter>

        <DataTable
          remote
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: ScheduleLogRow) => String(row.id)"
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          :bottom-bordered="true"
          striped
        />
      </div>
    </ElCard>

    <!-- 执行详情：结构化展示（基础信息/重试链/动作快照），与任务管理的触发预览同一形态 -->
    <ElDialog v-model="detailVisible" title="执行详情" width="640px">
      <div v-if="detailView" class="flex flex-col gap-12px">
        <div class="grid grid-cols-2 gap-x-16px gap-y-6px text-13px">
          <div>
            <span class="text-gray-400">日志 ID：</span>
            {{ detailView.id }}
          </div>
          <div>
            <span class="text-gray-400">状态：</span>
            <ElTag size="small" :type="statusTypeMap[detailView.status] ?? 'info'">{{ detailView.status }}</ElTag>
          </div>
          <div class="col-span-2 truncate">
            <span class="text-gray-400">任务 ID：</span>
            {{ detailView.taskId }}
          </div>
          <div>
            <span class="text-gray-400">计划触发：</span>
            <span class="tabular-nums">{{ detailView.fireTime }}</span>
          </div>
          <div>
            <span class="text-gray-400">尝试次数：</span>
            {{ detailView.attempt === 0 ? '跳过（attempt=0）' : `第 ${detailView.attempt} 次尝试` }}
          </div>
          <div>
            <span class="text-gray-400">耗时：</span>
            <span class="tabular-nums">{{ detailView.costMs ?? '-' }} ms</span>
          </div>
          <div class="truncate">
            <span class="text-gray-400">执行器：</span>
            {{ detailView.executor }}
          </div>
        </div>

        <ElAlert v-if="detailView.errorMsg" :title="detailView.errorMsg" type="error" :closable="false" show-icon />
        <div v-else-if="detailView.resultDigest" class="text-13px">
          <span class="text-gray-400">结果：</span>
          {{ detailView.resultDigest }}
        </div>

        <div v-if="detailView.chain.length">
          <div class="mb-6px text-12px font-600">重试链 / 跳过记录</div>
          <table class="w-full border-collapse text-12px">
            <thead>
              <tr class="bg-[var(--el-fill-color-light)]">
                <th class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px text-left">
                  次数
                </th>
                <th class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px text-left">
                  状态
                </th>
                <th class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px text-left">
                  耗时
                </th>
                <th class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px text-left">
                  结果/错误
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detailView.chain" :key="item.attempt">
                <td class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px tabular-nums">
                  {{ item.attempt === 0 ? '跳过' : `#${item.attempt}` }}
                </td>
                <td class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px">
                  {{ item.status }}
                </td>
                <td class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px tabular-nums">
                  {{ item.costMs != null ? `${item.costMs}ms` : '-' }}
                </td>
                <td class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px">
                  {{ item.digest }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="detailView.actionSnapshot !== '-'">
          <div class="mb-6px text-12px font-600">动作快照</div>
          <pre
            class="m-0 max-h-200px overflow-auto rounded-6px bg-[var(--el-fill-color-light)] p-10px text-12px leading-18px"
            >{{ detailView.actionSnapshot }}</pre
          >
        </div>
      </div>
      <template #footer>
        <ElButton @click="detailVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>
