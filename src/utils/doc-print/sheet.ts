/**
 * SHEET 模板渲染器（单据打印第二种方式，Luckysheet 表格模板）。
 *
 * 与 render.ts（DOC/AiEditor）并列，消费同一取数通道的 docs 形状
 * （{main, details}，翻译/脱敏/行级范围已在服务端完成），
 * 输出同样走 preview.ts 隐藏 iframe 打印与 /back/print/pdf 归档——
 * 区别只在"版式真相"是 Luckysheet 单 sheet JSON，由这里转成带内联样式的 HTML 表格。
 *
 * 占位符协议（自描述、无位置引用，单元格文本内书写）：
 *   {{field}}                          主表字段
 *   {{sub.field}}                      子表字段；含此占位符的连续行 = 该子表的明细循环模板行块
 *   {{SUM/AVG/MIN/MAX(sub.field)}}     对整块明细聚合（放在循环块外的合计行）
 *   {{COUNT(sub)}}                     明细行数
 *   {{__seq}}                          循环块内的行序号（1 起）
 * 绑定随单元格内容走，不存位置引用——「再插一行就失配」这类问题在协议层不存在
 * （对照 DOC 路线 §3.4〔v2.1〕的位置引用教训）。
 *
 * 支持的 Luckysheet 版式子集：四边边框（单元格 bd + config.borderInfo 的
 * range/cell 两类）、合并单元格、行高列宽、字号/字色/加粗/斜体/下划线/背景/
 * 水平垂直对齐、富文本按纯文本拼接。富文本段内样式与图片第一版不做。
 */
import { escapeHtml } from './escape';
import { type DocPrintConfig, pageRuleOf } from './render';

// ==================== Luckysheet 结构（按消费收口的子集） ====================

/** Luckysheet 单元格值对象（渲染相关字段的子集，未声明字段原样忽略） */
export interface SheetCellV {
  v?: unknown;
  /** 显示值（数值/日期格式化后的文本） */
  m?: string;
  /** 单元格格式：{t:'inlineStr', s:[{v,m,...}]} 富文本段 */
  ct?: { t?: string; s?: Array<{ v?: unknown; m?: string }> } | null;
  fs?: number;
  fc?: string;
  bg?: string;
  bl?: number;
  it?: number;
  /** 下划线（luckysheet 字段名就是 un） */
  un?: number;
  /** 删除线（luckysheet 字段名是 cl） */
  cl?: number;
  /** 水平对齐：0 居中 / 1 左 / 2 右（缺省按值类型：数值右对齐） */
  ht?: 0 | 1 | 2;
  /** 垂直对齐：0 居中 / 1 上 / 2 下 */
  vt?: 0 | 1 | 2;
  bd?: Record<'t' | 'b' | 'l' | 'r', { style: string; color?: string } | null> | null;
}

export interface SheetCell {
  r: number;
  c: number;
  v: SheetCellV | null;
}

export interface SheetMerge {
  r: number;
  rs: number;
  c: number;
  cs: number;
}

export interface SheetConfig {
  rowlen?: Record<string, number>;
  columnlen?: Record<string, number>;
  merge?: Record<string, SheetMerge>;
  borderInfo?: Array<Record<string, any>>;
  rowHidden?: Record<string, 0 | 1>;
  colHidden?: Record<string, 0 | 1>;
}

/** 模板落库形态（content_sheet 反序列化目标）：单 sheet */
export interface SheetTemplate {
  name?: string;
  celldata: SheetCell[];
  config?: SheetConfig;
}

// ==================== 常量与工具 ====================

/** Luckysheet 默认值（源码常量）：行高 19px / 列宽 73px / 字号 10pt */
const DEFAULT_ROW_HEIGHT = 19;
const DEFAULT_COL_WIDTH = 73;
const DEFAULT_FONT_PT = 10;
const DOC_COUNT_LIMIT = 50;

/**
 * 边框样式号 → CSS（Luckysheet setLineDash 的样式表：1=Thin 2=Hair 3=Dotted 4=Dashed
 * 5=DashDot 6=DashDotDot 7=Medium 8~11=Medium 虚线族 12=Thick 13=Double）。
 */
const BORDER_WIDTH_STYLE: Record<string, string> = {
  '1': '1px solid',
  '2': '1px solid',
  '3': '1px dotted',
  '4': '1px dashed',
  '5': '1px dashed',
  '6': '1px dashed',
  '7': '2px solid',
  '8': '2px dashed',
  '9': '2px dashed',
  '10': '2px dashed',
  '11': '2px dashed',
  '12': '3px solid',
  '13': '3px double'
};

