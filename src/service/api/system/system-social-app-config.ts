import { request } from '../../request';

// 查询第三方应用配置(小程序)列表
export function findSystemSocialAppConfigList(data: SystemSocialAppConfigNamespace.SystemSocialAppConfigQuery) {
  return request.post<SystemSocialAppConfigNamespace.SystemSocialAppConfigPage>(
    '/system/back/system/appConfig/list',
    data
  );
}

// 查询第三方应用配置(小程序)详细
export function findSystemSocialAppConfigDetail(id: string) {
  return request.get<SystemSocialAppConfigNamespace.SystemSocialAppConfigForm>(`/system/back/system/appConfig/${id}`);
}

// 新增第三方应用配置(小程序)
export function saveSystemSocialAppConfigDetail(data: SystemSocialAppConfigNamespace.SystemSocialAppConfigForm) {
  return request.post(`/system/back/system/appConfig/save`, data);
}

// 修改第三方应用配置(小程序)
export function updateSystemSocialAppConfigDetail(data: SystemSocialAppConfigNamespace.SystemSocialAppConfigForm) {
  return request.put(`/system/back/system/appConfig/edit`, data);
}

// 删除第三方应用配置(小程序)
export function delSystemSocialAppConfig(data: string[]) {
  return request.delete(`/system/back/system/appConfig/${data}`, {});
}
