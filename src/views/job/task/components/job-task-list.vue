<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ElDialog,
  ElPopconfirm,
  ElTag,
  ElButton as __forwarded_ElButton,
  ElSpace as __forwarded_ElSpace
} from 'element-plus';
import {
  type ScheduleTaskRow,
  batchScheduleTaskStatus,
  changeScheduleTaskStatus,
  delScheduleTask,
  findScheduleTaskList,
  previewScheduleTask,
  runScheduleTask,
  terminateScheduleTask
} from '@/service';
import { useAuth, useBoolean, useLoading, useScheduleDicts } from '@/hooks';
import { formatDateTime } from '@/utils/common';
import JobTaskModal, { type ModalType } from './job-task-modal.vue';

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;

defineOptions({ name: 'JobTaskList' });

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal, setFalse: closeModal } = useBoolean();
const { hasAuth } = useAuth();
const router = useRouter();
const { dicts, load: loadDicts } = useScheduleDicts();

const tableData = ref<ScheduleTaskRow[]>([]);
const modalType = ref<ModalType>('add');
const editData = ref<ScheduleTaskRow | null>(null);

/** 字典加载失败时的兜底：过滤仍可用，只是回到编码显示 */
const FALLBACK: Record<'source' | 'action' | 'status', Array<{ label: string; value: string }>> = {
  source: [
    { label: '手动创建', value: 'MANUAL' },
    { label: '流程超时', value: 'WORKFLOW' },
    { label: '表单设计', value: 'DESIGNER' },
    { label: '表单数据', value: 'DESIGNER_DATA' },
    { label: '系统内置', value: 'SYSTEM' },
    { label: '开放接口', value: 'OPENAPI' }
  ],
  action: [
    { label: '站内信通知', value: 'MESSAGE_NOTIFY' },
    { label: '系统 Bean', value: 'BEAN' },
    { label: 'Groovy 脚本', value: 'GROOVY_SCRIPT' },
    { label: '表单数据操作', value: 'FORM_DATA_OP' },
    { label: 'HTTP 回调', value: 'HTTP_CALL' }
  ],
  status: [
    { label: '就绪', value: 'READY' },
    { label: '已暂停', value: 'PAUSED' },
    { label: '已触发', value: 'TRIGGERED' },
    { label: '执行中', value: 'RUNNING' },
    { label: '已完成', value: 'DONE' },
    { label: '已取消', value: 'CANCELLED' }
  ]
};

/** 过滤下拉：字典优先，空（加载失败）时回退内置 */
function optionsOf(kind: 'source' | 'action' | 'status') {
  const map = dicts.value[kind];
  if (map.size) return [...map.entries()].map(([value, label]) => ({ label, value }));
  return FALLBACK[kind];
}

const sourceOptions = computed(() => optionsOf('source'));
const statusOptions = computed(() => optionsOf('status'));
const actionOptions = computed(() => optionsOf('action'));

/** 触发类型没有字典（useScheduleDicts 只维护 source/action/status），口径与新建弹窗一致 */
const triggerOptions: CommonType.Option[] = [
  { label: 'CRON（周期）', value: 'CRON' },
  { label: '固定间隔（≥60 秒）', value: 'FIXED_DELAY' },
  { label: '一次性', value: 'ONCE' }
];

/** 列表翻译：字典有则中文，无则原编码 */
function dictLabel(kind: 'source' | 'action' | 'status', value?: string | null) {
  if (!value) return '—';
  return dicts.value[kind].get(value) ?? FALLBACK[kind].find(item => item.value === value)?.label ?? value;
}

const statusTypeMap: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  READY: 'success',
  PAUSED: 'warning',
  TRIGGERED: 'info',
  RUNNING: 'info',
  DONE: 'info',
  CANCELLED: 'danger'
};

const formFilter = reactive({
  pageNum: 1,
  pageSize: 20,
  keyword: '',
  createdBy: undefined as string | undefined,
  source: undefined as string | undefined,
  status: undefined as string | undefined,
  triggerType: undefined as string | undefined,
  actionType: undefined as string | undefined
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
    const { data } = await findScheduleTaskList(formFilter);
    if (data) {
      tableData.value = data.list ?? [];
      pagination.itemCount = data.total ?? 0;
    }
  } finally {
    endLoading();
  }
}

