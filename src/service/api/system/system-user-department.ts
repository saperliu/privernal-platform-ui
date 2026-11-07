import { request } from '../../request';

// 查询用户兼职部门列表
export function findSystemUserDepartmentList(data: SystemUserDepartmentNamespace.SystemUserDepartmentQuery) {
  return request.post<SystemUserDepartmentNamespace.SystemUserDepartmentPage>(
    '/system/back/system/userDepartment/list',
    data
  );
}

// 查询用户兼职部门详细
export function findSystemUserDepartmentDetail(id: string) {
  return request.get<SystemUserDepartmentNamespace.SystemUserDepartmentForm>(
    `/system/back/system/userDepartment/${id}`
  );
}

// 新增用户兼职部门
export function saveSystemUserDepartmentDetail(data: SystemUserDepartmentNamespace.SystemUserDepartmentForm) {
  return request.post(`/system/back/system/userDepartment/save`, data);
}

// 修改用户兼职部门
export function updateSystemUserDepartmentDetail(data: SystemUserDepartmentNamespace.SystemUserDepartmentForm) {
  return request.put(`/system/back/system/userDepartment/edit`, data);
}

// 删除用户兼职部门
export function delSystemUserDepartment(data: string[]) {
  return request.delete(`/system/back/system/userDepartment/${data}`, {});
}