/** 颜色白名单：模板 JSON 可由他人经应用包导入，拼进 style 前必须收口 */
function safeColor(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
  if (/^rgba?\(\s*\d{1,3}\s*(,\s*\d{1,3}\s*){2}(,\s*(0?\.\d+|1|0)\s*)?\)$/.test(s)) return s;
  return '#000000';
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value
      .map(v => displayValue(v))
      .filter(Boolean)
      .join('、');
  }
  return String(value);
}

/** 单元格显示文本（富文本按段拼纯文本） */
function cellText(v: SheetCellV | null | undefined): string {
  if (!v) return '';
  if (v.ct && Array.isArray(v.ct.s) && v.ct.s.length) {
    return v.ct.s.map(seg => displayValue(seg?.m ?? seg?.v)).join('');
  }
  return displayValue(v.m ?? v.v);
}

// ==================== 占位符协议 ====================

const TOKEN_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;
// 操作符大小写不敏感（sum/SUM 等价），detailKey/field 保留原大小写；
// 字段编码允许连字符——设计器生成的子表编码就是 sub-table_8652 形态
const IDENT = '[A-Za-z][A-Za-z0-9_-]*';
const AGG_RE = new RegExp(`^(SUM|AVG|MIN|MAX|COUNT)\\(\\s*(${IDENT})\\s*(?:\\.\\s*(${IDENT}))?\\s*\\)$`, 'i');
const FIELD_RE = new RegExp(`^${IDENT}$`);
const SEQ_FIELD = '__seq';

export type SheetToken =
  | { kind: 'main'; field: string }
  | { kind: 'detail'; detailKey: string; field: string }
  | { kind: 'agg'; op: SheetAggOp; detailKey: string; field: string | null }
  | { kind: 'seq' }
  | { kind: 'unknown'; raw: string };

export type SheetAggOp = 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT';

export function parseSheetToken(raw: string): SheetToken {
  const token = raw.trim();
  if (token === SEQ_FIELD) {
    return { kind: 'seq' };
  }
  const agg = token.match(AGG_RE);
  if (agg) {
    return { kind: 'agg', op: agg[1].toUpperCase() as SheetAggOp, detailKey: agg[2], field: agg[3] ?? null };
  }
  const dot = token.indexOf('.');
  if (dot > 0) {
    const key = token.slice(0, dot).trim();
    const field = token.slice(dot + 1).trim();
    if (FIELD_RE.test(key) && FIELD_RE.test(field)) {
      return { kind: 'detail', detailKey: key, field };
    }
  } else if (FIELD_RE.test(token)) {
    return { kind: 'main', field: token };
  }
  return { kind: 'unknown', raw: token };
}

function tokensOf(text: string): SheetToken[] {
  return Array.from(text.matchAll(TOKEN_RE), match => parseSheetToken(match[1]));
}

/** 告警上下文：跨单元格去重（warned 键集合），同类问题只报一次 */
interface WarnCtx {
  warnings: string[];
  warned: Set<string>;
}

function warnOnce(ctx: WarnCtx, key: string, message: string): void {
  if (ctx.warned.has(key)) return;
  ctx.warned.add(key);
  ctx.warnings.push(message);
}

/** 占位符填充作用域：循环行内 values 已合并"主表 + 当前行"（行字段优先） */
interface FillScope {
  values: Record<string, unknown>;
  aggregates: Map<string, string>;
  seq: number | null;
  allowDetail: boolean;
  warn: WarnCtx;
}

/** 把一段单元格文本按占位符切分并填充；unknown token 原样保留（预览可见、便于纠正） */
function fillCellText(text: string, scope: FillScope): string {
  return text.replace(TOKEN_RE, (whole, raw: string) => {
    const token = parseSheetToken(raw);
    if (token.kind === 'main' || token.kind === 'detail') {
      return fillFieldToken(whole, token, scope);
    }
    if (token.kind === 'seq') {
      return scope.seq === null ? whole : String(scope.seq);
    }
    if (token.kind === 'agg') {
      return fillAggToken(whole, token, scope);
    }
    warnOnce(
      scope.warn,
      `unknown#${token.raw}`,
      `无法识别的占位符：{{${token.raw}}}（格式：字段名 / 子表.字段 / SUM(子表.字段)）`
    );
    return whole;
  });
}

