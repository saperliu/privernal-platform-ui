<script setup lang="tsx">
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { ElButton as __forwarded_ElButton, ElDropdown as __forwarded_ElDropdown } from 'element-plus';
import {
  activeFlowDefinition,
  findFlowDefinitionList,
  publishFlowDefinition,
  unactiveFlowDefinition,
  unpublishFlowDefinition
} from '@/service';
import {
  type FlowDesignerModule,
  loadWarmFlowDesigner,
  setCurrentDefinitionPublished,
  setCurrentFormCode
} from '@/libs/warm-flow-designer';
import FlowConditionEditor from '@/views/flow/components/flow-condition-editor.vue';
import NodeFormPermPanel from './node-form-perm-panel.vue';

export interface Props {
  /** 表单编码（数据库表名） */
  tableCode: string;
  /** 表单名称 */
  tableName: string;
  /** 表单ID */
  formId: string;
  /** 是否启用工作流 0 未启用 1 启用 */
  isWorkflow: number;
  /** 工作流标识 */
  workflowCode: string;
}
defineOptions({ name: 'FlowDesignPanel' });

const props = withDefaults(defineProps<Props>(), {
  tableCode: '',
  tableName: '',
  formId: '',
  isWorkflow: 0,
  workflowCode: ''
});

interface Emits {
  /** 流程开启 / 关闭，由父组件统一持久化 isWorkflow + workflowCode */
  (e: 'toggle', payload: { isWorkflow: number; workflowCode: string }): void;
}

const emit = defineEmits<Emits>();
const moduleRef = shallowRef<FlowDesignerModule | null>(null);
const designerLoading = ref(true);
const definitionLoading = ref(false);

/** flowCode 下的流程定义版本列表 */
const definitionList = ref<FlowNamespace.Definition[]>([]);
/** 当前画布加载的定义 */
const currentDefinitionId = ref<string>('');
/**
 * 版本列表是否已解析完成：设计器必须等列表就绪后再挂载。
 * 否则先以 key='new' 挂载出一张默认模板图，列表返回后 remount 才载入真实定义；
 * 若此时用户已保存，会把默认模板存成重复定义/覆盖设计，表现为"再打开流程图与保存的不一致"
 */
const defListReady = ref(false);

const hasDefinition = computed(() => definitionList.value.length > 0);
const currentDefinition = computed(
  () => definitionList.value.find(item => String(item.id) === currentDefinitionId.value) ?? null
);
const isPublished = computed(() => currentDefinition.value?.isPublish === 1);
const isActive = computed(() => currentDefinition.value?.activityStatus === 1);

/** 画布重挂载计数：点「重置」重载当前版本时 key 变化强制重建设计器，丢弃未保存修改 */
const designerReloadKey = ref(0);

/** ===== 调色板节点图标（SVG 字符串，经 innerHTML 渲染，风格对齐设计器内置图标） ===== */
const WF_ICON_BG = 'var(--wf-icon-bg, #ffffff)';
const WF_START_ICON = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="42" fill="${WF_ICON_BG}" stroke="rgb(56,161,105)" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="30" fill="rgba(56,161,105,0.35)"/>
</svg>`;
const WF_BETWEEN_ICON = `
<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="90" height="70" rx="8" fill="${WF_ICON_BG}" stroke="rgb(37,99,235)" stroke-width="1.5"/>
  <rect x="12" y="10" width="32" height="26" rx="5" ry="5" fill="rgba(37,99,235,0.08)" stroke="rgb(37,99,235)" stroke-width="1.2"/>
  <circle cx="28" cy="23" r="5.5" fill="rgba(37,99,235,0.15)" stroke="rgb(37,99,235)" stroke-width="1"/>
  <path d="M24 23l4 4l6-6" fill="none" stroke="rgb(37,99,235)" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"/>
</svg>`;
/** 抄送节点：卡片 + 信封 + 右上角纸飞机，青绿色区分审批节点 */
const WF_CC_ICON = `
<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="90" height="70" rx="8" fill="${WF_ICON_BG}" stroke="rgb(13,148,136)" stroke-width="1.5"/>
  <rect x="12" y="14" width="46" height="32" rx="5" ry="5" fill="rgba(13,148,136,0.08)" stroke="rgb(13,148,136)" stroke-width="1.2"/>
  <path d="M15 18 L35 35 L55 18" fill="none" stroke="rgb(13,148,136)" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M64 18 L84 12 L76 26 L84 28 L64 42 Z" fill="rgb(13,148,136)" opacity="0.85"/>
