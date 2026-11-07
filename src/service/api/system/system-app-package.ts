import { request } from '../../request';

// 导出应用包：表单、列表配置、流程定义与节点权限、报表数据集/图表/仪表盘元数据（specVersion 1.1）
export function exportAppPackage(appId: string) {
  return request.get<AppPackageNamespace.Package>('/system/back/system/appPackage/export', {
    params: { appId }
  });
}

// 导入应用包，overwrite 为 true 时更新目标环境已存在的表单与节点权限配置
export function importAppPackage(file: File, overwrite: boolean) {
  return request.post<AppPackageNamespace.ImportResult>(
    '/system/back/system/appPackage/import',
    { file, overwrite: String(overwrite) },
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}
