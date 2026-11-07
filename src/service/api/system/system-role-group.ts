import { request } from '../../request';

// 查询角色组列表
export function findSystemRoleGroupList(data: SystemRoleGroupNamespace.SystemRoleGroupQuery) {
  return request.post<SystemRoleGroupNamespace.SystemRoleGroupPage>('/system/back/system/roleGroup/list', data);
}

// 查询角色组详细
export function findSystemRoleGroupDetail(id: string) {
  return request.get<SystemRoleGroupNamespace.SystemRoleGroupForm>(`/system/back/system/roleGroup/${id}`);
}

// 新增角色组
export function saveSystemRoleGroupDetail(data: SystemRoleGroupNamespace.SystemRoleGroupForm) {
  return request.post(`/system/back/system/roleGroup/save`, data);
}

// 修改角色组
export function updateSystemRoleGroupDetail(data: SystemRoleGroupNamespace.SystemRoleGroupForm) {
  return request.put(`/system/back/system/roleGroup/edit`, data);
}

// 删除角色组
export function delSystemRoleGroup(data: string[]) {
  return request.delete(`/system/back/system/roleGroup/${data}`, {});
}
