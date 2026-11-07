/**
 * SSO 单点登录（OIDC 渠道配置）
 */
declare namespace SystemSsoNamespace {
  interface SsoOidcConfigQuery extends ApiCommon.RequestPage {
    configCode?: string;

    configName?: string;

    status?: number;
  }

  interface SsoOidcConfigForm extends ApiCommon.FormBase {
    id: string;

    configCode: string;

    configName: string;

    icon?: string;

    issuer?: string;

    discoveryUrl?: string;

    authorizeUrl?: string;

    tokenUrl?: string;

    userinfoUrl?: string;

    jwksUri?: string;

    clientId: string;

    /** 仅保存那一次响应里有值 */
    clientSecret?: string;

    clientSecretPrefix?: string;

    clientSecretLast4?: string;

    scopes?: string;

    redirectUri?: string;

    /** 逻辑名 → IdP 的 claim 名，留空用标准名 */
    claimMapping?: Record<string, string>;

    autoRegister?: number;

    defaultRoleIds?: string;

    status: number;

    organizationId?: string;
  }

  interface SsoOidcConfigPage extends ApiCommon.ResponsePage {
    list: SsoOidcConfigForm[];
  }

  /** 登录页用的渠道项（后端已裁掉密钥相关信息） */
  interface SsoLoginChannel {
    configCode: string;

    configName: string;

    icon?: string;
  }
}
