import { request } from '../../request';

// ==================== 脚本资产中心（skill-plan-upgrade §3-C1，v2.2 契约） ====================

export function fetchScriptAssetPage(params: {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  status?: string;
}) {
  return request.get('/dynamic/back/dynamic/script/asset/list', { params });
}

export function fetchScriptAsset(id: string) {
  return request.get(`/dynamic/back/dynamic/script/asset/${id}`);
}

export function createScriptAsset(data: ScriptNamespace.ScriptAsset) {
  return request.post<ScriptNamespace.ScriptAsset>('/dynamic/back/dynamic/script/asset/add', data);
}

export function updateScriptAsset(data: ScriptNamespace.ScriptAsset) {
  return request.post<ScriptNamespace.ScriptAsset>('/dynamic/back/dynamic/script/asset/edit', data);
}

export function publishScriptAsset(id: string) {
  return request.post(`/dynamic/back/dynamic/script/asset/${id}/publish`, {});
}

export function changeScriptAssetStatus(id: string, status: 'PUBLISHED' | 'DISABLED') {
  return request.post(`/dynamic/back/dynamic/script/asset/${id}/status`, null, { params: { status } });
}

/** 试运行（发布前必须实跑成功一次） */
export function runScriptAsset(id: string, params: Record<string, any>) {
  return request.post<{ result: any; version: number; trialPassed: boolean }>(
    `/dynamic/back/dynamic/script/asset/${id}/run`,
    params
  );
}

export function deleteScriptAsset(id: string) {
  return request.post(`/dynamic/back/dynamic/script/asset/${id}/delete`, {});
}

export function fetchScriptAssetReferences(id: string) {
  return request.get<ScriptNamespace.ScriptBinding[]>(`/dynamic/back/dynamic/script/asset/${id}/references`);
}

export function fetchScriptAssetExecLogs(id: string) {
  return request.get(`/dynamic/back/dynamic/script/asset/${id}/exec-logs`, { params: { pageNum: 1, pageSize: 20 } });
}

export function fetchScriptAssetVersions(id: string) {
  return request.get(`/dynamic/back/dynamic/script/asset/${id}/versions`);
}

// ==================== 挂点绑定（附录 C-7：独立表，不进 metaData） ====================

export function fetchScriptBindings(formId: string) {
  return request.get<ScriptNamespace.ScriptBinding[]>(`/dynamic/back/dynamic/script/binding/form/${formId}/list`);
}

/** 整表替换语义（与设计器面板整单提交对齐） */
export function saveScriptBindings(formId: string, tableCode: string, bindings: ScriptNamespace.ScriptBinding[]) {
  return request.post(`/dynamic/back/dynamic/script/binding/form/${formId}/save?tableCode=${tableCode}`, bindings);
}

export function changeScriptBindingStatus(id: string, enabled: 'Y' | 'N') {
  return request.post(`/dynamic/back/dynamic/script/binding/${id}/status`, null, { params: { enabled } });
}

export function deleteScriptBinding(id: string) {
  return request.post(`/dynamic/back/dynamic/script/binding/${id}/delete`, {});
}