function fillFieldToken(
  whole: string,
  token: { kind: 'main' | 'detail'; field: string; detailKey?: string },
  scope: FillScope
): string {
  // 循环块外的明细字段一律告警——即使主表恰好有同名字段也不静默顶替（用户写的是子表字段）
  if (token.kind === 'detail' && !scope.allowDetail) {
    warnOnce(
      scope.warn,
      `stray#${token.detailKey}.${token.field}`,
      `子表字段 {{${token.detailKey}.${token.field}}} 不在明细循环行内，未被填充`
    );
    return whole;
  }
  if (!(token.field in scope.values)) {
    warnOnce(
      scope.warn,
      `${token.kind}#${token.field}`,
      token.kind === 'main'
        ? `主表字段在数据中不存在，已保留占位符：{{${token.field}}}`
        : `子表 ${token.detailKey} 的字段 {{${token.field}}} 在数据中不存在，已保留占位符`
    );
    return whole;
  }
  return escapeHtml(displayValue(scope.values[token.field]));
}

function fillAggToken(whole: string, token: Extract<SheetToken, { kind: 'agg' }>, scope: FillScope): string {
  const key = `${token.op}(${token.detailKey}${token.field ? `.${token.field}` : ''})`;
  const value = scope.aggregates.get(key);
  if (value === undefined) {
    warnOnce(scope.warn, `agg#${key}`, `聚合占位符无对应明细数据：{{${key}}}`);
    return whole;
  }
  return escapeHtml(value);
}

// ==================== 网格模型与循环块 ====================

export interface LoopBlock {
  detailKey: string;
  start: number;
  end: number;
}

interface Grid {
  cells: Map<string, SheetCellV>;
  maxRow: number;
  maxCol: number;
  rowHidden: Set<number>;
  colHidden: Set<number>;
}

const key = (r: number, c: number) => `${r}_${c}`;

/** 收集有内容或有样式的单元格，并统计网格边界 */
function collectCells(celldata: SheetCell[]): { cells: Map<string, SheetCellV>; maxRow: number; maxCol: number } {
  const cells = new Map<string, SheetCellV>();
  let maxRow = -1;
  let maxCol = -1;
  for (const cell of celldata ?? []) {
    if (!cell?.v) continue; // eslint-disable-line no-continue
    const text = cellText(cell.v);
    if (text || cell.v.bd || cell.v.bg) {
      cells.set(key(cell.r, cell.c), cell.v);
      if (cell.r > maxRow) maxRow = cell.r;
      if (cell.c > maxCol) maxCol = cell.c;
    }
  }
  return { cells, maxRow, maxCol };
}

/** borderInfo 可作用于没有单元格数据的区域，网格边界需要把它的 range 尾端并入 */
function extendByBorderInfo(
  borderInfo: Array<Record<string, any>> | undefined,
  base: { maxRow: number; maxCol: number }
): { maxRow: number; maxCol: number } {
  let { maxRow, maxCol } = base;
  for (const info of borderInfo ?? []) {
    const ranges = Array.isArray(info?.range) ? info.range : [];
    for (const range of ranges) {
      const rows = Array.isArray(range?.row) ? range.row : [0, 0];
      const cols = Array.isArray(range?.column) ? range.column : [0, 0];
      if (rows[1] > maxRow) maxRow = rows[1];
      if (cols[1] > maxCol) maxCol = cols[1];
    }
  }
  return { maxRow, maxCol };
}

function buildGrid(sheet: SheetTemplate): Grid {
  const cfg = sheet.config ?? {};
  const collected = collectCells(sheet.celldata);
  const extent = extendByBorderInfo(cfg.borderInfo, { maxRow: collected.maxRow, maxCol: collected.maxCol });
  return {
    cells: collected.cells,
    maxRow: extent.maxRow,
    maxCol: extent.maxCol,
    rowHidden: new Set(Object.keys(cfg.rowHidden ?? {}).map(Number)),
    colHidden: new Set(Object.keys(cfg.colHidden ?? {}).map(Number))
  };
}

/** 单行的循环归属：返回该行引用的子表编码（无则 null）；一行引用多个子表时取第一个并告警 */
function detailKeyOfRow(grid: Grid, row: number, warn: WarnCtx): string | null {
  let found: string | null = null;
  for (let c = 0; c <= grid.maxCol; c += 1) {
    if (grid.colHidden.has(c)) continue; // eslint-disable-line no-continue
    const v = grid.cells.get(key(row, c));
    if (!v) continue; // eslint-disable-line no-continue
    for (const token of tokensOf(cellText(v))) {
      if (token.kind !== 'detail') continue; // eslint-disable-line no-continue
      if (found && found !== token.detailKey) {
        warnOnce(
          warn,
          `mixed#${row}`,
          `第 ${row + 1} 行同时引用了子表 ${found} 与 ${token.detailKey}，一行只能属于一个子表的明细循环`
        );
      } else {
        found = token.detailKey;
      }
    }
  }
  return found;
}

