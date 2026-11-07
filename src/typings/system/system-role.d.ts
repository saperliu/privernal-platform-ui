/**
 * 角色
 */
declare namespace SystemRoleNamespace {
  interface SystemRoleQuery extends ApiCommon.RequestPage {
    roleName?: string;
    systemType?: string;
  }

  interface SystemRolePage extends ApiCommon.ResponsePage {
    list: SystemRoleForm[];
  }

  /**
   * 角色
   */
  interface SystemRoleForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 备注 */
    remark: string;

    /** 数据权限;数据范围（50：全部数据权限 40：自定数据权限 20：本部门数据权限 30：本部门及以下数据权限 10: 仅本人数据权限） */
    dataScope: number;

    /** 角色KEY */
    roleKey: string;

    /** 状态;角色状态（0正常 1停用） */
    status: number;

    /** 排序值 */
    orderNum: number;

    /** 角色名称 */
    roleName: string;

    /** 角色的系统类型 NORMAL 普通   SYSTEM  系统 */
    systemType: string;

    /** 组织ID */
    organizationId: string;

    /** 角色分类ID */
    classificationId: string;

    /** 部门ID */
    departmentId: string;

    /** 部门名称 */
    deptName?: string;
  }

  interface SystemRoleTable extends SystemRoleForm {
    /** 序号 */
    index: number;
  }
}
