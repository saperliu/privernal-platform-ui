import { request } from '../../request';

// 查询字典类型列表
export function findSystemDictionaryTypeList(data: SystemDictionaryTypeNamespace.SystemDictionaryTypeQuery) {
  return request.post<SystemDictionaryTypeNamespace.SystemDictionaryTypePage>(
    '/system/back/system/dictionaryType/list',
    data
  );
}

// 查询字典类型详细
export function findSystemDictionaryTypeDetail(id: string) {
  return request.get<SystemDictionaryTypeNamespace.SystemDictionaryTypeForm>(
    `/system/back/system/dictionaryType/${id}`
  );
}

// 新增字典类型
export function saveSystemDictionaryTypeDetail(data: SystemDictionaryTypeNamespace.SystemDictionaryTypeForm) {
  return request.post(`/system/back/system/dictionaryType/save`, data);
}

// 修改字典类型
export function updateSystemDictionaryTypeDetail(data: SystemDictionaryTypeNamespace.SystemDictionaryTypeForm) {
  return request.put(`/system/back/system/dictionaryType/edit`, data);
}

// 删除字典类型
export function delSystemDictionaryType(data: string[]) {
  return request.delete(`/system/back/system/dictionaryType/${data}`, {});
}
