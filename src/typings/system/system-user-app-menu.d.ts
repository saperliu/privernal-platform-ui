/**
 * 用户收藏的常用功能菜单
 */
declare namespace SystemUserAppMenuNamespace {
  interface SystemUserAppMenuQuery extends ApiCommon.RequestPage {
    userId: string;

    menuId: string;

    status: number;

    organizationId: string;
  }

  interface SystemUserAppMenuPage extends ApiCommon.ResponsePage {
    list: SystemUserAppMenuForm[];
  }
  /**
   * 用户收藏的常用功能菜单
   */
  interface SystemUserAppMenuForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 用户的ID */
    userId: string;

    /** 关联的菜单 */
    menuId: string;

    /** 状态 */
    status: number;

    /** 组织ID */
    organizationId: string;
  }

  /**
   * 用户收藏的常用功能菜单
   * 详情
   */
  interface SystemUserAppMenuDetail extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 用户的ID */
    userId: string;

    /** 关联的菜单 */
    menuId: string;

    /** 状态 */
    status: number;

    /** 组织ID */
    organizationId: string;
  }
}
