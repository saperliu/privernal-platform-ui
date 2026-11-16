import { request } from '../../request';

// 查询角色与用户关系列表
export function findSystemRoleUserList(data: SystemRoleUserNamespace.SystemRoleUserQuery) {
  return request.post<SystemRoleUserNamespace.SystemRoleUserPage>('/system/back/system/roleUser/list', data);
}

// 查询角色与用户关系详细
export function findSystemRoleUserDetail(id: string) {
  return request.get<SystemRoleUserNamespace.SystemRoleUserForm>(`/system/back/system/roleUser/${id}`);
}

// 新增角色与用户关系
export function saveSystemRoleUserDetail(data: SystemRoleUserNamespace.SystemRoleUserForm) {
  return request.post(`/system/back/system/roleUser/save`, data);
}

// 新增角色与菜单关系
export function saveSystemRoleUserBatch(data: SystemRoleUserNamespace.SystemRoleUserForm) {
  return request.post(`/system/back/system/roleUser/batch/save`, data);
}

// 修改角色与用户关系
export function updateSystemRoleUserDetail(data: SystemRoleUserNamespace.SystemRoleUserForm) {
  return request.put(`/system/back/system/roleUser/edit`, data);
}

// R1-8 授权有效期：设置/清除成员授权有效期（expireTime=null 即恢复永久授权；Date 走 epoch 毫秒）
export function updateSystemRoleUserExpire(data: { id: string; expireTime: number | null }) {
  return request.put(`/system/back/system/roleUser/expire`, data);
}

// 删除角色与用户关系
export function delSystemRoleUser(data: string[]) {
  return request.delete(`/system/back/system/roleUser/${data}`, {});
}
