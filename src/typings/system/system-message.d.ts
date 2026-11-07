/**
 * 系统消息通知
 */
declare namespace SystemMessageNamespace {
  interface SystemMessageQuery extends ApiCommon.RequestPage {
    mainTitle?: string;

    subTitle?: string;

    messageType?: string;

    messagePerson?: string;

    detailUrl?: string;

    content?: string;

    status?: number;

    createdName?: string;
    remark?: string;
  }

  interface SystemMessagePage extends ApiCommon.ResponsePage {
    list: SystemMessageForm[];
  }
  /**
   * 系统消息通知
   */
  interface SystemMessageForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 标题 */
    mainTitle: string;

    /** 二级标题 */
    subTitle: string;

    /** 类型, WORKFLOW-审批消息，ALARM-报警消息，NOTICE-通知 */
    messageType: string;

    /** 发送人类型，ALL-所有人[限制组织内]，SEL-选定的人员 */
    messagePerson: string;

    /** 详情链接 */
    detailUrl: string;

    /** 内容简介 */
    content: string;

    /** 状态;（0未读 1已读） */
    status: number;

    /** 组织 */
    organizationId: string;

    /** 部门 */
    departmentId: string;

    /** $column.columnComment */
    createdName: string;

    userIds: string[];

    userList: SystemMessageUserNamespace.SystemMessageUserForm[];
  }

  /**
   * 系统消息通知
   * 详情
   */
  interface SystemMessageDetail extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 标题 */
    mainTitle: string;

    /** 二级标题 */
    subTitle: string;

    /** 类型, WORKFLOW-审批消息，ALARM-报警消息，NOTICE-通知 */
    messageType: string;

    /** 发送人类型，ALL-所有人[限制组织内]，SEL-选定的人员 */
    messagePerson: string;

    /** 详情链接 */
    detailUrl: string;

    /** 内容简介 */
    content: string;

    /** 状态;（0未读 1已读） */
    status: number;

    /** 组织 */
    organizationId: string;

    /** 部门 */
    departmentId: string;

    /** $column.columnComment */
    createdName: string;
  }
}
