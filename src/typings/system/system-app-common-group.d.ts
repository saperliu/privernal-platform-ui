/**
 * 应用关联的公共组
 */
declare namespace SystemAppCommonGroupNamespace {
  interface SystemAppCommonGroupQuery extends ApiCommon.RequestPage {
    appId: string;

    commonGroupId: string;

    status: number;

    organizationId: string;
  }

  interface SystemAppCommonGroupPage extends ApiCommon.ResponsePage {
    list: SystemAppCommonGroupForm[];
  }
  /**
   * 应用关联的公共组
   */
  interface SystemAppCommonGroupForm extends ApiCommon.FormBase {
    /** primary key id */
    id: string;

    /** 应用的ID */
    appId: string;

    /** 关联的公共组 */
    commonGroupId: string;
    commonGroupName: string;

    /** 状态 */
    status: number;

    /** 组织ID */
    organizationId: string;

    actionTag: string;
  }

  /**
   * 应用关联的公共组
   * 详情
   */
  interface SystemAppCommonGroupDetail extends ApiCommon.FormBase {
    /** primary key id */
    id: string;

    /** 应用的ID */
    appId: string;

    /** 关联的公共组 */
    commonGroupId: string;

    /** 状态 */
    status: number;

    /** 组织ID */
    organizationId: string;
  }
}