</svg>`;
const WF_END_ICON = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="42" fill="${WF_ICON_BG}" stroke="rgb(229,57,53)" stroke-width="3.5"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(229,57,53,0.25)" stroke-width="1"/>
</svg>`;

const designProps = computed(() => ({
  definitionId: currentDefinitionId.value || null,
  disabled: false,
  // 只进流程设计步骤：基础信息全部默认值（flowCode/名称/经典模型已预填），
  // 设计器隐藏「基础信息/流程设计」步骤栏并直接进入画布
  onlyDesignShow: true,
  // 基础节点面板：开始/审批/抄送/结束（抄送为中间节点 + ext.nodeKind=cc 标记，
  // 属性面板据此切换为精简面板，仅节点编码/名称 + 抄送人员）
  paletteNodes: {
    flowNodes: [
      { type: 'start', text: '开始', label: '开始', icon: WF_START_ICON },
      {
        type: 'between',
        text: '中间节点',
        label: '中间节点',
        icon: WF_BETWEEN_ICON,
        properties: { collaborativeWay: '1' }
      },
      {
        type: 'between',
        text: '抄送节点',
        label: '抄送',
        icon: WF_CC_ICON,
        properties: { collaborativeWay: '1', ext: { nodeKind: 'cc' } }
      },
      { type: 'end', text: '结束', label: '结束', icon: WF_END_ICON }
    ]
  },
  // 新建态预填基础信息，保证保存时 flowCode 与表单绑定
  initialJson: hasDefinition.value
    ? null
    : JSON.stringify({
        flowName: props.tableName || props.tableCode,
        flowCode: props.workflowCode || `flow_${props.tableCode}`,
        // 新流程默认经典模型：可自由拖拽连线（钉钉模型拖入节点不自动接线，易漏线导致
        // 后端校验"开始或者中间节点必须画跳转线"报错）；预填后设计器模型必填项也无需手选
        modelValue: 'CLASSICS',
        // 动态表单流程统一归类，业务人员无需维护分类
        category: 'dynamic',
        categoryList: [{ id: 'dynamic', name: '动态表单' }],
        // 审批页固定走低代码表单页，业务人员不可改
        formCustom: 'Y',
        formPath: props.tableCode ? `/builder/${props.tableCode}` : '',
        formPathList: props.tableCode
          ? [{ id: `/builder/${props.tableCode}`, name: props.tableName || props.tableCode, children: [] }]
          : [],
        remark: '',
        nodeList: []
      })
}));

async function initDesigner() {
  try {
    designerLoading.value = true;
    moduleRef.value = await loadWarmFlowDesigner();
  } catch (e) {
    console.error('加载流程设计器失败', e);
    window.$message?.error('流程设计器加载失败');
  } finally {
    designerLoading.value = false;
  }
}

// 节点表单绑定的默认值来源：保存时所有节点统一传 自定义表单=是、表单唯一标识=本表单编码
watch(
  () => props.tableCode,
  code => {
    setCurrentFormCode(code);
  },
  { immediate: true }
);

// 已发布流程的编辑在保存时另存为新版本（旧实例继续走旧版本直到完成）
watch(
  () => currentDefinition.value?.isPublish,
  isPublish => {
    setCurrentDefinitionPublished(isPublish === 1);
  },
  { immediate: true }
);

/** 查询当前表单绑定的流程定义版本 */
async function getDefinitionList() {
  if (!props.workflowCode) {
    defListReady.value = true;
    return;
  }
  definitionLoading.value = true;
  try {
    const { data, error } = await findFlowDefinitionList({
      flowCode: props.workflowCode,
      pageNum: 1,
      pageSize: 50,
      keywords: []
    });
    if (error === null && data) {
      definitionList.value = data.list ?? [];
      if (definitionList.value.length) {
        // 优先选中已发布的版本，否则取第一条
        const published = definitionList.value.find(item => item.isPublish === 1);
        if (!definitionList.value.some(item => String(item.id) === currentDefinitionId.value)) {
          currentDefinitionId.value = String((published ?? definitionList.value[0]).id);
        }
      } else {
        currentDefinitionId.value = '';
      }
    }
  } finally {
    definitionLoading.value = false;
    defListReady.value = true;
  }
}

