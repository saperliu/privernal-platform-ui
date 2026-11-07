/**
 * 用户服务组织
 */
declare namespace SystemUserServiceOrgNamespace {
  type SystemUserServiceOrgQuery = ApiCommon.RequestPage;

  interface SystemUserServiceOrgPage extends ApiCommon.ResponsePage {
    list: SystemUserServiceOrgForm[];
  }

  /**
   * 用户服务组织
   */
  interface SystemUserServiceOrgForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 用户ID;用户ID */
    userId: string;

    /** 组织ID;服务的组织ID */
    organizationId: string;

    /** 组织名称 */
    organizationName: string;

    /** 数据权限;数据范围（50：全部数据权限 40：自定数据权限 20：本部门数据权限 30：本部门及以下数据权限 10: 仅本人数据权限） */
    dataScope: 10 | 20 | 30 | 40 | 50;

    /** 部门ID;兼职部门ID */
    departmentId: string;
  }

  interface SystemUserServiceOrgTable extends SystemUserServiceOrgForm {
    /** 序号 */
    index: number;
  }

  /**
   * 数据权限
   * 40：全部数据权限
   * 50：自定数据权限
   * 20：本部门数据权限
   * 30：本部门及以下数据权限
   * 10: 仅本人数据权限
   */
  type DataScopeKey = NonNullable<SystemUserServiceOrgForm['dataScope']>;
}