function resetForm() {
  formFilter.keyword = '';
  formFilter.createdBy = undefined;
  formFilter.source = undefined;
  formFilter.status = undefined;
  formFilter.triggerType = undefined;
  formFilter.actionType = undefined;
  formFilter.pageNum = 1;
  pagination.page = 1;
  getTableData();
}

function handleAddTable() {
  modalType.value = 'add';
  editData.value = null;
  openModal();
}

function handleEditTable(row: ScheduleTaskRow) {
  modalType.value = 'edit';
  editData.value = row;
  openModal();
}

async function handleDeleteTable(row: ScheduleTaskRow) {
  const res = await delScheduleTask(row.id);
  if (res.error === null) {
    // delScheduleTask 在 service 层漏了响应体泛型（data 退化成 {}），按同类接口口径收窄后取 message
    const data = res.data as { message?: string };
    window.$message?.success(data.message ?? '已删除（软删，同编码可重建）');
    getTableData();
  }
}

async function handleToggleStatus(row: ScheduleTaskRow) {
  const next = row.status === 'PAUSED' ? 'READY' : 'PAUSED';
  const res = await changeScheduleTaskStatus(row.id, next);
  if (res.error === null) {
    window.$message?.info(res.data?.message ?? '操作成功');
    getTableData();
  }
}

async function handleRun(row: ScheduleTaskRow) {
  const res = await runScheduleTask(row.id);
  if (res.error === null) {
    window.$message?.info(res.data?.message ?? '已提交执行');
  }
}

async function handleTerminate(row: ScheduleTaskRow) {
  const res = await terminateScheduleTask(row.id);
  if (res.error === null) {
    window.$message?.info(res.data?.message ?? '已发出终止指令');
    getTableData();
  }
}

/** 预览弹窗数据：结构化展示而不是纯文本堆一起 */
interface PreviewView {
  title: string;

  fireTimes: string[];

  queue: Array<{ fireTime: string; cluster: number; estDelaySeconds: number }>;

  note?: string;

  queueWarning?: string;
}

const previewVisible = ref(false);
const previewView = ref<PreviewView | null>(null);

function handlePreview(row: ScheduleTaskRow) {
  previewScheduleTask(row.id, 5).then(({ data }) => {
    if (data) {
      previewView.value = {
        title: row.title,
        fireTimes: (data.fireTimes ?? []).map((t: string) => formatDateTime(t)),
        queue: (data.queue ?? []).map(q => ({
          fireTime: formatDateTime(q.fireTime),
          cluster: q.cluster,
          estDelaySeconds: q.estDelaySeconds
        })),
        note: data.note,
        queueWarning: data.queueWarning
      };
      previewVisible.value = true;
    }
  });
}

