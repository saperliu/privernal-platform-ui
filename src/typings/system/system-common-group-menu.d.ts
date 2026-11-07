/**
 * 组关联的权限
 */
declare namespace SystemCommonGroupMenuNamespace {
  interface SystemCommonGroupMenuQuery extends ApiCommon.RequestPage {
    menuId?: string;

    commonGroupId?: string;

    status?: number;

    organizationId?: string;
  }

  interface SystemCommonGroupMenuPage extends ApiCommon.ResponsePage {
    list: SystemCommonGroupMenuForm[];
  }
  /**
   * 组关联的权限
   */
  interface SystemCommonGroupMenuForm extends ApiCommon.FormBase {
    /** primary key id */
    id: string;

    /** 菜单的ID */
    menuId: string;
    menuName: string;
    menuType: string;

    /** 关联的公共组 */
    commonGroupId: string;

    /** 状态 */
    status: number;
    mustMenu: number;
    visibleMenu: number;
    /** 组织ID */
    organizationId: string;
    actionTag: string;

    children: SystemCommonGroupMenuForm[];
  }

  /**
   * 组关联的权限
   * 详情
   */
  interface SystemCommonGroupMenuDetail extends ApiCommon.FormBase {
    /** primary key id */
    id: string;

    /** 菜单的ID */
    menuId: string;
    menuName: string;
    menuType: string;

    /** 关联的公共组 */
    commonGroupId: string;

    /** 状态 */
    status: number;
    mustMenu: number;
    visibleMenu: number;
    /** 组织ID */
    organizationId: string;
    actionTag: string;

    children: SystemCommonGroupMenuForm[];
  }
}
