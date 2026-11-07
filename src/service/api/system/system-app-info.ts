import { request } from '../../request';

// 查询应用信息列表
export function findSystemAppInfoList(data: SystemAppInfoNamespace.SystemAppInfoQuery) {
  return request.post<SystemAppInfoNamespace.SystemAppInfoPage>('/system/back/system/appInfo/list', data);
}

// 查询应用信息详细
export function findSystemAppInfoDetail(id: string) {
  return request.get<SystemAppInfoNamespace.SystemAppInfoDetail>(`/system/back/system/appInfo/${id}`);
}

// 新增应用信息
export function saveSystemAppInfoDetail(data: SystemAppInfoNamespace.SystemAppInfoDetail) {
  return request.post(`/system/back/system/appInfo/save`, data);
}

// 修改应用信息
export function updateSystemAppInfoDetail(data: SystemAppInfoNamespace.SystemAppInfoDetail) {
  return request.put(`/system/back/system/appInfo/edit`, data);
}

// 删除应用信息
export function delSystemAppInfo(data: string[]) {
  return request.delete(`/system/back/system/appInfo/${data}`, {});
}

// 查询组织的应用
export function findSystemAppListByOrg() {
  return request.post<SystemAppInfoNamespace.SystemAppInfoForm[]>('/system/back/system/appInfo/app/list', {});
}
// 查询组织的应用，用于企业授权时，查询这个企业拥有的应用。因为非当前登录人操作，所以要传参。
export function findSystemAppListByOrgId(data: SystemAppInfoNamespace.SystemAppInfoQuery) {
  return request.post<SystemAppInfoNamespace.SystemAppInfoForm[]>('/system/back/system/appInfo/organization', data);
}
// 统计当前组织内非系统应用（个人/业务创建的应用）数量，首页"应用数量"
export function getOrgAppNum() {
  return request.get<number>('/system/back/system/appInfo/num');
}