/** 开启流程：生成 flowCode 并交给父组件持久化 */
function handleEnableFlow() {
  window.$dialog?.info({
    title: '开启流程',
    content: `确定为表单「${props.tableName || props.tableCode}」开启审批流程吗？开启后提交数据将进入流程审批。`,
    positiveText: '开启',
    negativeText: '取消',
    onPositiveClick: () => {
      emit('toggle', { isWorkflow: 1, workflowCode: props.workflowCode || `flow_${props.tableCode}` });
      window.$message?.success('流程已开启，请完成流程设计并发布');
    }
  });
}

/** 关闭流程 */
function handleCloseFlow() {
  window.$dialog?.warning({
    title: '关闭流程',
    content: '关闭后该表单提交数据不再走审批流程，运行中的流程实例不受影响。确定关闭吗？',
    positiveText: '关闭流程',
    negativeText: '取消',
    onPositiveClick: () => {
      emit('toggle', { isWorkflow: 0, workflowCode: props.workflowCode });
      window.$message?.success('流程已关闭');
    }
  });
}

/** 发布当前定义版本 */
function handlePublish() {
  if (!currentDefinitionId.value) return;
  publishFlowDefinition(currentDefinitionId.value).then(res => {
    if (res.error === null) {
      window.$message?.success('流程发布成功，新提交数据按新版本流转');
      getDefinitionList();
    }
  });
}

/** 停用发布 */
function handleUnpublish() {
  if (!currentDefinitionId.value) return;
  window.$dialog?.warning({
    title: '停用发布',
    content: '停用后新数据将无法按该版本发起流程，确定停用吗？',
    positiveText: '停用',
    negativeText: '取消',
    onPositiveClick: () => {
      unpublishFlowDefinition(currentDefinitionId.value).then(res => {
        if (res.error === null) {
          window.$message?.success('流程已停用发布');
          getDefinitionList();
        }
      });
    }
  });
}

/** 激活 / 挂起 */
function handleToggleActive() {
  if (!currentDefinitionId.value) return;
  const request = isActive.value ? unactiveFlowDefinition : activeFlowDefinition;
  request(currentDefinitionId.value).then(res => {
    if (res.error === null) {
      window.$message?.success(isActive.value ? '流程已挂起，进行中的实例暂停流转' : '流程已激活');
      getDefinitionList();
    }
  });
}

function onSaved(payload: any) {
  const id = payload?.data?.id || payload?.id;
  if (id) currentDefinitionId.value = String(id);
  window.$message?.success('流程设计保存成功');
  getDefinitionList();
}

function onReady() {
  if (!currentDefinitionId.value && definitionList.value.length) {
    currentDefinitionId.value = String(definitionList.value[0].id);
  }
}

/** 版本下拉选项：vN · 状态（版本多时下拉内滚动，不占版面） */
const versionOptions = computed(() =>
  definitionList.value.map(item => ({
    label: `v${item.version} · ${isPublishLabel(item.isPublish).label}${item.activityStatus === 0 ? ' · 已挂起' : ''}`,
    value: String(item.id)
  }))
);

/** 切换/选择版本 = 载入该版本到画布 */
function handleVersionChange(id: string) {
  if (id !== currentDefinitionId.value) {
    currentDefinitionId.value = id;
  } else {
    designerReloadKey.value += 1;
  }
}

/** 重置画布：丢弃未保存修改，重新载入当前版本 */
function handleResetCanvas() {
  designerReloadKey.value += 1;
  window.$message?.success('已重置为当前保存的版本');
}

/** 复制流程编码 */
async function copyFlowCode() {
  try {
    await navigator.clipboard.writeText(props.workflowCode);
    window.$message?.success('流程编码已复制');
  } catch {
    window.$message?.warning('复制失败，请手动选择复制');
  }
}

/** 更多操作（挂起/激活、关闭流程） */
const moreOptions = computed(() => [
  { key: 'toggleActive', label: isActive.value ? '挂起流程' : '激活流程' },
  { key: 'close', label: '关闭流程', danger: true }
]);

