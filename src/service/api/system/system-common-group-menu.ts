import { request } from '../../request';

// 查询组关联的权限列表
export function findSystemCommonGroupMenuList(data: SystemCommonGroupMenuNamespace.SystemCommonGroupMenuQuery) {
  return request.post<SystemCommonGroupMenuNamespace.SystemCommonGroupMenuPage>(
    '/system/back/system/commonGroupMenu/list',
    data
  );
}

export function findSystemCommonGroupMenuTree(data: SystemAppMenuNamespace.SystemAppMenuQuery) {
  return request.post<SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm[]>(
    '/system/back/system/commonGroupMenu/tree',
    data
  );
}
// 查询组关联的权限详细
export function findSystemCommonGroupMenuDetail(id: string) {
  return request.get<SystemCommonGroupMenuNamespace.SystemCommonGroupMenuDetail>(
    `/system/back/system/commonGroupMenu/${id}`
  );
}

// 新增组关联的权限
export function saveSystemCommonGroupMenuDetail(data: SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm) {
  return request.post(`/system/back/system/commonGroupMenu/save`, data);
}

// 修改组关联的权限
export function updateSystemCommonGroupMenuDetail(data: SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm) {
  return request.put(`/system/back/system/commonGroupMenu/edit`, data);
}

// 删除组关联的权限
export function delSystemCommonGroupMenu(data: string[]) {
  return request.delete(`/system/back/system/commonGroupMenu/${data}`, {});
}
