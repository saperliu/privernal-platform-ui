/**
 * 角色与菜单关系
 */
declare namespace SystemRoleMenuNamespace {
  type SystemRoleMenuQuery = ApiCommon.RequestPage;

  interface SystemRoleMenuPage extends ApiCommon.ResponsePage {
    list: SystemRoleMenuForm[];
  }

  /**
   * 角色与菜单关系
   */
  interface SystemRoleMenuForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 角色ID */
    roleId: string;

    /** 菜单ID */
    menuId: string;

    /** 菜单名称 */
    menuName: string;

    dataScope: number;

    /** 菜单的权限标识;后端通过标识查询角色授权，然后通过当前用户和角色匹配，找到此用户设置的服务部门，再查询数据。如果没有设置则只查询主部门的 */
    permission: string;

    appId: string;

    menuDTOList: SystemRoleMenuScopeDTO[];
  }

  /**
   * 角色与菜单，数据范围
   */
  interface SystemRoleMenuScopeDTO {
    /** 主键 */
    id: string;

    /** 菜单名称 */
    menuName: string;

    /**  */
    organizationId: string;

    /** 菜单的权限标识;后端通过标识查询角色授权，然后通过当前用户和角色匹配，找到此用户设置的服务部门，再查询数据。如果没有设置则只查询主部门的 */
    permission: string;

    dataScope: number;

    appId: string;

    menuId: string;

    actionTag: string;
  }
}
