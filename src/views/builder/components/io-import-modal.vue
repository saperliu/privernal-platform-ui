<script setup lang="ts">
/**
 * 数据导入弹窗（R2-19 导入导出增强，从 dynamic-data-list.vue 抽出）
 *
 * 三段式：
 * ① 选择文件：模板下载 + 上传 xlsx → 自动调预检接口；
 * ② 预检与列映射：跨环境列结构预检告警（未匹配列/缺必填列/类型脏样本）+
 *    自定义列映射表（Excel 表头 → 目标字段下拉，自动匹配预选，可改/可忽略）→ 开始导入；
 * ③ 进度：轮询读库（重启不丢、多实例可见）+ 失败报告下载 + 导入记录列表
 *    （进行中的任务可重新挂上轮询——后端重启续跑的 UI 入口）。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
  ElAlert as __forwarded_ElAlert,
  ElButton as __forwarded_ElButton,
  ElDialog as __forwarded_ElDialog,
  ElOption as __forwarded_ElOption,
  ElProgress as __forwarded_ElProgress,
  ElSelect as __forwarded_ElSelect,
  ElSpace as __forwarded_ElSpace,
  ElTable as __forwarded_ElTable,
  ElTableColumn as __forwarded_ElTableColumn,
  ElTag as __forwarded_ElTag,
  ElUpload as __forwarded_ElUpload
} from 'element-plus';
import type { UploadFile } from 'element-plus';
import {
  fetchIoImportProgress,
  fetchIoImportReport,
  fetchIoImportTasks,
  fetchIoTemplate,
  previewIoImport,
  startIoImport
} from '@/service/api/dynamic/advanced';
import { formatDateTime } from '@/utils';

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElAlert = __forwarded_ElAlert;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDialog = __forwarded_ElDialog;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElOption = __forwarded_ElOption;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElProgress = __forwarded_ElProgress;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTable = __forwarded_ElTable;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTableColumn = __forwarded_ElTableColumn;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTag = __forwarded_ElTag;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElUpload = __forwarded_ElUpload;

const props = defineProps<{
  show: boolean;
  formId: string;
  /** 表单名（下载文件命名） */
  formName?: string;
  /** 高级设置 strict_validate：Y 时必填缺失的行会校验失败（预检告警用） */
  strictValidate?: boolean;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
  /** 本轮导入有新数据落库（刷新列表） */
  imported: [];
}>();

type Step = 'select' | 'mapping' | 'progress';

const step = ref<Step>('select');
const file = ref<File | null>(null);
const previewing = ref(false);
const starting = ref(false);

const preview = ref<AdvancedNamespace.ImportPreviewResult | null>(null);
/** 映射编辑态：每列 Excel 表头 → 字段编码（''=忽略） */
const mappingRows = ref<Array<{ header: string; field: string }>>([]);

const task = ref<AdvancedNamespace.ImportProgress | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;
const taskRecords = ref<AdvancedNamespace.ImportTaskSummary[]>([]);

const dialogVisible = computed({
  get: () => props.show,
  set: value => emit('update:show', value)
});

const progressPercent = computed(() => {
  if (!task.value || !task.value.total) return 0;
  return Math.min(100, Math.round((task.value.processed / task.value.total) * 100));
});

/** ElProgress 状态：进行中默认色，完成后按失败行数给 warning/success（失败任务红） */
const progressStatus = computed<'' | 'success' | 'exception' | 'warning'>(() => {
  if (!task.value?.finished) return '';
  if (task.value.status === 'FAILED') return 'exception';
  return task.value.failed > 0 ? 'warning' : 'success';
});

const unmatched = computed(() => preview.value?.precheck.unmatched ?? []);
const missingRequired = computed(() => preview.value?.precheck.missingRequired ?? []);
const typeWarnings = computed(() => preview.value?.precheck.warnings ?? []);
const mappedCount = computed(() => mappingRows.value.filter(row => row.field).length);

const statusMeta: Record<string, { label: string; type: 'warning' | 'primary' | 'success' | 'danger' }> = {
  PENDING_MAPPING: { label: '待映射确认', type: 'warning' },
  RUNNING: { label: '执行中', type: 'primary' },
  FINISHED: { label: '已完成', type: 'success' },
  FAILED: { label: '失败', type: 'danger' }
};

function statusOf(status: string) {
  return statusMeta[status] ?? { label: status, type: 'info' as const };
}

function resetAll() {
  stopPolling();
  step.value = 'select';
  file.value = null;
  preview.value = null;
  mappingRows.value = [];
  task.value = null;
}

watch(
  () => props.show,
  show => {
    if (show) {
      resetAll();
      loadRecords();
    }
  }
);

onBeforeUnmount(stopPolling);

function close() {
  emit('update:show', false);
}

/** ElUpload 的 change 回调：单文件，取到原生 File 后立即预检 */
function onFileChange(uploadFile: UploadFile) {
  const raw = uploadFile.raw;
  if (!raw || !props.formId) return;
  file.value = raw;
  void handlePreview(raw);
}

