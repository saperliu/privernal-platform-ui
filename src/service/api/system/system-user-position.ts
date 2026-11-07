import { request } from '../../request';

// 查询用户的岗位列表
export function findSystemUserPositionList(data: SystemUserPositionNamespace.SystemUserPositionQuery) {
  return request.post<SystemUserPositionNamespace.SystemUserPositionPage>(
    '/system/back/system/userPosition/list',
    data
  );
}

// 查询用户的岗位详细
export function findSystemUserPositionDetail(id: string) {
  return request.get<SystemUserPositionNamespace.SystemUserPositionForm>(`/system/back/system/userPosition/${id}`);
}

// 新增用户的岗位
export function saveSystemUserPositionDetail(data: SystemUserPositionNamespace.SystemUserPositionForm) {
  return request.post(`/system/back/system/userPosition/save`, data);
}

// 修改用户的岗位
export function updateSystemUserPositionDetail(data: SystemUserPositionNamespace.SystemUserPositionForm) {
  return request.put(`/system/back/system/userPosition/edit`, data);
}

// 删除用户的岗位
export function delSystemUserPosition(data: string[]) {
  return request.delete(`/system/back/system/userPosition/${data}`, {});
}
