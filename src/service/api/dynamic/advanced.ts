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

/**
 * 上传 Excel 一步式导入（自动映射，兼容旧调用方；新 UI 走 previewIoImport + startIoImport）。
 * ⚠ file 必须以普通对象传（{ file }）：request 客户端的 multipart 转换层按 Object.entries 重建
 * form-data，直接传原生 FormData 会被取成空条目 → 空 multipart body → 后端连接中断（R2-19 实测坑，
 * 旧实现即坏在此处，UI 上传从未真正走通）。
 */
export function uploadIoImport(formId: string, file: File) {
  return request.post<{ taskId: string; total: number }>(`/dynamic/back/dynamic/io/import/${formId}`, { file }, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

/**
 * 上传 Excel 预检（R2-19 两阶段第一步）：解析表头与原始行、生成跨环境列结构预检报告，
 * 任务落 PENDING_MAPPING（不执行）。返回 taskId/headers/mapping(自动匹配建议)/precheck/fields。
 * file 以普通对象传（同 uploadIoImport 的 multipart 转换层口径）。
 */
export function previewIoImport(formId: string, file: File) {
  return request.post<AdvancedNamespace.ImportPreviewResult>(
    `/dynamic/back/dynamic/io/import/preview/${formId}`,
    { file },
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

/** 确认列映射并启动导入（两阶段第二步）：mapping={表头:字段编码}，空串=忽略该列 */
export function startIoImport(taskId: string, mapping: Record<string, string>) {
  return request.post<{ taskId: string; total: number }>(
    `/dynamic/back/dynamic/io/import/start/${taskId}`,
    mapping
  );
}

/** 导入进度轮询（读库：重启不丢、多实例可见）：含 status/finishedTime */
export function fetchIoImportProgress(taskId: string) {
  return request.get<AdvancedNamespace.ImportProgress>(`/dynamic/back/dynamic/io/import/progress/${taskId}`);
}

/** 导入记录：该表单最近 20 条任务（多实例可见的历史痕迹） */
export function fetchIoImportTasks(formId: string) {
  return request.get<AdvancedNamespace.ImportTaskSummary[]>(`/dynamic/back/dynamic/io/import/tasks/${formId}`);
}

/** 下载失败行报告（可修改后重新导入） */
export function fetchIoImportReport(taskId: string) {
  return request.get<Blob>(`/dynamic/back/dynamic/io/import/report/${taskId}`, { responseType: 'blob' });
}

/** 导出数据 Excel（body=列表同款查询条件，不含分页=全量；敏感列按配置脱敏/剔除，选项回译） */
export function exportIoData(formId: string, query: Record<string, any>) {
  return request.post<Blob>(`/dynamic/back/dynamic/io/export/${formId}`, query, { responseType: 'blob' });
}
