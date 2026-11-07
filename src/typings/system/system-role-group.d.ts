/**
 * 角色组
 */
declare namespace SystemRoleGroupNamespace {
  interface SystemRoleGroupQuery extends ApiCommon.RequestPage {
    groupName?: '';
  }

  interface SystemRoleGroupPage extends ApiCommon.ResponsePage {
    list: SystemRoleGroupForm[];
  }

  /**
   * 角色组
   */
  interface SystemRoleGroupForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 组编码 */
    groupCode: string;

    /** 组名 */
    groupName: string;

    /** 组织ID;默认的组织 */
    organizationId: string;

    /** 组的类型;SYSTEM 系统默认 CUSTOM 用户创建 */
    groupType: string;

    /** 部门;所属部门 */
    departmentId: string;
  }

  interface SystemRoleGroupTable extends SystemRoleGroupForm {
    /** 序号 */
    index: number;
  }
}
