/**
 * 角色用户与部门关系
 */
declare namespace SystemRoleUserDeptNamespace {
  interface SystemRoleUserDeptQuery extends ApiCommon.RequestPage {
    roleUserId: string;
    deptName: string;
  }

  interface SystemRoleUserDeptPage extends ApiCommon.ResponsePage {
    list: SystemRoleUserDeptForm[];
  }

  /**
   * 角色用户与部门关系
   */
  interface SystemRoleUserDeptForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 角色用户表的ID;角色用户表的ID */
    roleUserId: string;

    /** 组织ID;所属组织 */
    organizationId: string;

    /** 服务的部门 */
    departmentId: string;

    deptName: string;

    status: number;

    departmentDTOList: SystemDepartmentNamespace.SystemDepartmentForm[];
    /** 新增的部门列表 */
    addDepartmentDTOList: SystemDepartmentNamespace.SystemDepartmentForm[];
    /** 删除的部门列表 */
    delDepartmentDTOList: SystemDepartmentNamespace.SystemDepartmentForm[];
  }

  interface SystemRoleUserDeptTable extends SystemRoleUserDeptForm {
    /** 序号 */
    index: number;
  }
}
