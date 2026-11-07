import { request } from '../../request';

// 查询动态数据库列表
export function findDynamicDatabaseList(data: DynamicDatabaseNamespace.DynamicDatabaseQuery) {
  return request.post<DynamicDatabaseNamespace.DynamicDatabasePage>('/dynamic/back/dynamic/database/list', data);
}

// 查询动态数据库详细
export function findDynamicDatabaseDetail(id: string) {
  return request.get<DynamicDatabaseNamespace.DynamicDatabaseDetail>(`/dynamic/back/dynamic/database/${id}`);
}

// 新增动态数据库
export function saveDynamicDatabaseDetail(data: DynamicDatabaseNamespace.DynamicDatabaseForm) {
  return request.post(`/dynamic/back/dynamic/database/save`, data);
}

// 修改动态数据库
export function updateDynamicDatabaseDetail(data: DynamicDatabaseNamespace.DynamicDatabaseForm) {
  return request.put(`/dynamic/back/dynamic/database/edit`, data);
}

// 删除动态数据库
export function delDynamicDatabase(data: string[]) {
  return request.delete(`/dynamic/back/dynamic/database/${data}`, {});
}
