/**
 * 大屏组件间联动的纯逻辑（M6.2）。
 *
 * 状态是不可变的普通对象，两个理由：
 * 1. 它是**运行态**，不进 schema、不进撤销栈（与 `store.designPreview` 同口径）——
 *    撤销一次画布编辑不该把观众点出来的下钻状态清掉；
 * 2. 联动最容易出错的是「退一层之后还剩哪些过滤」，纯函数才能被 test:datav 钉住。
 *
 * 联动只通过**全局参数**传播：运行态取数契约是 `{screenCode, widgetId, params}`，
 * 每个组件的查询条件来自库里保存的 schema，前端不能替别的组件改条件——
 * 那等于把 `datav:screen:query` 变成任意配置的入口。
 */

/** 一次点击在当前层留下的选中信息 */
export interface LinkageSelection {
  /** 发起点击的组件 */
  source: string;

  /** 点中的维度别名（dim0/dim1…） */
  alias: string;

  /** 该维度的原始编码（不是显示名） */
  code: string;

  /** 该维度的显示名：图表按标签在已构建的 option 里找回数据点，DOM 组件按它显示选中态 */
  display: string;

  /** 这次点击写下的参数（编码 → 值），接收方靠它判断自己该不该亮 */
  params: Record<string, string>;
}

/** 一次点击产生的一层联动 */
export interface LinkageEntry {
  /** 面包屑文案，如「课程：数学」 */
  label: string;

  /** 写入的全局参数（值一律用原始编码） */
  params: Record<string, string>;

  /** 本层造成的下钻层级（widgetId → 层级，0 表示回到顶层） */
  drills: Record<string, number>;

  selection: LinkageSelection;
}

export interface LinkageState {
  /** 下钻/联动栈，最后一条是最新一层 */
  entries: LinkageEntry[];
}

export const EMPTY_LINKAGE: LinkageState = { entries: [] };

/**
 * 取被点中的维度值。
 *
 * 必须优先用 `dimNCode`：配了 lookup 的维度里 `dim0` 是翻译后的显示名，
 * 拿显示名去过滤另一张表的编码字段会一条都匹配不上（与报表下钻同一口径）。
 */
export function dimensionValue(
  row: ReportChartNamespace.AggRow,
  alias: string
): { code: string; label: string } | null {
  const raw = row[alias];
  if (raw === undefined || raw === null || raw === '') return null;
  const code = row[`${alias}Code`];
  return { code: String(code ?? raw), label: String(raw) };
}

/** 该组件的下钻链（未声明即不可下钻） */
export function drillChain(widget: DatavNamespace.Widget | undefined): string[] {
  const fields = widget?.data?.drillFields;
  return Array.isArray(fields) ? fields.filter(field => Boolean(field && String(field).trim())) : [];
}

/**
 * 下一层下钻层级；已在最后一层时返回 null。
 *
 * 刻意不做「到底了回到顶层」的循环：投屏上那表现为「点一下画面跳回第一层」，
 * 比停在最后一层更难解释，而且观众分不清是自己点的还是数据在动。
 */
export function nextDrillLevel(widget: DatavNamespace.Widget | undefined, currentLevel: number): number | null {
  const chain = drillChain(widget);
  if (chain.length < 2) return null;
  const next = Math.max(0, currentLevel) + 1;
  return next >= chain.length ? null : next;
}

/** 当前层级：取栈里最后一条对该组件的设定（下钻是按组件各自记的） */
export function drillLevelOf(state: LinkageState, widgetId: string): number {
  const drills = mergeDrills(state);
  return drills[widgetId] ?? 0;
}

/**
 * 点击跳屏的目标编码；没配或配了空串返回 null。
 *
 * `open_screen` 与「传播参数 / 下钻」互斥，这里就是唯一的判定处：跳走之后在 URL 上留一层
 * 本屏的下钻状态，观众后退回来看到的是带着陌生下钻的半截画面，比不跳更让人困惑。
 * 跳转也**不带**当前参数——目标屏有它自己的参数口径与权限口径。
 */
export function openScreenTarget(widget: DatavNamespace.Widget | undefined): string | null {
  const jump = (widget?.interactions ?? []).find(item => item.trigger === 'click' && item.action === 'open_screen');
  const code = typeof jump?.target === 'string' ? jump.target.trim() : '';
  return code === '' ? null : code;
}

