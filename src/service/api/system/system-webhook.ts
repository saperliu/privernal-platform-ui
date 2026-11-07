import { request } from '../../request';

// 查询订阅列表
export function findWebhookSubscriptionList(data: SystemWebhookNamespace.WebhookSubscriptionQuery) {
  return request.post<SystemWebhookNamespace.WebhookSubscriptionPage>(
    '/system/back/system/webhook/subscription/list',
    data
  );
}

// 查询订阅详细
export function findWebhookSubscriptionDetail(id: string) {
  return request.get<SystemWebhookNamespace.WebhookSubscriptionForm>(`/system/back/system/webhook/subscription/${id}`);
}

// 新增订阅（返回的 secret 用于对端验签，只出现一次）
export function saveWebhookSubscription(data: SystemWebhookNamespace.WebhookSubscriptionForm) {
  return request.post<SystemWebhookNamespace.WebhookSubscriptionForm>(
    '/system/back/system/webhook/subscription/save',
    data
  );
}

// 修改订阅
export function updateWebhookSubscription(data: SystemWebhookNamespace.WebhookSubscriptionForm) {
  return request.put('/system/back/system/webhook/subscription/edit', data);
}

// 删除订阅
export function delWebhookSubscription(data: string[]) {
  return request.delete(`/system/back/system/webhook/subscription/${data}`, {});
}

// 轮换订阅签名密钥
export function rotateWebhookSubscription(id: string) {
  return request.put<SystemWebhookNamespace.WebhookSubscriptionForm>(
    `/system/back/system/webhook/subscription/rotate/${id}`,
    {}
  );
}

// 可订阅的事件类型
export function findWebhookEventTypes() {
  return request.get<string[]>('/system/back/system/webhook/eventTypes');
}

// 事件列表
export function findWebhookEventList(data: SystemWebhookNamespace.WebhookEventQuery) {
  return request.post<SystemWebhookNamespace.WebhookEventPage>('/system/back/system/webhook/event/list', data);
}

// 事件详细（含投递记录）
export function findWebhookEventDetail(id: string) {
  return request.get<SystemWebhookNamespace.WebhookEventForm>(`/system/back/system/webhook/event/${id}`);
}

// 手动重发事件
export function resendWebhookEvent(id: string) {
  return request.put<SystemWebhookNamespace.WebhookEventForm>(`/system/back/system/webhook/event/resend/${id}`, {});
}

// 事件的投递记录
export function findWebhookDeliveryLogs(eventId: string) {
  return request.get<SystemWebhookNamespace.WebhookDeliveryLogForm[]>(
    `/system/back/system/webhook/delivery/${eventId}`
  );
}
