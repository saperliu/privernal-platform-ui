<script setup lang="ts">
import { nextTick, ref, shallowRef, watch } from 'vue';
import {
  ElAlert as __forwarded_ElAlert,
  ElEmpty as __forwarded_ElEmpty,
  ElLoading as __forwarded_ElLoadingDirective
} from 'element-plus';
import { findFlowDefinitionDetail, findFlowDefinitionList, getFlowInstanceNodes } from '@/service';
import { type FlowDesignerModule, loadWarmFlowDesigner } from '@/libs/warm-flow-designer';

/**
 * 流程图回显：按实例节点状态给定义画布着色
 * 已办理=绿 / 当前节点=橙(虚线) / 未到达=灰（warm-flow 设计器内置 status 着色机制）
 */
const props = defineProps<{
  /** 流程实例 id（决定节点状态数据来源） */
  instanceId?: string | null;
  /** 流程编码（用于解析当前发布版定义） */
  flowCode?: string;
  /** 实例流程状态；办结态会把结束节点标记为已到达 */
  flowStatus?: string;
}>();

const vLoading = __forwarded_ElLoadingDirective;

/** warm-flow flow_status 的办结态：审批通过/自动完成/已完成 */
const FINISHED_FLOW_STATUS = new Set(['2', '3', '8']);

const loading = ref(false);
const loadFailed = ref(false);
const designerModule = shallowRef<FlowDesignerModule | null>(null);
/** FlowDesigner 组件实例（取底层 LogicFlow 用） */
const designerComp = ref<any>(null);
/** 注入节点状态后的 warm-flow 定义 JSON；变化时配合 :key 重挂设计器重渲染 */
const graphJson = shallowRef<Record<string, any> | null>(null);
const graphVersion = ref(0);

/**
 * 设计器挂载时全局置 __WF_FLOW_DESIGN_MODE__=true（节点一律用类型语义色、不判断运行状态），
 * 会覆盖本组件依赖的内置 status 着色。画布渲染完成后关掉设计模式并重渲染，
 * 让「已办理绿 / 当前橙虚线 / 未到达灰」生效，再自适应缩放。
 */
async function applyStatusColors() {
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 350));
  try {
    (window as any).__WF_FLOW_DESIGN_MODE__ = false;
    const lf = designerComp.value?.getLogicFlow?.();
    if (!lf) return;
    lf.render(lf.getGraphRawData());
    // 画布尺寸/transform 在渲染后仍会稳定几次，多次 fitView 确保全图入视口（对齐设计器自身的重试节奏）
    [150, 400, 800].forEach(delay => {
      setTimeout(() => designerComp.value?.fitView?.(), delay);
    });
  } catch (e) {
    console.error('流程图状态着色失败', e);
  }
}

interface WfSkipJson {
  nowNodeCode?: string;
  nextNodeCode?: string;
  status?: number;
  [key: string]: any;
}

interface WfNodeJson {
  nodeCode?: string;
  nodeType?: number | string;
  status?: number;
  skipList?: WfSkipJson[];
  [key: string]: any;
}

/** 网关与结束节点在引擎里不产生待办任务，只要前驱已完成就视为已流过（不动点传播） */
const GATEWAY_NODE_TYPES = new Set([3, 4, 5, '3', '4', '5']);

/**
 * 兼容 AI/早期保存的定义：节点坐标只有 "x,y" 没有 "|tx,ty" 文本锚点段时，
 * 设计器把节点文本渲染在画布原点 (0,0) 全部叠在一起。补成文本居中于节点。
 */
function normalizeCoordinates(defJson: Record<string, any>) {
  (defJson.nodeList as any[]).forEach((node, index) => {
    const coordinate = String(node.coordinate ?? '');
    if (!coordinate) {
      const y = 80 + index * 120;
      node.coordinate = `200,${y}|200,${y}`;
      return;
    }
    if (!coordinate.includes('|')) {
      node.coordinate = `${coordinate}|${coordinate}`;
    }
  });
}

function buildStatusMap(nodeList: WfNodeJson[], nodeInfos: FlowNamespace.FlowNodeInfoDTO[], finished: boolean) {
  const statusByCode = new Map<string, number>();
  nodeInfos.forEach(info => {
    const status = info.nodeStatus === 'COMPLETED' ? 2 : info.nodeStatus === 'ACTIVE' ? 1 : 0;
    statusByCode.set(String(info.nodeCode), status);
  });
  if (finished) {
    nodeList.forEach(node => {
      if (Number(node.nodeType) === 2) statusByCode.set(String(node.nodeCode), 2);
    });
  }
  const allSkips: WfSkipJson[] = nodeList.flatMap(node => (Array.isArray(node.skipList) ? node.skipList : []));
  let changed = true;
  let guard = 0;
  while (changed && guard < 20) {
    changed = false;
    guard += 1;
    for (const skip of allSkips) {
      const from = statusByCode.get(String(skip.nowNodeCode)) ?? 0;
      const target = nodeList.find(node => String(node.nodeCode) === String(skip.nextNodeCode));
      if (!target || (Number(target.nodeType) !== 2 && !GATEWAY_NODE_TYPES.has(target.nodeType as number))) continue;
      if (from === 2 && (statusByCode.get(String(skip.nextNodeCode)) ?? 0) === 0) {
        statusByCode.set(String(skip.nextNodeCode), 2);
        changed = true;
      }
    }
  }
  return statusByCode;
}

