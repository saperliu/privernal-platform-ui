/**
 * 公共组[用户或角色]
 */
declare namespace SystemCommonGroupNamespace {
  interface SystemCommonGroupQuery extends ApiCommon.RequestPage {
    name?: string;
    code?: string;
    remark?: string;
    moduleType?: string;

    description?: string;

    groupType?: string;
  }

  interface SystemCommonGroupPage extends ApiCommon.ResponsePage {
    list: SystemCommonGroupForm[];
  }
  /**
   * 公共组[用户或角色]
   */
  interface SystemCommonGroupForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 组名 */
    name: string;

    /** 组编码 */
    code: string;

    /** 模块类型 */
    moduleType: string;

    /** 描述 */
    description: string;

    /** 类型 */
    groupType: string;

    /** 组织ID */
    organizationId: string;

    /** 部门ID */
    departmentId: string;
  }

  /**
   * 公共组[用户或角色]
   * 详情
   */
  interface SystemCommonGroupDetail extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 组名 */
    name: string;

    /** 组编码 */
    code: string;

    /** 模块类型 */
    moduleType: string;

    /** 描述 */
    description: string;

    /** 类型 */
    groupType: string;

    /** 组织ID */
    organizationId: string;

    /** 部门ID */
    departmentId: string;

    /**
     * 应用修改的菜单
     */
    menuList: SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm[];
  }
}
