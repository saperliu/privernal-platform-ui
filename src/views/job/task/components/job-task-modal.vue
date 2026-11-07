<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import {
  ElButton as __forwarded_ElButton,
  ElDrawer as __forwarded_ElDrawer,
  ElForm as __forwarded_ElForm,
  ElFormItem as __forwarded_ElFormItem,
  ElInput as __forwarded_ElInput,
  ElInputNumber as __forwarded_ElInputNumber,
  ElSelect as __forwarded_ElSelect,
  ElSpace as __forwarded_ElSpace
} from 'element-plus';
import { type ScheduleTaskRow, previewCron, saveScheduleTask, updateScheduleTask } from '@/service';
import { formatDateTime } from '@/utils/common';

export type ModalType = 'add' | 'edit';

interface FormData {
  id?: string;
  title: string;
  taskCode?: string;
  triggerType: string;
  cronExpr?: string;
  intervalSeconds?: number;
  nextFireTime?: number | null;
  jitterSeconds?: number;
  misfirePolicy: string;
  concurrentPolicy: string;
  timeoutSeconds: number;
  maxRetry: number;
  actionType: string;
  actionConfig: string;
  remark?: string;
}

const props = defineProps<{
  visible: boolean;
  modalType: ModalType;
  editData: ScheduleTaskRow | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'close-modal'): void;
  (e: 'submit-success'): void;
}>();
const formRef = ref<FormInstance | null>(null);
const submitting = ref(false);

const defaultFormData: FormData = {
  title: '',
  taskCode: '',
  triggerType: 'CRON',
  cronExpr: '',
  intervalSeconds: 300,
  nextFireTime: null,
  jitterSeconds: 0,
  misfirePolicy: 'COMPENSATE',
  concurrentPolicy: 'FORBID',
  timeoutSeconds: 300,
  maxRetry: 3,
  actionType: 'MESSAGE_NOTIFY',
  actionConfig: ''
};

const formData = reactive<FormData>({ ...defaultFormData });

const isEdit = computed(() => props.modalType === 'edit');

/** §7.1 硬约束：整点/准整点 cron（分钟位为 0）默认推荐 jitter=60 削峰 */
const isOnHourCron = computed(() => {
  if (formData.triggerType !== 'CRON' || !formData.cronExpr) return false;
  const fields = formData.cronExpr.trim().split(/\s+/);
  return fields.length === 6 && (fields[1] === '0' || fields[1] === '*/1');
});

watch(
  () => props.visible,
  val => {
    if (val) {
      if (isEdit.value && props.editData) {
        const row = props.editData;
        Object.assign(formData, defaultFormData, {
          id: row.id,
          title: row.title,
          taskCode: row.taskCode ?? '',
          triggerType: row.triggerType,
          cronExpr: row.cronExpr ?? '',
          intervalSeconds: row.intervalSeconds ?? 300,
          nextFireTime: row.nextFireTime ? new Date(row.nextFireTime).getTime() : null,
          jitterSeconds: row.jitterSeconds ?? 0,
          misfirePolicy: row.misfirePolicy ?? 'COMPENSATE',
          concurrentPolicy: row.concurrentPolicy ?? 'FORBID',
          timeoutSeconds: row.timeoutSeconds ?? 300,
          maxRetry: row.maxRetry ?? 3,
          actionType: row.actionType,
          actionConfig: row.actionConfig ?? '',
          remark: row.remark ?? ''
        });
      } else {
        Object.assign(formData, defaultFormData);
      }
    }
  }
);

const triggerOptions: CommonType.Option[] = [
  { label: 'CRON（周期）', value: 'CRON' },
  { label: '固定间隔（≥60 秒）', value: 'FIXED_DELAY' },
  { label: '一次性', value: 'ONCE' }
];
const misfireOptions: CommonType.Option[] = [
  { label: '补偿一次（COMPENSATE）', value: 'COMPENSATE' },
  { label: '跳到下次（SKIP）', value: 'SKIP' }
];
const concurrentOptions: CommonType.Option[] = [
  { label: '上一轮未完则跳过（FORBID）', value: 'FORBID' },
  { label: '跳过且不记录（SKIP）', value: 'SKIP' },
  { label: '错过轮次排队补跑（QUEUE）', value: 'QUEUE' }
];
const actionOptions: CommonType.Option[] = [
  { label: '站内信通知（MESSAGE_NOTIFY）', value: 'MESSAGE_NOTIFY' },
  { label: '系统 Bean（BEAN）', value: 'BEAN' },
  { label: 'Groovy 脚本（GROOVY_SCRIPT）', value: 'GROOVY_SCRIPT' },
  { label: '表单数据操作（FORM_DATA_OP）', value: 'FORM_DATA_OP' },
  { label: 'HTTP 回调（HTTP_CALL）', value: 'HTTP_CALL' }
];

