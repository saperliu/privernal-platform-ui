/**
 * 大屏 schema 的默认值、版本迁移与脏数据归一化。
 *
 * 这里全部是纯函数：编辑器、预览页、后端回读都走同一套，避免「编辑器能开、预览白屏」。
 * 原则是**坏数据降级而不抛异常**——一块已发布的大屏必须能被新版本打开，
 * 单个组件的配置损坏只丢那一个组件，并把原因通过 warnings 暴露出来。
 */

/** 当前 schema 版本，新增破坏性变更时递增并在 migrate 里补一段 */
export const SCHEMA_VERSION = 1;

/** 设计稿默认分辨率：主流 LED 屏 16:9 */
export const DEFAULT_CANVAS = {
  width: 1920,
  height: 1080
} as const;

/** 轮播默认与下限：低于 5 秒观众读不完一屏，而且每次切页都会触发整页取数 */
export const DEFAULT_ROTATION_SEC = 10;

export const MIN_ROTATION_SEC = 5;

let idSeed = 0;

/**
 * 不用 crypto.randomUUID：私有化交付常走 http，非安全上下文里该 API 不存在
 */
export function createId(prefix = 'w'): string {
  idSeed = (idSeed + 1) % 0xffff;
  const random = Math.floor(Math.random() * 0xffffff).toString(36);
  return `${prefix}_${Date.now().toString(36)}${idSeed.toString(36)}${random}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickNumber(source: Record<string, unknown>, key: string, fallback: number): number {
  const raw = source[key];
  const num = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(num) ? num : fallback;
}

function pickString(source: Record<string, unknown>, key: string, fallback: string): string {
  const raw = source[key];
  return typeof raw === 'string' && raw !== '' ? raw : fallback;
}

function pickBoolean(source: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const raw = source[key];
  return typeof raw === 'boolean' ? raw : fallback;
}

export function createDefaultBackground(): DatavNamespace.Background {
  return { type: 'color', value: 'datav-bg', size: 'cover' };
}

export function createDefaultGrid(): DatavNamespace.GridConfig {
  return { show: true, size: 10, snap: true, alignGuide: true };
}

export function createDefaultCanvas(overrides?: Partial<DatavNamespace.Canvas>): DatavNamespace.Canvas {
  return {
    width: DEFAULT_CANVAS.width,
    height: DEFAULT_CANVAS.height,
    fit: 'scale',
    background: createDefaultBackground(),
    grid: createDefaultGrid(),
    // 默认浅色：datav-theme.css 的 .datav-scope 基础层本身就是浅色，深色要靠 data-datav-theme='dark' 覆盖
    theme: 'light',
    palette: 'tech-blue',
    ...overrides
  };
}

export function createDefaultLayout(overrides?: Partial<DatavNamespace.Layout>): DatavNamespace.Layout {
  return { x: 0, y: 0, w: 400, h: 240, rotate: 0, z: 1, locked: false, hidden: false, ...overrides };
}

export function createEmptySchema(canvas?: Partial<DatavNamespace.Canvas>): DatavNamespace.ScreenSchema {
  return {
    schemaVersion: SCHEMA_VERSION,
    canvas: createDefaultCanvas(canvas),
    params: [],
    widgets: [],
    groups: [],
    pages: [{ id: createId('page'), name: '第 1 页' }],
    rotation: { enabled: false, intervalSec: DEFAULT_ROTATION_SEC }
  };
}

/**
 * 归一化页面列表，并把所有组件都归到某一页上。
 *
 * 老屏（没有 pages）在这里被自动包成「第 1 页」——不要求人工迁移，也不报错：
 * 升级前所有已发布大屏都必须能照常打开。`pageId` 指向不存在页面的组件同样归第一页，
 * 否则它会变成「画布上看不见、取数却一直在打」的幽灵组件。
 */
function migratePages(
  rawPages: unknown,
  widgets: DatavNamespace.Widget[],
  warnings: string[]
): DatavNamespace.ScreenPage[] {
  const pages: DatavNamespace.ScreenPage[] = [];
  const seen = new Set<string>();

  if (Array.isArray(rawPages)) {
    rawPages.forEach((item, index) => {
      if (!isPlainObject(item)) {
        return;
      }
      const id = typeof item.id === 'string' ? item.id : '';
      if (id === '' || seen.has(id)) {
        warnings.push(`第 ${index + 1} 个页面缺少有效 id 或与前面的页面重复，已丢弃`);
        return;
      }
      seen.add(id);
      const intervalSec = Number(item.intervalSec);
      pages.push({
        id,
        name: typeof item.name === 'string' && item.name.trim() !== '' ? item.name : `第 ${pages.length + 1} 页`,
        intervalSec:
          Number.isFinite(intervalSec) && intervalSec > 0
            ? Math.max(MIN_ROTATION_SEC, Math.round(intervalSec))
            : undefined
      });
    });
  }

  if (!pages.length) {
    pages.push({ id: createId('page'), name: '第 1 页' });
    seen.add(pages[0].id);
  }

  widgets.forEach(widget => {
    if (!widget.pageId || !seen.has(widget.pageId)) {
      widget.pageId = pages[0].id;
    }
  });

  return pages;
}

function migrateRotation(raw: unknown): DatavNamespace.ScreenRotation {
  if (!isPlainObject(raw)) {
    return { enabled: false, intervalSec: DEFAULT_ROTATION_SEC };
  }
  const intervalSec = Number(raw.intervalSec);
  return {
    enabled: raw.enabled === true,
    intervalSec:
      Number.isFinite(intervalSec) && intervalSec > 0
        ? Math.max(MIN_ROTATION_SEC, Math.round(intervalSec))
        : DEFAULT_ROTATION_SEC
  };
}

const FIT_VALUES = ['scale', 'width', 'height', 'none'] as const;
const THEME_VALUES = ['dark', 'light'] as const;
/**
 * 已存 schema 没写 theme 时的口径。不能跟着 createDefaultCanvas 一起变浅色：
 * 早期屏（多为接口/脚本建的验收屏）背景实打实是 #0b1220 深底，翻成浅色就是「深底 + 深色文字」，
 * 而且设计器自动保存会把翻色结果写回 schema_json。默认值只管新建。
 */
const LEGACY_THEME: DatavNamespace.ThemeScheme = 'dark';
const PALETTE_VALUES = ['tech-blue', 'aurora-purple', 'graphite-gold', 'emerald', 'neon-cyan', 'custom'] as const;
const REFRESH_VALUES = ['none', 'interval', 'manual', 'realtime'] as const;
/** 与后端 DynamicReportQueryService 的 FILTER_OPS 键、DynamicDatavDataService 的白名单同一份 */
const PARAM_OPS = ['eq', 'ne', 'like', 'gt', 'ge', 'lt', 'le'] as const;
/** 后端按标识符白名单校验字段，路径形式（filters.org）一定过不了，迁移时就先拦掉 */
const FIELD_IDENTIFIER = /^[A-Za-z][A-Za-z0-9_]*$/;
/** 自定义色板槽位上限：与 datav-theme.css 的 --datav-series-1..8 对齐 */
const CUSTOM_PALETTE_MAX = 8;
/** 六位 hex 校验。先剥前导 # 再匹配，正则里不出现「# 紧跟十六进制」的形态，躲开色值 lint 的误伤 */
const HEX_6 = /^[0-9a-fA-F]{6}$/;

/** 归一化用户填的色值：接受 `#abc123` / `ABC123`，返回 `#abc123` 形态或 null（不合法） */
export function normalizeHexColor(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const body = input.trim().replace(/^#/, '');
  return HEX_6.test(body) ? `#${body.toLowerCase()}` : null;
}

/**
 * 自定义色板归一化：非数组返回 null；逐项校验，非法项转空串占位而不是剔除——
 * 剔除会让「第 3 槽的颜色顶到第 2 槽」，面板上的槽位与 --datav-series-N 序号错位。
 * 长度保持 ≤8 且不补位，空槽由 customPaletteVars 跳过。
 */
export function normalizeCustomPalette(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.slice(0, CUSTOM_PALETTE_MAX).map(item => normalizeHexColor(item) ?? '');
}

/**
 * 把自定义色板换算成 `.datav-scope` 上的 inline CSS 变量覆盖。
 * 只覆盖已填写的槽位：第 5 个没填就继续用主题层默认的第 5 色，而不是清空它。
 * 色值来自用户配置（canvas.customPalette），不违反「源码不许硬编码色值」的约定。
 */
export function customPaletteVars(canvas: DatavNamespace.Canvas): Record<string, string> {
  if (canvas.palette !== 'custom') return {};
  const colors = normalizeCustomPalette(canvas.customPalette) ?? [];
  const vars: Record<string, string> = {};
  colors.forEach((color, index) => {
    if (color === '') return;
    vars[`--datav-series-${index + 1}`] = color;
  });
  return vars;
}

/** 色板里是否至少有一个合法色（决定 customPalette 键要不要落 schema） */
export function hasCustomColor(raw: unknown): boolean {
  const colors = normalizeCustomPalette(raw);
  return colors !== null && colors.some(color => color !== '');
}

function migrateCanvas(raw: unknown, warnings: string[]): DatavNamespace.Canvas {
  const base = createDefaultCanvas();
  if (!isPlainObject(raw)) {
    warnings.push('画布配置缺失或格式非法，已按默认 1920×1080 浅色恢复');
    return base;
  }

  const width = Math.max(1, Math.round(pickNumber(raw, 'width', base.width)));
  const height = Math.max(1, Math.round(pickNumber(raw, 'height', base.height)));
  const fit = FIT_VALUES.includes(pickString(raw, 'fit', 'scale') as (typeof FIT_VALUES)[number])
    ? (pickString(raw, 'fit', 'scale') as DatavNamespace.CanvasFit)
    : 'scale';
  const rawTheme = pickString(raw, 'theme', LEGACY_THEME);
  const theme = THEME_VALUES.includes(rawTheme as (typeof THEME_VALUES)[number])
    ? (rawTheme as DatavNamespace.ThemeScheme)
    : LEGACY_THEME;
  const palette = PALETTE_VALUES.includes(pickString(raw, 'palette', 'tech-blue') as (typeof PALETTE_VALUES)[number])
    ? (pickString(raw, 'palette', 'tech-blue') as DatavNamespace.PaletteKey)
    : 'tech-blue';

  const background = isPlainObject(raw.background)
    ? {
        type: raw.background.type === 'image' ? ('image' as const) : ('color' as const),
        value: pickString(raw.background, 'value', 'datav-bg'),
        size: pickString(raw.background, 'size', 'cover') as DatavNamespace.Background['size']
      }
    : base.background;

  const grid = isPlainObject(raw.grid)
    ? {
        show: pickBoolean(raw.grid, 'show', base.grid.show),
        size: Math.max(1, Math.round(pickNumber(raw.grid, 'size', base.grid.size))),
        snap: pickBoolean(raw.grid, 'snap', base.grid.snap),
        alignGuide: pickBoolean(raw.grid, 'alignGuide', base.grid.alignGuide)
      }
    : base.grid;

  // 人工辅助线只认 axis/at 都合法的项：脏数据丢掉，而不是带着 NaN 进渲染算出个不可见的线
  const guides = Array.isArray(raw.guides)
    ? raw.guides
        .filter(isPlainObject)
        .map(item => ({
          axis: item.axis === 'y' ? ('y' as const) : ('x' as const),
          at: Number(item.at)
        }))
        .filter(item => Number.isFinite(item.at))
    : [];

  // 自定义色板只在 palette=custom 时有意义；脏值逐项转空槽占位，全空则连键都不落（回落内置色板）
  const normalizedPalette = normalizeCustomPalette(raw.customPalette);
  const customPalette =
    palette === 'custom' && hasCustomColor(raw.customPalette) ? (normalizedPalette as string[]) : undefined;
  if (palette === 'custom' && raw.customPalette !== undefined && !customPalette) {
    warnings.push('自定义色板没有合法色值，已回落内置配色板的系列色');
  }

  return { width, height, fit, background, grid, theme, palette, customPalette, guides };
}

function migrateData(raw: unknown, widgetName: string, warnings: string[]): DatavNamespace.WidgetData {
  const fallback: DatavNamespace.WidgetData = { mode: 'static', staticRows: [] };
  if (!isPlainObject(raw)) {
    return fallback;
  }

  const mode = raw.mode === 'dataset' ? 'dataset' : 'static';
  const data: DatavNamespace.WidgetData = { mode };

  if (mode === 'dataset') {
    if (typeof raw.datasetCode !== 'string' || raw.datasetCode === '') {
      warnings.push(`组件「${widgetName}」绑定了数据集但编码为空，已回退为静态数据`);
      return { ...fallback, mapping: isPlainObject(raw.mapping) ? (raw.mapping as Record<string, string>) : undefined };
    }
    data.datasetCode = raw.datasetCode;
    if (isPlainObject(raw.reportConfig)) {
      const config = raw.reportConfig as Record<string, unknown>;
      // 补齐三个数组：绑定面板直接对 dimensions/measures 做 map/filter，
      // 手写或旧版 JSON 里缺任一个都会在运行时抛 TypeError
      data.reportConfig = {
        ...config,
        dimensions: Array.isArray(config.dimensions) ? (config.dimensions as ReportChartNamespace.Dimension[]) : [],
        measures: Array.isArray(config.measures) ? (config.measures as ReportChartNamespace.Measure[]) : [],
        filters: Array.isArray(config.filters) ? (config.filters as ReportDatasetNamespace.ReportFilter[]) : []
      } as ReportChartNamespace.ReportConfig;
    }
  } else {
    data.staticRows = Array.isArray(raw.staticRows) ? (raw.staticRows as Record<string, string | number>[]) : [];
  }

  if (isPlainObject(raw.mapping)) {
    data.mapping = raw.mapping as Record<string, string>;
  }

  if (isPlainObject(raw.refresh)) {
    const strategy = REFRESH_VALUES.includes(
      pickString(raw.refresh, 'strategy', 'none') as (typeof REFRESH_VALUES)[number]
    )
      ? (pickString(raw.refresh, 'strategy', 'none') as DatavNamespace.DataRefresh['strategy'])
      : 'none';
    data.refresh = {
      strategy,
      intervalSec: Math.max(1, Math.round(pickNumber(raw.refresh, 'intervalSec', 60))),
      onError: ['keepLast', 'clear', 'alert'].includes(pickString(raw.refresh, 'onError', 'keepLast'))
        ? (pickString(raw.refresh, 'onError', 'keepLast') as DatavNamespace.DataRefresh['onError'])
        : 'keepLast'
    };
  }

  if (Array.isArray(raw.paramBindings)) {
    const bindings: DatavNamespace.ParamBinding[] = [];
    raw.paramBindings.forEach((item, index) => {
      if (!isPlainObject(item)) return;
      const param = pickString(item, 'param', '');
      // 早期草稿把条件写成 reportConfig 的路径（filters.org），后端按字段校验必然失败：
      // 能安全当成字段名的就搬过来，否则丢弃并在面板提示，不要让必挂的绑定留在画布里
      const legacy = pickString(item, 'target', '');
      const field = pickString(item, 'field', '') || (FIELD_IDENTIFIER.test(legacy) ? legacy : '');
      if (!param || !field) {
        warnings.push(`组件「${widgetName}」第 ${index + 1} 个参数绑定缺少有效的数据集字段，已丢弃`);
        return;
      }
      const op = pickString(item, 'op', 'eq').toLowerCase();
      bindings.push({
        param,
        field,
        op: (PARAM_OPS as readonly string[]).includes(op) ? (op as DatavNamespace.ParamBinding['op']) : 'eq',
        required: pickBoolean(item, 'required', true)
      });
    });
    if (bindings.length) {
      data.paramBindings = bindings;
    }
  }

  // 下钻链必须在这里一起归一化：migrateData 是白名单重建对象，漏一个键就等于
  // 「设计者配好了、也保存成功了、运行态拿到的 schema 里却没有」——最难查的那种失败
  if (Array.isArray(raw.drillFields)) {
    const fields = raw.drillFields.filter(item => typeof item === 'string' && item.trim() !== '');
    if (fields.length) {
      data.drillFields = fields;
    }
  }

  return data;
}

function migrateWidget(raw: unknown, index: number, warnings: string[]): DatavNamespace.Widget | null {
  if (!isPlainObject(raw)) {
    warnings.push(`第 ${index + 1} 个组件记录格式非法，已跳过`);
    return null;
  }

  const type = pickString(raw, 'type', '');
  if (type === '') {
    warnings.push(`第 ${index + 1} 个组件缺少类型，已跳过`);
    return null;
  }

  const name = pickString(raw, 'name', type);
  const layoutSource = isPlainObject(raw.layout) ? raw.layout : raw;
  const layout: DatavNamespace.Layout = {
    x: Math.round(pickNumber(layoutSource, 'x', 0)),
    y: Math.round(pickNumber(layoutSource, 'y', 0)),
    w: Math.max(1, Math.round(pickNumber(layoutSource, 'w', 400))),
    h: Math.max(1, Math.round(pickNumber(layoutSource, 'h', 240))),
    rotate: pickNumber(layoutSource, 'rotate', 0),
    z: Math.round(pickNumber(layoutSource, 'z', index + 1)),
    locked: pickBoolean(layoutSource, 'locked', false),
    hidden: pickBoolean(layoutSource, 'hidden', false)
  };

  return {
    id: pickString(raw, 'id', createId()),
    name,
    type,
    layout,
    group: typeof raw.group === 'string' ? raw.group : null,
    pageId: typeof raw.pageId === 'string' ? raw.pageId : undefined,
    style: isPlainObject(raw.style) ? (raw.style as DatavNamespace.WidgetStyle) : {},
    data: migrateData(raw.data, name, warnings),
    interactions: Array.isArray(raw.interactions)
      ? (raw.interactions.filter(isPlainObject) as unknown as DatavNamespace.WidgetInteraction[])
      : undefined
  };
}

export interface MigrateResult {
  schema: DatavNamespace.ScreenSchema;

  /** 归一化过程中的降级说明，编辑器与预览页都应显示，不能静默 */
  warnings: string[];
}

/**
 * 把任意来源的 schema（接口字符串、老版本 JSON、null）归一化为当前版本。
 *
 * 不做的事：不猜测意图、不合并两份配置、不抛异常——抛异常会让整块大屏打不开。
 */
export function migrateSchema(input: unknown): MigrateResult {
  const warnings: string[] = [];

  let raw: unknown = input;
  if (typeof raw === 'string') {
    if (raw.trim() === '') {
      raw = null;
    } else {
      try {
        raw = JSON.parse(raw);
      } catch {
        warnings.push('画布 JSON 解析失败，已按空白大屏恢复');
        raw = null;
      }
    }
  }

  if (!isPlainObject(raw)) {
    return { schema: createEmptySchema(), warnings };
  }

  const version = pickNumber(raw, 'schemaVersion', 0);
  if (version < SCHEMA_VERSION) {
    warnings.push(`画布版本 v${version} 低于当前 v${SCHEMA_VERSION}，已自动升级`);
  } else if (version > SCHEMA_VERSION) {
    warnings.push(`画布版本 v${version} 高于当前版本 v${SCHEMA_VERSION}，部分配置可能不被识别`);
  }

  const widgets = Array.isArray(raw.widgets)
    ? raw.widgets
        .map((item, index) => migrateWidget(item, index, warnings))
        .filter((item): item is DatavNamespace.Widget => item !== null)
    : [];

  const groups = Array.isArray(raw.groups)
    ? raw.groups
        .filter(isPlainObject)
        .filter(item => typeof item.id === 'string')
        .map(item => ({
          id: item.id as string,
          name: typeof item.name === 'string' ? item.name : undefined,
          widgetIds: Array.isArray(item.widgetIds)
            ? (item.widgetIds.filter(id => typeof id === 'string') as string[])
            : []
        }))
    : [];

  const params = Array.isArray(raw.params)
    ? raw.params
        .filter(isPlainObject)
        .filter(item => typeof item.code === 'string')
        .map(item => ({
          code: item.code as string,
          name: typeof item.name === 'string' ? item.name : (item.code as string),
          type: (['select', 'date', 'daterange', 'text'].includes(String(item.type))
            ? String(item.type)
            : 'select') as DatavNamespace.ScreenParam['type'],
          defaultValue: item.defaultValue as DatavNamespace.ScreenParam['defaultValue'],
          dataSource: typeof item.dataSource === 'string' ? item.dataSource : undefined
        }))
    : [];

  return {
    schema: {
      schemaVersion: SCHEMA_VERSION,
      canvas: migrateCanvas(raw.canvas, warnings),
      params,
      widgets,
      groups,
      pages: migratePages(raw.pages, widgets, warnings),
      rotation: migrateRotation(raw.rotation)
    },
    warnings
  };
}

/** 复制组件时用，避免 id 冲突 */
/**
 * 组件级深拷贝。走 JSON 而不是逐层展开：组件本来就只由可序列化字段构成（它整份要进
 * schema_json），而 `{ ...widget.data }` 这种一层浅拷贝会让副本与原件共用 reportConfig，
 * 粘贴后改副本的维度/度量，原件的图跟着一起变。
 */
export function deepCloneWidget(widget: DatavNamespace.Widget): DatavNamespace.Widget {
  return JSON.parse(JSON.stringify(widget)) as DatavNamespace.Widget;
}

export function cloneWidget(widget: DatavNamespace.Widget, offset = 20): DatavNamespace.Widget {
  const next = deepCloneWidget(widget);
  next.id = createId();
  next.name = `${widget.name} 副本`;
  next.group = null;
  next.layout = { ...next.layout, x: widget.layout.x + offset, y: widget.layout.y + offset, z: widget.layout.z + 1 };
  return next;
}

export function serializeSchema(schema: DatavNamespace.ScreenSchema): string {
  return JSON.stringify(schema);
}
