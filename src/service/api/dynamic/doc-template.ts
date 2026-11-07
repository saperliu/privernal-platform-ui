import { request } from '../../request';

// ==================== 单据打印模板（plan-sheet-print §3.2/§3.3，M1 CRUD） ====================
// 路径统一落 /back/print/*（与 /back/report/* 同层级），带 /dynamic 前缀照 advanced.ts 惯例。

export function fetchDocTemplates(formId: string) {
  return request.get<AdvancedNamespace.DocTemplate[]>(`/dynamic/back/print/template/form/${formId}`);
}

export function fetchDocTemplate(id: string) {
  return request.get<AdvancedNamespace.DocTemplate>(`/dynamic/back/print/template/${id}`);
}

export function createDocTemplate(data: AdvancedNamespace.DocTemplate) {
  return request.post<AdvancedNamespace.DocTemplate>('/dynamic/back/print/template/add', data);
}

export function updateDocTemplate(data: AdvancedNamespace.DocTemplate) {
  return request.post<AdvancedNamespace.DocTemplate>('/dynamic/back/print/template/update', data);
}

export function deleteDocTemplate(id: string) {
  return request.post(`/dynamic/back/print/template/${id}/delete`, {});
}

// ==================== 运行态取数与 PDF（plan-sheet-print §3.3，M3/M4 通道） ====================

/** 运行态临时参数（plan-sheet-print §3.3-6 / §8-③）：列与操作符在服务端过白名单，值一律绑定 */
export interface PrintFilter {
  field: string;
  op?: string;
  value: string;
}

/**
 * 按模板取数：主表+子表、可读值、服务端脱敏、行级范围收口；dataIds 必须传全量勾选 id。
 * filter 三态：不传（undefined）= 用模板 params_json 的默认值；传空数组 = 显式不过滤；
 * 传具体项 = 按参数过滤，且在勾选模式下收窄成「既勾了、又匹配参数」的行。
 */
export function fetchPrintData(templateCode: string, dataIds: string[], filter?: PrintFilter[]) {
  return request.post<AdvancedNamespace.PrintDataResult>('/dynamic/back/print/data', { templateCode, dataIds, filter });
}

/** 模板可用字段树 */
export function fetchPrintFields(params: { templateCode?: string; formId?: string }) {
  return request.post<Array<{ field: string; label: string; dataType: string; kind: string }>>(
    '/dynamic/back/print/fields',
    params
  );
}

/**
 * 渲染后 HTML 出 PDF（blob 下载）。
 * templateCode 与份数/明细行都走查询串：服务端切面记录的 operation_url 含 query，
 * 打印留痕因此带得上"谁在何时打了几份多少行"（html 体量大，不入 operation_param）。
 */
export function fetchPrintPdf(html: string, templateCode: string, summary?: { docs?: number; detailRows?: number }) {
  const query = summary ? `?docs=${summary.docs ?? 0}&detailRows=${summary.detailRows ?? 0}` : '';
  return request.post<Blob>(`/dynamic/back/print/pdf/${templateCode}${query}`, { html }, { responseType: 'blob' });
}
