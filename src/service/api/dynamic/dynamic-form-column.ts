import { request } from '../../request';

// 查询form的列的数据列表
export function findDynamicFormColumnList(data: DynamicFormColumnNamespace.DynamicFormColumnQuery) {
  return request.post<DynamicFormColumnNamespace.DynamicFormColumnPage>('/dynamic/back/dynamic/formColumn/list', data);
}

// 查询form的列的数据详细
export function findDynamicFormColumnDetail(id: string) {
  return request.get<DynamicFormColumnNamespace.DynamicFormColumnDetail>(`/dynamic/back/dynamic/formColumn/${id}`);
}

// 新增form的列的数据
export function saveDynamicFormColumnDetail(data: DynamicFormColumnNamespace.DynamicFormColumnForm) {
  return request.post(`/dynamic/back/dynamic/formColumn/save`, data);
}

// 修改form的列的数据
export function updateDynamicFormColumnDetail(data: DynamicFormColumnNamespace.DynamicFormColumnForm) {
  return request.put(`/dynamic/back/dynamic/formColumn/edit`, data);
}

// 删除form的列的数据
export function delDynamicFormColumn(data: string[]) {
  return request.delete(`/dynamic/back/dynamic/formColumn/${data}`, {});
}