/** 组件是否有任何一种点击行为（决定要不要给它手型光标与键盘焦点） */
export function hasClickAction(widget: DatavNamespace.Widget | undefined): boolean {
  return (widget?.interactions ?? []).some(item => item.trigger === 'click');
}

/** 面板用：勾选跳屏时清掉互斥的其它点击行为，反之亦然 */
export function withoutJump(items: DatavNamespace.WidgetInteraction[]): DatavNamespace.WidgetInteraction[] {
  return items.filter(item => item.action !== 'open_screen');
}

export function withoutParamAndDrill(items: DatavNamespace.WidgetInteraction[]): DatavNamespace.WidgetInteraction[] {
  return items.filter(item => item.action === 'open_screen');
}

export function mergeParams(state: LinkageState): Record<string, string> {
  const merged: Record<string, string> = {};
  state.entries.forEach(entry => Object.assign(merged, entry.params));
  return merged;
}

export function mergeDrills(state: LinkageState): Record<string, number> {
  const merged: Record<string, number> = {};
  state.entries.forEach(entry => Object.assign(merged, entry.drills));
  return merged;
}

export function pushEntry(state: LinkageState, entry: LinkageEntry): LinkageState {
  return { entries: [...state.entries, entry] };
}

/** 返回上级：弹掉最后一层，参数与层级按剩下的层重新合并 */
export function popEntry(state: LinkageState): LinkageState {
  if (!state.entries.length) return state;
  return { entries: state.entries.slice(0, -1) };
}

/**
 * 哪些组件要跟着重取。
 *
 * 判据是目标组件自己的 `paramBindings` 是否命中本次变更的参数，而不是整屏重取：
 * 一块 30 组件的屏点一下就把所有查询重打一遍，轮播场景等于自己制造雪崩。
 * 下钻的组件必刷（它的维度换了），哪怕它没绑任何参数。
 */
export function affectedWidgets(
  widgets: DatavNamespace.Widget[],
  changedParams: string[],
  drilledWidgetIds: string[]
): string[] {
  if (!changedParams.length && !drilledWidgetIds.length) return [];
  const wanted = new Set(changedParams);
  const touched = new Set(drilledWidgetIds);
  widgets.forEach(widget => {
    if (widget.layout?.hidden || widget.data?.mode !== 'dataset') return;
    const bindings = widget.data.paramBindings ?? [];
    if (bindings.some(binding => wanted.has(binding.param))) touched.add(widget.id);
  });
  return [...touched];
}

/**
 * 某一行当前是否处于选中态。
 *
 * 两类组件判据不同：
 * - 发起方认「点中的别名 + 那个值」，所以同组件里点别的条目会把高亮挪过去；
 * - 接收方认「我的第一个维度字段，正好被这次选中的某个参数过滤着」，于是它对应的
 *   那一根也亮着。观众需要看见是谁在跟着动，否则一次点击后满屏数字都变了、
 *   画面却没有任何因果标记，那和数据自己跳了一样。
 */
export function isRowSelected(
  widget: DatavNamespace.Widget,
  row: ReportChartNamespace.AggRow,
  state: LinkageState
): boolean {
  const selection = state.entries[state.entries.length - 1]?.selection;
  if (!selection) return false;

  if (widget.id === selection.source) {
    const value = dimensionValue(row, selection.alias);
    return Boolean(value && value.code === selection.code);
  }

  const dimension = widget.data?.reportConfig?.dimensions?.[0];
  if (!dimension?.field) return false;
  const binding = (widget.data?.paramBindings ?? []).find(item => item.field === dimension.field);
  if (!binding) return false;
  const value = selection.params[binding.param];
  if (value === undefined) return false;
  const rowValue = dimensionValue(row, 'dim0');
  return Boolean(rowValue && rowValue.code === value);
}

/**
 * 该组件当前该高亮哪个显示名（空串表示不高亮）。
 *
 * 与 `isRowSelected` 同一套判定，但只到组件粒度：图表要的是「给哪根柱子加 select 态」，
 * 逐行判据在 ECharts 这边反而用不上（数据点在 option 里，不在 rows 里）。
 * 接收方沿用发起方那份显示名——两处维度字段相同即同一含义；
 * 不同 lookup 表可能显示不同名，那种情况宁可不亮，亮错一根比不亮更容易被当成数据问题。
 */
