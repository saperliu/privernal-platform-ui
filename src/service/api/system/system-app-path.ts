import { request } from '../../request';

// 查询应用可以访问的路径列表
export function findSystemAppPathList(data: SystemAppPathNamespace.SystemAppPathQuery) {
  return request.post<SystemAppPathNamespace.SystemAppPathPage>('/system/back/system/appPath/list', data);
}

// 查询应用可以访问的路径详细
export function findSystemAppPathDetail(id: string) {
  return request.get<SystemAppPathNamespace.SystemAppPathDetail>(`/system/back/system/appPath/${id}`);
}

// 新增应用可以访问的路径
export function saveSystemAppPathDetail(data: SystemAppPathNamespace.SystemAppPathForm) {
  return request.post(`/system/back/system/appPath/save`, data);
}

// 修改应用可以访问的路径
export function updateSystemAppPathDetail(data: SystemAppPathNamespace.SystemAppPathForm) {
  return request.put(`/system/back/system/appPath/edit`, data);
}

// 删除应用可以访问的路径
export function delSystemAppPath(data: string[]) {
  return request.delete(`/system/back/system/appPath/${data}`, {});
}
