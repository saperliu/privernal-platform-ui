import { request } from '../../request';

// 查询公共组[用户或角色]列表
export function findSystemCommonGroupList(data: SystemCommonGroupNamespace.SystemCommonGroupQuery) {
  return request.post<SystemCommonGroupNamespace.SystemCommonGroupPage>('/system/back/system/commonGroup/list', data);
}

// 查询公共组[用户或角色]详细
export function findSystemCommonGroupDetail(id: string) {
  return request.get<SystemCommonGroupNamespace.SystemCommonGroupDetail>(`/system/back/system/commonGroup/${id}`);
}

// 新增公共组[用户或角色]
export function saveSystemCommonGroupDetail(data: SystemCommonGroupNamespace.SystemCommonGroupForm) {
  return request.post(`/system/back/system/commonGroup/save`, data);
}

// 修改公共组[用户或角色]
export function updateSystemCommonGroupDetail(data: SystemCommonGroupNamespace.SystemCommonGroupForm) {
  return request.put(`/system/back/system/commonGroup/edit`, data);
}

// 删除公共组[用户或角色]
export function delSystemCommonGroup(data: string[]) {
  return request.delete(`/system/back/system/commonGroup/${data}`, {});
}