const actionPlaceholder = computed(() => {
  switch (formData.actionType) {
    case 'MESSAGE_NOTIFY':
      return '{"title":"标题","content":"内容","userIds":["用户id"]}';
    case 'BEAN':
      return '{"bean":"call-log-purge"}';
    case 'GROOVY_SCRIPT':
      return '{"script":"def now = new Date(); return now.toString();"}';
    case 'FORM_DATA_OP':
      return '{"operation":"DELETE","tableName":"物理表名","dataId":"数据id"}';
    case 'HTTP_CALL':
      return '{"url":"https://example.com/hook","method":"POST","body":"{}"}';
    default:
      return '{}';
  }
});

const rules: FormRules = {
  title: { required: true, message: '请输入任务名称', trigger: 'blur' },
  cronExpr: {
    validator: () => {
      if (formData.triggerType !== 'CRON') return true;
      return Boolean(formData.cronExpr);
    },
    message: 'CRON 触发必须填写表达式（6 位秒级）',
    trigger: 'blur'
  },
  intervalSeconds: {
    validator: () => {
      if (formData.triggerType !== 'FIXED_DELAY') return true;
      return (formData.intervalSeconds ?? 0) >= 60;
    },
    message: '间隔最小 60 秒',
    trigger: 'blur'
  },
  nextFireTime: {
    validator: () => {
      if (formData.triggerType !== 'ONCE') return true;
      return Boolean(formData.nextFireTime);
    },
    message: '一次性任务必须选择触发时间',
    trigger: 'change'
  },
  actionConfig: {
    validator: () => {
      if (!formData.actionConfig) return false;
      try {
        JSON.parse(formData.actionConfig);
        return true;
      } catch {
        return false;
      }
    },
    message: '动作配置必须是合法 JSON',
    trigger: 'blur'
  }
};

async function handleCronPreview() {
  if (!formData.cronExpr) return;
  try {
    const { data } = await previewCron(formData.cronExpr, 5);
    if (data?.fireTimes) {
      window.$message?.({
        message: `未来触发：${data.fireTimes.map((t: string) => formatDateTime(t)).join('；')}`,
        type: 'info',
        duration: 8000
      });
    }
  } catch (e) {
    window.$message?.error((e as Error).message ?? '表达式非法');
  }
}

function handleCloseModal() {
  emit('update:visible', false);
  emit('close-modal');
}

function buildPayload() {
  const payload: Record<string, unknown> = {
    title: formData.title,
    taskCode: formData.taskCode || null,
    triggerType: formData.triggerType,
    cronExpr: formData.triggerType === 'CRON' ? formData.cronExpr : null,
    intervalSeconds: formData.triggerType === 'FIXED_DELAY' ? formData.intervalSeconds : null,
    jitterSeconds: formData.triggerType === 'CRON' ? (formData.jitterSeconds ?? 0) : 0,
    misfirePolicy: formData.misfirePolicy,
    concurrentPolicy: formData.concurrentPolicy,
    timeoutSeconds: formData.timeoutSeconds,
    maxRetry: formData.maxRetry,
    actionType: formData.actionType,
    actionConfig: formData.actionConfig,
    remark: formData.remark ?? null,
    // 后端 @JsonFormat 只认 yyyy-MM-dd HH:mm:ss.SSS（毫秒）：toISOString 的 UTC 串会被反序列化拒绝，
    // 平台惯例秒级串也过不了；所以本地时区格式化后补 .000
    nextFireTime:
      formData.triggerType === 'ONCE' && formData.nextFireTime
        ? `${formatDateTime(Number(formData.nextFireTime))}.000`
        : null
  };
  return payload;
}

