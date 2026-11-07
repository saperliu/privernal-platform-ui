/**
 * 角色组与角色
 */
declare namespace SystemRoleGroupRoleNamespace {
  type SystemRoleGroupRoleQuery = ApiCommon.RequestPage;

  interface SystemRoleGroupRolePage extends ApiCommon.ResponsePage {
    list: SystemRoleGroupRoleForm[];
  }

  /**
   * 角色组与角色
   */
  interface SystemRoleGroupRoleForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 组ID */
    groupId: string;

    /** 角色ID */
    roleId: string;
  }

  interface SystemRoleGroupRoleTable extends SystemRoleGroupRoleForm {
    /** 序号 */
    index: number;
  }
}
