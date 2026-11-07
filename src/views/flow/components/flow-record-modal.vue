<script setup lang="ts">
import type { Component } from 'vue';
import { computed, ref, watch } from 'vue';
import {
  ElDialog as __forwarded_ElDialog,
  ElIcon as __forwarded_ElIcon,
  ElTabPane as __forwarded_ElTabPane,
  ElTabs as __forwarded_ElTabs,
  ElTag as __forwarded_ElTag,
  ElTimeline as __forwarded_ElTimeline,
  ElTimelineItem as __forwarded_ElTimelineItem
} from 'element-plus';
import dayjs from 'dayjs';
import {
  AddOutline,
  AlertCircleOutline,
  CheckmarkOutline,
  CloseOutline,
  EllipseOutline,
  TimeOutline,
  GitNetworkOutline as __forwarded_GitNetworkOutline
} from '@vicons/ionicons5';
import { findFlowRecordByInstanceId, findFlowStatusByBusinessId, findSystemUserList } from '@/service';
import { formatDateTime, getCnDate } from '@/utils';
import { cooperateTypeLabels, flowStatusLabels, flowStatusTones, skipTypeLabels, skipTypeTones } from './flow-labels';
import type { FlowTone } from './flow-labels';
import FlowGraphPanel from './flow-graph-panel.vue';

/**
 * 流程记录：实例流转轨迹（我发起的/已办/动态表单数据行 共用）
 * 支持两种入口：instanceId 直接查记录；businessId 先解析流程实例再查
 */
