/**
 * 应用可以访问的路径
 */
declare namespace SystemAppPathNamespace {
  interface SystemAppPathQuery extends ApiCommon.RequestPage {
    appId: string;

    path: string;

    status: number;

    organizationId: string;
  }

  interface SystemAppPathPage extends ApiCommon.ResponsePage {
    list: SystemAppPathForm[];
  }
  /**
   * 应用可以访问的路径
   */
  interface SystemAppPathForm extends ApiCommon.FormBase {
    /** primary key id */
    id: string;

    /** 应用 */
    appId: string;

    /** path */
    path: string;

    /** 状态 */
    status: number;

    /** 组织ID */
    organizationId: string;
  }

  /**
   * 应用可以访问的路径
   * 详情
   */
  interface SystemAppPathDetail extends ApiCommon.FormBase {
    /** primary key id */
    id: string;

    /** 应用 */
    appId: string;

    /** path */
    path: string;

    /** 状态 */
    status: number;

    /** 组织ID */
    organizationId: string;
  }
}
