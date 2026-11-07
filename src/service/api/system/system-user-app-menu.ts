import { request } from '../../request';

// 查询用户收藏的常用功能菜单列表
export function findSystemUserAppMenuList(data: SystemUserAppMenuNamespace.SystemUserAppMenuQuery) {
  return request.post<SystemUserAppMenuNamespace.SystemUserAppMenuPage>('/system/back/system/userAppMenu/list', data);
}

// 查询用户收藏的常用功能菜单详细
export function findSystemUserAppMenuDetail(id: string) {
  return request.get<SystemUserAppMenuNamespace.SystemUserAppMenuDetail>(`/system/back/system/userAppMenu/${id}`);
}

// 新增用户收藏的常用功能菜单
export function saveSystemUserAppMenuDetail(data: SystemUserAppMenuNamespace.SystemUserAppMenuForm) {
  return request.post(`/system/back/system/userAppMenu/save`, data);
}

// 修改用户收藏的常用功能菜单
export function updateSystemUserAppMenuDetail(data: SystemUserAppMenuNamespace.SystemUserAppMenuForm) {
  return request.put(`/system/back/system/userAppMenu/edit`, data);
}

// 删除用户收藏的常用功能菜单
export function delSystemUserAppMenu(data: string[]) {
  return request.delete(`/system/back/system/userAppMenu/${data}`, {});
}
