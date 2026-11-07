/**
 * 用户组
 */
declare namespace SystemUserGroupNamespace {
  interface SystemUserGroupQuery extends ApiCommon.RequestPage {
    groupName?: string;
  }

  interface SystemUserGroupPage extends ApiCommon.ResponsePage {
    list: SystemUserGroupForm[];
  }

  /**
   * 用户组
   */
  interface SystemUserGroupForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 组名 */
    groupName: string;

    /** 类型;SYSTEM 系统默认 CUSTOM 用户创建 */
    groupType: string;

    /** 编码 */
    groupCode: string;

    /** 组织ID */
    organizationId: string;

    /** 部门ID */
    departmentId: string;
  }

  interface SystemUserGroupTable extends SystemUserGroupForm {
    /** 序号 */
    index: number;
  }
}
