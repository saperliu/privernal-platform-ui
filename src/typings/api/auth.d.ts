/**
 * Namespace Api
 *
 * backend api module: "auth"（迁自 perfect-cloud-ui，对接 privernal-platform 真实后端）
 */
declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    /**
     * 用户角色类型(前端静态路由用角色类型进行路由权限的控制)
     *
     * - SuperPlatformRole: 平台内系统超级管理员角色(该权限具有所有路由数据)
     * - SuperRole: 平台内组织的超级管理员角色
     * - user: 用户
     * - custom: 自定义角色
     */
    type RoleType = 'SuperRole' | 'SuperPlatformRole' | 'user';
    /** 返回的token和刷新token */
    interface LoginToken {
      token: string;
      refreshToken: string;
      userInfo?: UserManagement.User;
      /** 账号有多个组织时返回可选的组织，此时的 token 是选择组织用的临时令牌 */
      organizations?: SystemUserServiceOrgNamespace.SystemUserServiceOrgForm[];
    }

    interface UserInfo {
      /** 用户id */
      userId: string;
      /** 用户名 */
      loginName: string;
      /** 昵称 */
      nickName: string;
      /** 用户角色类型 */
      userRole: string;
      /** 授权的功能 */
      permissions?: string[];
      /** 授权的角色的key */
      roleKeys: string[];
      /** 授权的角色 */
      roles?: [];
      user?: UserManagement.User;
      initPassword: boolean;
      avatar: string;
      /** 当前登录的组织 */
      organizationId?: string;
      /** 当前登录的组织编码 */
      organizationCode?: string;
      /** 当前登录的部门 */
      departmentId?: string;
      /** 账号可以切换的组织 */
      userServiceOrgDTOList?: SystemUserServiceOrgNamespace.SystemUserServiceOrgForm[];
    }

    interface Captcha {
      id: string;
      data: string;
      message: string;
    }

    /** 登录的参数 */
    interface LoginDTO {
      /** 验证码的ID */
      id?: string | null;
      /** 登录名 */
      loginName?: string | null;
      /** 密码（F4：挑战口径=SHA512(nonce+线摘要)，旧口径=线摘要 SHA512(明文)） */
      password?: string | null;
      /** F4 挑战登录：/auth/login/challenge 下发的 nonce 编号 */
      nonceId?: string | null;
      /** 小程序的编码 */
      productCode?: string | null;
      /** 验证码的结果或是小程序的CODE（图形验证码已下线，密码登录不再携带） */
      code?: string | null;
      iv?: string | null;
      encryptedData?: string | null;
    }

    /** F4 登录挑战（/auth/login/challenge 响应） */
    interface LoginChallenge {
      enabled: boolean;
      nonceId?: string;
      nonce?: string;
      ttlSeconds?: number;
      /** false=用户尚未迁移封存摘要：先提交一次旧口径线摘要（服务端静默封存），再取新 nonce 重试 */
      migrated?: boolean;
    }
  }

  namespace UserManagement {
    interface User {
      /** 用户id */
      userId: string;

      /** 用户名 */
      loginName: string | null;
      /** 昵称 */
      nickName: string | null;
      /** 第三方授权登录的OPENID */
      openId: string | null;
      /** 权限列表 */
      permissions: [];

      systemUserDTO: SystemUser;

      /**
       * 用户状态
       *
       * - 0: 启用
       * - 1: 禁用
       * - 5: 待审核
       * - 3: 冻结
       * - 4: 软删除
       */
      userStatus: '0' | '1' | '5' | '3' | '4' | null;
      index?: number;
    }

    interface SystemUser {
      /** 主键 */
      id: string | null;
      /** 登录名 */
      loginName: string | null;
      /** 昵称 */
      nickName: string | null;
      userType: string | null;
      /** 用户邮箱 */
      email: string | null;
      /** 用户手机号码 */
      phone: string | null;
      /**
       * 用户性别
       *
       * - 1: 女
       * - 0: 男
       */
      gender: '0' | '1' | null;
      /** 用户头像 */
      avatar: string | null;
      /** 状态;状态（0正常 1停用） */
      status: number | null;
      /** 身份证号;身份证号 */
      identityNum: string | null;
      /** 所属组织ID */
      organizationId: string | null;
      /** 所属部门ID */
      departmentId: string | null;
    }

    interface ResetPasswordDTO {
      /** 旧密码 */
      oldPassword: string;

      /** 新密码 */
      password: string;
    }
  }
}
