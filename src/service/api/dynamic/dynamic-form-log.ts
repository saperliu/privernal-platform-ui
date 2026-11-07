import { request } from '../../request';

// 查询form的历史版本列表
export function findDynamicFormLogList(data: DynamicFormLogNamespace.DynamicFormLogQuery) {
  return request.post<DynamicFormLogNamespace.DynamicFormLogPage>('/dynamic/back/dynamic/formLog/list', data);
}

// 查询form的历史版本详细
export function findDynamicFormLogDetail(id: string) {
  return request.get<DynamicFormLogNamespace.DynamicFormLogDetail>(`/dynamic/back/dynamic/formLog/${id}`);
}

// 新增form的历史版本
export function saveDynamicFormLogDetail(data: DynamicFormLogNamespace.DynamicFormLogForm) {
  return request.post(`/dynamic/back/dynamic/formLog/save`, data);
}

// 修改form的历史版本
export function updateDynamicFormLogDetail(data: DynamicFormLogNamespace.DynamicFormLogForm) {
  return request.put(`/dynamic/back/dynamic/formLog/edit`, data);
}

// 删除form的历史版本
export function delDynamicFormLog(data: string[]) {
  return request.delete(`/dynamic/back/dynamic/formLog/${data}`, {});
}
