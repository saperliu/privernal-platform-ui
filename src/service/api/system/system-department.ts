import { request } from '../../request';

// 查询部门树
export function findSystemDepartmentAllTree(data: SystemDepartmentNamespace.SystemDepartmentQuery) {
  return request.post<SystemDepartmentNamespace.SystemDepartmentTable>('/system/back/system/department/all/tree', data);
}
// 查询部门树
export function findSystemDepartmentTree(data: SystemDepartmentNamespace.SystemDepartmentQuery) {
  return request.post<SystemDepartmentNamespace.SystemDepartmentTable>('/system/back/system/department/tree', data);
}

// 查询部门列表
export function findSystemDepartmentList(data: SystemDepartmentNamespace.SystemDepartmentQuery) {
  return request.post<SystemDepartmentNamespace.SystemDepartmentPage>('/system/back/system/department/list', data);
}

// 查询部门详细
export function findSystemDepartmentDetail(id: string) {
  return request.get<SystemDepartmentNamespace.SystemDepartmentForm>(`/system/back/system/department/${id}`);
}

// 新增部门
export function saveSystemDepartmentDetail(data: SystemDepartmentNamespace.SystemDepartmentForm) {
  return request.post(`/system/back/system/department/save`, data);
}

// 修改部门
export function updateSystemDepartmentDetail(data: SystemDepartmentNamespace.SystemDepartmentForm) {
  return request.put(`/system/back/system/department/edit`, data);
}

// 删除部门
export function delSystemDepartment(data: string[]) {
  return request.delete(`/system/back/system/department/${data}`, {});
}
