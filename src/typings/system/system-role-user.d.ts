/**
 * 角色与用户关系
 */
declare namespace SystemRoleUserNamespace {
  interface SystemRoleUserQuery extends ApiCommon.RequestPage {
    roleId?: string;
    nickName?: string;
  }

  interface SystemRoleUserPage extends ApiCommon.ResponsePage {
    list: SystemRoleUserForm[];
  }

  /**
   * 角色与用户关系
   */
  interface SystemRoleUserForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 角色ID */
    roleId: string;

    /** 用户ID */
    userId: string;

    /**
     * 登录名
     */
    loginName?: string;
    /**
     * 昵称
     */
    nickName?: string | null;
    /** 用户邮箱 */
    email?: string | null;
    /** 用户手机号码 */
    phone?: string | null;
    /**
     * 用户状态
     * - 0: 启用
     * - 1: 禁用
     * - 5: 待审核
     * - 3: 冻结
     * - 4: 软删除
     */
    status: 0 | 1 | 5 | 3 | 4;
    /**
     * 增加的人员
     */
    userDTOList: SystemUserNamespace.SystemUserForm[];
  }

  interface SystemRoleUserTable extends SystemRoleUserForm {
    /** 序号 */
    index: number;
  }
}
