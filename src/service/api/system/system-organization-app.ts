import { request } from '../../request';

// 查询组织授权的应用列表
export function findSystemOrganizationAppList(data: SystemOrganizationAppNamespace.SystemOrganizationAppQuery) {
  return request.post<SystemOrganizationAppNamespace.SystemOrganizationAppPage>(
    '/system/back/system/organizationApp/list',
    data
  );
}

// 查询组织授权的应用详细
export function findSystemOrganizationAppDetail(id: string) {
  return request.get<SystemOrganizationAppNamespace.SystemOrganizationAppDetail>(
    `/system/back/system/organizationApp/${id}`
  );
}

// 新增组织授权的应用
export function saveSystemOrganizationAppDetail(data: SystemOrganizationAppNamespace.SystemOrganizationAppForm) {
  return request.post(`/system/back/system/organizationApp/save`, data);
}

// 修改组织授权的应用
export function updateSystemOrganizationAppDetail(data: SystemOrganizationAppNamespace.SystemOrganizationAppForm) {
  return request.put(`/system/back/system/organizationApp/edit`, data);
}

// 删除组织授权的应用
export function delSystemOrganizationApp(data: string[]) {
  return request.delete(`/system/back/system/organizationApp/${data}`, {});
}
