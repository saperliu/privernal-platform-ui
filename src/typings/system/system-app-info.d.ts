/**
 * 应用信息
 */
declare namespace SystemAppInfoNamespace {
  interface SystemAppInfoQuery extends ApiCommon.RequestPage {
    appKey?: string;

    appSecret?: string;

    appName?: string;

    code?: string;

    type?: string;

    userId?: string;

    status?: number;

    organizationId?: string;
  }

  interface SystemAppInfoPage extends ApiCommon.ResponsePage {
    list: SystemAppInfoForm[];
  }
  /**
   * 应用信息
   */
  interface SystemAppInfoForm extends ApiCommon.FormBase {
    /** primary key id */
    id: string;

    /** 应用KEY */
    appKey: string;

    /** 应用密钥 */
    appSecret: string;

    /** 图标 */
    icon: string;

    /** 名称 */
    appName: string;

    /** 编码 */
    code: string;

    /** 类型 */
    type: string;

    /** 用户 */
    userId: string;

    /** 状态 */
    status: number;

    /** 组织ID */
    organizationId: string;
    /** PC端的路径 */
    pcPath: string;
    /** APP的路径 */
    appPath: string;

    /**
     * 前端显示图标使用
     */
    localIcon: string;
    /**
     * 应用修改的菜单
     */
    menuList: SystemAppMenuNamespace.SystemAppMenuForm[];
    groupList: SystemAppCommonGroupNamespace.SystemAppCommonGroupForm[];
  }

  /**
   * 应用信息
   * 详情
   */
  interface SystemAppInfoDetail extends ApiCommon.FormBase {
    /** primary key id */
    id: string;

    /** 应用KEY */
    appKey: string;

    /** 应用密钥 */
    appSecret: string;

    /** 图标 */
    icon: string;

    /** 名称 */
    appName: string;

    /** 编码 */
    code: string;

    /** 类型 */
    type: string;

    /** 用户 */
    userId: string;

    /** 状态 */
    status: number;

    /** 组织ID */
    organizationId: string;
    /**
     * 应用修改的菜单
     */
    menuList: SystemAppMenuNamespace.SystemAppMenuForm[];
    groupList: SystemAppCommonGroupNamespace.SystemAppCommonGroupForm[];
    workflowList: SystemAppWorkflowNamespace.SystemAppWorkflowForm[];
  }
}
