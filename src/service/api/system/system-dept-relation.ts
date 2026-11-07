import { request } from '../../request';

// 查询部门内联关系列表
export function findSystemDeptRelationList(data: SystemDeptRelationNamespace.SystemDeptRelationQuery) {
  return request.post<SystemDeptRelationNamespace.SystemDeptRelationPage>(
    '/system/back/system/deptRelation/list',
    data
  );
}

// 查询部门内联关系详细
export function findSystemDeptRelationDetail(id: string) {
  return request.get<SystemDeptRelationNamespace.SystemDeptRelationForm>(`/system/back/system/deptRelation/${id}`);
}

// 新增部门内联关系
export function saveSystemDeptRelationDetail(data: SystemDeptRelationNamespace.SystemDeptRelationForm) {
  return request.post(`/system/back/system/deptRelation/save`, data);
}

// 修改部门内联关系
export function updateSystemDeptRelationDetail(data: SystemDeptRelationNamespace.SystemDeptRelationForm) {
  return request.put(`/system/back/system/deptRelation/edit`, data);
}

// 删除部门内联关系
export function delSystemDeptRelation(data: string[]) {
  return request.delete(`/system/back/system/deptRelation/${data}`, {});
}
