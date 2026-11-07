/**
 * 应用关联的菜单
 */
declare namespace SystemAppMenuNamespace {
  interface SystemAppMenuQuery extends ApiCommon.RequestPage {
    remark?: string;
    appId?: string;

    menuId?: string;

    status?: number;

    organizationId?: string;
  }

  interface SystemAppMenuPage extends ApiCommon.ResponsePage {
    list: SystemAppMenuForm[];
  }
  /**
   * 应用关联的菜单
   */
  interface SystemAppMenuForm extends ApiCommon.FormBase {
    /** primary key id */
    id: string;

    /** 应用的ID */
    appId: string;

    /** 关联的菜单 */
    menuId: string;

    /** 状态 */
    status: number;

    mustMenu: number;
    visibleMenu: number;

    /** 组织ID */
    organizationId: string;

    menuName: string;
    menuType: string;
    actionTag: string;

    children: SystemAppMenuForm[];
  }

  /**
   * 应用关联的菜单
   * 详情
   */
  interface SystemAppMenuDetail extends ApiCommon.FormBase {
    /** primary key id */
    id: string;

    /** 应用的ID */
    appId: string;

    /** 关联的菜单 */
    menuId: string;

    /** 状态 */
    status: number;
    mustMenu: number;
    visibleMenu: number;
    /** 组织ID */
    organizationId: string;
    menuName: string;
    menuType: string;
    actionTag: string;
  }
}
