/**
 * Webhook 事件订阅与投递记录
 */
declare namespace SystemWebhookNamespace {
  interface WebhookSubscriptionQuery extends ApiCommon.RequestPage {
    subscriptionName?: string;

    appId?: string;

    tableCode?: string;

    eventType?: string;

    status?: number;
  }

  interface WebhookSubscriptionForm extends ApiCommon.FormBase {
    id: string;

    appId?: string;

    subscriptionName: string;

    url: string;

    httpMethod?: string;

    /** 仅新建/轮换那一次响应里有值 */
    secret?: string;

    secretPrefix?: string;

    secretLast4?: string;

    events: string[];

    /** 留空表示收该组织内全部表的事件 */
    tableCode?: string;

    headers?: Record<string, any>;

    sslVerify?: number;

    timeoutMs?: number;

    maxRetry?: number;

    status: number;

    organizationId?: string;
  }

  interface WebhookSubscriptionPage extends ApiCommon.ResponsePage {
    list: WebhookSubscriptionForm[];
  }

  interface WebhookEventQuery extends ApiCommon.RequestPage {
    subscriptionId?: string;

    eventType?: string;

    tableCode?: string;

    bizId?: string;

    /** PENDING / DELIVERING / SUCCESS / FAILED / DEAD */
    status?: string;

    beginTime?: string;

    endTime?: string;
  }

  interface WebhookDeliveryLogForm {
    id: string;

    eventId?: string;

    subscriptionId?: string;

    attempt?: number;

    url?: string;

    statusCode?: number;

    success?: number;

    responseBrief?: string;

    errorMsg?: string;

    /** Long 序列化为字符串 */
    costMs?: string | number;

    createdTime?: string;
  }

  interface WebhookEventForm {
    id: string;

    subscriptionId?: string;

    subscriptionName?: string;

    eventType?: string;

    tableCode?: string;

    bizId?: string;

    payload?: Record<string, any>;

    status?: string;

    retryCount?: number;

    nextRetryTime?: string;

    lastError?: string;

    deliveredTime?: string;

    createdTime?: string;

    deliveryLogs?: WebhookDeliveryLogForm[];
  }

  interface WebhookEventPage extends ApiCommon.ResponsePage {
    list: WebhookEventForm[];
  }
}
