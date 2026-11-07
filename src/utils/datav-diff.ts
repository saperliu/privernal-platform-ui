/**
 * 大屏 schema 版本对比（M7.7）——纯函数，node 可直跑断言。
 *
 * 对比是「审计呈现」不是「数据迁移」：输出给人读，所以按语义分组
 * （新增/删除/修改的组件、画布参数、全局参数），修改项只报字段名不报值——
 * 几十 KB 的 schemaJson 里两个版本的具体差异靠人眼逐字段比对没有意义，
 * 「哪个组件的哪一块变了 + 从哪个版本开始变」才是排查时的问题。
 */

export interface WidgetDiffEntry {
  id: string;

  name: string;

  type: string;

  /** 修改项里列出变化区域：布局 / 样式 / 数据 / 交互 / 名称 */
  areas: string[];
}

export interface ScreenDiff {
  /** 新版本里新增的组件 */
  added: WidgetDiffEntry[];

  /** 新版本里已删除的组件 */
  removed: WidgetDiffEntry[];

  /** 两个版本都在、但有变化的组件 */
  changed: WidgetDiffEntry[];

  /** 画布参数变化的字段名（width/height/theme/palette/…） */
  canvasChanged: string[];

  /** 全局参数定义是否变化（增删改合并为一个布尔，参数细节通常跟组件绑定一起看） */
  paramsChanged: boolean;
}

type RawWidget = DatavNamespace.Widget;

function widgetMap(widgets: RawWidget[] | undefined): Map<string, RawWidget> {
  const map = new Map<string, RawWidget>();
  (widgets ?? []).forEach(widget => {
    if (widget && typeof widget.id === 'string') map.set(widget.id, widget);
  });
  return map;
}

/** JSON 稳定序列化：对象键序不影响「没变」的判定 */
function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys.map(key => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(',')}}`;
}

function entryOf(widget: RawWidget, areas: string[] = []): WidgetDiffEntry {
  return { id: widget.id, name: widget.name || widget.id, type: widget.type, areas };
}

/**
 * 对比两个版本的 schema。base 为旧版本，target 为新版本；
 * schemaJson 解析失败时抛 TypeError——对比入口必须先过 migrateSchema，坏数据不该走到这里。
 */
export function diffSchemas(base: DatavNamespace.ScreenSchema, target: DatavNamespace.ScreenSchema): ScreenDiff {
  const baseMap = widgetMap(base.widgets);
  const targetMap = widgetMap(target.widgets);

  const added: WidgetDiffEntry[] = [];
  const changed: WidgetDiffEntry[] = [];

  targetMap.forEach((widget, id) => {
    const old = baseMap.get(id);
    if (!old) {
      added.push(entryOf(widget));
      return;
    }
    const areas: string[] = [];
    if (stableJson(old.layout) !== stableJson(widget.layout)) areas.push('布局');
    if (stableJson(old.style) !== stableJson(widget.style)) areas.push('样式');
    if (stableJson(old.data) !== stableJson(widget.data)) areas.push('数据');
    if (stableJson(old.interactions) !== stableJson(widget.interactions)) areas.push('交互');
    if (old.name !== widget.name) areas.push('名称');
    if (areas.length) changed.push(entryOf(widget, areas));
  });

  const removed: WidgetDiffEntry[] = [];
  baseMap.forEach((widget, id) => {
    if (!targetMap.has(id)) removed.push(entryOf(widget));
  });

  const canvasChanged: string[] = [];
  const baseCanvas = base.canvas as unknown as Record<string, unknown>;
  const targetCanvas = target.canvas as unknown as Record<string, unknown>;
  const canvasKeys = new Set([...Object.keys(baseCanvas ?? {}), ...Object.keys(targetCanvas ?? {})]);
  canvasKeys.forEach(key => {
    if (stableJson(baseCanvas?.[key]) !== stableJson(targetCanvas?.[key])) {
      canvasChanged.push(key);
    }
  });

  const paramsChanged = stableJson(base.params) !== stableJson(target.params);

  return { added, removed, changed, canvasChanged, paramsChanged };
}

/** diff 结果的人读摘要（一行），用于消息提示与无障碍朗读 */
export function summarizeDiff(diff: ScreenDiff): string {
  const parts: string[] = [];
  if (diff.added.length) parts.push(`新增 ${diff.added.length} 个组件`);
  if (diff.removed.length) parts.push(`删除 ${diff.removed.length} 个组件`);
  if (diff.changed.length) parts.push(`修改 ${diff.changed.length} 个组件`);
  if (diff.canvasChanged.length) parts.push(`画布参数（${diff.canvasChanged.join('/')}）`);
  if (diff.paramsChanged) parts.push('全局参数');
  return parts.length ? parts.join('，') : '两个版本的画布内容完全一致';
}
