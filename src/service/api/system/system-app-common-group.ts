import { request } from '../../request';

// 查询应用关联的公共组列表
export function findSystemAppCommonGroupList(data: SystemAppCommonGroupNamespace.SystemAppCommonGroupQuery) {
  return request.post<SystemAppCommonGroupNamespace.SystemAppCommonGroupPage>(
    '/system/back/system/appCommonGroup/list',
    data
  );
}

// 查询应用关联的公共组详细
export function findSystemAppCommonGroupDetail(id: string) {
  return request.get<SystemAppCommonGroupNamespace.SystemAppCommonGroupDetail>(
    `/system/back/system/appCommonGroup/${id}`
  );
}

// 新增应用关联的公共组
export function saveSystemAppCommonGroupDetail(data: SystemAppCommonGroupNamespace.SystemAppCommonGroupForm) {
  return request.post(`/system/back/system/appCommonGroup/save`, data);
}

// 修改应用关联的公共组
export function updateSystemAppCommonGroupDetail(data: SystemAppCommonGroupNamespace.SystemAppCommonGroupForm) {
  return request.put(`/system/back/system/appCommonGroup/edit`, data);
}

// 删除应用关联的公共组
export function delSystemAppCommonGroup(data: string[]) {
  return request.delete(`/system/back/system/appCommonGroup/${data}`, {});
}