/**
 * 循环块识别：行内出现 {{子表.字段}} 占位符即标记该行归属该子表；
 * 同一子表的连续行合成一个模板行块（支持一行或多行/块）。
 */
export function detectLoopBlocks(grid: Grid, warnings: string[]): LoopBlock[] {
  const warn: WarnCtx = { warnings, warned: new Set() };
  const rowKey = new Map<number, string>();
  for (let r = 0; r <= grid.maxRow; r += 1) {
    if (grid.rowHidden.has(r)) continue; // eslint-disable-line no-continue
    const found = detailKeyOfRow(grid, r, warn);
    if (found) {
      rowKey.set(r, found);
    }
  }
  const blocks: LoopBlock[] = [];
  for (const [r, k] of rowKey) {
    const prev = blocks[blocks.length - 1];
    if (prev && prev.detailKey === k && prev.end === r - 1) {
      prev.end = r;
    } else {
      blocks.push({ detailKey: k, start: r, end: r });
    }
  }
  return blocks;
}

/** 行是否处于某循环块内（含起止） */
function blockAtRow(blocks: LoopBlock[], row: number): LoopBlock | undefined {
  return blocks.find(b => row >= b.start && row <= b.end);
}

// ==================== 边框归一化 ====================

interface BorderSide {
  /** Luckysheet 样式号 */
  style: string;
  color?: string;
}

type CellBorders = Partial<Record<'t' | 'b' | 'l' | 'r', BorderSide | null>>;
type SideName = 't' | 'b' | 'l' | 'r';

function borderCss(side: BorderSide | null | undefined): string | null {
  if (!side) return null;
  const widthStyle = BORDER_WIDTH_STYLE[String(side.style)] ?? '1px solid';
  return `${widthStyle} ${safeColor(side.color)}`;
}

/** range 型 borderInfo 的 borderType → 对区域内 (r,c) 格应用哪些边 */
function sidesForBorderType(pos: {
  borderType: string;
  rect: { r1: number; r2: number; c1: number; c2: number };
  r: number;
  c: number;
}): SideName[] {
  const { borderType, rect, r, c } = pos;
  switch (borderType) {
    case 'border-all':
      return ['t', 'b', 'l', 'r'];
    case 'border-outside': {
      const sides: SideName[] = [];
      if (r === rect.r1) sides.push('t');
      if (r === rect.r2) sides.push('b');
      if (c === rect.c1) sides.push('l');
      if (c === rect.c2) sides.push('r');
      return sides;
    }
    case 'border-inside': {
      const sides: SideName[] = [];
      if (r !== rect.r2) sides.push('b');
      if (c !== rect.c2) sides.push('r');
      return sides;
    }
    case 'border-top':
    case 'border-bottom':
    case 'border-left':
    case 'border-right':
      return [borderType.slice('border-'.length) as SideName];
    default:
      return [];
  }
}

/**
 * 两个边框来源归一成"每格四边"：config.borderInfo 按数组顺序应用（后设覆盖先设，
 * border-none 清空），最后应用单元格自身 bd（最高优先级；null 边 = 显式清除）。
 */
function buildBorderMap(sheet: SheetTemplate, grid: Grid): Map<string, CellBorders> {
  const map = new Map<string, CellBorders>();
  const bordersOf = (r: number, c: number): CellBorders => {
    const k = key(r, c);
    let entry = map.get(k);
    if (!entry) {
      entry = {};
      map.set(k, entry);
    }
    return entry;
  };
  const cfg = sheet.config ?? {};
  for (const info of cfg.borderInfo ?? []) {
    if (!info) continue; // eslint-disable-line no-continue
    if (info.rangeType === 'cell') {
      applyCellBorderInfo(bordersOf, info);
    } else {
      applyRangeBorderInfo(bordersOf, info);
    }
  }
  // 单元格级 bd 最后应用（优先级最高）
  for (const [k, v] of grid.cells) {
    if (v.bd) {
      applyCellBd(map, k, v.bd);
    }
  }
  return map;
}

function applyCellBd(map: Map<string, CellBorders>, k: string, bd: NonNullable<SheetCellV['bd']>): void {
  const entry = map.get(k) ?? {};
  map.set(k, entry);
  for (const sideName of ['t', 'b', 'l', 'r'] as const) {
    const side = bd[sideName];
    if (side !== undefined) {
      entry[sideName] = side;
    }
  }
}

function applyCellBorderInfo(bordersOf: (r: number, c: number) => CellBorders, info: Record<string, any>): void {
  const v = info.value ?? {};
  const r = Number(v.row_index);
  const c = Number(v.col_index);
  if (!Number.isFinite(r) || !Number.isFinite(c)) return;
  const entry = bordersOf(r, c);
  entry.l = v.l ?? null;
  entry.r = v.r ?? null;
  entry.t = v.t ?? null;
  entry.b = v.b ?? null;
}

