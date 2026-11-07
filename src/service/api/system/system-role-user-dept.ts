import { request } from '../../request';

// 查询角色用户与部门关系列表
export function findSystemRoleUserDeptList(data: SystemRoleUserDeptNamespace.SystemRoleUserDeptQuery) {
  return request.post<SystemRoleUserDeptNamespace.SystemRoleUserDeptPage>(
    '/system/back/system/roleUserDept/list',
    data
  );
}

// 查询角色用户与部门关系详细
export function findSystemRoleUserDeptDetail(id: string) {
  return request.get<SystemRoleUserDeptNamespace.SystemRoleUserDeptForm>(`/system/back/system/roleUserDept/${id}`);
}

// 新增角色用户与部门关系
export function saveSystemRoleUserDeptDetail(data: SystemRoleUserDeptNamespace.SystemRoleUserDeptForm) {
  return request.post(`/system/back/system/roleUserDept/save`, data);
}

// 新增角色与菜单关系
export function saveSystemRoleUserDeptBatch(data: SystemRoleUserDeptNamespace.SystemRoleUserDeptForm) {
  return request.post(`/system/back/system/roleUserDept/batch/save`, data);
}

// 修改角色用户与部门关系
export function updateSystemRoleUserDeptDetail(data: SystemRoleUserDeptNamespace.SystemRoleUserDeptForm) {
  return request.put(`/system/back/system/roleUserDept/edit`, data);
}

// 删除角色用户与部门关系
export function delSystemRoleUserDept(data: string[]) {
  return request.delete(`/system/back/system/roleUserDept/${data}`, {});
}