export function highlightLabelFor(widget: DatavNamespace.Widget, state: LinkageState): string {
  const selection = state.entries[state.entries.length - 1]?.selection;
  if (!selection) return '';
  if (widget.id === selection.source) return selection.display;

  const dimension = widget.data?.reportConfig?.dimensions?.[0];
  if (!dimension?.field) return '';
  const binding = (widget.data?.paramBindings ?? []).find(item => item.field === dimension.field);
  if (!binding) return '';
  return selection.params[binding.param] === undefined ? '' : selection.display;
}

/**
 * 面包屑的一层文案：维度标签 + 显示名。
 *
 * 标签取不到时退到参数编码——宁可写出「course：数学」这种半生不熟的条目，
 * 也不能什么都不显示：观众看不到自己被过滤了什么，就会把过滤后的数当成全量数。
 */
export function entryLabel(dimensionLabel: string | undefined, param: string, display: string): string {
  return `${dimensionLabel || param}：${display}`;
}

/** ECharts 点击回调里我们真正用得上的几个字段 */
export interface ChartClickParams {
  name?: unknown;

  seriesName?: unknown;

  dataIndex?: number;

  /** 当前 option 里的系列条数，决定 dataIndex 能不能直接当行号用 */
  seriesCount?: number;
}

/**
 * 把 ECharts 的点击参数还原成聚合结果里的那一行。
 *
 * 不能直接用 `dataIndex`：多系列图的系列是按第二个维度分组切出来的，
 * `dataIndex` 是「该系列内的第几根」而不是扁平 rows 的下标，直接取会点到别的行、
 * 传错过滤值——那种错在画面上完全看不出来，只会得到「联动结果不对」。
 * 所以先按显示名匹配，唯一系列时才退回下标。
 */
export function findClickedRow(
  rows: ReportChartNamespace.AggRow[],
  params: ChartClickParams
): ReportChartNamespace.AggRow | null {
  if (!rows.length) return null;
  const name = params.name === undefined || params.name === null ? '' : String(params.name);
  const seriesName = params.seriesName ? String(params.seriesName) : '';

  if (name) {
    const byDim0 = rows.filter(row => String(row.dim0 ?? '') === name);
    if (byDim0.length > 1 && seriesName) {
      const exact = byDim0.find(row => String(row.dim1 ?? '') === seriesName);
      if (exact) return exact;
    }
    if (byDim0.length) return byDim0[0];
  }

  // 饼图/漏斗这类单系列图 name 可能为空（数据项只给了 value），此时下标才是唯一线索
  if ((params.seriesCount ?? 1) <= 1 && typeof params.dataIndex === 'number') {
    return rows[params.dataIndex] ?? null;
  }
  return null;
}

/** 高亮落点：ECharts 的 dispatchAction 要系列下标与数据下标 */
export interface ChartPointIndex {
  seriesIndex: number;

  dataIndex: number;
}

/** 高亮落点的判据：按**编码**找回是哪一个数据点 */
export interface HighlightTarget {
  /** 维度别名（dim0/dim1） */
  alias: string;

  /** 该维度的原始编码 */
  code: string;

  /** 拆系列的第二维度别名（mapping.split），给了才按系列区分 */
  split?: string;
}

/**
 * 在已构建好的 option 里按编码找回数据点。
 *
 * 为什么不用显示名：同名不同编码的两行（两个班都叫「初一(1)班」，编码不同）在类目轴上
 * 就是两根一模一样的柱子，按名字取第一个会亮错一根——而亮错的比不亮更难被发现。
 * 判据是：行号在 rows 里按编码定位，再拿显示名校验 option 的那个位置是否对得上；
 * 对不上时只有「该显示名在这份 option 里唯一出现」才退回名字匹配，否则宁可不亮。
 *
 * 也不能记点击时拿到的 (seriesIndex, dataIndex)：联动之后组件会重取数、option 整份重建
 * （notMerge），排序一变老下标就指向另一根柱子。
 */