function handleSubmit(e: MouseEvent) {
  e.preventDefault();
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const payload = buildPayload();
      const { data } =
        isEdit.value && formData.id
          ? await updateScheduleTask(formData.id, payload as Partial<ScheduleTaskRow>)
          : await saveScheduleTask(payload as Partial<ScheduleTaskRow>);
      if (data) {
        window.$message?.success(data.message ?? '保存成功');
        emit('submit-success');
        handleCloseModal();
      }
    } finally {
      submitting.value = false;
    }
  });
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElForm = __forwarded_ElForm;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElFormItem = __forwarded_ElFormItem;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInput = __forwarded_ElInput;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInputNumber = __forwarded_ElInputNumber;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDrawer = __forwarded_ElDrawer;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;
</script>

<template>
  <ElDrawer
    :model-value="visible"
    :title="isEdit ? '编辑任务' : '新建任务'"
    size="720px"
    :close-on-click-modal="false"
    class="privernal-drawer"
    @update:model-value="handleCloseModal"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-position="left" label-width="110">
      <ElFormItem label="任务名称" prop="title">
        <ElInput v-model="formData.title" placeholder="如：每日数据汇总提醒" />
      </ElFormItem>
      <ElFormItem label="任务编码" prop="taskCode">
        <ElInput v-model="formData.taskCode" placeholder="应用内唯一编码，如 daily_summary（可选）" />
      </ElFormItem>
      <ElFormItem label="触发类型" prop="triggerType">
        <ElSelect v-model="formData.triggerType">
          <ElOption v-for="opt in triggerOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="formData.triggerType === 'CRON'" label="CRON 表达式" prop="cronExpr">
        <ElSpace class="w-full">
          <ElInput v-model="formData.cronExpr" placeholder="6 位秒级，如 0 0 9 * * ? 表示每天 9 点" />
          <ElButton size="small" text @click="handleCronPreview">校验并预览未来 5 次</ElButton>
        </ElSpace>
      </ElFormItem>
      <ElFormItem v-if="formData.triggerType === 'FIXED_DELAY'" label="间隔（秒）" prop="intervalSeconds">
        <ElInputNumber v-model="formData.intervalSeconds" :min="60" :step="60" class="w-full" />
      </ElFormItem>
      <ElFormItem v-if="formData.triggerType === 'ONCE'" label="触发时间" prop="nextFireTime">
        <ElDatePicker v-model="formData.nextFireTime" type="datetime" class="w-full" clearable />
      </ElFormItem>
      <ElFormItem v-if="formData.triggerType === 'CRON'" label="jitter（秒）">
        <ElSpace class="w-full">
          <ElInputNumber
            v-model="formData.jitterSeconds"
            :min="0"
            :max="60"
            class="w-full"
            placeholder="0-60；整点任务建议 60 削峰（确定性偏移，叠加到实际触发时刻）"
          />
          <ElSpace v-if="isOnHourCron && (formData.jitterSeconds ?? 0) === 0" align="center">
            <span class="jitter-warn">整点任务会大量聚集触发，建议配置 jitter=60 削峰</span>
            <ElButton size="small" type="warning" @click="formData.jitterSeconds = 60">一键设为 60</ElButton>
          </ElSpace>
        </ElSpace>
      </ElFormItem>
      <ElFormItem label="错过策略" prop="misfirePolicy">
        <ElSelect v-model="formData.misfirePolicy">
          <ElOption v-for="opt in misfireOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="并发策略" prop="concurrentPolicy">
        <ElSelect v-model="formData.concurrentPolicy">
          <ElOption v-for="opt in concurrentOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="执行超时（秒）">
        <ElInputNumber v-model="formData.timeoutSeconds" :min="10" :max="3600" class="w-full" />
      </ElFormItem>
      <ElFormItem label="失败重试次数">
        <ElInputNumber v-model="formData.maxRetry" :min="0" :max="9" class="w-full" />
      </ElFormItem>
      <ElFormItem label="动作类型" prop="actionType">
        <ElSelect v-model="formData.actionType">
          <ElOption v-for="opt in actionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="动作配置(JSON)" prop="actionConfig">
        <ElInput v-model="formData.actionConfig" type="textarea" :rows="4" :placeholder="actionPlaceholder" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="formData.remark" type="textarea" :rows="2" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElSpace justify="end">
        <ElButton text @click="handleCloseModal">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
      </ElSpace>
    </template>
  </ElDrawer>
</template>

<style scoped>
.jitter-warn {
  color: #d97706;
  font-size: 12px;
}
</style>