function applyRangeBorderInfo(bordersOf: (r: number, c: number) => CellBorders, info: Record<string, any>): void {
  const borderType = String(info.borderType ?? '');
  const isClear = borderType === 'border-none' || borderType === 'border-clear';
  const side: BorderSide | null = isClear ? null : { style: String(info.style ?? '1'), color: info.color };
  for (const range of Array.isArray(info.range) ? info.range : []) {
    const rows = Array.isArray(range?.row) ? range.row : [0, 0];
    const cols = Array.isArray(range?.column) ? range.column : [0, 0];
    const rect = { r1: rows[0], r2: rows[1], c1: cols[0], c2: cols[1] };
    for (let r = rect.r1; r <= rect.r2; r += 1) {
      for (let c = rect.c1; c <= rect.c2; c += 1) {
        applyBorderToCell(bordersOf, { r, c, borderType, rect, isClear, side });
      }
    }
  }
}

function applyBorderToCell(
  bordersOf: (r: number, c: number) => CellBorders,
  cell: {
    r: number;
    c: number;
    borderType: string;
    rect: { r1: number; r2: number; c1: number; c2: number };
    isClear: boolean;
    side: BorderSide | null;
  }
): void {
  const entry = bordersOf(cell.r, cell.c);
  if (cell.isClear) {
    entry.t = null;
    entry.b = null;
    entry.l = null;
    entry.r = null;
    return;
  }
  for (const sideName of sidesForBorderType({ borderType: cell.borderType, rect: cell.rect, r: cell.r, c: cell.c })) {
    entry[sideName] = cell.side;
  }
}

// ==================== 聚合 ====================

function computeAggregate(args: {
  op: string;
  field: string | null;
  rows: Array<Record<string, unknown>> | undefined;
}): string | undefined {
  const { op, field, rows } = args;
  if (op === 'COUNT') {
    return String(rows?.length ?? 0);
  }
  if (!rows || !rows.length || !field) return undefined;
  const nums = rows.map(row => Number(row[field])).filter(n => Number.isFinite(n));
  if (!nums.length) return undefined;
  let result: number;
  switch (op) {
    case 'SUM':
      result = nums.reduce((a, b) => a + b, 0);
      break;
    case 'AVG':
      result = nums.reduce((a, b) => a + b, 0) / nums.length;
      break;
    case 'MIN':
      result = Math.min(...nums);
      break;
    case 'MAX':
      result = Math.max(...nums);
      break;
    default:
      return undefined;
  }
  // 浮点尾差收敛到 4 位，避免 0.1+0.2 类打印瑕疵
  return String(Math.round(result * 10000) / 10000);
}

// ==================== 渲染 ====================

export interface SheetRenderInput {
  sheet: SheetTemplate;
  docs: Array<{ main: Record<string, unknown>; details: Record<string, Array<Record<string, unknown>>> }>;
  printConfig?: Partial<DocPrintConfig> | null;
  formName?: string;
}

export interface SheetRenderResult {
  /** 完整 HTML 文档（含 <style>），与 renderDocHtml 同一消费口径 */
  html: string;
  warnings: string[];
}

/** 输出行的展开槽位：静态行照抄，循环行按数据行展开成 N 份 */
interface Slot {
  src: number;
  loop?: { block: LoopBlock; instance: number };
}

interface DocData {
  main: Record<string, unknown>;
  details: Record<string, Array<Record<string, unknown>>>;
}

/** 字体与对齐的内联样式片段 */
function fontInlineParts(v: SheetCellV | undefined): string[] {
  const parts: string[] = [];
  const fontSize = Number.isFinite(Number(v?.fs)) && Number(v?.fs) > 0 ? Number(v?.fs) : DEFAULT_FONT_PT;
  parts.push(`font-size: ${fontSize}pt`);
  if (v?.bl === 1) parts.push('font-weight: bold');
  if (v?.it === 1) parts.push('font-style: italic');
  // 下划线与删除线可并存
  const decorations = [v?.un === 1 ? 'underline' : '', v?.cl === 1 ? 'line-through' : ''].filter(Boolean).join(' ');
  if (decorations) parts.push(`text-decoration: ${decorations}`);
  if (v?.fc) parts.push(`color: ${safeColor(v.fc)}`);
  if (v?.bg) parts.push(`background-color: ${safeColor(v.bg)}`);
  parts.push(...alignInlineParts(v));
  return parts;
}

