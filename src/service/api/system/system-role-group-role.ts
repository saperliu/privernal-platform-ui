import { request } from '../../request';

// 查询角色组与角色列表
export function findSystemRoleGroupRoleList(data: SystemRoleGroupRoleNamespace.SystemRoleGroupRoleQuery) {
  return request.post<SystemRoleGroupRoleNamespace.SystemRoleGroupRolePage>(
    '/system/back/system/roleGroupRole/list',
    data
  );
}

// 查询角色组与角色详细
export function findSystemRoleGroupRoleDetail(id: string) {
  return request.get<SystemRoleGroupRoleNamespace.SystemRoleGroupRoleForm>(`/system/back/system/roleGroupRole/${id}`);
}

// 新增角色组与角色
export function saveSystemRoleGroupRoleDetail(data: SystemRoleGroupRoleNamespace.SystemRoleGroupRoleForm) {
  return request.post(`/system/back/system/roleGroupRole/save`, data);
}

// 修改角色组与角色
export function updateSystemRoleGroupRoleDetail(data: SystemRoleGroupRoleNamespace.SystemRoleGroupRoleForm) {
  return request.put(`/system/back/system/roleGroupRole/edit`, data);
}

// 删除角色组与角色
export function delSystemRoleGroupRole(data: string[]) {
  return request.delete(`/system/back/system/roleGroupRole/${data}`, {});
}
