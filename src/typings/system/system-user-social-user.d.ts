/**
 * 社交帐号关联系统账号
 */
declare namespace SystemUserSocialUserNamespace {
  type SystemUserSocialUserQuery = ApiCommon.RequestPage;

  interface SystemUserSocialUserPage extends ApiCommon.ResponsePage {
    list: SystemUserSocialUserForm[];
  }

  /**
   * 社交帐号关联系统账号
   */
  interface SystemUserSocialUserForm extends ApiCommon.FormBase {
    /**  */
    id: string;

    /** 系统用户ID */
    userId: string;

    /** 社交用户ID */
    socialUserId: string;
  }

  interface SystemUserSocialUserTable extends SystemUserSocialUserForm {
    /** 序号 */
    index: number;
  }
}
