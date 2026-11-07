/**
 * 菜单
 */
declare namespace SystemMenuNamespace {
  interface SystemMenuQuery extends ApiCommon.RequestPage {
    menuName?: '';
    menuTypes?: string[];
    appCode?: string;
  }

  interface SystemMenuQueryParams {
    menuName?: '';
    menuTypes?: string[];
  }

  interface SystemMenuPage extends ApiCommon.ResponsePage {
    list: SystemMenuForm[];
  }

  /**
   * 菜单
   */
  interface SystemMenuForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 菜单名称 */
    menuName: string;

    /** 菜单编码 */
    menuCode: string;

    /** 显示顺序;显示顺序 */
    orderNum: number;

    /** 路由地址;路由地址 */
    path: string;

    /** 组件路径;组件路径 */
    component: string;

    /** 路由参数;路由参数 */
    params: string;

    /** 是否为外链;是否为外链（1是 0否） */
    isFrame: number;

    /** 是否缓存;是否缓存（1 缓存 0不缓存） */
    isCache: number;

    /** 菜单类型;菜单类型（M目录 C菜单 F按钮） */
    menuType: 'M' | 'C' | 'F';

    /** 菜单状态;菜单状态（0显示 1隐藏） */
    visible: number;

    /** 菜单状态;菜单状态（3停用 1正常） */
    status: number;

    /** 权限标识;权限标识 */
    permission: string;

    /** 父级菜单;父级菜单 */
    parentId: string;

    /** 菜单图标;菜单图标 */
    icon: string;

    /**  */
    organizationId: string;

    /** 子节点 */
    children: Array<SystemMenuForm>;

    /** 数据权限 */
    dataScope: number;

    /**
     * 前端交互使用
     */
    checked?: boolean;
    /**
     * 是否APP功能菜单
     */
    appMenu?: number;

    /**
     * 当前菜单所属的应用
     */
    appId?: string;

    mustMenu: number;
  }

  /**
   * 菜单类型
   * - M: 目录
   * - C: 菜单
   * - F: 按钮
   */
  type MenuTypeKey = NonNullable<SystemMenuForm['menuType']>;
}