function handleMoreAction(key: string) {
  if (key === 'toggleActive') {
    window.$dialog?.warning({
      title: isActive.value ? '挂起流程' : '激活流程',
      content: isActive.value
        ? '挂起后进行中的实例暂停流转，新数据仍可发起但不会流转。确定挂起吗？'
        : '激活后流程恢复流转。确定激活吗？',
      positiveText: isActive.value ? '挂起' : '激活',
      negativeText: '取消',
      onPositiveClick: () => handleToggleActive()
    });
  } else if (key === 'close') {
    window.$dialog?.warning({
      title: '关闭流程',
      content: '关闭后该表单提交数据不再走审批流程，运行中的流程实例不受影响。确定关闭吗？',
      positiveText: '关闭流程',
      negativeText: '取消',
      onPositiveClick: () => handleCloseFlow()
    });
  }
}

function isPublishLabel(isPublish: number) {
  if (isPublish === 1) return { label: '已发布', type: 'success' as const };
  if (isPublish === 9) return { label: '已失效', type: 'error' as const };
  return { label: '未发布', type: 'default' as const };
}

onMounted(async () => {
  await initDesigner();
  await getDefinitionList();
});

defineExpose({
  reload: getDefinitionList
});

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDropdown = __forwarded_ElDropdown;
</script>

<template>
  <div class="flow-panel">
    <!-- 未开启流程：引导开启 -->
    <div v-if="isWorkflow !== 1" class="flow-guide">
      <div class="guide-card">
        <span class="guide-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
            <path d="M12 4v3M12 17v3M6.5 7.5h4M13.5 7.5h4M6.5 16.5h11" />
            <rect x="3" y="10" width="7" height="4" rx="1.2" />
            <rect x="14" y="10" width="7" height="4" rx="1.2" />
            <rect x="9.5" y="2.5" width="5" height="3.5" rx="1.2" />
          </svg>
        </span>
        <h3 class="guide-title">该表单尚未开启审批流程</h3>
        <p class="guide-desc">开启后即可在此设计审批节点，表单提交的数据会按流程流转</p>
        <ElButton type="primary" @click="handleEnableFlow">开启流程</ElButton>
      </div>
    </div>

    <!-- 已开启流程：工具条与画布合成一张卡片，不再各自一块白底 -->
    <div v-else class="flow-card">
      <div class="flow-bar">
        <span class="bar-code" :title="`流程编码：${workflowCode}（点击复制）`" @click="copyFlowCode">
          {{ workflowCode }}
        </span>

        <span class="bar-sep"></span>

        <ElSelect
          class="bar-version"
          :model-value="currentDefinitionId || null"
          :loading="definitionLoading"
          :placeholder="hasDefinition ? '选择版本' : '尚未保存流程定义'"
          :disabled="!hasDefinition"
          size="small"
          @change="handleVersionChange"
        >
          <ElOption v-for="opt in versionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>

        <span
          v-if="currentDefinition"
          class="state-pill"
          :class="isPublished ? 'is-on' : 'is-off'"
          :title="isPublished ? '已发布：新提交数据按此版本流转' : '未发布：仅设计态，不参与流转'"
        >
          <i class="state-dot"></i>
          {{ isPublishLabel(currentDefinition.isPublish).label }}
        </span>
        <span
          v-if="currentDefinition"
          class="state-pill"
          :class="isActive ? 'is-on' : 'is-warn'"
          :title="isActive ? '已激活：流程正常流转' : '已挂起：进行中的实例暂停流转'"
        >
          <i class="state-dot"></i>
          {{ isActive ? '已激活' : '已挂起' }}
        </span>

        <span class="bar-spacer"></span>

        <ElButton
          size="small"
          quaternary
          :disabled="!currentDefinitionId"
          title="丢弃画布上未保存的修改，重新载入当前版本"
          @click="handleResetCanvas"
        >
          重置
        </ElButton>
        <ElButton
          v-if="!isPublished"
          size="small"
          type="primary"
          :disabled="!currentDefinitionId"
          title="发布当前版本：新提交数据按此版本流转"
          @click="handlePublish"
        >
          发布
        </ElButton>
        <ElPopconfirm
          v-else
          title="停用后新数据将无法按该版本发起流程，确定停用吗？"
          confirm-button-text="确认"
          cancel-button-text="取消"
          width="280"
          @confirm="handleUnpublish"
        >
          <template #reference>
            <ElButton size="small" type="warning" plain>停用发布</ElButton>
          </template>
        </ElPopconfirm>
        <ElDropdown :options="moreOptions" trigger="click" @select="handleMoreAction">
          <ElButton size="small" quaternary title="更多操作">⋯</ElButton>
        </ElDropdown>
      </div>

      <div class="flow-canvas">
        <div v-if="designerLoading" class="canvas-mask">
          <div v-loading="true" element-loading-text="流程设计器加载中..."></div>
        </div>
        <component
          :is="moduleRef?.FlowDesigner"
          v-else-if="moduleRef && defListReady"
          :key="(currentDefinitionId || 'new') + '-' + designerReloadKey"
          v-bind="designProps"
          @saved="onSaved"
          @ready="onReady"
        >
          <!-- 节点属性面板扩展（对齐旧 wfs：节点规则 / 操作权限 / 流程按钮） -->
          <template #node-form-extra="{ form, disabled, nodes }">
            <NodeFormPermPanel
              :form="form"
              :disabled="disabled"
              :table-code="tableCode"
              :flow-code="workflowCode"
              :nodes="nodes"
            />
          </template>
          <!-- 网关连线「节点流转条件」：替换边面板内置的运算符条件行（表达式编辑弹窗，wfexpr 策略） -->
          <template #skip-condition="{ form, disabled }">
            <FlowConditionEditor :form="form" :disabled="disabled" :table-code="tableCode" />
          </template>
          <template #loading>
            <div class="canvas-mask">
              <div v-loading="true" element-loading-text="流程加载中..."></div>
            </div>
          </template>
        </component>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flow-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* ===== 未开启流程的引导卡片 ===== */
