import { request } from '../../request';

// 查询文件配置列表
export function findSystemFileConfigList(data: SystemFileConfigNamespace.SystemFileConfigQuery) {
  return request.post<SystemFileConfigNamespace.SystemFileConfigPage>('/file/back/system/fileConfig/list', data);
}

// 查询文件配置详细
export function findSystemFileConfigDetail(id: string) {
  return request.get<SystemFileConfigNamespace.SystemFileConfigForm>(`/file/back/system/fileConfig/${id}`);
}

// 新增文件配置
export function saveSystemFileConfigDetail(data: SystemFileConfigNamespace.SystemFileConfigForm) {
  return request.post(`/file/back/system/fileConfig/save`, data);
}

// 修改文件配置
export function updateSystemFileConfigDetail(data: SystemFileConfigNamespace.SystemFileConfigForm) {
  return request.put(`/file/back/system/fileConfig/edit`, data);
}

// 删除文件配置
export function delSystemFileConfig(data: string[]) {
  return request.delete(`/file/back/system/fileConfig/${data}`, {});
}
