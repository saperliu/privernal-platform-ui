/**
 * 部门
 */
declare namespace SystemDepartmentNamespace {
  interface SystemDepartmentQuery extends ApiCommon.RequestPage {
    deptName?: string;
  }

  interface SystemDepartmentPage extends ApiCommon.ResponsePage {
    list: SystemDepartmentForm[];
  }

  interface SystemDepartmentTree {
    data: SystemDepartmentForm[];
  }

  /**
   * 部门
   */
  interface SystemDepartmentForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 部门编码 */
    deptCode: string;

    /** 部门名称 */
    deptName: string;

    /** 排序 */
    orderNum: number;

    /** 主管的ID */
    leaderId: string;
    /**
     * 系统类型
     */
    systemType: string;
    /** 主管 */
    leaderName?: string;

    /** 状态;是否禁用 0是否，1是是 */
    status: number;

    /** 组织ID;所属组织 */
    organizationId: string;
    parentName?: string;
    parentId?: string;
  }

  interface SystemDepartmentTable extends SystemDepartmentForm {
    /** 序号 */
    index: number;

    children?: SystemDepartmentTable[];
  }
}