.flow-guide {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.guide-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  width: 420px;
  padding: 36px 32px 32px;
  text-align: center;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 14px;
  box-shadow: var(--ds-shadow-sm);
}

.guide-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-bottom: 6px;
  color: rgb(var(--primary-color));
  background: rgb(var(--primary-color) / 8%);
  border-radius: 14px;
}

.guide-icon svg {
  width: 28px;
  height: 28px;
}

.guide-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ds-text);
}

.guide-desc {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ds-text-weak);
}

/* ===== 工具条 + 画布合为一张卡片 ===== */
.flow-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 12px;
  box-shadow: var(--ds-shadow-xs);
}

.flow-bar {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  height: 44px;
  padding: 0 12px;
  border-bottom: 1px solid var(--ds-border);
}

.bar-code {
  padding: 3px 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--ds-text-sub);
  white-space: nowrap;
  cursor: pointer;
  background: var(--ds-canvas);
  border: 1px solid var(--ds-border);
  border-radius: 5px;
  transition:
    color 0.16s ease,
    border-color 0.16s ease;
}

.bar-code:hover {
  color: rgb(var(--primary-color));
  border-color: rgb(var(--primary-color) / 45%);
}

.bar-sep {
  width: 1px;
  height: 18px;
  background: var(--ds-border);
}

.bar-version {
  width: 168px;
}

.bar-spacer {
  flex: 1;
}

/* 状态胶囊：圆点表意 + 文字，避免工具条上散落裸圆点 */
.state-pill {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  font-size: 12px;
  white-space: nowrap;
  border: 1px solid var(--ds-border);
  border-radius: 11px;
}

.state-pill.is-on {
  color: #18a058;
  background: rgb(24 160 88 / 8%);
  border-color: rgb(24 160 88 / 24%);
}

.state-pill.is-warn {
  color: #dd6b20;
  background: rgb(221 107 32 / 8%);
  border-color: rgb(221 107 32 / 24%);
}

.state-pill.is-off {
  color: var(--ds-text-weak);
  background: var(--ds-canvas);
}

.state-dot {
  width: 6px;
  height: 6px;
  background: currentcolor;
  border-radius: 50%;
}

.flow-canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.canvas-mask {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ds-surface);
}

/* ===== warm-flow 设计器定制：面向业务人员的动态表单流程 ===== */

/* 隐藏「自定义表单」开关：基础信息中唯一的 switch，固定为是（Y），路径由 initialJson 统一预填
   （EP 迁移后类名是 .el-form-item/.el-switch，原先的 .n-* 永不匹配，字段一直暴露着） */
:deep(.dialogForm .el-form-item:has(.el-switch)) {
  display: none;
}

/* 隐藏「表单唯一标识/表单路径」行（紧随自定义表单开关之后），动态表单本身即自定义表单，路径已预填 */
:deep(.dialogForm .el-form-item:has(.el-switch) + .el-form-item) {
  display: none;
}

