import { request } from '../../request';

// 查询用户组与用户列表
export function findSystemUserGroupUserList(data: SystemUserGroupUserNamespace.SystemUserGroupUserQuery) {
  return request.post<SystemUserGroupUserNamespace.SystemUserGroupUserPage>(
    '/system/back/system/userGroupUser/list',
    data
  );
}

// 查询用户组与用户详细
export function findSystemUserGroupUserDetail(id: string) {
  return request.get<SystemUserGroupUserNamespace.SystemUserGroupUserForm>(`/system/back/system/userGroupUser/${id}`);
}

// 新增用户组与用户
export function saveSystemUserGroupUserDetail(data: SystemUserGroupUserNamespace.SystemUserGroupUserForm) {
  return request.post(`/system/back/system/userGroupUser/save`, data);
}

// 修改用户组与用户
export function updateSystemUserGroupUserDetail(data: SystemUserGroupUserNamespace.SystemUserGroupUserForm) {
  return request.put(`/system/back/system/userGroupUser/edit`, data);
}

// 删除用户组与用户
export function delSystemUserGroupUser(data: string[]) {
  return request.delete(`/system/back/system/userGroupUser/${data}`, {});
}

// 查询用户组的用户
export function findSystemUserByGroup(data: SystemUserGroupUserNamespace.SystemUserGroupUserQuery) {
  return request.post<SystemUserGroupUserNamespace.SystemUserGroupUserPage>(
    '/system/back/system/userGroup/user/list',
    data
  );
}

// 新增用户组与用户关系
export function saveSystemUserGroupBatch(data: SystemUserGroupUserNamespace.SystemUserGroupUserForm) {
  return request.post(`/system/back/system/userGroup/batch/save`, data);
}