async function handleBatch(status: string) {
  const scopeText = formFilter.source ? `来源=${dictLabel('source', formFilter.source)}` : '全部来源';
  window.$dialog?.warning({
    title: status === 'PAUSED' ? '批量暂停确认' : '批量启用确认',
    content: `将${status === 'PAUSED' ? '暂停' : '启用'}当前组织内 ${scopeText} 的所有任务（在途执行不受影响），确认继续？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { data } = await batchScheduleTaskStatus(undefined, formFilter.source, status);
      if (data !== undefined && data !== null) {
        window.$message?.success(`批量操作完成，影响 ${data} 行`);
        getTableData();
      }
    }
  });
}

function handleSourceJump(row: ScheduleTaskRow) {
  if (row.source === 'WORKFLOW') {
    router.push({ path: '/flow/definition' });
  } else if (row.source === 'DESIGNER' || row.source === 'DESIGNER_DATA') {
    router.push({ path: '/dynamic/form' });
  }
}

function triggerText(row: ScheduleTaskRow) {
  if (row.triggerType === 'CRON') return row.cronExpr ?? '';
  if (row.triggerType === 'FIXED_DELAY') return `每 ${row.intervalSeconds ?? '-'} 秒`;
  return '一次性';
}

const columns = computed<DataTable.Column<ScheduleTaskRow>[]>(() => [
  {
    title: '序号',
    key: 'index',
    width: 60,
    render: (_row, index) => index + 1 + (formFilter.pageNum - 1) * formFilter.pageSize
  },
  {
    title: '任务名称',
    key: 'title',
    // 固定 220px + 截断：任务名常是「一次性任务:wf:ins:…」的长串，不截断会把整表撑出屏幕
    // width: 220,
    render: row => (
      <div class="w-full">
        <div class="truncate" title={row.title}>
          {row.title}
        </div>
        {row.taskCode ? (
          <span class="gray-true-500 truncate text-12px" title={row.taskCode}>
            {row.taskCode}
          </span>
        ) : null}
      </div>
    )
  },
  { title: '来源', key: 'source', width: 110, render: row => dictLabel('source', row.source) },
  {
    title: '触发',
    key: 'trigger',
    width: 80,
    render: row => (
      <div>
        <ElTag size="small">{row.triggerType}</ElTag>
        <div class="text-12px">{triggerText(row)}</div>
      </div>
    )
  },
  {
    title: '下次触发',
    key: 'nextFireTime',
    width: 170,
    render: row => (row.nextFireTime ? formatDateTime(row.nextFireTime) : '-')
  },
  { title: '动作', key: 'actionType', width: 130, render: row => dictLabel('action', row.actionType) },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: row => (
      <ElTag size="small" type={statusTypeMap[row.status] ?? 'info'}>
        {dictLabel('status', row.status)}
      </ElTag>
    )
  },
  {
    title: '触发/失败',
    key: 'count',
    width: 95,
    render: row => (
      <span>
        {row.triggerCount ?? 0} / <span class={row.failCount ? 'color-error' : ''}>{row.failCount ?? 0}</span>
      </span>
    )
  },
  {
    title: '操作',
    key: 'actions',
    // width: 300,
    fixed: 'right',
    render: row => (
      <ElSpace size="small">
        {hasAuth('schedule:task:edit') ? (
          <ElButton size="small" text type="primary" onClick={() => handleEditTable(row)}>
            编辑
          </ElButton>
        ) : null}
        {hasAuth('schedule:task:edit') ? (
          <ElButton size="small" text type="primary" onClick={() => handleToggleStatus(row)}>
            {row.status === 'PAUSED' ? '启用' : '暂停'}
          </ElButton>
        ) : null}
        {hasAuth('schedule:task:run') ? (
          <ElButton
            size="small"
            type="primary"
            plain
            disabled={row.status === 'RUNNING' || row.status === 'TRIGGERED'}
            onClick={() => handleRun(row)}
          >
            执行
          </ElButton>
        ) : null}
        {hasAuth('schedule:task:terminate') && row.status === 'RUNNING' ? (
          <ElPopconfirm
            title="确认终止运行中的任务？"
            confirm-button-text="确认"
            cancel-button-text="取消"
            onConfirm={() => handleTerminate(row)}
          >
            {{
              reference: () => (
                <ElButton size="small" type="danger" plain>
                  终止
                </ElButton>
              )
            }}
          </ElPopconfirm>
        ) : null}
        {hasAuth('schedule:task:query') ? (
          <ElButton size="small" text type="primary" onClick={() => handlePreview(row)}>
            预览
          </ElButton>
        ) : null}
        {row.source === 'WORKFLOW' || row.source === 'DESIGNER' || row.source === 'DESIGNER_DATA' ? (
          <ElButton size="small" text type="primary" onClick={() => handleSourceJump(row)}>
            来源
          </ElButton>
        ) : null}
        {hasAuth('schedule:task:delete') ? (
          <ElPopconfirm
            title="确认删除？删除后同编码任务可重新创建。"
            confirm-button-text="确认"
            cancel-button-text="取消"
            width={260}
            onConfirm={() => handleDeleteTable(row)}
          >
            {{
              reference: () => (
                <ElButton size="small" type="danger">
                  删除
                </ElButton>
              )
            }}
          </ElPopconfirm>
        ) : null}
      </ElSpace>
    )
  }
]);

/** ListAdditional 刷新入口 */
function init() {
  getTableData();
}

function search() {
  formFilter.pageNum = 1;
  pagination.page = 1;
  getTableData();
}

onMounted(() => {
  getTableData();
  loadDicts();
});
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="schedule:task:add"
          permission-remove="schedule:task:delete"
          permission-export=""
          permission-import=""
          :show-remove="false"
          :show-export="false"
          :show-import="false"
          operation-title="定时任务"
          @add="handleAddTable"
          @keyword-clear="search"
          @search="search"
          @reset="resetForm"
        >
          <template #button>
            <ElButton
              v-if="hasAuth('schedule:task:pause-batch')"
              type="warning"
              size="small"
              plain
              @click="handleBatch('PAUSED')"
            >
              批量暂停
            </ElButton>
            <ElButton
              v-if="hasAuth('schedule:task:pause-batch')"
              type="info"
              size="small"
              plain
              @click="handleBatch('READY')"
            >
              批量启用
            </ElButton>
          </template>
          <template #filter>
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px">
              <div class="col-span-3 flex flex-row items-center justify-end">负责人</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.createdBy" clearable placeholder="创建人 userId" size="small" />
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">来源</div>
              <div class="col-span-7">
                <ElSelect v-model="formFilter.source" clearable placeholder="请选择" size="small">
                  <ElOption v-for="opt in sourceOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">状态</div>
              <div class="col-span-7">
                <ElSelect v-model="formFilter.status" clearable placeholder="请选择" size="small">
                  <ElOption v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">触发类型</div>
              <div class="col-span-7">
                <ElSelect v-model="formFilter.triggerType" clearable placeholder="请选择" size="small">
                  <ElOption v-for="opt in triggerOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">动作</div>
              <div class="col-span-7">
                <ElSelect v-model="formFilter.actionType" clearable placeholder="请选择" size="small">
                  <ElOption v-for="opt in actionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
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
          :row-key="(row: ScheduleTaskRow) => row.id"
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          :bottom-bordered="true"
          striped
        />
      </div>
    </ElCard>

    <JobTaskModal
      v-model:visible="visible"
      :modal-type="modalType"
      :edit-data="editData"
      @close-modal="closeModal"
      @submit-success="getTableData"
    />

    <!-- 触发预览：结构化展示未来触发时间与排队估算，替代原先堆成一团的纯文本 dialog -->
    <ElDialog v-model="previewVisible" title="未来 5 次触发预览" width="560px">
      <div v-if="previewView" class="flex flex-col gap-12px">
        <div class="truncate text-13px text-gray-500" :title="previewView.title">{{ previewView.title }}</div>

        <div>
          <div class="mb-6px text-12px font-600">触发时间</div>
          <div
            class="flex flex-col gap-4px border border-[var(--el-border-color-lighter)] rounded-6px border-solid px-14px py-10px"
          >
            <div
              v-for="(time, index) in previewView.fireTimes"
              :key="time"
              class="flex items-center gap-8px text-13px tabular-nums"
            >
              <span class="w-18px text-right text-gray-400">{{ index + 1 }}.</span>
              <span>{{ time }}</span>
            </div>
            <div v-if="!previewView.fireTimes.length" class="text-12px text-gray-400">无触发计划</div>
          </div>
        </div>

        <div v-if="previewView.queue.length">
          <div class="mb-6px text-12px font-600">排队延迟估算</div>
          <table class="w-full border-collapse text-12px">
            <thead>
              <tr class="bg-[var(--el-fill-color-light)]">
                <th class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px text-left">
                  触发时间
                </th>
                <th class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px text-left">
                  同时刻聚集
                </th>
                <th class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px text-left">
                  预计排队
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="q in previewView.queue" :key="q.fireTime">
                <td class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px tabular-nums">
                  {{ q.fireTime }}
                </td>
                <td class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px tabular-nums">
                  {{ q.cluster }} 个
                </td>
                <td class="border border-[var(--el-border-color-lighter)] border-solid px-8px py-4px tabular-nums">
                  ~{{ q.estDelaySeconds }}s
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ElAlert
          v-if="previewView.queueWarning"
          :title="previewView.queueWarning"
          type="warning"
          :closable="false"
          show-icon
        />
        <div v-if="previewView.note" class="text-12px text-gray-500">{{ previewView.note }}</div>
      </div>
      <template #footer>
        <ElButton @click="previewVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.text-12px {
  font-size: 12px;
  color: #999;
}
</style>
