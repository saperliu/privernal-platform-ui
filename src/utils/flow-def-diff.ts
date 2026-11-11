/**
 * 流程定义版本对比（R2-18 ①）——纯函数，node 可直跑断言。
 *
 * 输入是两版定义详情里的 DefJson（GET /definition/{id} 的 flowDefinition 字段，
 * 含 nodeList/skipList），与设计器保存链路同构。对比口径与 datav-diff 一致：
 * 输出给人读的语义分组（新增/删除/修改的节点、连线、定义级字段）。
 *
 * 两个刻意的降噪决定：
 *  - 坐标（coordinate）不参与修改判定——拖动节点即变，不是审计关心的问题；
 *  - handlerType/handlerPath（办理人处理器）不参与——平台保存链路不落库，
 *    两版详情里一个是设计器产物一个是回读产物，比了必是假差异。
 */

export interface FlowNodeDiffEntry {
  code: string;

  name: string;

  /** 节点类型可读名：开始/审批/抄送/子流程/结束/网关 */
  typeLabel: string;

  /** 修改项里列出变化区域：名称/办理人/协作方式/驳回落点/监听器/表单绑定/超时/扩展属性（新增/删除项无） */
  areas?: string[];
}

export interface FlowSkipDiffEntry {
  /** "A->B" 形式的连线键 */
  key: string;

  label: string;

  /** 修改项里列出变化区域：跳转类型/条件/名称（新增/删除项无） */
  areas?: string[];
}

export interface FlowDefDiff {
  /** 定义级变化的字段可读名（流程名称/模型/分类/表单绑定/监听器） */
  defChanged: string[];

  nodesAdded: FlowNodeDiffEntry[];

  nodesRemoved: FlowNodeDiffEntry[];

  nodesChanged: FlowNodeDiffEntry[];

  skipsAdded: FlowSkipDiffEntry[];

  skipsRemoved: FlowSkipDiffEntry[];

  skipsChanged: FlowSkipDiffEntry[];
}

type RawNode = Record<string, any>;
type RawSkip = Record<string, any>;

