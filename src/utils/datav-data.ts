/**
 * AggResult → 组件字段 的投影层（纯函数）。
 *
 * 组件不直接读 `dim0` / `value` 这些后端别名，而是读 `data.mapping` 里声明的键：
 * 换数据集时只改绑定，不改组件；同时后端别名规则（第一个度量固定叫 value）不外溢到组件里。
 *
 * 这里的函数不碰 Vue、不碰网络，因此可以直接被 node 跑起来验证，见 scripts/test-datav-utils.mjs。
 */

type Row = ReportChartNamespace.AggRow;

type Result = ReportChartNamespace.AggResult;

export type Mapping = Record<string, string> | undefined;

/** 后端别名的兜底来源：candidates 是后端回传的清单，fallback 是报表内核的固定约定 */
export interface AliasSources {
  candidates?: string[];
  fallback: string;
}

/** 别名优先级：组件映射 > 后端回传的清单 > 报表内核的固定约定 */
export function aliasOf(mapping: Mapping, key: string, sources: AliasSources): string {
  const fromMapping = mapping?.[key];
  if (typeof fromMapping === 'string' && fromMapping !== '') return fromMapping;
  const first = sources.candidates?.[0];
  if (typeof first === 'string' && first !== '') return first;
  return sources.fallback;
}

/** 值可能是字符串（Decimal 序列化）或 null，图表只认有限数 */
export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

export function pickColumn(rows: Row[], alias: string): Array<string | number> {
  return rows.map(row => {
    const value = row[alias];
    return value === null || value === undefined ? '' : (value as string | number);
  });
}

// ==================== 数据加工管线（过滤 → 排序 → Top N） ====================

/** 过滤运算符的展示文案，面板与校验共用同一份口径 */
export const FILTER_OPS: Array<{ value: DatavNamespace.DataFilter['op']; label: string }> = [
  { value: 'eq', label: '等于' },
  { value: 'ne', label: '不等于' },
  { value: 'gt', label: '大于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lt', label: '小于' },
  { value: 'lte', label: '小于等于' },
  { value: 'contains', label: '包含' },
  { value: 'notContains', label: '不包含' },
  { value: 'empty', label: '为空' },
  { value: 'notEmpty', label: '非空' }
];

