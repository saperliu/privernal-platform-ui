import { request } from '../../request';

// 查询角色列表
export function findSystemRoleList(data: SystemRoleNamespace.SystemRoleQuery) {
  return request.post<SystemRoleNamespace.SystemRolePage>('/system/back/system/role/list/dto', data);
}

// 查询角色详细
export function findSystemRoleDetail(id: string) {
  return request.get<SystemRoleNamespace.SystemRoleForm>(`/system/back/system/role/${id}`);
}

// 新增角色
export function saveSystemRoleDetail(data: SystemRoleNamespace.SystemRoleForm) {
  return request.post(`/system/back/system/role/save`, data);
}

// 修改角色
export function updateSystemRoleDetail(data: SystemRoleNamespace.SystemRoleForm) {
  return request.put(`/system/back/system/role/edit`, data);
}

// 删除角色
export function delSystemRole(data: string[]) {
  return request.delete(`/system/back/system/role/${data}`, {});
}

// 查询角色的用户
export function findSystemUserByRole(data: SystemRoleUserNamespace.SystemRoleUserQuery) {
  return request.post<SystemRoleUserNamespace.SystemRoleUserPage>('/system/back/system/role/user/list', data);
}

// 查询角色的功能
export function findSystemMenuByRole(roleId: string, appId: string) {
  return request.get<SystemRoleMenuNamespace.SystemRoleMenuForm[]>(
    `/system/back/system/role/menu/list/${roleId}/${appId}`,
    {}
  );
}
