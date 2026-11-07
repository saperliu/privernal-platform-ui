import { request } from '../../request';

// 查询系统配置列表
export function findSystemDefaultConfigList(data: SystemDefaultConfigNamespace.SystemDefaultConfigQuery) {
  return request.post<SystemDefaultConfigNamespace.SystemDefaultConfigPage>(
    '/system/back/system/defaultConfig/list',
    data
  );
}

// 查询系统配置详细
export function findSystemDefaultConfigDetail(id: string) {
  return request.get<SystemDefaultConfigNamespace.SystemDefaultConfigForm>(`/system/back/system/defaultConfig/${id}`);
}

// 新增系统配置
export function saveSystemDefaultConfigDetail(data: SystemDefaultConfigNamespace.SystemDefaultConfigForm) {
  return request.post(`/system/back/system/defaultConfig/save`, data);
}

// 修改系统配置
export function updateSystemDefaultConfigDetail(data: SystemDefaultConfigNamespace.SystemDefaultConfigForm) {
  return request.put(`/system/back/system/defaultConfig/edit`, data);
}

// 删除系统配置
export function delSystemDefaultConfig(data: string[]) {
  return request.delete(`/system/back/system/defaultConfig/${data}`, {});
}

// 查询配置，通过key
export function findSystemDefaultConfigByKey(key: string) {
  return request.get<Array<SystemDefaultConfigNamespace.SystemDefaultConfigForm>>(
    `/system/back/system/defaultConfig/theme/${key}`
  );
}
