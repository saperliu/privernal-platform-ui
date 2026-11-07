/**
 * 单据打印渲染器（plan-sheet-print §3.5，M2）：
 * 模板 HTML + 数据（M2 手工喂数 / M3 服务端通道）→ 可打印的完整 HTML 文档。
 *
 * 职责：
 *   1) 版式白名单清洗：只允许段落/行内样式/表格（含合并单元格）；剥掉 position/float/flex/grid
 *      等白名单外样式并告警（浏览器与 PDF 两条通道一致性的前提，§3.5）；
 *   2) 占位符替换：span.doc-field[data-code] → 转义后的可读值；缺列保留标签 + warnings（软引用）；
 *   3) 明细模板行复制：table[data-detail-key] 的 tr[data-template-row] 按数据行克隆，
 *      行内占位符按 kind=detail 的字段取值；明细数据缺失 → warnings；
 *   4) 多单拼接：单间插 .doc-page-break（分页由浏览器 CSS 完成，不写分页算法）；
 *   5) 打印 CSS：@page 纸张/边距、thead 跨页重复、行/占位符不截断。
 */
import { escapeHtml } from './escape';

export interface DocPrintData {
  /** 主表字段编码 → 可读值（翻译/脱敏已在服务端完成，M3） */
  main: Record<string, unknown>;
  /** 明细区 key（子表字段编码）→ 数据行列表 */
  details: Record<string, Array<Record<string, unknown>>>;
}

export interface DocPrintConfig {
  paper: string;
  orientation: string;
  margins: { top: number; bottom: number; left: number; right: number };
}

export interface DocRenderInput {
  /** 模板 HTML（SHEET 分流等场景可能取到空值，按空文档渲染） */
  contentHtml?: string | null;
  docs: DocPrintData[];
  printConfig?: Partial<DocPrintConfig> | null;
  formName?: string;
  /** 2000 行单次上限、10000 硬上限（§3.3-5，超限进 warnings 而非静默截断） */
  rowLimit?: number;
  hardRowLimit?: number;
}

export interface DocRenderResult {
  /** 完整 HTML 文档（含 <style>），交 utils/doc-print/preview.ts 的 iframe 打印 */
  html: string;
  warnings: string[];
}

/** 白名单外的 CSS 属性（值无关，一律剥除） */
const BANNED_STYLE_PROPS = new Set([
  'position',
  'float',
  'clear',
  'flex',
  'flex-basis',
  'flex-direction',
  'flex-flow',
  'flex-grow',
  'flex-shrink',
  'flex-wrap',
  'grid',
  'grid-area',
  'grid-template',
  'grid-template-columns',
  'grid-template-rows',
  'align-items',
  'align-content',
  'justify-content',
  'justify-items',
  'gap'
]);

const DEFAULT_CONFIG: DocPrintConfig = {
  paper: 'A4',
  orientation: 'PORTRAIT',
  margins: { top: 12, bottom: 12, left: 14, right: 14 }
};

/** 与 §3.5 纸张档位、后端 DocTemplateService.ALLOWED_PAPERS 保持一致 */
const PAPER_WHITELIST = new Set(['A4', 'A5', 'Letter']);
const MARGIN_MAX_MM = 50;

/** 边距必须是有限数值且落在合理区间，否则回落默认值（防拼进 <style> 的任意串） */
function safeMargin(value: unknown, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > MARGIN_MAX_MM) {
    return fallback;
  }
  return num;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    return value
      .map(v => displayValue(v))
      .filter(Boolean)
      .join('、');
  }
  return String(value);
}

const BANNED_DISPLAY_VALUES = new Set(['flex', 'inline-flex', 'grid', 'inline-grid']);

/** 内容黑名单：脚本/嵌入/跳转型节点一律移除（模板作者侧第一层，配合版式 CSS 白名单） */
const DANGEROUS_TAGS = 'script,iframe,frame,frameset,object,embed,applet,link,meta,base,form';

const URL_ATTRS = new Set(['href', 'src', 'srcset', 'action', 'xlink:href']);