/** 水平/垂直对齐片段；水平缺省按值类型（数值右对齐，其余左对齐），垂直缺省居中（画布默认） */
function alignInlineParts(v: SheetCellV | undefined): string[] {
  const parts: string[] = [];
  if (v?.ht === 0) parts.push('text-align: center');
  else if (v?.ht === 2) parts.push('text-align: right');
  else if (v?.ht === 1) parts.push('text-align: left');
  else if (typeof v?.v === 'number') parts.push('text-align: right');
  if (v?.vt === 1) parts.push('vertical-align: top');
  else if (v?.vt === 2) parts.push('vertical-align: bottom');
  else parts.push('vertical-align: middle');
  return parts;
}

/** 四边的 CSS border 片段（无边的方向不输出） */
function borderInlineParts(borders: CellBorders | undefined): string[] {
  if (!borders) return [];
  const parts: string[] = [];
  const sides: Array<[SideName, string]> = [
    ['t', 'border-top'],
    ['b', 'border-bottom'],
    ['l', 'border-left'],
    ['r', 'border-right']
  ];
  for (const [name, cssName] of sides) {
    const css = borderCss(borders[name]);
    if (css) {
      parts.push(`${cssName}: ${css}`);
    }
  }
  return parts;
}

function cellInlineStyle(v: SheetCellV | undefined, borders: CellBorders | undefined): string {
  return [...fontInlineParts(v), ...borderInlineParts(borders)].join('; ');
}

/** 收集模板里全部占位符（编辑器保存/示例数据/绑定观测用） */
export function collectSheetTokens(sheet: SheetTemplate): SheetToken[] {
  const grid = buildGrid(sheet);
  const tokens: SheetToken[] = [];
  const seen = new Set<string>();
  for (const v of grid.cells.values()) {
    for (const token of tokensOf(cellText(v))) {
      const id = JSON.stringify(token);
      if (!seen.has(id)) {
        seen.add(id);
        tokens.push(token);
      }
    }
  }
  return tokens;
}

/** 保存进 binding_json 的观测形态（真实绑定在单元格占位符里，这里只为可读性/审计） */
export function buildSheetBinding(sheet: SheetTemplate): {
  placeholders: Array<{ code: string; kind: 'main' | 'detail' }>;
  details: Array<{ detailKey: string; blocks: Array<[number, number]> }>;
} {
  const warnings: string[] = [];
  const grid = buildGrid(sheet);
  const blocks = detectLoopBlocks(grid, warnings);
  const placeholders: Array<{ code: string; kind: 'main' | 'detail' }> = [];
  const seen = new Set<string>();
  for (const token of collectSheetTokens(sheet)) {
    if (token.kind === 'main' && !seen.has(token.field)) {
      seen.add(token.field);
      placeholders.push({ code: token.field, kind: 'main' });
    } else if (token.kind === 'detail') {
      const code = `${token.detailKey}.${token.field}`;
      if (!seen.has(code)) {
        seen.add(code);
        placeholders.push({ code, kind: 'detail' });
      }
    }
  }
  const details: Array<{ detailKey: string; blocks: Array<[number, number]> }> = [];
  for (const b of blocks) {
    const existing = details.find(d => d.detailKey === b.detailKey);
    if (existing) {
      existing.blocks.push([b.start, b.end]);
    } else {
      details.push({ detailKey: b.detailKey, blocks: [[b.start, b.end]] });
    }
  }
  return { placeholders, details };
}

/** 静态行照抄、循环块按数据行展开成 N 份；空明细块塌缩（告警由调用方收口） */
function buildSlots(grid: Grid, blocks: LoopBlock[], doc: DocData): Slot[] {
  const slots: Slot[] = [];
  let r = 0;
  while (r <= grid.maxRow) {
    const block = blockAtRow(blocks, r);
    if (grid.rowHidden.has(r) || !block) {
      if (!grid.rowHidden.has(r)) {
        slots.push({ src: r });
      }
      r += 1;
    } else {
      const rows = doc.details?.[block.detailKey] ?? [];
      for (let i = 0; i < rows.length; i += 1) {
        for (let br = block.start; br <= block.end; br += 1) {
          slots.push({ src: br, loop: { block, instance: i } });
        }
      }
      r = block.end + 1;
    }
  }
  return slots;
}

/** 合并单元格落位计划：锚点 span 表 + 被覆盖格集合 */
interface SpanPlan {
  covered: Set<string>;
  anchorSpan: Map<string, { rs: number; cs: number }>;
}

