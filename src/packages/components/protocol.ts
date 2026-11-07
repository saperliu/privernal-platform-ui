/**
 * 大屏组件协议
 *
 * 一个组件 = 一个目录，内含 `meta.ts`（声明）+ `index.vue`（运行时渲染）。
 * 属性面板完全由 `schemas` 驱动生成，所以新增一个组件不需要写任何表单代码——
 * 这是 M2 能并行铺开 40 个组件的前提，也是组件外包的唯一接口面。
 */
import { defineAsyncComponent } from 'vue';
import type { Component } from 'vue';
import LoadErrorWidget from './load-error-widget.vue';

/** 属性面板支持的控件；不在此列的控件请新增而不是绕过面板直接写 style */
export type FieldControl = 'text' | 'textarea' | 'number' | 'slider' | 'switch' | 'color' | 'select' | 'radio' | 'json';

export interface WidgetFieldSchema {
  /**
   * 读写路径，支持点号嵌套，如 `font.size`
   *
   * 不带前缀时读写 `widget.style`；用 `data.` 前缀可读写数据配置，
   * 例如 `data.mapping.value` 让组件声明自己需要哪些数据列。
   */
  key: string;

  label: string;

  control: FieldControl;

  /** 面板里的分组标题，同组字段相邻显示 */
  group?: string;

  min?: number;

  max?: number;

  step?: number;

  /** 单位后缀，仅用于展示 */
  unit?: string;

  placeholder?: string;

  options?: Array<{ label: string; value: string | number }>;

  /** 说明文字，面板里以次要文本显示 */
  tip?: string;
}

export interface WidgetMeta {
  /** 全局唯一，写入 schema.widgets[].type，改名等于破坏老数据 */
  type: string;

  name: string;

  /** 组件栏分组标题 */
  category: string;

  /** iconify 名，走项目已有的 unplugin-icons 体系 */
  icon?: string;

  /** 新建时的默认尺寸（设计稿像素），位置由编辑器居中计算 */
  defaultSize: { w: number; h: number };

  /** 默认样式，必须与 schemas 里的 key 一一对应，否则面板显示空值 */
  defaultStyle: Record<string, unknown>;

  /** 默认数据配置；纯展示类组件可省略 */
  defaultData?: Partial<DatavNamespace.WidgetData>;

  /**
   * 组件要求的聚合形态，绑定面板据此生成 `data.reportConfig.reportType`，
   * 与后端 `DynamicReportQueryService.ALLOWED_TYPES` 同一份取值。
   *
   * 声明在这里而不是让绑定面板按 `widget.type` 写 if-else：新增组件时只改自己的 meta，
   * 绑定面板不会被拖进一张越长越长的类型表。缺省时按柱图（要求至少一个维度）处理。
   */
  reportType?: ReportChartNamespace.ReportType;

  /** 属性面板定义 */
  fields: WidgetFieldSchema[];

  /** 运行时渲染组件，用 defineAsyncComponent 保持首屏体积 */
  runtime: Component;

  /** 数据绑定区是否显示（静态组件设 false 免得用户去绑数据集） */
  supportData?: boolean;
}

/**
 * 声明一个组件
 *
 * 单独函数的意义是让漏写字段在编译期报错，而不是运行时面板空白。
 */
export function defineWidget(meta: WidgetMeta): WidgetMeta {
  return meta;
}

/**
 * 色值口径：面板里填 token 名（`datav-accent`）时补成 `var(--datav-accent)` 引用，填 CSS 值时原样用。
 *
 * 组件不许写十六进制（`pnpm lint:datav` 会拦），因为配色板是画布级设置，
 * 写死色值切板时不跟随。色值都从 `.datav-scope` 上的变量走。
 */
export function resolveColor(value: unknown, fallbackToken: string): string {
  if (typeof value !== 'string' || value.trim() === '') return `var(--${fallbackToken})`;
  return value.startsWith('datav-') ? `var(--${value})` : value;
}

/** `font.size` 形式的路径读取，中间缺失返回 undefined */
export function readPath(source: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object') return (current as Record<string, unknown>)[segment];
    return undefined;
  }, source);
}

/** 路径写入，自动创建中间对象；原地修改并返回同一引用 */
export function writePath(target: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split('.');
  let cursor = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const next = cursor[segment];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  cursor[segments[segments.length - 1]] = value;
}

/**
 * 懒加载运行时组件
 *
 * 40+ 个组件里一半会拉进 echarts 或 vchart，全部同步引入的话编辑器首屏就废了。
 * 加载失败（网络抖动/发版瞬间）走 errorComponent 给出可读占位——
 * errorComponent 会收到传给异步组件的 props，所以能报出是哪个组件没加载出来。
 */
export function lazyRuntime(loader: () => Promise<{ default: Component }>): Component {
  return defineAsyncComponent({
    loader,
    errorComponent: LoadErrorWidget
  });
}

/** 组件栏排序：同类相邻、按名称稳定 */
export function sortWidgetsByCategory(list: WidgetMeta[]): WidgetMeta[] {
  return [...list].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category, 'zh-CN');
    return a.name.localeCompare(b.name, 'zh-CN');
  });
}
