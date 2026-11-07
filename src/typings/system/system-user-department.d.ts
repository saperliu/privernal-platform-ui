/**
 * 用户兼职部门
 */
declare namespace SystemUserDepartmentNamespace {
  type SystemUserDepartmentQuery = ApiCommon.RequestPage;

  interface SystemUserDepartmentPage extends ApiCommon.ResponsePage {
    list: SystemUserDepartmentForm[];
  }
  /**
   * 用户兼职部门
   */
  interface SystemUserDepartmentForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 备注 */
    remark: string;

    /** 用户ID */
    userId: string;

    /** 组织ID;此数据所属组织 */
    organizationId: string;

    /** 部门ID;所属部门 */
    departmentId: string;

    /** 是否主部门(0 否，1是)，目前主部门放在了user表里 */
    isMain: number;

    /**
     * 增加的人员
     */
    userDTOList: SystemUserNamespace.SystemUserForm[];
  }

  interface SystemUserDepartmentTable extends SystemUserDepartmentForm {
    /** 序号 */
    index: number;
  }
}