const props = defineProps<{
  show: boolean;
  /** 流程实例 id（列表行给出时用） */
  instanceId?: string | null;
  /** 业务数据 id（动态表单行「流程」入口用，内部解析实例） */
  businessId?: string | null;
  /** 列表行携带的标题信息，记录尚未返回时先展示 */
  flowName?: string;
  businessTitle?: string;
  /** 实例状态；缺省时按业务入口解析或最后一条记录推断 */
  flowStatus?: string;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

interface RecordStep {
  key: string;
  nodeName: string;
  actionLabel: string;
  tone: FlowTone;
  icon: Component;
  running: boolean;
  approver: string;
  initial: string;
  cooperateLabel: string;
  timeText: string;
  durationText: string;
  targetText: string;
  message: string;
}

const loading = ref(false);
const records = ref<FlowNamespace.HisTask[]>([]);
const userNames = ref<Record<string, string>>({});
/** businessId 入口解析出的实例状态（instanceId 入口由列表行给 flowStatus） */
const resolved = ref<FlowNamespace.InstanceStatus | null>(null);
/** 业务数据尚未发起流程 */
const notStarted = ref(false);
/** 解析后的实例 id（记录与流程图共用） */
const resolvedInstanceId = ref('');
/** 页签：流转记录 / 流程图（流程图按需挂载，画布要等页签可见后才能量出尺寸） */
const activeTab = ref('timeline');

/** 办理人可能是用户 id，按需拉一次映射（失败则原样展示 id） */
let userNameReq: Promise<Record<string, string>> | null = null;
function loadUserNames() {
  userNameReq ??= findSystemUserList({ pageNum: 1, pageSize: 500 })
    .then(({ data }) => {
      const map: Record<string, string> = {};
      (data?.list || []).forEach(user => {
        map[String(user.id)] = String(user.nickName || user.loginName || user.id);
      });
      return map;
    })
    .catch(() => ({}) as Record<string, string>);
  return userNameReq;
}

/** 办理时间：未办理的记录只有到达时间 */
function handleTime(row: FlowNamespace.HisTask) {
  return String(row.updateTime || row.createTime || '');
}

function isRunning(row: FlowNamespace.HisTask) {
  return String(row.skipType || '') === 'PROCESS' || String(row.flowStatus || '') === '1';
}

function toneIcon(tone: FlowTone, running: boolean): Component {
  if (running) return TimeOutline;
  if (tone === 'success') return CheckmarkOutline;
  if (tone === 'error') return CloseOutline;
  if (tone === 'warning') return AlertCircleOutline;
  if (tone === 'info') return AddOutline;
  return EllipseOutline;
}

/** 单个环节耗时：到达时间 → 办理时间 */
function stepDuration(row: FlowNamespace.HisTask) {
  if (!row.createTime || !row.updateTime) return '';
  const seconds = dayjs(handleTime(row)).diff(dayjs(String(row.createTime)), 'second');
  return seconds > 0 ? getCnDate(seconds * 1000) : '';
}

/** 按办理时间升序 */
const sortedRecords = computed(() => [...records.value].sort((a, b) => handleTime(a).localeCompare(handleTime(b))));

/** FlowTone（含 naive 遗留的 default/error）→ Element Plus 组件的 type 取值 */
const EP_TONE_TYPES: Record<FlowTone, 'primary' | 'success' | 'info' | 'warning' | 'danger'> = {
  default: 'info',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'danger'
};

function tagType(tone: FlowTone) {
  return EP_TONE_TYPES[tone];
}

function resolveApprover(row: FlowNamespace.HisTask) {
  const rawApprover = String(row.approver || row.collaborator || '');
  return userNames.value[rawApprover] || rawApprover;
}

function resolveActionLabel(skipType: string, running: boolean) {
  return skipTypeLabels[skipType] ?? (running ? '审批中' : skipType);
}

function resolveCooperateLabel(row: FlowNamespace.HisTask) {
  const cooperateType = Number(row.cooperateType);
  if (cooperateType <= 1) return '';
  return cooperateTypeLabels[cooperateType] ?? '';
}

function resolveTargetText(row: FlowNamespace.HisTask, skipType: string) {
  const targetNodeName = String(row.targetNodeName || '');
  if (!targetNodeName) return '';
  const isReject = skipType === 'REJECT' || skipType === 'DISAPPROVE' || skipType === 'AUTO_REJECT';
  return `${isReject ? '退回至' : '流转至'} ${targetNodeName}`;
}

const steps = computed<RecordStep[]>(() =>
  sortedRecords.value.map((row, index) => {
    const skipType = String(row.skipType || '');
    const running = isRunning(row);
    const tone: FlowTone = skipTypeTones[skipType] ?? (running ? 'info' : 'default');
    const approver = resolveApprover(row);
    return {
      key: String(row.id ?? index),
      nodeName: row.nodeName || row.nodeCode || '-',
      actionLabel: resolveActionLabel(skipType, running),
      tone,
      icon: toneIcon(tone, running),
      running,
      approver: approver || '等待办理',
      initial: approver ? approver.slice(0, 1) : '·',
      cooperateLabel: resolveCooperateLabel(row),
      timeText: formatDateTime(handleTime(row) || row.createTime).slice(5, 16),
      durationText: stepDuration(row),
      targetText: resolveTargetText(row, skipType),
      message: String(row.message || '')
    };
  })
);

const headTitle = computed(() => props.flowName || String(sortedRecords.value[0]?.flowName || '') || '流程');
const subTitle = computed(() => props.businessTitle || String(sortedRecords.value[0]?.businessTitle || ''));

/** 概览首项：列表/解析给出实例状态时展示状态，否则展示最后一个环节的办理结果 */
const instanceStatus = computed(
  () => props.flowStatus ?? (resolved.value ? String(resolved.value.flowStatus) : undefined)
);
const fromInstance = computed(() => instanceStatus.value !== undefined);
const statusValue = computed(() => (fromInstance.value ? String(instanceStatus.value) : ''));

/** 办结态补一个收尾节点，轨迹不再停在最后一个审批环节（终止/作废/失效同理） */
const END_STEP_CONF: Record<string, { nodeName: string; tone: FlowTone }> = {
  '2': { nodeName: '流程结束', tone: 'success' },
  '3': { nodeName: '流程结束', tone: 'success' },
  '8': { nodeName: '流程结束', tone: 'success' },
  '4': { nodeName: '流程终止', tone: 'error' },
  '5': { nodeName: '流程作废', tone: 'error' },
  '10': { nodeName: '流程失效', tone: 'error' }
};

const endStep = computed<RecordStep | null>(() => {
  const conf = END_STEP_CONF[statusValue.value];
  const last = steps.value[steps.value.length - 1];
  if (!conf || !last) return null;
  return {
    key: 'flow-end',
    nodeName: conf.nodeName,
    actionLabel: flowStatusLabels[statusValue.value] ?? '',
    tone: conf.tone,
    icon: conf.tone === 'success' ? CheckmarkOutline : CloseOutline,
    running: false,
    approver: '系统',
    initial: '终',
    cooperateLabel: '',
    timeText: last.timeText,
    durationText: '',
    targetText: '',
    message: ''
  };
});

/** 轨迹展示用：记录 + 办结收尾节点；统计（办理环节数）仍用真实记录 steps */
const timelineSteps = computed(() => (endStep.value ? [...steps.value, endStep.value] : steps.value));

const statusLabel = computed(() => {
  if (fromInstance.value) return flowStatusLabels[statusValue.value] ?? statusValue.value;
  return steps.value[steps.value.length - 1]?.actionLabel ?? '';
});
const statusTone = computed<FlowTone>(() => {
  if (fromInstance.value) return flowStatusTones[statusValue.value] ?? 'default';
  return steps.value[steps.value.length - 1]?.tone ?? 'default';
});
const statusStatLabel = computed(() => (fromInstance.value ? '流程状态' : '最近办理'));

/** 发起时间取最早一条记录的到达时间 */
const applyTimeText = computed(() => {
  const first = sortedRecords.value[0];
  return first ? formatDateTime(first.createTime || handleTime(first)).slice(5, 16) : '-';
});

/** 全流程流转耗时：首条记录 → 最新节点（仍在办理则算到当前时刻） */
const totalDurationText = computed(() => {
  const first = sortedRecords.value[0];
  const last = sortedRecords.value[sortedRecords.value.length - 1];
  if (!first?.createTime || !last) return '-';
  const end = isRunning(last) ? dayjs() : dayjs(handleTime(last));
  const seconds = end.diff(dayjs(String(first.createTime)), 'second');
  return seconds > 0 ? getCnDate(seconds * 1000) : '-';
});

/** 业务入口才拿得到当前节点：流程仍在办理时提示等待中的节点 */
const runningHint = computed(() => (resolved.value?.running ? String(resolved.value.nodeName || '') : ''));

/** 流程图需要流程编码：业务入口来自实例解析，实例入口取首条记录 */
const flowCode = computed(() => String(resolved.value?.flowCode || sortedRecords.value[0]?.flowCode || ''));

watch(
  () => [props.show, props.instanceId, props.businessId],
  async () => {
    if (!props.show) return;
    loading.value = true;
    records.value = [];
    resolved.value = null;
    notStarted.value = false;
    resolvedInstanceId.value = '';
    activeTab.value = 'timeline';
    let instanceId = props.instanceId ?? '';
    if (!instanceId && props.businessId) {
      const { data, error } = await findFlowStatusByBusinessId(props.businessId);
      if (error === null && data?.instanceId) {
        resolved.value = data;
        instanceId = data.instanceId;
      } else {
        notStarted.value = true;
      }
    }
    resolvedInstanceId.value = instanceId;
    if (instanceId) {
      const { data, error } = await findFlowRecordByInstanceId(instanceId);
      records.value = error === null && data ? data : [];
    }
    loading.value = false;
    if (records.value.some(row => /^\d{3,}$/.test(String(row.approver || '')))) {
      userNames.value = await loadUserNames();
    }
  },
  { immediate: true }
);

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElIcon = __forwarded_ElIcon;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDialog = __forwarded_ElDialog;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTag = __forwarded_ElTag;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTimeline = __forwarded_ElTimeline;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTimelineItem = __forwarded_ElTimelineItem;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTabs = __forwarded_ElTabs;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTabPane = __forwarded_ElTabPane;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const GitNetworkOutline = __forwarded_GitNetworkOutline;
</script>

<template>
  <ElDialog
    :model-value="props.show"
    :width="activeTab === 'graph' ? '940px' : '680px'"
    append-to-body
    @update:model-value="(value: boolean) => emit('update:show', value)"
  >
    <template #header>
      <div class="flow-record-head">
        <span class="flow-record-head__icon">
          <ElIcon :size="18"><component :is="GitNetworkOutline" /></ElIcon>
        </span>
        <div class="min-w-0 flex-1">
          <div class="flow-record-head__title">流程记录</div>
          <div class="flow-record-head__sub truncate">
            {{ headTitle }}
            <template v-if="subTitle">· {{ subTitle }}</template>
          </div>
        </div>
      </div>
    </template>

    <div v-loading="loading">
      <!-- 未发起流程：直接给空态 -->
      <div v-if="notStarted" class="flow-record-body">
        <div class="flow-record-empty">
          该条数据暂未发起流程
          <div class="flow-record-empty__tip">表单已开启流程时，新增数据会自动发起</div>
        </div>
      </div>

      <ElTabs v-else v-model="activeTab" class="flow-record-tabs">
        <ElTabPane label="流转记录" name="timeline">
          <div class="flow-record-body">
            <!-- 概览指标 -->
            <div v-if="!notStarted" class="flow-record-stats">
              <div class="flow-record-stat">
                <div class="flow-record-stat__label">{{ statusStatLabel }}</div>
                <div class="flow-record-stat__value">
                  <ElTag v-if="statusLabel" :type="tagType(statusTone)" size="small" :bordered="false" round>
                    {{ statusLabel }}
                  </ElTag>
                  <span v-else>-</span>
                </div>
              </div>
              <div class="flow-record-stat">
                <div class="flow-record-stat__label">发起时间</div>
                <div class="flow-record-stat__value">{{ applyTimeText }}</div>
              </div>
              <div class="flow-record-stat">
                <div class="flow-record-stat__label">办理环节</div>
                <div class="flow-record-stat__value">{{ steps.length }} 个</div>
              </div>
              <div class="flow-record-stat">
                <div class="flow-record-stat__label">流转耗时</div>
                <div class="flow-record-stat__value">{{ totalDurationText }}</div>
              </div>
            </div>

            <!-- 流转轨迹 -->
            <ElTimeline v-if="timelineSteps.length" :icon-size="18" class="flow-record-timeline">
              <ElTimelineItem v-for="step in timelineSteps" :key="step.key" :type="tagType(step.tone)">
                <template #icon>
                  <span
                    class="flow-record-node"
                    :class="[`flow-record-node--${step.tone}`, { 'flow-record-node--running': step.running }]"
                  >
                    <ElIcon :size="11"><component :is="step.icon" /></ElIcon>
                  </span>
                </template>
                <div class="flow-record-card" :class="{ 'flow-record-card--running': step.running }">
                  <div class="flow-record-card__row">
                    <span class="flow-record-card__node">{{ step.nodeName }}</span>
                    <span
                      v-if="step.actionLabel"
                      class="flow-record-card__action"
                      :class="`flow-record-card__action--${step.tone}`"
                    >
                      {{ step.actionLabel }}
                    </span>
                    <span v-if="step.cooperateLabel" class="flow-record-card__coop">{{ step.cooperateLabel }}</span>
                    <span class="flow-record-card__time">{{ step.timeText }}</span>
                  </div>
                  <div class="flow-record-card__row flow-record-card__meta">
                    <span class="flow-record-card__avatar" :class="`flow-record-node--${step.tone}`">
                      {{ step.initial }}
                    </span>
                    <span class="flow-record-card__who">{{ step.approver }}</span>
                    <span v-if="step.durationText" class="flow-record-card__cost">耗时 {{ step.durationText }}</span>
                    <span v-if="step.targetText" class="flow-record-card__target">{{ step.targetText }}</span>
                  </div>
                  <div v-if="step.message" class="flow-record-card__message">{{ step.message }}</div>
                </div>
              </ElTimelineItem>
            </ElTimeline>

            <div v-if="runningHint" class="flow-record-waiting">当前等待「{{ runningHint }}」节点办理</div>

            <div v-if="!steps.length && !loading" class="flow-record-empty">
              暂无流转记录，流程已发起，等待第一节点办理
            </div>
          </div>
        </ElTabPane>

        <ElTabPane v-if="resolvedInstanceId && flowCode" label="流程图" name="graph" lazy>
          <FlowGraphPanel :instance-id="resolvedInstanceId" :flow-code="flowCode" :flow-status="statusValue" />
        </ElTabPane>
      </ElTabs>
    </div>
  </ElDialog>
</template>

<style scoped>
.flow-record-modal :deep(.n-card-header) {
  padding: 18px 20px 14px;
}

.flow-record-modal :deep(.n-card-content) {
  padding-top: 0;
}

.flow-record-head {
  align-items: center;
  display: flex;
  gap: 10px;
  min-width: 0;
}

.flow-record-head__icon {
  align-items: center;
  background: linear-gradient(135deg, #1677ff, #69a9ff);
  border-radius: 9px;
  color: #fff;
  display: flex;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.flow-record-head__title {
  color: #1d2129;
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
}

.flow-record-head__sub {
  color: #86909c;
  font-size: 12px;
  line-height: 18px;
}

.flow-record-body {
  min-height: 120px;
  max-height: 58vh;
  overflow-y: auto;
}

.flow-record-tabs :deep(.el-tabs__content) {
  overflow: visible;
}

.flow-record-tabs :deep(.el-tabs__header) {
  margin-bottom: 14px;
}

.flow-record-stats {
  background: linear-gradient(180deg, #f7f9fc, #fdfdfe);
  border: 1px solid #f0f2f5;
  border-radius: 10px;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 18px;
  padding: 12px 8px;
}

.flow-record-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding-left: 12px;
}

.flow-record-stat + .flow-record-stat {
  border-left: 1px solid #eceef2;
}

.flow-record-stat__label {
  color: #86909c;
  font-size: 12px;
  line-height: 16px;
}

.flow-record-stat__value {
  color: #1d2129;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  white-space: nowrap;
}

.flow-record-node {
  align-items: center;
  border-radius: 50%;
  color: #fff;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;
}

.flow-record-node--success {
  background: #00b42a;
}

.flow-record-node--error {
  background: #f53f3f;
}

.flow-record-node--warning {
  background: #ff7d00;
}

.flow-record-node--info {
  background: #1677ff;
}

.flow-record-node--default {
  background: #c9cdd4;
}

/* 进行中环节用脉冲光晕提示，替代静止圆点 */
.flow-record-node--running {
  animation: flow-record-pulse 1.6s ease-out infinite;
}

@keyframes flow-record-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(22, 119, 255, 0.35);
  }
  100% {
    box-shadow: 0 0 0 8px rgba(22, 119, 255, 0);
  }
}

.flow-record-card {
  background: #f7f8fa;
  border: 1px solid #f0f2f5;
  border-radius: 10px;
  margin-bottom: 16px;
  padding: 10px 14px;
}

.flow-record-card--running {
  background: #f2f7ff;
  border-color: #d6e6ff;
}

.flow-record-card__row {
  align-items: center;
  display: flex;
  gap: 8px;
  min-width: 0;
}

.flow-record-card__node {
  color: #1d2129;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}

.flow-record-card__action {
  border-radius: 4px;
  flex-shrink: 0;
  font-size: 12px;
  line-height: 18px;
  padding: 0 6px;
}

.flow-record-card__action--success {
  background: #e8ffea;
  color: #009a29;
}

.flow-record-card__action--error {
  background: #ffece8;
  color: #d92c2c;
}

.flow-record-card__action--warning {
  background: #fff7e8;
  color: #d25f00;
}

.flow-record-card__action--info {
  background: #e8f3ff;
  color: #0e63d4;
}

.flow-record-card__action--default {
  background: #f2f3f5;
  color: #4e5969;
}

.flow-record-card__coop {
  background: #f2f3f5;
  border-radius: 4px;
  color: #4e5969;
  flex-shrink: 0;
  font-size: 12px;
  line-height: 18px;
  padding: 0 6px;
}

.flow-record-card__time {
  color: #86909c;
  font-size: 12px;
  margin-left: auto;
  white-space: nowrap;
}

.flow-record-card__meta {
  color: #4e5969;
  font-size: 12px;
  line-height: 20px;
  margin-top: 2px;
}

.flow-record-card__avatar {
  align-items: center;
  border-radius: 50%;
  display: flex;
  flex-shrink: 0;
  font-size: 11px;
  height: 18px;
  justify-content: center;
  width: 18px;
}

.flow-record-card__who {
  color: #1d2129;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-record-card__cost,
.flow-record-card__target {
  color: #86909c;
  white-space: nowrap;
}

.flow-record-card__message {
  background: #fff;
  border-left: 3px solid #e5e6eb;
  border-radius: 6px;
  color: #4e5969;
  font-size: 12px;
  line-height: 18px;
  margin-top: 8px;
  padding: 6px 10px;
  white-space: pre-wrap;
  word-break: break-word;
}

.flow-record-card--running .flow-record-card__message {
  border-left-color: #bcd7ff;
}

.flow-record-timeline :deep(.n-timeline-item:last-child) .flow-record-card {
  margin-bottom: 0;
}

/* 圆点默认按 naive-ui 的标题行定位；卡片自带 10px 上内边距，需下移才与首行「节点名」居中 */
.flow-record-timeline :deep(.n-timeline-item-timeline) {
  top: 13px;
}

.flow-record-empty {
  color: #86909c;
  font-size: 13px;
  padding: 36px 0;
  text-align: center;
}

.flow-record-empty__tip {
  color: #c9cdd4;
  font-size: 12px;
  line-height: 20px;
  margin-top: 4px;
}

.flow-record-waiting {
  background: #f7f8fa;
  border-radius: 8px;
  color: #4e5969;
  font-size: 12px;
  line-height: 20px;
  margin-top: 4px;
  padding: 8px 12px;
  text-align: center;
}
</style>
