import { request } from '../../request';

// 导出应用包：表单、列表配置、流程定义与节点权限、报表/大屏/字典/角色绑定元数据（specVersion 1.5，自动签名）
export function exportAppPackage(appId: string) {
  return request.get<AppPackageNamespace.Package>('/system/back/system/appPackage/export', {
    params: { appId }
  });
}

// 导入应用包，overwrite 为 true 时更新目标环境已存在的表单与节点权限配置；
// 已签包验签失败会被后端拒绝，ignoreSignature=true 为显式豁免（确认包来源可信时使用）
export function importAppPackage(file: File, overwrite: boolean, ignoreSignature = false) {
  return request.post<AppPackageNamespace.ImportResult>(
    '/system/back/system/appPackage/import',
    { file, overwrite: String(overwrite), ignoreSignature: String(ignoreSignature) },
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

// 导入预检（dry-run）：解析包并比对目标环境，逐项预测 create/update/skip/reuse/conflict，不落库
export function dryRunAppPackage(file: File, overwrite: boolean) {
  return request.post<AppPackageNamespace.DryRunResult>(
    '/system/back/system/appPackage/dryRun',
    { file, overwrite: String(overwrite) },
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

// 官方模板列表（manifest 展示面）
export function fetchAppPackageTemplates() {
  return request.get<AppPackageNamespace.TemplateSummary[]>('/system/back/system/appPackage/templates');
}

// 模板包详情（完整应用包 JSON，安装前预览用）
export function fetchAppPackageTemplate(templateCode: string) {
  return request.get<AppPackageNamespace.Package>(`/system/back/system/appPackage/templates/${templateCode}`);
}

// 模板安装预检：与导入预检同口径
export function dryRunAppPackageTemplate(templateCode: string, overwrite: boolean) {
  return request.post<AppPackageNamespace.DryRunResult>('/system/back/system/appPackage/dryRunTemplate', null, {
    params: { templateCode, overwrite: String(overwrite) }
  });
}

// 一键安装官方模板（模板包来自随发布内置资源，安装前以本环境密钥现签再走标准导入链路）
export function importAppPackageTemplate(templateCode: string, overwrite: boolean) {
  return request.post<AppPackageNamespace.ImportResult>('/system/back/system/appPackage/importTemplate', null, {
    params: { templateCode, overwrite: String(overwrite) }
  });
}