/* 隐藏「监听器配置」区块：业务人员不配置监听器（第二个 form-section） */
:deep(.dialogForm > .form-section:last-of-type) {
  display: none;
}

/* 「设计器模型」提示换行显示，避免与模型卡片重叠截断 */
:deep(.el-form-item:has(.radio-card-group) .el-form-item__content) {
  flex-wrap: wrap;
}

:deep(.radio-card-group) {
  flex: 1 1 100%;
}

/* 基础信息表单限宽居中，超宽屏下输入框不至于拉满整行 */
:deep(.app-container) {
  max-width: 920px;
  margin: 0 auto;
  padding: 20px 32px 40px;
}

/* 画布左侧节点面板标题不被裁剪 */
:deep(.phoenix-left-sidebar) *,
:deep([class*='sidebar'] [class*='title']) {
  overflow: visible;
}
</style>

<style lang="scss">
/* ===== warm-flow 设计器嵌入区（画布+左侧节点栏+顶部小工具条）=====
   这些类名来自打包好的设计器产物，只在 .flow-canvas 内做限定，避免影响 /flow/designer 独立页 */
.flow-canvas .design-toolbar {
  /* 设计器产物在 toolbar 上写了内联 padding，必须 important 才能留出右边距 */
  padding: 6px 10px !important;
  background: var(--ds-surface);
  border-bottom: 1px solid var(--ds-border);
}

.flow-canvas .design-toolbar .toolbar-group {
  gap: 6px;
}

.flow-canvas .diagram-sidebar {
  background: var(--ds-canvas);
  border-right: 1px solid var(--ds-border);
}

.flow-canvas .diagram-sidebar .group-title {
  font-weight: 600;
  color: var(--ds-text-weak);
  letter-spacing: 0.02em;
}

/* 节点抽屉项：默认无底色，悬停时才出现色块，补齐静态边界与反馈 */
.flow-canvas .sidebar-item {
  border: 1px solid var(--ds-border);
  border-radius: 8px;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;
}

.flow-canvas .sidebar-item:hover {
  background: rgb(var(--primary-color) / 6%);
  border-color: rgb(var(--primary-color) / 35%);
}

/* ===== 节点属性抽屉与钉钉画布定制（抽屉 append-to-body 传送至 body，必须用全局样式） ===== */

/* 属性抽屉：只保留「基础设置」一个分区，「办理人设置」「监听器」入口对业务人员隐藏
   （办理人配置由扩展面板的人员设置承担，监听器面向开发人员） */
.property-drawer-modern .modern-tab-item:nth-child(n + 2) {
  display: none;
}

/* 节点属性「基础设置」：隐藏「自定义表单」卡片行（radio-card-sm 组合为该行独有）
   与其后条件渲染的「表单唯一标识/表单路径」行（formCustom 未设值时该行不渲染，
   相邻兄弟会落到 node-perm-panel 根 div 上，不匹配选择器，人员设置不受影响）。
   保存时由 dataProvider.saveJson 统一默认：formCustom=Y、formPath=本表单编码。
   EP 迁移后同样要换成 .el-form-item（原先 .n-form-item 从未命中）。 */
.property-drawer-modern .el-form-item:has(.radio-card-group.radio-card-sm),
.property-drawer-modern .el-form-item:has(.radio-card-group.radio-card-sm) + .el-form-item {
  display: none;
}

/* 属性抽屉 body 的原生滚动条：轨道右缘贯穿到 TAB 区旁，视觉上像 TAB 右侧多了滚动条；
   隐藏滚动条但保留滚动能力 */
.property-drawer-modern .el-drawer__body {
  scrollbar-width: none;
}

.property-drawer-modern .el-drawer__body::-webkit-scrollbar {
  display: none;
}

/* 钉钉（MIMIC）模型节点：名称与办理人名单单行省略显示，
   修复长文字换行两行后被 base-node 的 overflow:hidden 裁剪的问题（悬停有 title 全文提示） */
.base-node .top-section span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* 应用全局 reset（reset.css）把 svg 设为 display:block，节点名后的编辑图标被挤到第二行裁掉，
   这里恢复行内排版并禁止在 flex 中被压缩，保证名称与编辑图标水平摆放 */
.base-node .top-section span:first-child svg {
  display: inline-block;
  flex-shrink: 0;
}

.base-node .bottom-section {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: auto;
}
</style>