function mergeStatusIntoDefinition(definition: Record<string, any>, nodeInfos: FlowNamespace.FlowNodeInfoDTO[]) {
  const finished = FINISHED_FLOW_STATUS.has(String(props.flowStatus ?? ''));
  const statusByCode = buildStatusMap(definition.nodeList || [], nodeInfos, finished);
  (definition.nodeList as WfNodeJson[]).forEach(node => {
    node.status = statusByCode.get(String(node.nodeCode)) ?? 0;
    (node.skipList || []).forEach(skip => {
      const from = statusByCode.get(String(skip.nowNodeCode)) ?? 0;
      const to = statusByCode.get(String(skip.nextNodeCode)) ?? 0;
      skip.status = from === 2 && to >= 1 ? 2 : 0;
    });
  });
  return definition;
}

async function loadGraph() {
  if (!props.instanceId || !props.flowCode) return;
  loading.value = true;
  loadFailed.value = false;
  try {
    if (!designerModule.value) {
      designerModule.value = await loadWarmFlowDesigner();
    }
    const { data: defPage } = await findFlowDefinitionList({
      flowCode: props.flowCode,
      isPublish: 1,
      pageNum: 1,
      pageSize: 10,
      keywords: []
    });
    const definitionId = defPage?.list?.[0]?.id;
    if (!definitionId) {
      loadFailed.value = true;
      return;
    }
    const { data: definition } = await findFlowDefinitionDetail(definitionId);
    // 后端 /definition/{id} 返回的 DefJson 已展开：nodeList/skipList 在顶层（无 flowDefinition 包装）；
    // 兼容历史响应形态（flowDefinition 为 JSON 字符串）
    const defRow = definition as unknown as { flowDefinition?: string | Record<string, any>; nodeList?: any[] } | null;
    let defJson: Record<string, any> | null = null;
    if (defRow?.flowDefinition) {
      defJson = typeof defRow.flowDefinition === 'string' ? JSON.parse(defRow.flowDefinition) : defRow.flowDefinition;
    } else if (Array.isArray(defRow?.nodeList)) {
      defJson = { ...defRow };
    }
    const { data: nodeInfos } = await getFlowInstanceNodes(props.instanceId);
    if (!defJson || !Array.isArray(defJson.nodeList)) {
      loadFailed.value = true;
      return;
    }
    normalizeCoordinates(defJson);
    graphJson.value = mergeStatusIntoDefinition(defJson, nodeInfos || []);
    graphVersion.value += 1;
    applyStatusColors();
  } catch (e) {
    console.error('加载流程图失败', e);
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.instanceId, props.flowCode],
  () => {
    graphJson.value = null;
    if (props.instanceId && props.flowCode) {
      loadGraph();
    }
  },
  { immediate: true }
);

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElEmpty = __forwarded_ElEmpty;
const ElAlert = __forwarded_ElAlert;
</script>

<template>
  <div class="flow-graph-panel">
    <div v-if="loading" v-loading="true" class="flow-graph-panel__loading" element-loading-text="流程图加载中..." />
    <ElAlert
      v-else-if="loadFailed"
      type="warning"
      :closable="false"
      title="流程图加载失败"
      description="未找到已发布的流程定义，请确认流程已发布后重试"
    />
    <template v-else-if="graphJson && designerModule">
      <div class="flow-graph-panel__legend">
        <span class="flow-graph-panel__legend-item">
          <i class="flow-graph-panel__dot flow-graph-panel__dot--done" />
          已办理
        </span>
        <span class="flow-graph-panel__legend-item">
          <i class="flow-graph-panel__dot flow-graph-panel__dot--running" />
          当前节点
        </span>
        <span class="flow-graph-panel__legend-item">
          <i class="flow-graph-panel__dot flow-graph-panel__dot--pending" />
          未到达
        </span>
      </div>
      <div class="flow-graph-panel__canvas">
        <component
          :is="designerModule.FlowDesigner"
          :key="graphVersion"
          ref="designerComp"
          :json="graphJson"
          :disabled="true"
          :only-design-show="true"
        />
      </div>
    </template>
    <ElEmpty v-else description="暂无流程数据" />
  </div>
</template>

<style scoped>
.flow-graph-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flow-graph-panel__loading {
  height: 320px;
}

.flow-graph-panel__legend {
  display: flex;
  flex-shrink: 0;
  gap: 18px;
  justify-content: flex-end;
  padding-right: 4px;
}

.flow-graph-panel__legend-item {
  align-items: center;
  color: #4e5969;
  display: flex;
  font-size: 12px;
  gap: 6px;
}

.flow-graph-panel__dot {
  border-radius: 50%;
  display: inline-block;
  height: 10px;
  width: 10px;
}

.flow-graph-panel__dot--done {
  background: rgb(56, 161, 105);
}

.flow-graph-panel__dot--running {
  background: rgb(245, 158, 11);
}

.flow-graph-panel__dot--pending {
  background: rgb(107, 114, 128);
}

.flow-graph-panel__canvas {
  border: 1px solid #f0f2f5;
  border-radius: 10px;
  height: calc(60vh - 60px);
  min-height: 360px;
  overflow: hidden;
}

/* 查看态隐藏设计器左侧「基础节点」拖拽面板 */
.flow-graph-panel__canvas :deep(.diagram-sidebar) {
  display: none;
}
</style>
