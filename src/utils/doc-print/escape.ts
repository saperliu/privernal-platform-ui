/**
 * 打印值转义（plan-sheet-print §3.4〔v2 版补充〕）：
 * 占位符替换发生在 HTML 上，取数值含 < > & " 会破版式乃至 XSS（预览走 iframe doc.write）。
 * 与服务端 cn.hutool.http.HtmlUtil.escape 同口径；别把 Java 方法当"口径"引用，两端各自实现。
 */
export function escapeHtml(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    return '';
  }
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
