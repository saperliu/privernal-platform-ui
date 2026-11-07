import DOMPurify from 'dompurify';

/**
 * HTML 净化入口：后端没有服务端 XSS 防护，这里是富文本渲染前的唯一一层。
 * 默认配置会剥离 <script>、事件属性（onerror 等）与 javascript: URL。
 * 所有 v-html / srcdoc 渲染后端返回的富文本前必须经过本函数。
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) {
    return '';
  }
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
