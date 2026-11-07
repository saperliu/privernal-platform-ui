import { request } from '../../request';

/**
 * 查询用户列表
 */
export function findSystemUserList(data: SystemUserNamespace.SystemUserQuery) {
  return request.post<SystemUserNamespace.SystemUserPage>('/system/back/system/user/list', data);
}

/**
 * 查询用户列表
 */
export function findSystemUserAllList(data: SystemUserNamespace.SystemUserQuery) {
  return request.post<SystemUserNamespace.SystemUserPage>('/system/back/system/user/all/list', data);
}

/**
 * 查询用户详情
 */
export function findSystemUserDetail(id: string) {
  return request.get<SystemUserNamespace.SystemUserForm>(`/system/back/system/user/${id}`);
}

/**
 * 查询用户详情
 */
export function findSystemUserByOrganizationId(organizationId: string, id: string) {
  return request.get<SystemUserNamespace.SystemUserForm>(`/system/back/system/user/org/${id}/${organizationId}`);
}
/**
 * 保存用户详情
 */
export function saveSystemUserDetail(data: SystemUserNamespace.SystemUserForm) {
  return request.post(`/system/back/system/user/save`, data);
}

/**
 * 保存用户详情
 */
export function updateSystemUserDetail(data: SystemUserNamespace.SystemUserForm) {
  return request.put(`/system/back/system/user/edit`, data);
}

/**
 * 删除用户
 */
export function delSystemUser(data: string[]) {
  return request.delete(`/system/back/system/user/${data}`, {});
}
export function getOrgUserNum() {
  return request.get(`/system/back/system/user/num`, {});
}
