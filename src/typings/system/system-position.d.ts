/**
 * 岗位
 */
declare namespace SystemPositionNamespace {
  interface SystemPositionQuery extends ApiCommon.RequestPage {
    positionName?: string;
  }

  interface SystemPositionPage extends ApiCommon.ResponsePage {
    list: SystemPositionTable[];
  }

  /**
   * 岗位
   */
  interface SystemPositionForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 岗位名称 */
    positionName: string;

    /** 岗位编码 */
    positionCode: string;

    /** 状态;是否禁用，0是否，1是是 */
    status: number;

    /** 排序值 */
    orderNum: number;

    /** 组织ID;所属组织 */
    organizationId: string;

    /** 部门ID;所属部门 */
    departmentId: string;
  }

  interface SystemPositionTable extends SystemPositionForm {
    /** 序号 */
    index: number;
  }
}
