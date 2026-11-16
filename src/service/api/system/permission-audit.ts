import { request } from '../../request';

// R1-8 权限审计报表：权限相关变更日志（含动作归类与对象名称解析）
export function findPermissionAuditList(data: PermissionAuditNamespace.PermissionAuditQuery) {
  return request.post<PermissionAuditNamespace.PermissionAuditPage>(
    '/message/back/message/systemLogOperation/permissionAudit',
    data
  );
}

// R1-8 权限台账：人×应用×数据范围（仅生效中的授权）
export function findPermissionMatrix(data: PermissionAuditNamespace.PermissionMatrixQuery) {
  return request.post<PermissionAuditNamespace.PermissionMatrixRow[]>(
    '/system/back/system/permissionAudit/matrix',
    data
  );
}