/** 运算符是否需要右侧取值输入（为空/非空不需要） */
export function opNeedsValue(op: DatavNamespace.DataFilter['op']): boolean {
  return op !== 'empty' && op !== 'notEmpty';
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/**
 * 单条条件判定：比较类运算数值优先（两侧都能数值化时按数比），否则按字符串比较；
 * contains/notContains 纯文本；empty 把空串也视为空。
 */
function matchFilter(row: Row, filter: DatavNamespace.DataFilter): boolean {
  const raw = row[filter.field];
  const text = cellText(raw);

  switch (filter.op) {
    case 'empty':
      return text.trim() === '';
    case 'notEmpty':
      return text.trim() !== '';
    case 'contains':
      return text.includes(filter.value);
    case 'notContains':
      return !text.includes(filter.value);
    default:
      break;
  }

  const leftNum = toNumber(raw);
  const rightNum = toNumber(filter.value);
  const bothNumeric = leftNum !== null && rightNum !== null;
  const cmp = bothNumeric ? Math.sign(leftNum - rightNum) : Math.sign(text.localeCompare(filter.value, 'zh-CN'));

  switch (filter.op) {
    case 'eq':
      return bothNumeric ? cmp === 0 : text === filter.value;
    case 'ne':
      return bothNumeric ? cmp !== 0 : text !== filter.value;
    case 'gt':
      return cmp > 0;
    case 'gte':
      return cmp >= 0;
    case 'lt':
      return cmp < 0;
    case 'lte':
      return cmp <= 0;
    default:
      return true;
  }
}

/** 多级排序的比较器：逐级比较，数值列按数比、其余 localeCompare，保证稳定 */
function compareBySorters(a: Row, b: Row, sorters: DatavNamespace.DataSorter[]): number {
  for (const sorter of sorters) {
    const left = a[sorter.field];
    const right = b[sorter.field];
    const leftNum = toNumber(left);
    const rightNum = toNumber(right);
    let cmp: number;
    if (leftNum !== null && rightNum !== null) {
      cmp = Math.sign(leftNum - rightNum);
    } else {
      cmp = cellText(left).localeCompare(cellText(right), 'zh-CN');
    }
    if (cmp !== 0) return sorter.order === 'desc' ? -cmp : cmp;
  }
  return 0;
}

/**
 * 应用数据加工管线：过滤（AND）→ 排序（多级）→ Top N。
 * 空管线原样返回（同一引用），未配置字段的条件/排序项跳过，坏配置不吞数据。
 */
export function applyPipeline(rows: Row[], pipeline?: DatavNamespace.DataPipeline | null): Row[] {
  if (!pipeline) return rows;

  let out = rows;

  const filters = (pipeline.filters ?? []).filter(item => item.field);
  if (filters.length) {
    out = out.filter(row => filters.every(filter => matchFilter(row, filter)));
  }

  const sorters = (pipeline.sorters ?? []).filter(item => item.field);
  if (sorters.length) {
    out = [...out].sort((a, b) => compareBySorters(a, b, sorters));
  }

  const limit = Number(pipeline.limit);
  if (Number.isFinite(limit) && limit > 0) {
    out = out.slice(0, Math.floor(limit));
  }

  return out;
}

/** 行键并集的稳定提取：优先取现有行的键（保持出现顺序），供面板字段下拉使用 */
export function rowFieldOptions(rows: Row[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  rows.slice(0, 20).forEach(row => {
    Object.keys(row).forEach(key => {
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    });
  });
  return keys;
}

/** null 值保持为 null 而不是 0：折线断点与「确实是 0」在图上必须是两种形状 */
export function pickNumbers(rows: Row[], alias: string): Array<number | null> {
  return rows.map(row => toNumber(row[alias]));
}

export interface CategorySeries {
  categories: Array<string | number>;

  series: Array<{ name: string; values: Array<number | null> }>;
}

/**
 * 直角坐标系（柱状 / 折线 / 面积）用：
 * - 无 `split` 时一个度量一条系列，图例名取后端回传的中文列名；
 * - 有 `split` 时按第二个维度拆系列，只取 `value` 别名——两维多度量在 1920 宽的屏上读不出信息。
 */
export function buildCategorySeries(result: Result | null, mapping: Mapping): CategorySeries {
  const rows = result?.rows ?? [];
  const axis = aliasOf(mapping, 'axis', { candidates: result?.dimensionAliases, fallback: 'dim0' });
  const value = aliasOf(mapping, 'value', { candidates: result?.measureAliases, fallback: 'value' });
  const split = typeof mapping?.split === 'string' && mapping.split !== '' ? mapping.split : '';

  const categories = pickColumn(rows, axis);

  if (split) {
    const grouped = new Map<string, Array<number | null>>();
    rows.forEach((row, index) => {
      const key = String(row[split] ?? '');
      let bucket = grouped.get(key);
      if (!bucket) {
        // 按类目数预铺 null：某组在这一类上没有行时留空，让线在这里断开而不是连过去
        bucket = rows.map(() => null);
        grouped.set(key, bucket);
      }
      bucket[index] = toNumber(row[value]);
    });
    return {
      categories,
      series: Array.from(grouped, ([name, values]) => ({ name, values }))
    };
  }

  const measureAliases = result?.measureAliases?.length ? result.measureAliases : [value];
  const measureLabels = result?.measureLabels;
  return {
    categories,
    series: measureAliases.map((alias, index) => ({
      name: measureLabels?.[index] || alias,
      values: pickNumbers(rows, alias)
    }))
  };
}

export interface PieSlice {
  name: string;

  /** 已经是有限数：ECharts 的饼图 data.value 不接受 null，缺值行必须在投影阶段就丢掉 */
  value: number;
}

/** 饼 / 环：轴别名当分类名，值别名当扇区大小，缺值的行直接丢 */
export function buildPieSeries(result: Result | null, mapping: Mapping): PieSlice[] {
  const rows = result?.rows ?? [];
  const axis = aliasOf(mapping, 'axis', { candidates: result?.dimensionAliases, fallback: 'dim0' });
  const value = aliasOf(mapping, 'value', { candidates: result?.measureAliases, fallback: 'value' });
  const slices: PieSlice[] = [];
  rows.forEach(row => {
    const num = toNumber(row[value]);
    if (num === null) return;
    slices.push({ name: String(row[axis] ?? ''), value: num });
  });
  return slices;
}

/** 数字卡 / 仪表盘：取第一行的值别名，无数据时返回 null 由组件显示占位 */
export function buildSingleValue(result: Result | null, mapping: Mapping): number | null {
  const rows = result?.rows ?? [];
  if (!rows.length) return null;
  const value = aliasOf(mapping, 'value', { candidates: result?.measureAliases, fallback: 'value' });
  return toNumber(rows[0][value]);
}

export interface ScatterPoint {
  name: string;

  x: number;

  y: number;

  /**
   * 气泡尺寸来源：第二个度量（或 mapping.size 显式指定的列）的聚合值。
   * 没有第二度量时是 undefined，散点图与气泡图因此共用同一份投影。
   */
  size?: number;
}

/**
 * 散点：X 必须能化成数，非数值的行直接丢。
 *
 * 维度是文本时（比如按门店分组）画不出散点，这里选择丢行而不是回退成序号——
 * 把类目标签悄悄变成 1、2、3 的位置会让读者读出根本不存在的强弱关系。
 */
export function buildScatterSeries(result: Result | null, mapping: Mapping): ScatterPoint[] {
  const rows = result?.rows ?? [];
  const axis = aliasOf(mapping, 'axis', { candidates: result?.dimensionAliases, fallback: 'dim0' });
  const value = aliasOf(mapping, 'value', { candidates: result?.measureAliases, fallback: 'value' });
  // 尺寸列优先由 mapping.size 指定，否则取第二个度量：单度量时保持纯散点，不能凭空造一个尺寸
  const aliases = result?.measureAliases ?? [];
  const fromMapping = typeof mapping?.size === 'string' && mapping.size !== '' ? mapping.size : '';
  const sizeAlias = fromMapping || (aliases.length > 1 ? aliases[1] : '');
  const points: ScatterPoint[] = [];
  rows.forEach(row => {
    const x = toNumber(row[axis]);
    const y = toNumber(row[value]);
    if (x === null || y === null) return;
    const size = sizeAlias ? toNumber(row[sizeAlias]) : null;
    const name = String(row[`${axis}Code`] ?? row[axis] ?? '');
    points.push(size === null ? { name, x, y } : { name, x, y, size });
  });
  return points;
}

/**
 * 双轴投影：左列取第一个度量，右列优先取 mapping.value2，其次才是后端回传的第二个度量别名。
 * <p>
 * 必须允许显式指定右列——静态示例数据不带 measureAliases，只靠别名时右轴永远是空的，
 * 组件在编辑器里就会显示成「只有一列的双轴图」。
 */
export function buildDualAxisSeries(result: Result | null, mapping: Mapping): CategorySeries {
  const rows = result?.rows ?? [];
  const axis = aliasOf(mapping, 'axis', { candidates: result?.dimensionAliases, fallback: 'dim0' });
  const left = aliasOf(mapping, 'value', { candidates: result?.measureAliases, fallback: 'value' });
  const aliases = result?.measureAliases ?? [];
  const fromMapping = typeof mapping?.value2 === 'string' && mapping.value2 !== '' ? mapping.value2 : '';
  const right = fromMapping || (aliases.length > 1 ? aliases[1] : '');
  const labels = result?.measureLabels;

  const series: CategorySeries['series'] = [{ name: labels?.[0] || left, values: pickNumbers(rows, left) }];
  if (right && right !== left) {
    const rightIndex = aliases.indexOf(right);
    series.push({ name: (rightIndex > 0 ? labels?.[rightIndex] : '') || right, values: pickNumbers(rows, right) });
  }

  return { categories: pickColumn(rows, axis), series };
}

/** 进度/水位：把当前值按 max 折成 0~1，max<=0 或无值时返回 null 由组件显示占位 */
export function toRatio(value: number | null, max: number | null): number | null {
  if (value === null || max === null || max <= 0) return null;
  return Math.min(1, Math.max(0, value / max));
}

export interface LinkGraph {
  nodes: Array<{ name: string }>;

  links: Array<{ source: string; target: string; value: number }>;
}

/**
 * 桑基 / 关系图：dim0 → split 维度 的带权边。
 *
 * 配了 `split`（第二维度）时按 (dim0, split) 组合聚合权重；没配时把相邻类目串成链——
 * 链式只是演示形态，真实关系语义要求配置者给出第二维度。
 */
export function buildLinkGraph(result: Result | null, mapping: Mapping): LinkGraph {
  const rows = result?.rows ?? [];
  const axis = aliasOf(mapping, 'axis', { candidates: result?.dimensionAliases, fallback: 'dim0' });
  const value = aliasOf(mapping, 'value', { candidates: result?.measureAliases, fallback: 'value' });
  const split = typeof mapping?.split === 'string' && mapping.split !== '' ? mapping.split : '';

  const nodes = new Set<string>();
  const links = new Map<string, { source: string; target: string; value: number }>();

  const addEdge = (source: string, target: string, weight: number) => {
    if (!source || !target || source === target) return;
    const key = `${source}\u0000${target}`;
    const existing = links.get(key);
    if (existing) existing.value += weight;
    else links.set(key, { source, target, value: weight });
  };

  rows.forEach(row => {
    const num = toNumber(row[value]) ?? 0;
    const from = String(row[axis] ?? '');
    nodes.add(from);
    if (split) {
      const to = String(row[split] ?? '');
      nodes.add(to);
      addEdge(from, to, num);
    }
  });

  if (!split) {
    const names = [...nodes];
    for (let i = 0; i < names.length - 1; i += 1) addEdge(names[i], names[i + 1], 1);
  }

  return { nodes: [...nodes].map(name => ({ name })), links: [...links.values()] };
}

export interface HeatCell {
  x: string;

  y: string;

  value: number;
}

/** 热力图：(dim0 × split) 交叉计数/求和；没配 split 时退化为单行条带 */
export function buildHeatCells(result: Result | null, mapping: Mapping): HeatCell[] {
  const rows = result?.rows ?? [];
  const axis = aliasOf(mapping, 'axis', { candidates: result?.dimensionAliases, fallback: 'dim0' });
  const value = aliasOf(mapping, 'value', { candidates: result?.measureAliases, fallback: 'value' });
  const split = typeof mapping?.split === 'string' && mapping.split !== '' ? mapping.split : '';

  const cells = new Map<string, HeatCell>();
  rows.forEach(row => {
    const x = String(row[axis] ?? '');
    const y = split ? String(row[split] ?? '') : result?.measureLabels?.[0] || '数量';
    const num = split ? 1 : (toNumber(row[value]) ?? 0);
    const key = `${x}\u0000${y}`;
    const existing = cells.get(key);
    if (existing) existing.value += num;
    else cells.set(key, { x, y, value: num });
  });
  return [...cells.values()];
}

/**
 * 数字渲染：先定小数位，再按需加千分位。
 *
 * 小数位钳在 0~4 —— 后端度量常是 Decimal，原样输出会变成 `12.34567890123` 这种屏上没法读的东西。
 */
export interface FormatOptions {
  decimals?: number | null;

  unit?: string | null;

  thousands?: boolean;

  percent?: boolean;

  negativeColor?: boolean;

  emptyText?: string | null;
}

/**
 * 带语义的格式化：除了文本，还告诉调用方这是不是负数。
 * <p>
 * 负色必须由调用方落到 class 上（CSS 变量），而不是在这里返回带颜色的字符串——
 * 一旦把颜色写进工具函数，暗/亮两套配色板和「负色」这个开关就都失效了。
 */
export function formatValue(
  value: number | null | undefined,
  format: FormatOptions | null | undefined
): { text: string; negative: boolean } {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return { text: format?.emptyText || '—', negative: false };
  }
  const negative = value < 0;
  const scaled = format?.percent ? value * 100 : value;
  let text = formatNumber(scaled, {
    decimals: format?.decimals ?? (Number.isInteger(scaled) ? 0 : 2),
    thousands: Boolean(format?.thousands)
  });
  if (format?.percent) {
    text += '%';
  } else if (format?.unit) {
    text += String(format.unit);
  }
  return { text, negative: negative && Boolean(format?.negativeColor) };
}

export function formatNumber(value: number, options: { decimals?: number; thousands?: boolean } = {}): string {
  const decimals = Math.min(4, Math.max(0, Math.round(Number(options.decimals) || 0)));
  const text = value.toFixed(decimals);
  if (!options.thousands) return text;
  const [intPart, fracPart] = text.split('.');
  return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${fracPart ? `.${fracPart}` : ''}`;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/**
 * 时钟用浏览器本地时间格式化。
 *
 * 不做时区参数：投放机的系统时区就是这块屏所在地的时区，再在配置里叠一层时区只会让
 * 「大屏上的时间」和「现场墙上时钟」对不上。
 */
export function formatClock(
  date: Date,
  options: { showDate?: boolean; showWeek?: boolean; showSeconds?: boolean } = {}
): string {
  const parts: string[] = [];
  if (options.showDate !== false) {
    parts.push(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
  }
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}${options.showSeconds === false ? '' : `:${pad(date.getSeconds())}`}`;
  parts.push(time);
  if (options.showWeek) parts.push(WEEKDAYS[date.getDay()]);
  return parts.join(' ');
}
