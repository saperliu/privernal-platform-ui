import { request } from '../../request';

// 查询字典数据列表
export function findSystemDictionaryDataList(data: SystemDictionaryDataNamespace.SystemDictionaryDataQuery) {
  return request.post<SystemDictionaryDataNamespace.SystemDictionaryDataPage>(
    '/system/back/system/dictionaryData/list',
    data
  );
}

// 查询字典数据详细
export function findSystemDictionaryDataDetail(id: string) {
  return request.get<SystemDictionaryDataNamespace.SystemDictionaryDataForm>(
    `/system/back/system/dictionaryData/${id}`
  );
}

// 新增字典数据
export function saveSystemDictionaryDataDetail(data: SystemDictionaryDataNamespace.SystemDictionaryDataForm) {
  return request.post(`/system/back/system/dictionaryData/save`, data);
}

// 修改字典数据
export function updateSystemDictionaryDataDetail(data: SystemDictionaryDataNamespace.SystemDictionaryDataForm) {
  return request.put(`/system/back/system/dictionaryData/edit`, data);
}

// 删除字典数据
export function delSystemDictionaryData(data: string[]) {
  return request.delete(`/system/back/system/dictionaryData/${data}`, {});
}
