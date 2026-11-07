import { request } from '../../request';

// 查询角色与菜单关系列表
export function findSystemRoleMenuList(data: SystemRoleMenuNamespace.SystemRoleMenuQuery) {
  return request.post<any>('/system/back/system/roleMenu/list', data);
}

// 查询角色与菜单关系详细
export function findSystemRoleMenuDetail(id: string) {
  return request.get<SystemRoleMenuNamespace.SystemRoleMenuForm>(`/system/back/system/roleMenu/${id}`);
}

// 新增角色与菜单关系
export function saveSystemRoleMenuDetail(data: SystemRoleMenuNamespace.SystemRoleMenuForm) {
  return request.post(`/system/back/system/roleMenu/save`, data);
}

// 新增角色与菜单关系
export function saveSystemRoleMenuBatch(data: SystemRoleMenuNamespace.SystemRoleMenuForm) {
  return request.post(`/system/back/system/roleMenu/batch/save`, data);
}

// 修改角色与菜单关系
export function updateSystemRoleMenuDetail(data: SystemRoleMenuNamespace.SystemRoleMenuForm) {
  return request.put(`/system/back/system/roleMenu/edit`, data);
}

// 删除角色与菜单关系
export function delSystemRoleMenu(data: string[]) {
  return request.delete(`/system/back/system/roleMenu/${data}`, {});
}
