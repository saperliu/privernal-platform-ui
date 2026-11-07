import { request } from '../../request';

// 查询岗位列表
export function findSystemPositionList(data: SystemPositionNamespace.SystemPositionQuery) {
  return request.post<SystemPositionNamespace.SystemPositionPage>('/system/back/system/position/list', data);
}

// 查询岗位详细
export function findSystemPositionDetail(id: string) {
  return request.get<SystemPositionNamespace.SystemPositionForm>(`/system/back/system/position/${id}`);
}

// 新增岗位
export function saveSystemPositionDetail(data: SystemPositionNamespace.SystemPositionForm) {
  return request.post(`/system/back/system/position/save`, data);
}

// 修改岗位
export function updateSystemPositionDetail(data: SystemPositionNamespace.SystemPositionForm) {
  return request.put(`/system/back/system/position/edit`, data);
}

// 删除岗位
export function delSystemPosition(data: string[]) {
  return request.delete(`/system/back/system/position/${data}`, {});
}

// 查询岗位的用户
export function findSystemUserByPosition(data: SystemUserPositionNamespace.SystemUserPositionQuery) {
  return request.post<SystemUserPositionNamespace.SystemUserPositionPage>(
    '/system/back/system/position/user/list',
    data
  );
}

// 新增岗位与用户关系
export function saveSystemUserPositionBatch(data: SystemUserPositionNamespace.SystemUserPositionForm) {
  return request.post(`/system/back/system/userPosition/batch/save`, data);
}