/** 黑名单清洗：删除脚本/嵌入类节点、on* 事件属性与 javascript:/vbscript:/data:text/html URL */
function sanitizeDangerous(root: Document | Element, warnings: string[]): void {
  const banned = Array.from(root.querySelectorAll(DANGEROUS_TAGS));
  if (banned.length) {
    warnings.push(`版式包含不允许的脚本/嵌入节点（${banned.length} 处），已自动移除`);
    for (const el of banned) {
      el.remove();
    }
  }
  for (const el of Array.from(root.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
      } else if (URL_ATTRS.has(name) && /^\s*(javascript|vbscript|data:\s*text\/html)/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  }
}

/** 版式白名单清洗：剥掉白名单外样式属性与取值，并告警（text-align 等常规属性保留） */
function sanitizeLayout(root: Document | Element, warnings: string[]): void {
  const styled = Array.from(root.querySelectorAll<HTMLElement>('[style]'));
  for (const el of styled) {
    const style = el.style;
    const removed: string[] = [];
    for (const prop of Array.from(style as unknown as Array<string>)) {
      if (BANNED_STYLE_PROPS.has(prop)) {
        removed.push(prop);
        style.removeProperty(prop);
      } else if (prop === 'display' && BANNED_DISPLAY_VALUES.has(style.getPropertyValue('display').trim())) {
        removed.push('display:flex/grid');
        style.removeProperty('display');
      }
    }
    // jsdom/部分浏览器对 float 的迭代口径是 cssFloat，单独处理
    if (style.cssFloat) {
      removed.push('float');
      style.removeProperty('float');
    }
    if (removed.length) {
      warnings.push(`版式包含打印不支持的样式（${removed.join('/')}），已自动剥除；请改用表格布局排版`);
    }
  }
}

/** 占位符替换的作用域配置 */
interface PlaceholderScope {
  warnings: string[];
  scopeName: string;
  skipInDetailTables?: boolean;
  warned?: Set<string>;
}

/** 单个占位符节点的取值上下文（作用域配置 + 当前作用域的取值表） */
interface PlaceholderField extends PlaceholderScope {
  values: Record<string, unknown>;
}

/** 单个占位符节点的取值与降级处理（明细表内占位符按行取值时不在此处理） */
function fillPlaceholderField(field: HTMLElement, scope: PlaceholderField): void {
  const code = field.getAttribute('data-code') ?? '';
  if (scope.skipInDetailTables && field.closest('table[data-detail-key]')) {
    return;
  }
  if (!(code in scope.values)) {
    const warnKey = `${scope.scopeName}#${code}`;
    if (!scope.warned || !scope.warned.has(warnKey)) {
      scope.warned?.add(warnKey);
      scope.warnings.push(
        `占位字段在数据中不存在，已保留标签：${field.textContent || code}（${code}）${scope.scopeName}`
      );
    }
    // 软引用：保留标签本身，去掉占位样式属性，打印输出原标签文本
    field.removeAttribute('data-code');
    field.removeAttribute('data-kind');
    field.classList.remove('doc-field');
    return;
  }
  // DOM 序列化会对文本节点自动做 HTML 转义（<>&），这里赋原始值即可；
  // escapeHtml 只用于"拼 HTML 字符串"的场景（如标题）
  field.textContent = displayValue(scope.values[code]);
  // 已渲染的占位符退化为纯文本 span
  field.removeAttribute('data-kind');
  field.classList.remove('doc-field');
}

/**
 * 替换一个节点作用域内的占位符（doc-field span → 值文本）。
 * skipInDetailTables：跳过明细表内的占位符，交给 expandDetailRows 按行取值。
 * 若不跳过，明细模板行的 data-code 会在此被"缺列"分支剥掉，明细行将永远填不出值。
 * warned：按「作用域 + 字段」去重缺列告警，避免千行明细刷出同样条数的告警。
 */
function replacePlaceholders(scope: Element, values: Record<string, unknown>, ctx: PlaceholderScope) {
  const fields = Array.from(scope.querySelectorAll<HTMLElement>('span.doc-field[data-code]'));
  for (const field of fields) {
    fillPlaceholderField(field, { ...ctx, values });
  }
}

/** 明细区渲染所需的取值上下文 */
interface DetailRowScope {
  detailKey: string;
  warnings: string[];
  mainValues: Record<string, unknown>;
  warned?: Set<string>;
}

/** 复制明细模板行填充数据；返回该明细区实际渲染行数 */
function expandDetailRows(
  table: Element,
  rows: Array<Record<string, unknown>> | undefined,
  scope: DetailRowScope
): number {
  const templateRow = table.querySelector('tr[data-template-row]');
  if (!templateRow) {
    scope.warnings.push(`明细表 ${scope.detailKey} 缺少模板行，整表按静态内容输出`);
    return 0;
  }
  if (!rows || !rows.length) {
    scope.warnings.push(`明细区 ${scope.detailKey} 无数据行`);
  }
  const dataRows = rows ?? [];
  const parent = templateRow.parentNode as Node;
  const anchor = templateRow.nextSibling;
  for (const row of dataRows) {
    const clone = templateRow.cloneNode(true) as Element;
    // 行数据优先、主表字段兜底：明细表里引用主表字段（如逐行重复单号）是常见版式
    replacePlaceholders(
      clone,
      { ...scope.mainValues, ...row },
      {
        warnings: scope.warnings,
        scopeName: `（明细 ${scope.detailKey}）`,
        skipInDetailTables: false,
        warned: scope.warned
      }
    );
    clone.removeAttribute('data-template-row');
    parent.insertBefore(clone, anchor || templateRow);
  }
  parent.removeChild(templateRow);
  return dataRows.length;
}

/**
 * @page 规则（纸张/方向/边距）。paper/margins 会进 <style>，一律过白名单与数值化兜底：
 * print_config 来自模板（可由他人经应用包导入），不过滤即成 </style> / CSS 注入面
 * （后端 DocTemplateService 是落库前的第一道）。DOC 与 SHEET 两条渲染链共用。
 */
export function pageRuleOf(config: DocPrintConfig): string {
  const paper = PAPER_WHITELIST.has(config.paper) ? config.paper : DEFAULT_CONFIG.paper;
  const orient = config.orientation === 'LANDSCAPE' ? 'landscape' : 'portrait';
  const m = config.margins ?? DEFAULT_CONFIG.margins;
  const top = safeMargin(m.top, DEFAULT_CONFIG.margins.top);
  const right = safeMargin(m.right, DEFAULT_CONFIG.margins.right);
  const bottom = safeMargin(m.bottom, DEFAULT_CONFIG.margins.bottom);
  const left = safeMargin(m.left, DEFAULT_CONFIG.margins.left);
  return `@page { size: ${paper} ${orient}; margin: ${top}mm ${right}mm ${bottom}mm ${left}mm; }`;
}

/**
 * 组装打印 CSS（§3.5 四条，不写一行分页算法）。
 */
export function buildPrintCss(config: DocPrintConfig): string {
  return [
    pageRuleOf(config),
    `thead { display: table-header-group; }`,
    `tr, .doc-field { page-break-inside: avoid; }`,
    `.doc-page-break { page-break-before: always; }`,
    `body { font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif; font-size: 13px; color: #000; }`,
    `h1.doc-title { text-align: center; margin: 0 0 12px; }`,
    `table { border-collapse: collapse; width: 100%; }`,
    `th, td { border: 1px solid #666; padding: 6px 8px; text-align: left; vertical-align: top; page-break-inside: avoid; }`,
    `.doc-record { margin: 0; }`
  ].join('\n');
}

const DOC_COUNT_LIMIT = 50;

/**
 * 渲染主入口：模板 + N 份数据 → 完整打印 HTML。
 */
export function renderDocHtml(input: DocRenderInput): DocRenderResult {
  const warnings: string[] = [];
  const rowLimit = input.rowLimit ?? 2000;
  const hardRowLimit = input.hardRowLimit ?? 10000;
  const config: DocPrintConfig = { ...DEFAULT_CONFIG, ...(input.printConfig ?? {}) } as DocPrintConfig;
  if (input.printConfig?.margins) {
    config.margins = { ...DEFAULT_CONFIG.margins, ...input.printConfig.margins };
  }
  if (input.docs.length > DOC_COUNT_LIMIT) {
    warnings.push(`单次最多打印 ${DOC_COUNT_LIMIT} 份，超出部分已截断（当前 ${input.docs.length} 份）`);
  }

  const parser = new DOMParser();
  const templateDoc = parser.parseFromString(
    `<!doctype html><html><body>${input.contentHtml ?? ''}</body></html>`,
    'text/html'
  );
  sanitizeDangerous(templateDoc.body, warnings);
  sanitizeLayout(templateDoc.body, warnings);

  let totalRows = 0;
  const sections: string[] = [];
  const docs = input.docs.slice(0, DOC_COUNT_LIMIT);
  const warnedMissing = new Set<string>();
  for (let i = 0; i < docs.length; i += 1) {
    const doc = docs[i];
    const section = templateDoc.body.cloneNode(true) as Element;
    // 主表占位符：明细表内部的占位符按行取值，此处不处理
    replacePlaceholders(section, doc.main, {
      warnings,
      scopeName: '',
      skipInDetailTables: true,
      warned: warnedMissing
    });
    // 明细区
    for (const table of Array.from(section.querySelectorAll('table[data-detail-key]'))) {
      const key = table.getAttribute('data-detail-key') ?? '';
      const rows = doc.details?.[key];
      totalRows += rows?.length ?? 0;
      expandDetailRows(table, rows, {
        detailKey: key,
        warnings,
        mainValues: doc.main,
        warned: warnedMissing
      });
    }
    let title = '';
    if (input.formName) {
      title =
        i === 0
          ? `<h1 class="doc-title">${escapeHtml(input.formName)}</h1>`
          : `<h1 class="doc-title">${escapeHtml(input.formName)}（${i + 1}/${docs.length}）</h1>`;
    }
    sections.push(`<section class="doc-record">${title}${section.innerHTML}</section>`);
  }

  if (totalRows > rowLimit && totalRows <= hardRowLimit) {
    warnings.push(`明细行合计 ${totalRows} 行，超过单次建议上限 ${rowLimit} 行，打印耗时可能明显变长`);
  } else if (totalRows > hardRowLimit) {
    warnings.push(`明细行合计 ${totalRows} 行，超过硬上限 ${hardRowLimit} 行，请缩小打印范围`);
  }

  const body = sections.join('\n<div class="doc-page-break"></div>\n');
  const html =
    `<!doctype html><html><head><meta charset="utf-8"><title>print</title>` +
    `<style>${buildPrintCss(config)}</style></head><body>${body}</body></html>`;
  return { html, warnings };
}