async function handlePreview(target: File) {
  previewing.value = true;
  try {
    const { data, error } = await previewIoImport(props.formId, target);
    if (error || !data) {
      window.$message?.error(error?.message ?? '预检失败，请检查文件后重试');
      file.value = null;
      return;
    }
    preview.value = data;
    mappingRows.value = data.headers
      .filter(header => header !== '')
      .map(header => ({ header, field: data.mapping[header] ?? '' }));
    step.value = 'mapping';
    window.$message?.success(`预检完成：共 ${data.total} 行，匹配 ${mappedCount.value} 列`);
  } finally {
    previewing.value = false;
  }
}

function backToSelect() {
  step.value = 'select';
  file.value = null;
  preview.value = null;
  mappingRows.value = [];
}

async function handleTemplateDownload() {
  const { data, error } = await fetchIoTemplate(props.formId);
  if (error || !data) {
    window.$message?.error('模板下载失败，请重试');
    return;
  }
  downloadBlob(data, `import-template-${props.formName ?? props.formId}.xlsx`);
}

/** 确认映射并启动导入 */
async function handleStart() {
  if (!preview.value) return;
  const mapping: Record<string, string> = {};
  for (const row of mappingRows.value) {
    mapping[row.header] = row.field;
  }
  starting.value = true;
  try {
    const { data, error } = await startIoImport(preview.value.taskId, mapping);
    if (error || !data?.taskId) {
      window.$message?.error(error?.message ?? '导入发起失败');
      return;
    }
    task.value = {
      taskId: data.taskId,
      status: 'RUNNING',
      finished: false,
      total: data.total ?? preview.value.total,
      processed: 0,
      success: 0,
      skipped: 0,
      failed: 0
    };
    step.value = 'progress';
    window.$message?.success(`导入任务已提交，共 ${data.total ?? preview.value.total} 行`);
    startPolling();
  } finally {
    starting.value = false;
  }
}

function startPolling() {
  stopPolling();
  timer = setInterval(() => void pollProgress(), 1000);
}

function stopPolling() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

async function pollProgress() {
  if (!task.value) return;
  const { data, error } = await fetchIoImportProgress(task.value.taskId);
  if (error || !data) return;
  task.value = { ...task.value, ...data };
  if (data.finished) {
    stopPolling();
    if (data.status === 'FAILED') {
      window.$message?.error(`导入任务失败：${data.failed} 行未入库，可下载报告查看`);
    } else {
      window.$message?.success(`导入完成：成功 ${data.success}，跳过 ${data.skipped}，失败 ${data.failed}`);
    }
    emit('imported');
    loadRecords();
  }
}

/** 从导入记录把进行中的任务重新挂上轮询（后端重启续跑/换端查看的入口） */
function attachTask(record: AdvancedNamespace.ImportTaskSummary) {
  task.value = {
    taskId: record.taskId,
    status: record.status,
    finished: record.status === 'FINISHED' || record.status === 'FAILED',
    total: record.total,
    processed: record.processed,
    success: record.success,
    skipped: record.skipped,
    failed: record.failed
  };
  step.value = 'progress';
  if (!task.value.finished) {
    startPolling();
  }
}

async function handleReportDownload(taskId: string) {
  const { data, error } = await fetchIoImportReport(taskId);
  if (error || !data) {
    window.$message?.error('报告下载失败，请重试');
    return;
  }
  downloadBlob(data, `import-report-${taskId}.xlsx`);
}

async function loadRecords() {
  if (!props.formId) return;
  const { data, error } = await fetchIoImportTasks(props.formId);
  if (!error && data) {
    taskRecords.value = data;
  }
}

/** 浏览器下载 Blob 的统一入口（Excel 同款，与父组件 downloadBlob 一致） */
function downloadBlob(blob: Blob, fileName: string) {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}
</script>

