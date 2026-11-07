/**
 * 组件注册表
 *
 * 自动收集 `<分类>/<组件>/meta.ts`，新增组件只需建目录、不用改这里。
 */
import { type WidgetMeta, defineWidget } from './protocol';
import UnknownRuntime from './unknown-widget.vue';

const modules = import.meta.glob<{ default: WidgetMeta }>('./*/*/meta.ts', { eager: true });

const registry = new Map<string, WidgetMeta>();

Object.entries(modules).forEach(([path, mod]) => {
  const meta = mod.default;
  if (!meta?.type) {
    console.warn(`[datav] ${path} 未导出有效的组件声明，已忽略`);
    return;
  }
  if (registry.has(meta.type)) {
    console.error(`[datav] 组件类型重复：${meta.type}（${path}）`);
    return;
  }
  registry.set(meta.type, meta);
});

/** 未注册类型的兜底渲染：老数据必须能打开并显示问题，而不是整屏白掉 */
const FALLBACK: WidgetMeta = defineWidget({
  type: '__unknown__',
  name: '未知组件',
  category: '其他',
  defaultSize: { w: 300, h: 160 },
  defaultStyle: {},
  fields: [],
  runtime: UnknownRuntime,
  supportData: false
});

export function getWidgetMeta(type: string): WidgetMeta {
  return registry.get(type) ?? { ...FALLBACK, type, name: type };
}

export function hasWidget(type: string): boolean {
  return registry.has(type);
}

/** 组件栏列表，按分类聚合 */
export function allWidgets(): WidgetMeta[] {
  return [...registry.values()].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category, 'zh-CN');
    return a.name.localeCompare(b.name, 'zh-CN');
  });
}

export function categories(): Array<{ label: string; widgets: WidgetMeta[] }> {
  const map = new Map<string, WidgetMeta[]>();
  allWidgets().forEach(item => {
    if (!map.has(item.category)) map.set(item.category, []);
    map.get(item.category)!.push(item);
  });
  return [...map].map(([label, widgets]) => ({ label, widgets }));
}

/** 由声明生成一个可放进 schema 的组件实例 */
export function createWidgetFromMeta(
  meta: WidgetMeta,
  canvas: { width: number; height: number },
  z: number
): DatavNamespace.Widget {
  const w = meta.defaultSize.w;
  const h = meta.defaultSize.h;
  return {
    id: `w_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    name: meta.name,
    type: meta.type,
    layout: {
      // 落在画布中心，避免新组件跑到可视区外
      x: Math.max(0, Math.round((canvas.width - w) / 2)),
      y: Math.max(0, Math.round((canvas.height - h) / 2)),
      w,
      h,
      rotate: 0,
      z,
      locked: false,
      hidden: false
    },
    group: null,
    style: JSON.parse(JSON.stringify(meta.defaultStyle ?? {})) as Record<string, unknown>,
    data: {
      mode: 'static',
      staticRows: [],
      ...meta.defaultData
    }
  };
}

export { FALLBACK as UNKNOWN_WIDGET_META };
