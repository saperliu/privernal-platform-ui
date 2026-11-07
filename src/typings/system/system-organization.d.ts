/**
 * 组织
 */
declare namespace SystemOrganizationNamespace {
  import SystemMenuForm = SystemMenuNamespace.SystemMenuForm;

  interface SystemOrganizationQuery extends ApiCommon.RequestPage {
    organizationName?: string;
    organizationCode?: string;
  }

  interface SystemOrganizationPage extends ApiCommon.ResponsePage {
    list: SystemOrganizationForm[];
  }

  /**
   * 组织
   */
  interface SystemOrganizationForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 组织名称 */
    organizationName: string;

    /** 排序 */
    orderNum: number;

    /** 主管的ID;就是用户的ID */
    leaderId: string;

    /** 状态;是否禁用，0否，1是 */
    status: number;

    /** 组织的编码 */
    organizationCode: string;

    /**
     * 登录名
     */
    loginName: string;
    /**
     * 昵称
     */
    nickName: string | null;

    /** 用户邮箱 */
    email: string | null;
    /** 用户手机号码 */
    phone: string | null;
    /** 身份证号**/
    identityNum: string | null;
    /**
     * 用户性别
     * - 1: 女
     * - 0: 男
     */
    gender: '0' | '1' | '2' | null;
    /**
     * 用户状态
     * - 0: 启用
     * - 1: 禁用
     * - 5: 待审核
     * - 3: 冻结
     * - 4: 软删除
     */
    userStatus: 0 | 1 | 5 | 3 | 4;
  }

  interface SystemOrganizationAppDTO {
    /** 序号 */
    organizationId: string;
    appList: SystemOrganizationAppNamespace.SystemOrganizationAppForm[];
  }

  /** 组织已授权的菜单行（查询响应，与后端 SystemOrganizationMenuDTO 的扁平字段对齐） */
  interface SystemOrganizationMenuItem {
    id?: string;
    menuId: string;
    status?: number;
    organizationId: string;
    appId?: string;
  }

  /** 保存组织授权的请求体（后端按 organizationId + menuDTOList 接收，与查询响应不同形） */
  interface SystemOrganizationMenuDTO {
    /** 序号 */
    organizationId: string;
    menuDTOList: SystemMenuForm[];
  }

  interface SystemOrganizationMenuFilter {
    /** 序号 */
    organizationId: string;
  }
}
