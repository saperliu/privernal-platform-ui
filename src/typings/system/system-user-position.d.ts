/**
 * 用户的岗位
 */
declare namespace SystemUserPositionNamespace {
  interface SystemUserPositionQuery extends ApiCommon.RequestPage {
    positionId: string;
    nickName: string;
  }

  interface SystemUserPositionPage extends ApiCommon.ResponsePage {
    list: SystemUserPositionForm[];
  }

  /**
   * 用户的岗位
   */
  interface SystemUserPositionForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 用户ID */
    userId: string;

    /** 岗位ID */
    positionId: string;

    /** 组织ID;此数据所属组织 */
    organizationId: string;

    /** 部门ID;所属部门 */
    departmentId: string;

    /** 是否主岗位(0 否，1是) */
    isMain: number;

    /**
     * 增加的人员
     */
    userDTOList: SystemUserNamespace.SystemUserForm[];
  }

  interface SystemUserPositionTable extends SystemUserPositionForm {
    /** 序号 */
    index: number;
  }
}
