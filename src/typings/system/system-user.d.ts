declare namespace SystemUserNamespace {
  interface SystemUserQuery extends ApiCommon.RequestPage {
    /**
     * 登录名
     */
    loginName?: string | null;
    /**
     * 昵称
     */
    nickName?: string | null;
    /** 用户手机号码 */
    phone?: string | null;
    /** 用户所属部门 */
    departmentId?: string | null;
  }

  interface SystemUserPage extends ApiCommon.ResponsePage {
    list: SystemUserForm[];
  }

  interface SystemUserForm {
    /**
     * 主键
     */
    id: string;
    /**
     * 登录名
     */
    loginName: string;
    /**
     * 昵称
     */
    nickName: string | null;
    password: string | null;
    userType: string | null;
    /** 用户邮箱 */
    email: string | null;
    /** 用户手机号码 */
    phone: string | null;
    /**
     * 用户性别
     * - 1: 女
     * - 0: 男
     */
    gender: '0' | '1' | '2' | null;
    /**
     * 用户头像
     */
    avatar?: string | null;
    /**
     * 用户状态
     * - 0: 草稿
     * - 1: 启用
     * - 5: 待审核
     * - 3: 禁用
     */
    status: 0 | 1 | 5 | 3;
    /**
     * 身份证号;身份证号
     */
    identityNum?: string | null;
    /**
     * 所属组织ID
     */
    organizationId: string | null;
    /**
     * 所属部门ID
     */
    departmentId: string | undefined | null;
    /**
     * 权限的范围，当前组织
     */
    dataScope: number;
  }

  interface SystemUserTable extends SystemUserForm {
    /** 序号 */
    index: number;
  }

  /**
   * 用户性别
   * - 1: 女
   * - 0: 男
   */
  type GenderKey = NonNullable<SystemUserForm['gender']>;

  /**
   * 用户状态
   * - 0: 启用
   * - 1: 禁用
   * - 5: 待审核
   * - 3: 冻结
   * - 4: 软删除
   */
  type UserStatusKey = NonNullable<SystemUserForm['status']>;
}
