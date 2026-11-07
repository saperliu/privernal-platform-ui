/**
 * 通知
 */
declare namespace SystemNoticeNamespace {
  interface SystemNoticeQuery extends ApiCommon.RequestPage {
    /** 公告标题 */
    noticeTitle?: string;
    /** 内容简介 */
    content?: string;
    /** 状态;（1正常 0停止） */
    status?: number;
  }

  interface SystemNoticePage extends ApiCommon.ResponsePage {
    list: SystemNoticeForm[];
  }

  /**
   * 通知
   */
  interface SystemNoticeForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 备注 */
    remark: string;

    /** 公告标题 */
    noticeTitle: string;

    /** 公告类型 */
    noticeType: string;

    /** 内容简介 */
    content: string;

    /** 状态;（0正常 1停止） */
    status: number;

    /** 详情链接 */
    detailUrl: string;

    /** 组织 */
    organizationId: string;

    /** 部门 */
    departmentId: string;
  }

  interface SystemNoticeTable extends SystemNoticeForm {
    /** 序号 */
    index: number;
  }
}
