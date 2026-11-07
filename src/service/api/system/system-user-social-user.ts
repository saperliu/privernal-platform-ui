import { request } from '../../request';

// 查询社交帐号关联系统账号列表
export function findSystemUserSocialUserList(data: SystemUserSocialUserNamespace.SystemUserSocialUserQuery) {
  return request.post<SystemUserSocialUserNamespace.SystemUserSocialUserPage>(
    '/system/back/system/userSocialUser/list',
    data
  );
}

// 查询社交帐号关联系统账号详细
export function findSystemUserSocialUserDetail(id: string) {
  return request.get<SystemUserSocialUserNamespace.SystemUserSocialUserForm>(
    `/system/back/system/userSocialUser/${id}`
  );
}

// 新增社交帐号关联系统账号
export function saveSystemUserSocialUserDetail(data: SystemUserSocialUserNamespace.SystemUserSocialUserForm) {
  return request.post(`/system/back/system/userSocialUser/save`, data);
}

// 修改社交帐号关联系统账号
export function updateSystemUserSocialUserDetail(data: SystemUserSocialUserNamespace.SystemUserSocialUserForm) {
  return request.put(`/system/back/system/userSocialUser/edit`, data);
}

// 删除社交帐号关联系统账号
export function delSystemUserSocialUser(data: string[]) {
  return request.delete(`/system/back/system/userSocialUser/${data}`, {});
}