/** 登记一个合并单元格：锚点 span + 覆盖格集合 */
function markSpan(plan: SpanPlan, outRow: number, merge: SheetMerge): void {
  plan.anchorSpan.set(key(outRow, merge.c), { rs: merge.rs, cs: merge.cs });
  for (let i = 0; i < merge.rs; i += 1) {
    for (let j = 0; j < merge.cs; j += 1) {
      if (i !== 0 || j !== 0) {
        plan.covered.add(key(outRow + i, merge.c + j));
      }
    }
  }
}

/**
 * 合并单元格落位：完全在循环块内的随每份实例复制；与循环块重叠但不同属一块
 * （锚行静态、尾行伸进循环区，或锚行在块内、尾行越出块尾）语义不明，按未合并输出并告警；
 * 纯静态合并按锚行落位。
 */
function placeMerges(merges: SheetMerge[], ctx: { blocks: LoopBlock[]; slots: Slot[]; warn: WarnCtx }): SpanPlan {
  const plan: SpanPlan = { covered: new Set(), anchorSpan: new Map() };
  for (const m of merges) {
    if (!m || !m.rs || !m.cs || (m.rs === 1 && m.cs === 1)) continue; // eslint-disable-line no-continue
    const anchorBlock = blockAtRow(ctx.blocks, m.r);
    const fullyInside = Boolean(anchorBlock) && m.r + m.rs - 1 <= (anchorBlock as LoopBlock).end;
    const overlapsBlock = ctx.blocks.some(b => m.r <= b.end && m.r + m.rs - 1 >= b.start);
    if (overlapsBlock && !fullyInside) {
      warnOnce(ctx.warn, `cross#${m.r}_${m.c}`, `第 ${m.r + 1} 行的合并单元格跨越明细循环区边界，打印时已按未合并输出`);
    } else if (fullyInside && anchorBlock) {
      ctx.slots.forEach((slot, outRow) => {
        if (slot.loop && slot.loop.block === anchorBlock && slot.src === m.r) {
          markSpan(plan, outRow, m);
        }
      });
    } else {
      const anchorRow = ctx.slots.findIndex(s => s.src === m.r && !s.loop);
      if (anchorRow >= 0) {
        markSpan(plan, anchorRow, m);
      }
    }
  }
  return plan;
}

/** 聚合值（整份单据口径）；无数据/无有效数值时不预填，渲染时按缺值告警 */
function computeAggregates(sheet: SheetTemplate, doc: DocData): Map<string, string> {
  const aggregates = new Map<string, string>();
  for (const token of collectSheetTokens(sheet)) {
    if (token.kind !== 'agg') continue; // eslint-disable-line no-continue
    const mapKey = `${token.op}(${token.detailKey}${token.field ? `.${token.field}` : ''})`;
    const value = computeAggregate({ op: token.op, field: token.field, rows: doc.details?.[token.detailKey] });
    if (value !== undefined) {
      aggregates.set(mapKey, value);
    }
  }
  return aggregates;
}

/** 单份单据渲染所需的静态上下文（模板派生物，跨多份复用） */
interface RenderContext {
  sheet: SheetTemplate;
  grid: Grid;
  blocks: LoopBlock[];
  borderMap: Map<string, CellBorders>;
  warn: WarnCtx;
}

