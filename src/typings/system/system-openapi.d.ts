/**
 * OpenAPI 应用凭证与调用统计
 */
declare namespace SystemOpenapiNamespace {
  /** API 范围 */
  type OpenApiScope = 'data:read' | 'data:write' | 'flow:start' | 'meta:read' | 'schedule:write' | 'schedule:read';

  /** 表级授权的动作，与后端 OpenApiCredentialService 的白名单一致（审批动作不开放） */
  type OpenApiAction = 'list' | 'read' | 'add' | 'edit' | 'remove' | 'start';

  interface OpenApiCredentialQuery extends ApiCommon.RequestPage {
    appId?: string;

    credentialName?: string;

    accessKey?: string;

    status?: number;
  }

  interface OpenApiTableGrant {
    tableCode: string;

    actions: OpenApiAction[];
  }

  interface OpenApiCredentialForm extends ApiCommon.FormBase {
    id: string;

    appId: string;

    appName?: string;

    credentialName: string;

    accessKey?: string;

    /** 仅新建/轮换那一次响应里有值 */
    secret?: string;

    secretPrefix?: string;

    secretLast4?: string;

    scopes: OpenApiScope[];

    tableGrants: OpenApiTableGrant[];

    boundUserId?: string;

    boundDepartmentId?: string;

    status: number;

    expireTime?: string | number;

    rateLimitPerMinute?: number;

    lastCallTime?: string;

    /** 后端把 Long 统一序列化成字符串（雪花 ID 精度保护），这里按字符串接收 */
    callCount?: string;

    organizationId?: string;
  }

  interface OpenApiCredentialPage extends ApiCommon.ResponsePage {
    list: OpenApiCredentialForm[];
  }

  interface OpenApiCallLogQuery extends ApiCommon.RequestPage {
    accessKey?: string;

    appId?: string;

    action?: string;

    tableCode?: string;

    /** SUCCESS / DENIED / FAILED / RATE_LIMITED */
    result?: string;

    beginTime?: string;

    endTime?: string;
  }

  interface OpenApiCallLogForm {
    id: string;

    requestId?: string;

    accessKey?: string;

    endpoint?: string;

    httpMethod?: string;

    action?: string;

    tableCode?: string;

    bizId?: string;

    result?: string;

    statusCode?: number;

    errorCode?: string;

    errorMsg?: string;

    costMs?: string | number;

    clientIp?: string;

    createdTime?: string;
  }

  interface OpenApiCallLogPage extends ApiCommon.ResponsePage {
    list: OpenApiCallLogForm[];
  }

  interface OpenApiCallStatForm {
    groupKey: string;

    /** Long 序列化为字符串 */
    totalCount: string;

    successCount: string;

    failCount: string;

    avgCostMs: number;
  }
}
