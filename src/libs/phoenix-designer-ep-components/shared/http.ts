import { pluginManager } from 'phoenix-designer';

/**
 * phoenix-designer 组件共用的轻量请求封装。
 *
 * 设计器组件运行在画布/表单渲染场景，不经过项目 axios 实例，
 * 这里用 fetch 并手动附加 pluginManager.global.axiosConfig.headers
 * （其中 Authorization 为 getter，每次请求实时读取最新 token）。
 */

/** 组装公共请求头 */
function buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const globalHeaders = pluginManager.global.axiosConfig?.headers;
  if (globalHeaders) {
    Object.assign(headers, globalHeaders);
  }
  return headers;
}

/** POST JSON，返回响应 JSON（非 2xx 抛错） */
export async function postJson(url: string, body: Record<string, unknown> = {}) {
  const res = await fetch(url, {
    body: JSON.stringify(body),
    headers: buildHeaders(),
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error(`请求失败(${res.status})：${url}`);
  }
  return res.json();
}

/** GET JSON，返回响应 JSON（非 2xx 抛错） */
export async function getJson(url: string) {
  const res = await fetch(url, { headers: buildHeaders(), method: 'GET' });
  if (!res.ok) {
    throw new Error(`请求失败(${res.status})：${url}`);
  }
  return res.json();
}

/**
 * 兼容多种分页响应结构，取出列表：
 * {data:{list}} / {data:{rows}} / {list} / {rows}
 */
export function unwrapPageList(res: any): any[] {
  const list = res?.data?.list ?? res?.data?.rows ?? res?.list ?? res?.rows;
  return Array.isArray(list) ? list : [];
}
