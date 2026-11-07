/**
 * 用户组与用户
 */
declare namespace SystemUserGroupUserNamespace {
  interface SystemUserGroupUserQuery extends ApiCommon.RequestPage {
    groupId: string;
    nickName: string;
  }

  interface SystemUserGroupUserPage extends ApiCommon.ResponsePage {
    list: SystemUserGroupUserForm[];
  }

  /**
   * 用户组与用户
   */
  interface SystemUserGroupUserForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 用户组ID */
    groupId: string;

    /** 用户ID */
    userId: string;

    /**
     * 增加的人员
     */
    userDTOList: SystemUserNamespace.SystemUserForm[];
  }

  interface SystemUserGroupUserTable extends SystemUserGroupUserForm {
    /** 序号 */
    index: number;
  }
}
