import { request } from '../../request';

// 查询用户组列表
export function findSystemUserGroupList(data: SystemUserGroupNamespace.SystemUserGroupQuery) {
  return request.post<SystemUserGroupNamespace.SystemUserGroupPage>('/system/back/system/userGroup/list', data);
}

// 查询用户组详细
export function findSystemUserGroupDetail(id: string) {
  return request.get<SystemUserGroupNamespace.SystemUserGroupForm>(`/system/back/system/userGroup/${id}`);
}

// 新增用户组
export function saveSystemUserGroupDetail(data: SystemUserGroupNamespace.SystemUserGroupForm) {
  return request.post(`/system/back/system/userGroup/save`, data);
}

// 修改用户组
export function updateSystemUserGroupDetail(data: SystemUserGroupNamespace.SystemUserGroupForm) {
  return request.put(`/system/back/system/userGroup/edit`, data);
}

// 删除用户组
export function delSystemUserGroup(data: string[]) {
  return request.delete(`/system/back/system/userGroup/${data}`, {});
}
