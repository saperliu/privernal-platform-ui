/**
 * 大屏联动状态（M6.2）。
 *
 * 由宿主页面（投放/预览）创建并 provide，组件侧只经 `useDatavLinkage` 读写。
 * 与 `useDatavRuntime` 分开是有意的：runtime 管「怎么取数」，这里管「观众点出了什么状态」。
 *
 * 状态是运行态：不进 schema、不进撤销栈。撤销一次画布编辑不该顺手清掉观众的下钻，
 * 反过来一次点击也不该留下可撤销的历史条目（同 `store.designPreview` 那条口径）。
 */
import { computed, inject, provide, ref, toValue } from 'vue';
import type { InjectionKey, MaybeRefOrGetter } from 'vue';
import {
  affectedWidgets,
  dimensionValue,
  drillLevelOf,
  entryLabel,
  highlightLabelFor,
  isRowSelected,
  mergeDrills,
  mergeParams,
  nextDrillLevel,
  openScreenTarget,
  popEntry,
  pushEntry
} from '@/utils/datav-linkage';
import type { LinkageState } from '@/utils/datav-linkage';
import type { DatavRuntime } from './useDatavRuntime';

/** 一次点击写进请求的覆盖项：参数与下钻层级 */
export interface DatavLinkageOverrides {
  params: Record<string, string>;

  drills: Record<string, number>;
}

export interface DatavLinkage {
  /** 联动栈，最后一条是最新一层 */
  readonly state: LinkageState;

  readonly params: Record<string, string>;

  readonly drills: Record<string, number>;

  readonly active: boolean;

  readonly crumbs: string[];

  click(widget: DatavNamespace.Widget, row: ReportChartNamespace.AggRow): Promise<void>;

  /** 从 URL 恢复联动栈（不触发刷新，由调用方在首屏取数前调） */
  restore(state: LinkageState): void;

  /** 返回上级（退一层） */
  back(): Promise<void>;

  clear(): Promise<void>;

  /** 参数栏改过某些参数后，涉及这些参数的联动层要让位 */
  dropParams(codes: string[]): Promise<void>;

  isSelected(widget: DatavNamespace.Widget, row: ReportChartNamespace.AggRow): boolean;

  /** 该组件当前该亮哪个显示名（图表用，空串=不高亮） */
  highlightLabel(widget: DatavNamespace.Widget): string;

  /** 当前选中的维度与值（图表按 display 在已构建的 option 里找回数据点） */
  readonly selection: { alias: string; code: string; display: string } | null;
}

const LINKAGE_KEY: InjectionKey<DatavLinkage | null> = Symbol('DatavLinkage');

export interface DatavLinkageOptions {
  widgets: MaybeRefOrGetter<DatavNamespace.Widget[]>;

  runtime: DatavRuntime;

  /**
   * 组件配了 `open_screen` 时由宿主页面决定怎么跳。
   *
   * 不给默认实现是有意的：免登投放页（/pub/datav）没有这块屏的授权上下文，
   * 在那儿凭空拼一个目标屏的地址等于造一个未鉴权的跳转口子。宿主不传，跳屏就不生效。
   */
  openScreen?: (screenCode: string) => void;
}

