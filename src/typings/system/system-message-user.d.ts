/**
 * 系统通知人员
 */
declare namespace SystemMessageUserNamespace {
  interface SystemMessageUserQuery extends ApiCommon.RequestPage {
    messageId?: string;

    userId?: string;

    status?: number;

    nickName?: string;
  }

  interface SystemMessageUserPage extends ApiCommon.ResponsePage {
    list: SystemMessageUserForm[];
  }
  /**
   * 系统通知人员
   */
  interface SystemMessageUserForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 消息ID */
    messageId: string;

    /** 用户 */
    userId: string;

    /** 状态;（0未读 1已读） */
    status: number;

    /** 昵称 */
    nickName: string;
  }

  /**
   * 系统通知人员
   * 详情
   */
  interface SystemMessageUserDetail extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 消息ID */
    messageId: string;

    /** 用户 */
    userId: string;

    /** 状态;（0未读 1已读） */
    status: number;

    /** 昵称 */
    nickName: string;
  }
}
