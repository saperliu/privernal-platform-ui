import { request } from '../../request';

// 查询组织列表
export function findSystemOrganizationList(data: SystemOrganizationNamespace.SystemOrganizationQuery) {
  return request.post<SystemOrganizationNamespace.SystemOrganizationPage>(
    '/system/back/system/organization/list',
    data
  );
}

// 查询组织详细
export function findSystemOrganizationDetail(id: string) {
  return request.get<SystemOrganizationNamespace.SystemOrganizationForm>(`/system/back/system/organization/${id}`);
}

// 新增组织
export function saveSystemOrganizationDetail(data: SystemOrganizationNamespace.SystemOrganizationForm) {
  return request.post(`/system/back/system/organization/save`, data);
}

// 修改组织
export function updateSystemOrganizationDetail(data: SystemOrganizationNamespace.SystemOrganizationForm) {
  return request.put(`/system/back/system/organization/edit`, data);
}

// 删除组织
export function delSystemOrganization(data: string[]) {
  return request.delete(`/system/back/system/organization/${data}`, {});
}

// 同步组织
export function synSystemOrganization(data: string) {
  return request.post(`/system/back/system/organization/syn/${data}`, {});
}

// 新增组织的功能
export function saveSystemOrganizationMenu(data: SystemOrganizationNamespace.SystemOrganizationMenuDTO) {
  return request.post(`/system/back/system/organization/menu/save`, data);
}

// 新增组织的菜单
export function findSystemOrganizationMenu(data: SystemOrganizationNamespace.SystemOrganizationMenuFilter) {
  return request.post<SystemOrganizationNamespace.SystemOrganizationMenuItem[]>(
    `/system/back/system/organization/menu/list`,
    data
  );
}

// 同步组织字典
export function synSystemOrganizationDict(data: SystemOrganizationNamespace.SystemOrganizationForm) {
  return request.put(`/system/back/system/organization/init/dict`, data);
}

export function synSystemOrganizationWorkflow(data: SystemOrganizationNamespace.SystemOrganizationForm) {
  return request.put(`/system/back/flow/definition/syn`, {
    organizationId: data.id,
    departmentId: ''
  });
}

// 新增组织的应用
export function saveSystemOrganizationApp(data: SystemOrganizationNamespace.SystemOrganizationAppDTO) {
  return request.post(`/system/back/system/organization/app/save`, data);
}