/** 渲染一份单据的 <table> HTML */
function renderDocTable(ctx: RenderContext, doc: DocData): string {
  const { sheet, grid, blocks, borderMap, warn } = ctx;
  const cfg = sheet.config ?? {};
  const rowHeight = (r: number) => Number(cfg.rowlen?.[r]) || DEFAULT_ROW_HEIGHT;
  const colWidth = (c: number) => Number(cfg.columnlen?.[c]) || DEFAULT_COL_WIDTH;
  const visibleCols: number[] = [];
  for (let c = 0; c <= grid.maxCol; c += 1) {
    if (!grid.colHidden.has(c)) visibleCols.push(c);
  }
  for (const block of blocks) {
    if (!doc.details?.[block.detailKey]?.length) {
      warnOnce(warn, `empty#${block.detailKey}`, `明细区 ${block.detailKey} 无数据行，循环区整块未输出`);
    }
  }
  const slots = buildSlots(grid, blocks, doc);
  const plan = placeMerges(Object.values(cfg.merge ?? {}), { blocks, slots, warn });
  const aggregates = computeAggregates(sheet, doc);

  const rowsHtml: string[] = [];
  slots.forEach((slot, outRow) => {
    const tds: string[] = [];
    for (const c of visibleCols) {
      if (plan.covered.has(key(outRow, c))) continue; // eslint-disable-line no-continue
      const v = grid.cells.get(key(slot.src, c));
      const text = v ? cellText(v) : '';
      let spanAttr = '';
      let mergeInfo: { rs: number; cs: number } | undefined;
      const span = plan.anchorSpan.get(key(outRow, c));
      if (span) {
        spanAttr = ` colspan="${span.cs}" rowspan="${span.rs}"`;
        mergeInfo = span;
      }
      let filled: string;
      if (slot.loop) {
        const dataRow = doc.details?.[slot.loop.block.detailKey]?.[slot.loop.instance] ?? {};
        filled = fillCellText(text, {
          values: { ...doc.main, ...dataRow },
          aggregates,
          seq: slot.loop.instance + 1,
          allowDetail: true,
          warn
        });
      } else {
        filled = fillCellText(text, {
          values: doc.main,
          aggregates,
          seq: null,
          allowDetail: false,
          warn
        });
      }
      // 合并区域边框取边缘格（右/下取最远端）
      let borders = borderMap.get(key(slot.src, c));
      if (mergeInfo && borders) {
        borders = {
          ...borders,
          r: borderMap.get(key(slot.src, c + mergeInfo.cs - 1))?.r,
          b: borderMap.get(key(slot.src + mergeInfo.rs - 1, c))?.b
        };
      }
      const style = cellInlineStyle(v, borders);
      tds.push(`<td style="${style}"${spanAttr}>${filled || '&nbsp;'}</td>`);
    }
    rowsHtml.push(`<tr style="height:${rowHeight(slot.src)}px">${tds.join('')}</tr>`);
  });

  const colsHtml = visibleCols.map(c => `<col style="width:${colWidth(c)}px">`).join('');
  return `<table class="sheet-print"><colgroup>${colsHtml}</colgroup>${rowsHtml.join('')}</table>`;
}

/** 渲染主入口：sheet 模板 + N 份数据 → 完整打印 HTML */
export function renderSheetHtml(input: SheetRenderInput): SheetRenderResult {
  const warnings: string[] = [];
  const sheet = input.sheet;
  const grid = buildGrid(sheet);
  if (grid.maxRow < 0 || grid.maxCol < 0) {
    return {
      html: buildDocument('<p style="color:#999">空模板：没有可打印的内容</p>', input.printConfig),
      warnings: ['模板画布为空，请先排版或插入字段']
    };
  }
  const warn: WarnCtx = { warnings, warned: new Set() };
  const blocks = detectLoopBlocks(grid, warnings);
  const renderCtx: RenderContext = {
    sheet,
    grid,
    blocks,
    borderMap: buildBorderMap(sheet, grid),
    warn
  };

  if (input.docs.length > DOC_COUNT_LIMIT) {
    warnings.push(`单次最多打印 ${DOC_COUNT_LIMIT} 份，超出部分已截断（当前 ${input.docs.length} 份）`);
  }
  const docs = input.docs.slice(0, DOC_COUNT_LIMIT);

  const sections: string[] = [];
  docs.forEach((doc, docIndex) => {
    let title = '';
    if (input.formName) {
      const suffix = docIndex === 0 ? '' : `（${docIndex + 1}/${docs.length}）`;
      title = `<h1 class="doc-title">${escapeHtml(input.formName)}${escapeHtml(suffix)}</h1>`;
    }
    const table = renderDocTable(renderCtx, doc);
    sections.push(`<section class="doc-record">${title}${table}</section>`);
  });

  const body = sections.join('\n<div class="doc-page-break"></div>\n');
  return { html: buildDocument(body, input.printConfig), warnings };
}

/** 完整打印文档（样式与 DOC 路线的分页/标题约定一致；td 不带默认边框，边框全由单元格样式决定） */
function buildDocument(body: string, printConfig: Partial<DocPrintConfig> | null | undefined): string {
  const config: DocPrintConfig = {
    paper: printConfig?.paper ?? 'A4',
    orientation: printConfig?.orientation ?? 'PORTRAIT',
    margins: printConfig?.margins ?? { top: 12, bottom: 12, left: 14, right: 14 }
  };
  const css = [
    pageRuleOf(config),
    `body { font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif; font-size: 10pt; color: #000; }`,
    `h1.doc-title { text-align: center; margin: 0 0 12px; font-size: 16pt; }`,
    `table.sheet-print { border-collapse: collapse; table-layout: fixed; margin: 0 auto; }`,
    `table.sheet-print td { box-sizing: border-box; padding: 2px 4px; overflow-wrap: break-word; }`,
    `table.sheet-print tr { page-break-inside: avoid; }`,
    `.doc-page-break { page-break-before: always; }`
  ].join('\n');
  return (
    `<!doctype html><html><head><meta charset="utf-8"><title>print</title>` +
    `<style>${css}</style></head><body>${body}</body></html>`
  );
}
