/**
 * R1-8 权限治理：权限审计报表 + 权限台账（人×应用×数据范围）
 */
declare namespace PermissionAuditNamespace {
  /** 审计行（system_log_operation 权限相关变更富化视图） */
  interface PermissionAuditRow {
    id: string;
    /** 时间 */
    createdTime?: string | null;
    /** 操作人 */
    operationPerson?: string | null;
    /** 动作归类 */
    action?: string | null;
    /** 对象摘要 */
    targetSummary?: string | null;
    /** 涉及角色（已解析名称） */
    roleNames?: string | null;
    /** 涉及用户（已解析名称） */
    userNames?: string | null;
    /** 状态 0正常 1异常 */
    status?: number | null;
    /** 请求方式 */
    requestMethod?: string | null;
    /** 请求URL */
    operationUrl?: string | null;
    /** 主机地址 */
    operationIp?: string | null;
    /** 请求参数 */
    operationParam?: string | null;
    /** 操作消息 */
    message?: string | null;
    /** @Log 模块名称 */
    name?: string | null;
  }

  interface PermissionAuditQuery extends ApiCommon.RequestPage {
    keyword?: string;
    keywords?: string[];
    /** 操作人（模糊） */
    operationPerson?: string;
    /** 时间范围 */
    dateList?: string[];
    parameters?: {
      beginDate?: string;
      endDate?: string;
    };
  }

  interface PermissionAuditPage extends ApiCommon.ResponsePage {
    list: PermissionAuditRow[];
  }

  /** 权限台账行 */
  interface PermissionMatrixRow {
    userId: string;
    loginName?: string | null;
    nickName?: string | null;
    roleId: string;
    roleName?: string | null;
    appId?: string | null;
    appName?: string | null;
    permission?: string | null;
    /** 10仅本人 20本部门 30本部门及以下 40自定义 50全部 */
    dataScope?: number | null;
    expireTime?: string | null;
  }

  interface PermissionMatrixQuery {
    /** 组织ID（非平台管理员后端强制为当前组织，可不传） */
    organizationId?: string;
    userId?: string;
    roleId?: string;
  }
}
