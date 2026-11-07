/**
 * 系统登录日志
 */
declare namespace SystemLogLoginNamespace {
  interface SystemLogLoginQuery extends ApiCommon.RequestPage {
    loginName?: string;

    nickName?: string;

    loginIp?: string;

    loginLocation?: string;

    browser?: string;

    os?: string;

    platform?: string;

    message?: string;

    status?: number;

    departmentId?: string;

    organizationId?: string;
    parameters?: {
      beginDate?: string;
      endDate?: string;
    };
    dateList?: string[];
  }

  interface SystemLogLoginPage extends ApiCommon.ResponsePage {
    list: SystemLogLoginForm[];
  }
  /**
   * 系统登录日志
   */
  interface SystemLogLoginForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 登录名 */
    loginName: string;

    /** 昵称 */
    nickName: string;

    /** 登录IP */
    loginIp: string;

    /** 登录地址 */
    loginLocation: string;

    /** 浏览器 */
    browser: string;

    /** 操作系统 */
    os: string;

    /** 平台固件 */
    platform: string;

    /** 消息 */
    message: string;

    /** 状态;登录是否成功（0正常 1异常） */
    status: number;

    /** $column.columnComment */
    departmentId: string;

    /** $column.columnComment */
    organizationId: string;
  }

  /**
   * 系统登录日志
   * 详情
   */
  interface SystemLogLoginDetail extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 登录名 */
    loginName: string;

    /** 昵称 */
    nickName: string;

    /** 登录IP */
    loginIp: string;

    /** 登录地址 */
    loginLocation: string;

    /** 浏览器 */
    browser: string;

    /** 操作系统 */
    os: string;

    /** 平台固件 */
    platform: string;

    /** 消息 */
    message: string;

    /** 状态;登录是否成功（0正常 1异常） */
    status: number;

    /** $column.columnComment */
    departmentId: string;

    /** $column.columnComment */
    organizationId: string;
  }
}
