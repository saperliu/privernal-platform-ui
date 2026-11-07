/**
 * 组织授权的应用
 */
declare namespace SystemOrganizationAppNamespace {
  interface SystemOrganizationAppQuery extends ApiCommon.RequestPage {
    appId?: string;

    status?: number;

    organizationId?: string;
  }

  interface SystemOrganizationAppPage extends ApiCommon.ResponsePage {
    list: SystemOrganizationAppForm[];
  }
  /**
   * 组织授权的应用
   */
  interface SystemOrganizationAppForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 应用的ID */
    appId: string;

    /** 菜单状态;菜单状态（0正常 1停用） */
    status: number;

    /** 组织ID */
    organizationId: string;

    actionTag: string;
  }

  /**
   * 组织授权的应用
   * 详情
   */
  interface SystemOrganizationAppDetail extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 应用的ID */
    appId: string;

    /** 菜单状态;菜单状态（0正常 1停用） */
    status: number;

    /** 组织ID */
    organizationId: string;
  }
}