<template>
  <ElDialog v-model="dialogVisible" title="导入数据" width="680px" @closed="stopPolling">
    <div class="flex flex-col gap-14px">
      <!-- ① 选择文件 -->
      <template v-if="step === 'select'">
        <ElSpace :size="14">
          <ElButton text size="small" @click="handleTemplateDownload">
            <icon-mdi-tray-arrow-down class="mr-4px text-18px" />
            下载导入模板
          </ElButton>
          <ElUpload
            :limit="1"
            accept=".xlsx"
            :auto-upload="false"
            :show-file-list="false"
            @change="onFileChange"
          >
            <ElButton text size="small" :loading="previewing">
              {{ previewing ? '预检中…' : '选择 Excel 文件（≤10MB，选择后自动预检）' }}
            </ElButton>
          </ElUpload>
        </ElSpace>
      </template>

      <!-- ② 预检与列映射 -->
      <template v-else-if="step === 'mapping' && preview">
        <ElSpace :size="8" wrap>
          <ElTag type="info">{{ file?.name }}</ElTag>
          <ElTag type="success">匹配 {{ mappedCount }} 列</ElTag>
          <ElTag v-if="unmatched.length" type="warning">未匹配 {{ unmatched.length }} 列</ElTag>
          <ElTag type="info">共 {{ preview.total }} 行</ElTag>
          <ElButton text size="small" @click="backToSelect">重新选文件</ElButton>
        </ElSpace>

        <ElAlert
          v-if="unmatched.length"
          type="warning"
          :closable="false"
          title="以下列在目标环境表单中没有对应字段（跨环境导入常见），将忽略或可手工映射到其他字段"
        >
          <div v-for="item in unmatched" :key="item.header" class="text-12px">
            「{{ item.header }}」：{{ item.reason }}
          </div>
        </ElAlert>
        <ElAlert
          v-if="missingRequired.length"
          type="error"
          :closable="false"
          :title="`缺少必填字段（${strictValidate ? '当前 strict_validate=Y，对应行会校验失败' : 'strict_validate=N 不阻断，但落库缺值'}）`"
        >
          <div v-for="item in missingRequired" :key="item.field" class="text-12px">
            {{ item.fieldName }}({{ item.field }})：{{ item.reason }}
          </div>
        </ElAlert>
        <ElAlert
          v-for="item in typeWarnings"
          :key="`${item.kind}-${item.header}-${item.sample}`"
          type="warning"
          :closable="false"
        >
          <template #title>
            <span v-if="item.kind === 'TYPE_MISMATCH'">
              类型可疑：「{{ item.header }}」样本「{{ item.sample }}」——{{ item.reason }}
            </span>
            <span v-else>{{ item.reason }}</span>
          </template>
        </ElAlert>

        <ElTable :data="mappingRows" size="small" max-height="320">
          <ElTableColumn prop="header" label="Excel 列（表头）" min-width="160" show-overflow-tooltip />
          <ElTableColumn label="映射到目标字段" min-width="220">
            <template #default="{ row }">
              <ElSelect v-model="row.field" size="small" clearable placeholder="忽略该列" filterable>
                <ElOption
                  v-for="item in preview.fields"
                  :key="item.field"
                  :value="item.field"
                  :label="`${item.fieldName || item.field}（${item.field}）`"
                />
              </ElSelect>
            </template>
          </ElTableColumn>
        </ElTable>

        <ElSpace justify="end">
          <ElButton size="small" @click="close">关闭</ElButton>
          <ElButton
            type="primary"
            size="small"
            :loading="starting"
            :disabled="mappedCount === 0"
            @click="handleStart"
          >
            开始导入
          </ElButton>
        </ElSpace>
      </template>

      <!-- ③ 进度 -->
      <template v-else-if="step === 'progress' && task">
        <div class="flex flex-col gap-8px">
          <ElProgress
            type="line"
            :percentage="progressPercent"
            :status="progressStatus"
            :show-indicator="!task.finished"
          />
          <span class="text-13px">
            已处理 {{ task.processed }} / {{ task.total }} 行
            <template v-if="task.finished">
              ：成功 {{ task.success }}，跳过 {{ task.skipped }}，失败 {{ task.failed }}
            </template>
            <template v-else-if="task.status === 'RUNNING'">（执行中，可关闭弹窗稍后回来查看）</template>
          </span>
          <ElSpace :size="8">
            <ElButton
              v-if="task.finished && task.failed > 0"
              text
              size="small"
              @click="handleReportDownload(task.taskId)"
            >
              下载失败行报告（可修改后重新导入）
            </ElButton>
            <ElButton v-if="task.finished" text size="small" @click="backToSelect">继续导入下一批</ElButton>
          </ElSpace>
        </div>
        <ElSpace justify="end">
          <ElButton size="small" @click="close">关闭</ElButton>
        </ElSpace>
      </template>

      <!-- 导入记录（读库：重启可续/多实例可见的痕迹） -->
      <div v-if="taskRecords.length" class="flex flex-col gap-6px">
        <div class="text-13px font-bold">导入记录（最近 {{ taskRecords.length }} 条）</div>
        <div
          v-for="record in taskRecords"
          :key="record.taskId"
          class="flex items-center justify-between gap-8px rounded-4px bg-gray-50 px-8px py-6px dark:bg-#1f1f1f"
        >
          <div class="flex items-center gap-8px text-12px">
            <ElTag size="small" :type="statusOf(record.status).type">{{ statusOf(record.status).label }}</ElTag>
            <span>
              {{ record.processed }}/{{ record.total }} 行
              <template v-if="record.status === 'FINISHED' || record.status === 'FAILED'">
                （成功 {{ record.success }} / 跳过 {{ record.skipped }} / 失败 {{ record.failed }}）
              </template>
            </span>
            <span class="opacity-60">{{ formatDateTime(record.createdTime) }}</span>
          </div>
          <ElSpace :size="4">
            <ElButton
              v-if="record.status === 'RUNNING' || record.status === 'PENDING_MAPPING'"
              text
              size="small"
              type="primary"
              @click="attachTask(record)"
            >
              查看进度
            </ElButton>
            <ElButton
              v-if="(record.status === 'FINISHED' || record.status === 'FAILED') && record.failed > 0"
              text
              size="small"
              @click="handleReportDownload(record.taskId)"
            >
              失败报告
            </ElButton>
          </ElSpace>
        </div>
      </div>
    </div>
  </ElDialog>
</template>
