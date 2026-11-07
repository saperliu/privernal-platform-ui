/**
 * 社交账号
 */
declare namespace SystemSocialUserNamespace {
  type SystemSocialUserQuery = ApiCommon.RequestPage;

  interface SystemSocialUserPage extends ApiCommon.ResponsePage {
    list: SystemSocialUserForm[];
  }

  /**
   * 社交账号
   */
  interface SystemSocialUserForm extends ApiCommon.FormBase {
    /**  */
    id: string;

    /** 第三方系统的唯一ID */
    uuid: string;

    /** 第三方用户来源 GITHUB、GITEE、QQ */
    source: string;

    /** 应用的编码,区分哪个应用登录 */
    appCode: string;

    /** 用户的授权令牌 */
    accessToken: string;

    /** 第三方用户的授权令牌的有效期 */
    expireIn: number;

    /** 刷新令牌 */
    refreshToken: string;

    /** 第三方用户的 open id */
    openId: string;

    /** 第三方用户的 ID */
    uid: string;

    /** 个别平台的授权信息 */
    accessCode: string;

    /** 第三方用户的 union id */
    unionId: string;

    /** 第三方用户授予的权限 */
    scope: string;

    /** 个别平台的授权信息 */
    tokenType: string;

    /** id token */
    idToken: string;

    /** 小米平台用户的附带属性 */
    macAlgorithm: string;

    /** 小米平台用户的附带属性 */
    macKey: string;

    /** 用户的授权code */
    code: string;

    /** Twitter平台用户的附带属性 */
    oauthToken: string;

    /** Twitter平台用户的附带属性 */
    oauthTokenSecret: string;

    /** 所属组织 */
    organizationId: string;

    /** 所属部门 */
    departmentId: string;
  }

  interface SystemSocialUserTable extends SystemSocialUserForm {
    /** 序号 */
    index: number;
  }
}