/** JSON 稳定序列化：对象键序不影响「没变」的判定（照 datav-diff.stableJson） */
function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map(key => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
    .join(',')}}`;
}

/** ext 存库形态是 "[{code,value}]" JSON 字符串，回读也可能是对象/数组，统一解析成键值表 */
function parseExtMap(node: RawNode): Record<string, any> {
  return parseExtValue(node?.ext);
}

function parseExtValue(raw: unknown): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return parseExtValue(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  if (Array.isArray(raw)) {
    const out: Record<string, any> = {};
    raw.forEach((item: any) => {
      if (item && item.code !== undefined) out[String(item.code)] = item.value;
    });
    return out;
  }
  return { ...raw };
}

const NODE_TYPE_LABELS: Record<string, string> = {
  0: '开始',
  1: '审批',
  2: '结束',
  3: '互斥网关',
  4: '并行网关',
  5: '包容网关'
};

function nodeTypeLabel(node: RawNode): string {
  const ext = parseExtMap(node);
  if (ext.nodeKind === 'cc') return '抄送';
  if (ext.nodeKind === 'subflow') return '子流程';
  return NODE_TYPE_LABELS[String(node?.nodeType ?? '')] || '节点';
}

function nodeLabel(node: RawNode): string {
  return String(node?.nodeName || node?.nodeCode || '未命名节点');
}

/** 协作方式的语义化文案（口径同后端：nodeRatio 0=或签 100=会签 1~99=票签，ext voteType=count 数量票签） */
function collaborationLabel(node: RawNode): string {
  const ext = parseExtMap(node);
  if (ext.voteType === 'count') {
    if (ext.voteCount !== undefined && ext.voteCount !== '') return `固定通过 ${ext.voteCount} 人`;
    if (ext.voteRejectCount !== undefined && ext.voteRejectCount !== '') return `固定驳回 ${ext.voteRejectCount} 人`;
    return '数量票签';
  }
  const ratio = node?.nodeRatio === undefined || node?.nodeRatio === null || node?.nodeRatio === ''
    ? '0'
    : String(node.nodeRatio);
  if (ratio === '0') return '或签（一人通过即过）';
  if (ratio === '100') return '会签（全员通过才过）';
  return `票签（通过率 ${ratio}%）`;
}

function cleanFlag(value: unknown): string {
  return String(value ?? '')
    .split('@@')
    .map(item => item.trim())
    .filter(Boolean)
    .join(',');
}

/** 节点各属性区域的变化判定；返回变化的区域可读名 */
function nodeChangedAreas(base: RawNode, target: RawNode): string[] {
  const areas: string[] = [];
  if (String(base.nodeName ?? '') !== String(target.nodeName ?? '')) areas.push('名称');
  if (cleanFlag(base.permissionFlag) !== cleanFlag(target.permissionFlag)) areas.push('办理人');
  if (collaborationLabel(base) !== collaborationLabel(target)) areas.push('协作方式');
  if (String(base.anyNodeSkip ?? '') !== String(target.anyNodeSkip ?? '')) areas.push('驳回落点');
  if (String(base.listenerType ?? '') !== String(target.listenerType ?? '')
    || String(base.listenerPath ?? '') !== String(target.listenerPath ?? '')) {
    areas.push('监听器');
  }
  if (String(base.formCustom ?? '') !== String(target.formCustom ?? '')
    || String(base.formPath ?? '') !== String(target.formPath ?? '')) {
    areas.push('表单绑定');
  }
  const baseExt = parseExtMap(base);
  const targetExt = parseExtMap(target);
  const timeoutKeys = ['wfTimeoutHours', 'wfTimeoutAction'];
  const extDiffKeys = new Set([...Object.keys(baseExt), ...Object.keys(targetExt)].filter(key => {
    if (['nodeKind', 'voteType', 'voteCount', 'voteRejectCount'].includes(key)) return false;
    if (timeoutKeys.includes(key)) return false;
    return stableJson(baseExt[key]) !== stableJson(targetExt[key]);
  }));
  const timeoutChanged = timeoutKeys.some(key => String(baseExt[key] ?? '') !== String(targetExt[key] ?? ''));
  if (timeoutChanged) areas.push('超时');
  if (extDiffKeys.size) areas.push('扩展属性');
  return areas;
}

function skipKey(skip: RawSkip): string {
  return `${skip?.nowNodeCode ?? ''}->${skip?.nextNodeCode ?? ''}`;
}

function skipLabel(skip: RawSkip, nodes: Map<string, RawNode>): string {
  const from = nodes.get(String(skip?.nowNodeCode ?? ''));
  const to = nodes.get(String(skip?.nextNodeCode ?? ''));
  const fromName = from ? nodeLabel(from) : String(skip?.nowNodeCode ?? '');
  const toName = to ? nodeLabel(to) : String(skip?.nextNodeCode ?? '');
  return `${fromName} → ${toName}`;
}

const SKIP_TYPE_LABELS: Record<string, string> = {
  PASS: '通过',
  REJECT: '驳回'
};

/** 收集全部连线：DefJson 的 skipList 挂在每个节点下（兼容旧结构顶层 skipList） */
function collectSkips(def: Record<string, any>): RawSkip[] {
  const out: RawSkip[] = [];
  const pushAll = (list: unknown) => {
    if (Array.isArray(list)) out.push(...(list as RawSkip[]));
  };
  pushAll(def?.skipList);
  (Array.isArray(def?.nodeList) ? def.nodeList : []).forEach((node: RawNode) => pushAll(node?.skipList));
  return out;
}

function skipChangedAreas(base: RawSkip, target: RawSkip): string[] {
  const areas: string[] = [];
  const typeOf = (skip: RawSkip) => SKIP_TYPE_LABELS[String(skip.skipType ?? '')] || String(skip.skipType ?? '');
  if (typeOf(base) !== typeOf(target)) areas.push('跳转类型');
  if (String(base.skipCondition ?? '') !== String(target.skipCondition ?? '')) areas.push('条件');
  if (String(base.skipName ?? '') !== String(target.skipName ?? '')) areas.push('名称');
  return areas;
}

const DEF_FIELD_LABELS: Array<{ key: string; label: string }> = [
  { key: 'flowName', label: '流程名称' },
  { key: 'modelValue', label: '模型' },
  { key: 'category', label: '分类' },
  { key: 'formCustom', label: '表单绑定' },
  { key: 'formPath', label: '表单绑定' },
  { key: 'listenerType', label: '监听器' },
  { key: 'listenerPath', label: '监听器' }
];

/**
 * 对比两版 DefJson。base 为旧版本，target 为新版本；结构异常（nodeList 不是数组）抛 TypeError，
 * 调用入口需先保证 flowDefinition 已解析为对象。
 */
export function diffFlowDefinitions(base: Record<string, any>, target: Record<string, any>): FlowDefDiff {
  const baseNodes = new Map<string, RawNode>();
  (Array.isArray(base?.nodeList) ? base.nodeList : []).forEach((node: RawNode) => {
    if (node?.nodeCode !== undefined) baseNodes.set(String(node.nodeCode), node);
  });
  const targetNodes = new Map<string, RawNode>();
  (Array.isArray(target?.nodeList) ? target.nodeList : []).forEach((node: RawNode) => {
    if (node?.nodeCode !== undefined) targetNodes.set(String(node.nodeCode), node);
  });

  const nodesAdded: FlowNodeDiffEntry[] = [];
  const nodesChanged: FlowNodeDiffEntry[] = [];
  targetNodes.forEach((node, code) => {
    const old = baseNodes.get(code);
    if (!old) {
      nodesAdded.push({ code, name: nodeLabel(node), typeLabel: nodeTypeLabel(node) });
      return;
    }
    const areas = nodeChangedAreas(old, node);
    if (areas.length) nodesChanged.push({ code, name: nodeLabel(node), typeLabel: nodeTypeLabel(node), areas });
  });
  const nodesRemoved: FlowNodeDiffEntry[] = [];
  baseNodes.forEach((node, code) => {
    if (!targetNodes.has(code)) {
      nodesRemoved.push({ code, name: nodeLabel(node), typeLabel: nodeTypeLabel(node) });
    }
  });

  const defChanged: string[] = [];
  DEF_FIELD_LABELS.forEach(({ key, label }) => {
    if (String(base?.[key] ?? '') !== String(target?.[key] ?? '') && !defChanged.includes(label)) {
      defChanged.push(label);
    }
  });

  const buildSkipMap = (def: Record<string, any>) => {
    const map = new Map<string, RawSkip>();
    collectSkips(def).forEach((skip: RawSkip) => {
      const key = skipKey(skip);
      // 同一对节点的多条连线（并行出线等）只保留第一条参与对比，避免键冲突互相覆盖
      if (!map.has(key)) map.set(key, skip);
    });
    return map;
  };
  const baseSkips = buildSkipMap(base);
  const targetSkips = buildSkipMap(target);

  const skipsAdded: FlowSkipDiffEntry[] = [];
  const skipsChanged: FlowSkipDiffEntry[] = [];
  const nodeMapOfTarget = targetNodes;
  targetSkips.forEach((skip, key) => {
    const old = baseSkips.get(key);
    if (!old) {
      skipsAdded.push({ key, label: skipLabel(skip, nodeMapOfTarget) });
      return;
    }
    const areas = skipChangedAreas(old, skip);
    if (areas.length) skipsChanged.push({ key, label: skipLabel(skip, nodeMapOfTarget), areas });
  });
  const skipsRemoved: FlowSkipDiffEntry[] = [];
  baseSkips.forEach((skip, key) => {
    if (!targetSkips.has(key)) skipsRemoved.push({ key, label: skipLabel(skip, baseNodes) });
  });

  return { defChanged, nodesAdded, nodesRemoved, nodesChanged, skipsAdded, skipsRemoved, skipsChanged };
}

/** diff 结果的人读摘要（一行），用于消息提示与标题 */
export function summarizeFlowDefDiff(diff: FlowDefDiff): string {
  const parts: string[] = [];
  if (diff.defChanged.length) parts.push(`定义级（${diff.defChanged.join('/')}）`);
  if (diff.nodesAdded.length) parts.push(`新增 ${diff.nodesAdded.length} 个节点`);
  if (diff.nodesRemoved.length) parts.push(`删除 ${diff.nodesRemoved.length} 个节点`);
  if (diff.nodesChanged.length) parts.push(`修改 ${diff.nodesChanged.length} 个节点`);
  const skipTotal = diff.skipsAdded.length + diff.skipsRemoved.length + diff.skipsChanged.length;
  if (skipTotal) parts.push(`连线变化 ${skipTotal} 处`);
  return parts.length ? parts.join('，') : '两个版本的流程内容完全一致';
}
