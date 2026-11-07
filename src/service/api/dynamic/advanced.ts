import { request } from '../../request';

// ==================== 高级设置：导入导出配置（high-setting §4） ====================

export function getIoConfig(formId: string) {
  return request.get<AdvancedNamespace.IoConfig>('/dynamic/back/dynamic/io/config', { params: { formId } });
}

export function saveIoConfig(data: AdvancedNamespace.IoConfig) {
  return request.post<AdvancedNamespace.IoConfig>('/dynamic/back/dynamic/io/config', data);
}

// ==================== 高级设置：表单外链（high-setting §5） ====================

export function createFormShare(data: AdvancedNamespace.ShareForm) {
  return request.post<AdvancedNamespace.ShareCreateResult>('/dynamic/back/dynamic/share/add', data);
}

export function fetchShareList(formId: string) {
  return request.get<AdvancedNamespace.ShareItem[]>(`/dynamic/back/dynamic/share/form/${formId}/list`);
}

export function rotateShareToken(id: string) {
  return request.post<AdvancedNamespace.ShareCreateResult>(`/dynamic/back/dynamic/share/${id}/rotate`, {});
}

export function updateShareStatus(id: string, enabled: 'Y' | 'N') {
  return request.post(`/dynamic/back/dynamic/share/${id}/status`, null, { params: { enabled } });
}

/** 修改外链配置（不动 token 与已发链接，D2-②） */
export function updateShare(id: string, data: AdvancedNamespace.ShareForm) {
  return request.post<AdvancedNamespace.ShareItem>(`/dynamic/back/dynamic/share/${id}/update`, data);
}

/**
 * 取链回显（D2-①）：管理端解密返回完整 URL，每次取链写 REVEAL 审计。
 * 开关 dynamic.share.reveal-enabled 默认关（fail-closed），未开启时后端报错。
 */
export function fetchShareLink(id: string) {
  return request.get<AdvancedNamespace.ShareLink>(`/dynamic/back/dynamic/share/${id}/link`);
}

export function deleteShare(id: string) {
  return request.post(`/dynamic/back/dynamic/share/${id}/delete`, {});
}

// ==================== 高级设置：联动规则（high-setting §7） ====================

export function fetchLinkageRules(formId: string) {
  return request.get<AdvancedNamespace.LinkageRule[]>(`/dynamic/back/dynamic/linkage/rule/form/${formId}`);
}

export function createLinkageRule(data: AdvancedNamespace.LinkageRule) {
  return request.post<AdvancedNamespace.LinkageRule>('/dynamic/back/dynamic/linkage/rule/add', data);
}

export function updateLinkageRule(data: AdvancedNamespace.LinkageRule) {
  return request.post<AdvancedNamespace.LinkageRule>('/dynamic/back/dynamic/linkage/rule/update', data);
}

export function updateLinkageRuleStatus(id: string, enabled: 'Y' | 'N') {
  return request.post(`/dynamic/back/dynamic/linkage/rule/${id}/status`, null, { params: { enabled } });
}

export function deleteLinkageRule(id: string) {
  return request.post(`/dynamic/back/dynamic/linkage/rule/${id}/delete`, {});
}

export function dryRunLinkageRule(id: string, dataId: string) {
  return request.post<AdvancedNamespace.DryRunResult>(`/dynamic/back/dynamic/linkage/rule/${id}/dryrun`, null, {
    params: { dataId }
  });
}

export function previewCronNext(cron: string, n = 3) {
  return request.get<string[]>(`/dynamic/back/dynamic/linkage/rule/preview-cron`, { params: { cron, n } });
}

export function fetchLinkageLogs(filter: AdvancedNamespace.LogFilter) {
  return request.post<AdvancedNamespace.LogPage>('/dynamic/back/dynamic/linkage/rule/logs', filter);
}

// ==================== 免登外链页（/pub/**，无登录态） ====================

export function fetchPublicFormMeta(token: string) {
  return request.get<AdvancedNamespace.PublicFormMeta>(`/dynamic/pub/form/meta/${token}`);
}

export function submitPublicForm(token: string, data: Record<string, any>) {
  return request.post<AdvancedNamespace.PublicSubmitResult>(`/dynamic/pub/form/submit/${token}`, data);
}

export function updatePublicFormByReceipt(token: string, data: Record<string, any>) {
  return request.post<AdvancedNamespace.PublicSubmitResult>(`/dynamic/pub/form/update/${token}`, data);
}

export function fetchPublicViewList(token: string, query: Record<string, any>) {
  return request.post<any>(`/dynamic/pub/view/list/${token}`, query);
}

export function fetchPublicViewDetail(token: string, dataId: string) {
  return request.get<any>(`/dynamic/pub/view/detail/${token}/${dataId}`);
}

// ===== 表单数据导入导出运行时（IoDataController，high-setting §4.2 T1）=====
// 运行时动作权限为 dynamic:data:import / dynamic:data:export（与定义级按钮权限区分）

/** 下载导入模板（两 Sheet：数据+说明） */
export function fetchIoTemplate(formId: string) {
  return request.get<Blob>(`/dynamic/back/dynamic/io/template/${formId}`, { responseType: 'blob' });
}

/** 上传 Excel 发起异步导入，返回 { taskId, total } */
export function uploadIoImport(formId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return request.post<{ taskId: string; total: number }>(`/dynamic/back/dynamic/io/import/${formId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

/** 导入进度轮询：{ taskId, finished, total, processed, success, skipped, failed } */
export function fetchIoImportProgress(taskId: string) {
  return request.get<{
    taskId: string;
    finished: boolean;
    total: number;
    processed: number;
    success: number;
    skipped: number;
    failed: number;
  }>(`/dynamic/back/dynamic/io/import/progress/${taskId}`);
}

/** 下载失败行报告（可修改后重新导入） */
export function fetchIoImportReport(taskId: string) {
  return request.get<Blob>(`/dynamic/back/dynamic/io/import/report/${taskId}`, { responseType: 'blob' });
}

/** 导出数据 Excel（body=列表同款查询条件，不含分页=全量；敏感列按配置脱敏/剔除，选项回译） */
export function exportIoData(formId: string, query: Record<string, any>) {
  return request.post<Blob>(`/dynamic/back/dynamic/io/export/${formId}`, query, { responseType: 'blob' });
}
