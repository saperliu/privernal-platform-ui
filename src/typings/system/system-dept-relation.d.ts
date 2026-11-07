/**
 * 部门内联关系
 */
declare namespace SystemDeptRelationNamespace {
  type SystemDeptRelationQuery = ApiCommon.RequestPage;

  interface SystemDeptRelationPage extends ApiCommon.ResponsePage {
    list: SystemDeptRelationForm[];
  }

  /**
   * 部门内联关系
   */
  interface SystemDeptRelationForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 部门ID;上级部门 */
    parentId: string;

    /** 部门ID;下级部门 */
    departmentId: string;

    /** 层级;上与下级是第几层级:顶级是0 组织名称。部门级别都是多1开始 */
    level: number;
  }

  interface SystemDeptRelationTable extends SystemDeptRelationForm {
    /** 序号 */
    index: number;
  }
}
