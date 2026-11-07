import { request } from '../../request';

// 查询社交账号列表
export function findSystemSocialUserList(data: SystemSocialUserNamespace.SystemSocialUserQuery) {
  return request.post<SystemSocialUserNamespace.SystemSocialUserPage>('/system/back/system/socialUser/list', data);
}

// 查询社交账号详细
export function findSystemSocialUserDetail(id: string) {
  return request.get<SystemSocialUserNamespace.SystemSocialUserForm>(`/system/back/system/socialUser/${id}`);
}

// 新增社交账号
export function saveSystemSocialUserDetail(data: SystemSocialUserNamespace.SystemSocialUserForm) {
  return request.post(`/system/back/system/socialUser/save`, data);
}

// 修改社交账号
export function updateSystemSocialUserDetail(data: SystemSocialUserNamespace.SystemSocialUserForm) {
  return request.put(`/system/back/system/socialUser/edit`, data);
}

// 删除社交账号
export function delSystemSocialUser(data: string[]) {
  return request.delete(`/system/back/system/socialUser/${data}`, {});
}
