import { request } from '../../request';

// 查询用户服务组织列表
export function findSystemUserServiceOrgList(data: SystemUserServiceOrgNamespace.SystemUserServiceOrgQuery) {
  return request.post<SystemUserServiceOrgNamespace.SystemUserServiceOrgPage>(
    '/system/back/system/userServiceOrg/list',
    data
  );
}

// 查询用户服务组织详细
export function findSystemUserServiceOrgDetail(id: string) {
  return request.get<SystemUserServiceOrgNamespace.SystemUserServiceOrgForm>(
    `/system/back/system/userServiceOrg/${id}`
  );
}

// 新增用户服务组织
export function saveSystemUserServiceOrgDetail(data: SystemUserServiceOrgNamespace.SystemUserServiceOrgForm) {
  return request.post(`/system/back/system/userServiceOrg/save`, data);
}

// 修改用户服务组织
export function updateSystemUserServiceOrgDetail(data: SystemUserServiceOrgNamespace.SystemUserServiceOrgForm) {
  return request.put(`/system/back/system/userServiceOrg/edit`, data);
}

// 删除用户服务组织
export function delSystemUserServiceOrg(data: string[]) {
  return request.delete(`/system/back/system/userServiceOrg/${data}`, {});
}
