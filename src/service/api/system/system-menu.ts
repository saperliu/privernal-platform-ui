import { request } from '../../request';

// 查询菜单列表
export function findSystemMenuTree(data: SystemMenuNamespace.SystemMenuQuery) {
  return request.post<SystemMenuNamespace.SystemMenuForm[]>('/system/back/system/menu/tree', data);
}

// 查询树型菜单
export function findSystemMenuTreeAll(data: SystemMenuNamespace.SystemMenuQuery) {
  return request.post<SystemMenuNamespace.SystemMenuForm[]>('/system/back/system/menu/tree/all', data);
}

// 查询树型菜单
export function findSystemMenuAppTree(data: SystemMenuNamespace.SystemMenuQuery) {
  return request.post<SystemMenuNamespace.SystemMenuForm[]>('/system/back/system/menu/app/tree', data);
}

// 查询菜单列表
export function findSystemMenuList(data: SystemMenuNamespace.SystemMenuQuery) {
  return request.post<SystemMenuNamespace.SystemMenuPage>('/system/back/system/menu/list', data);
}

// 查询菜单详细
export function findSystemMenuDetail(id: string) {
  return request.get<SystemMenuNamespace.SystemMenuForm>(`/system/back/system/menu/${id}`);
}

// 新增菜单
export function saveSystemMenuDetail(data: SystemMenuNamespace.SystemMenuForm) {
  return request.post(`/system/back/system/menu/save`, data);
}

// 修改菜单
export function updateSystemMenuDetail(data: SystemMenuNamespace.SystemMenuForm) {
  return request.put(`/system/back/system/menu/edit`, data);
}

// 删除菜单
export function delSystemMenu(data: string[]) {
  return request.delete(`/system/back/system/menu/${data}`, {});
}