export function createDatavLinkage(options: DatavLinkageOptions): DatavLinkage {
  const snapshot = ref<LinkageState>({ entries: [] });

  async function refreshOf(entries: { params: Record<string, string>; drills: Record<string, number> }[]) {
    const params = [...new Set(entries.flatMap(entry => Object.keys(entry.params)))];
    const drills = [...new Set(entries.flatMap(entry => Object.keys(entry.drills)))];
    const ids = affectedWidgets(toValue(options.widgets), params, drills);
    if (ids.length) await options.runtime.refreshWidgets(ids);
  }

  /** 维度名优先取后端回传的标签，它跟着数据集列快照与 lookup 走，前端不必再猜 */
  function dimensionLabel(widget: DatavNamespace.Widget, alias: string) {
    const index = Number(alias.replace(/\D/g, '')) || 0;
    return options.runtime.results[widget.id]?.dimensionLabels?.[index];
  }

  async function click(widget: DatavNamespace.Widget, row: ReportChartNamespace.AggRow) {
    // 跳屏是主导动作：配了它就只跳，不再叠加本屏的参数联动与下钻（互斥口径见 openScreenTarget）
    const jump = openScreenTarget(widget);
    if (jump) {
      options.openScreen?.(jump);
      return;
    }

    const params: Record<string, string> = {};
    const drills: Record<string, number> = {};
    let alias = 'dim0';
    let code = '';
    let display = '';

    (widget.interactions ?? [])
      .filter(item => item.trigger === 'click')
      .forEach(item => {
        if (item.action === 'set_param' && item.param) {
          const from = item.field || 'dim0';
          const value = dimensionValue(row, from);
          // 取不到值就整条跳过：写一个空参数进去会让 required 的绑定把整个组件判失败，
          // 观众看到的是「点一下画面就空了」，比不点更糟
          if (!value) return;
          params[item.param] = value.code;
          alias = from;
          code = value.code;
          display = value.label;
          return;
        }
        if (item.action === 'drill') {
          const next = nextDrillLevel(widget, drillLevelOf(snapshot.value, widget.id));
          if (next !== null) drills[widget.id] = next;
        }
      });

    if (!Object.keys(params).length && !Object.keys(drills).length) return;

    const label = display
      ? entryLabel(dimensionLabel(widget, alias), Object.keys(params)[0], display)
      : `下钻：${(widget.data?.drillFields ?? [])[drills[widget.id] ?? 0] ?? ''}`;

    snapshot.value = pushEntry(snapshot.value, {
      label,
      params,
      drills,
      selection: { source: widget.id, alias, code, display, params }
    });
    await refreshOf([{ params, drills }]);
  }

  async function back() {
    const popped = snapshot.value.entries[snapshot.value.entries.length - 1];
    if (!popped) return;
    snapshot.value = popEntry(snapshot.value);
    await refreshOf([popped]);
  }

  async function clear() {
    if (!snapshot.value.entries.length) return;
    const all = snapshot.value.entries;
    snapshot.value = { entries: [] };
    await refreshOf(all);
  }

  /**
   * 参数栏改了值 → 涉及这些参数的联动层全部退掉。
   *
   * 不做「联动优先」是有意为之：参数栏写着 course=英语、画面却因为一次点击还在过滤数学，
   * 就是又一处「没人看得出来的旧状态」，与 stale 不显示同一类缺陷。
   */
  async function dropParams(codes: string[]) {
    if (!codes.length || !snapshot.value.entries.length) return;
    const wanted = new Set(codes);
    const hit = (entry: LinkageState['entries'][number]) => Object.keys(entry.params).some(param => wanted.has(param));
    const dropped = snapshot.value.entries.filter(hit);
    if (!dropped.length) return;
    snapshot.value = { entries: snapshot.value.entries.filter(entry => !hit(entry)) };
    await refreshOf(dropped);
  }

  return {
    get state() {
      return snapshot.value;
    },
    get params() {
      return mergeParams(snapshot.value);
    },
    get drills() {
      return mergeDrills(snapshot.value);
    },
    get active() {
      return snapshot.value.entries.length > 0;
    },
    get crumbs() {
      return snapshot.value.entries.map(entry => entry.label);
    },
    get selection() {
      const last = snapshot.value.entries[snapshot.value.entries.length - 1]?.selection;
      return last ? { alias: last.alias, code: last.code, display: last.display } : null;
    },
    click,
    restore: (next: LinkageState) => {
      snapshot.value = { entries: next.entries.slice(-8) };
    },
    back,
    clear,
    dropParams,
    isSelected: (widget, row) => isRowSelected(widget, row, snapshot.value),
    highlightLabel: widget => highlightLabelFor(widget, snapshot.value)
  };
}

export function provideDatavLinkage(linkage: DatavLinkage | null) {
  provide(LINKAGE_KEY, linkage);
}

/** 编辑器里没有 runtime 也不取数，返回 null 由调用方决定不渲染交互 */
export function useDatavLinkage(): DatavLinkage | null {
  return inject(LINKAGE_KEY, null);
}

const WIDGET_KEY: InjectionKey<DatavNamespace.Widget | null> = Symbol('DatavWidget');

/**
 * 由 `widget-runtime` 统一下发当前组件。
 *
 * 走 provide 而不是让每个组件把 props.widget 传进钩子：联动要发生在
 * `useDatavChart` 内部（ECharts 的实例只在那里），而 14 个图表组件不该各写一遍接线。
 */
export function provideDatavWidget(widget: DatavNamespace.Widget) {
  provide(WIDGET_KEY, widget);
}

/** 组件侧的联动入口：设计态（没有 linkage）自动降级成空操作 */
export function useWidgetLinkage() {
  const widget = inject(WIDGET_KEY, null);
  const linkage = useDatavLinkage();

  const enabled = Boolean(widget && linkage);

  function clickRow(row: ReportChartNamespace.AggRow) {
    if (!widget || !linkage) return;
    linkage.click(widget, row);
  }

  function isSelected(row: ReportChartNamespace.AggRow) {
    if (!widget || !linkage) return false;
    return linkage.isSelected(widget, row);
  }

  /** 单值组件（指标卡 / 进度条 / 数字翻牌）：整个组件就代表结果的第一行 */
  function clickFirstRow(rows: ReportChartNamespace.AggRow[]) {
    if (rows.length) clickRow(rows[0]);
  }

  function isFirstRowSelected(rows: ReportChartNamespace.AggRow[]) {
    return rows.length ? isSelected(rows[0]) : false;
  }

  return { enabled, widget, linkage, clickRow, isSelected, clickFirstRow, isFirstRowSelected };
}

/**
 * 宿主页面给 runtime 的覆盖项来源。
 *
 * 只在联动生效时返回对象：不带联动时请求体与 M6.1 完全一致，
 * 缓存键也就不会因「多了一个空 drills」而整体换键。
 */
export function linkageOverridesOf(linkage: MaybeRefOrGetter<DatavLinkage | null>) {
  return computed<DatavLinkageOverrides | null>(() => {
    const value = toValue(linkage);
    if (!value || !value.active) return null;
    return { params: value.params, drills: value.drills };
  });
}
