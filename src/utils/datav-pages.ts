/**
 * 大屏分页与轮播的纯逻辑（M6.3）。
 *
 * 单独成模块的理由和联动一样：这些是「切页时机 + 停多久 + 哪些组件算这一页」的判定，
 * 一旦写错表现为投屏上某一页永远不出现、或者切得比人读完还快，
 * 而在浏览器里逐页等一遍的成本远高于把判据抽出来断言。
 */

/** 页面列表兜底：迁移层已经保证至少一页，这里再兜一次，调用方就不必到处判空 */
export function resolvePages(schema: DatavNamespace.ScreenSchema | null | undefined): DatavNamespace.ScreenPage[] {
  const pages = schema?.pages;
  return Array.isArray(pages) && pages.length ? pages : [];
}

/**
 * 某一页上参与渲染的组件。
 *
 * 没有 pageId 的组件按第一页算：历史数据、手写 JSON、以及「复制粘贴时忘了带页」都会落到这里，
 * 宁可让它显示在第一页，也不要变成看不见却仍在取数的幽灵组件。
 */
export function pageWidgets(schema: DatavNamespace.ScreenSchema, pageId: string | undefined): DatavNamespace.Widget[] {
  const pages = resolvePages(schema);
  const target = pageId && pages.some(page => page.id === pageId) ? pageId : pages[0]?.id;
  return (schema.widgets ?? []).filter(widget => (widget.pageId ?? pages[0]?.id) === target && !widget.layout.hidden);
}

/** 这一页停多久：页级覆盖整屏默认；下限已由迁移层钳过，这里只做兜底 */
export function pageDwellSec(
  page: DatavNamespace.ScreenPage | undefined,
  rotation: DatavNamespace.ScreenRotation | undefined
): number {
  const sec = page?.intervalSec ?? rotation?.intervalSec ?? 10;
  return Math.max(5, Math.round(sec));
}

/**
 * 轮播序列：只包含有可见组件的页。
 *
 * 空页要跳过——投屏上切到一片空白，值班的第一反应是「屏坏了」，
 * 而真实原因只是某一页的组件被全删了。
 */
export function rotationPlan(schema: DatavNamespace.ScreenSchema): { pageId: string; seconds: number }[] {
  const rotation = schema.rotation;
  if (!rotation?.enabled) return [];
  return resolvePages(schema)
    .map(page => ({ pageId: page.id, seconds: pageDwellSec(page, rotation) }))
    .filter(item => pageWidgets(schema, item.pageId).length > 0);
}

/** 下一页下标：只有一页或没有页时原地不动（不返回 -1，调用方不必特判） */
export function nextPageIndex(total: number, current: number): number {
  if (total <= 0) return 0;
  if (current < 0 || current >= total) return 0;
  return (current + 1) % total;
}
