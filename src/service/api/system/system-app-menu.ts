import { request } from '../../request';

// 查询应用关联的菜单列表
export function findSystemAppMenuList(data: SystemAppMenuNamespace.SystemAppMenuQuery) {
  return request.post<SystemAppMenuNamespace.SystemAppMenuPage>('/system/back/system/appMenu/list', data);
}

// 查询应用关联的菜单列表
export function findSystemAppMenuTree(data: SystemAppMenuNamespace.SystemAppMenuQuery) {
  return request.post<SystemAppMenuNamespace.SystemAppMenuForm[]>('/system/back/system/appMenu/tree', data);
}

// 查询应用关联的菜单详细
export function findSystemAppMenuDetail(id: string) {
  return request.get<SystemAppMenuNamespace.SystemAppMenuDetail>(`/system/back/system/appMenu/${id}`);
}

// 新增应用关联的菜单
export function saveSystemAppMenuDetail(data: SystemAppMenuNamespace.SystemAppMenuForm) {
  return request.post(`/system/back/system/appMenu/save`, data);
}

// 修改应用关联的菜单
export function updateSystemAppMenuDetail(data: SystemAppMenuNamespace.SystemAppMenuForm) {
  return request.put(`/system/back/system/appMenu/edit`, data);
}

// 删除应用关联的菜单
export function delSystemAppMenu(data: string[]) {
  return request.delete(`/system/back/system/appMenu/${data}`, {});
}
