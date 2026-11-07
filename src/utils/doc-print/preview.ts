/**
 * 单据打印预览（M0 从 dynamic-data-list.vue 旧打印链路抽出，plan-sheet-print §3.5）：
 * 隐藏 iframe + `doc.write` 写入渲染 HTML + `window.print()` 交给浏览器分页打印。
 * 时序约束：必须先 `doc.open()/write()/close()`，打印动作放 `iframe.onload` 里，
 * 否则部分浏览器会在文档就绪前弹出打印框打出空白页。
 */

import DOMPurify from 'dompurify';

export interface DocPrintPayload {
  /** 完整 HTML 文档（含 `<style>` 与 `@page` 声明），由渲染层拼好 */
  html: string;
}

/** 在隐藏 iframe 中打开打印预览（等效用户视角的"打印预览→打印"）。 */
export function printHtmlDoc({ html }: DocPrintPayload): void {
  // 兜底净化：调用方应已传渲染层清洗后的 HTML，这里按整文档再剥一次脚本/事件属性
  // （WHOLE_DOCUMENT 保留 <style>/@page 结构，打印分页不受影响）
  const safe = DOMPurify.sanitize(html, { WHOLE_DOCUMENT: true });
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(safe);
  doc.close();
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 60000);
  };
}
