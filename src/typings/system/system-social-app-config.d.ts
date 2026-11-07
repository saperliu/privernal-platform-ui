/**
 * 第三方应用配置(小程序)
 */
declare namespace SystemSocialAppConfigNamespace {
  interface SystemSocialAppConfigQuery extends ApiCommon.RequestPage {
    /** 应用的编码,区分哪个应用登录 */
    appCode?: string;

    /** 应用的名称，解绑时区分解绑哪一个 */
    appName?: string;
  }

  interface SystemSocialAppConfigPage extends ApiCommon.ResponsePage {
    list: SystemSocialAppConfigForm[];
  }

  /**
   * 第三方应用配置(小程序)
   */
  interface SystemSocialAppConfigForm extends ApiCommon.FormBase {
    /**  */
    id: string;

    /** appId */
    appId: string;

    /** 密钥 */
    secret: string;

    /** 应用的编码,区分哪个应用登录 */
    appCode: string;

    /** 应用的名称，解绑时区分解绑哪一个 */
    appName: string;

    /** 应用的url */
    appUrl: string;

    /** 部门 */
    deptId: string;

    /** 是否需要审核用户 */
    examineUser: string;

    /** 所属组织 */
    organizationId: string;

    /** 部门 */
    departmentId: string;

    /** 角色 */
    roleId: string;
  }

  interface SystemSocialAppConfigTable extends SystemSocialAppConfigForm {
    /** 序号 */
    index: number;
  }
}