export function findPointIndexForCode(
  option: unknown,
  rows: ReportChartNamespace.AggRow[],
  target: HighlightTarget
): ChartPointIndex | null {
  const rowIndex = rows.findIndex(row => dimensionValue(row, target.alias)?.code === target.code);
  if (rowIndex < 0 || !rows.length) return null;

  const row = rows[rowIndex];
  const display = String(row[target.alias] ?? '');
  const seriesIndex = target.split ? splitSeriesIndex(rows, target.split, row) : 0;
  const series = seriesListOf(option)[seriesIndex];
  const names = seriesNames(series?.data);
  const categories = axisCategories((option as { xAxis?: unknown } | null)?.xAxis);

  const list = categories.length ? categories : names;
  if (!list.length) return null;
  if (list[rowIndex] === display) return { seriesIndex, dataIndex: rowIndex };

  const first = list.indexOf(display);
  if (first < 0) return null;
  return !list.includes(display, first + 1) ? { seriesIndex, dataIndex: first } : null;
}

/** 系列顺序 = 第二维度值首次出现的顺序（与 buildCategorySeries 的 Map 插入口径一致） */
function splitSeriesIndex(
  rows: ReportChartNamespace.AggRow[],
  split: string,
  row: ReportChartNamespace.AggRow
): number {
  const key = String(row[split] ?? '');
  const groups: string[] = [];
  rows.forEach(item => {
    const value = String(item[split] ?? '');
    if (!groups.includes(value)) groups.push(value);
  });
  return Math.max(0, groups.indexOf(key));
}

function seriesListOf(option: unknown): Array<{ data?: unknown }> {
  const raw = (option as { series?: unknown } | null)?.series;
  if (Array.isArray(raw)) return raw as Array<{ data?: unknown }>;
  if (raw && typeof raw === 'object') return [raw as { data?: unknown }];
  return [];
}

/** 数据项可能是 `'数学'`、`{name:'数学', value:45}` 或 `['数学', 45]`；纯数字是度量值，不能当类目名 */
function seriesNames(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data.map(item => {
    if (typeof item === 'string') return item;
    if (Array.isArray(item)) return typeof item[0] === 'string' ? item[0] : '';
    if (item && typeof item === 'object' && 'name' in item) return String((item as { name: unknown }).name ?? '');
    return '';
  });
}

/** 柱/线图的类目通常在 `xAxis[0].data` 上，系列 data 里只剩数值 */
function axisCategories(axis: unknown): string[] {
  const first = Array.isArray(axis) ? axis[0] : axis;
  const data = (first as { data?: unknown } | undefined)?.data;
  if (!Array.isArray(data)) return [];
  return data.map(item => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && typeof (item as { value?: unknown }).value === 'string') {
      return (item as { value: string }).value;
    }
    return '';
  });
}

/* ---------- 下钻态与 URL ---------- */

/** 联动状态写进 URL 的键。与 `code` 一样要在运行态参数拼装时被排除，否则会被当成一个大屏参数 */
export const LINKAGE_QUERY_KEY = 'dvlink';

/** 层数上限：URL 长度是硬约束（约 2000 字符），八层已经超出任何一块真实大屏会用的深度 */
export const MAX_LINKAGE_LEVELS = 8;

function isLinkageEntry(value: unknown): value is LinkageEntry {
  const entry = value as LinkageEntry;
  return Boolean(
    entry &&
    typeof entry === 'object' &&
    typeof entry.label === 'string' &&
    entry.params &&
    typeof entry.params === 'object' &&
    entry.selection &&
    typeof entry.selection === 'object' &&
    typeof entry.selection.source === 'string'
  );
}

/**
 * 编解码都是**尽力而为**：URL 是用户会手改、会被 IM 截断的东西。
 * 解不出来就当没有联动，绝不让投放页因为一段坏 query 而白屏。
 */
export function encodeLinkage(state: LinkageState): string {
  if (!state.entries.length) return '';
  try {
    return encodeURIComponent(JSON.stringify(state.entries.slice(-MAX_LINKAGE_LEVELS)));
  } catch {
    return '';
  }
}

export function decodeLinkage(raw: unknown): LinkageState {
  if (typeof raw !== 'string' || raw === '') return { entries: [] };
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(parsed)) return { entries: [] };
    return { entries: parsed.filter(isLinkageEntry).slice(-MAX_LINKAGE_LEVELS) };
  } catch {
    return { entries: [] };
  }
}
