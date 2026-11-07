import { request } from '../../request';

// 查询系统消息通知列表
export function findSystemMessageList(data: SystemMessageNamespace.SystemMessageQuery) {
  return request.post<SystemMessageNamespace.SystemMessagePage>('/message/back/message/systemMessage/list', data);
}

// 首页公告栏：全员通知（messagePerson=ALL）最近 20 条
export function findBulletinMessageList() {
  return request.get<{ list: SystemMessageNamespace.SystemMessageDetail[]; total: number }>(
    '/message/back/message/systemMessage/bulletin/list'
  );
}

// 查询系统消息通知详细
export function findSystemMessageDetail(id: string) {
  return request.get<SystemMessageNamespace.SystemMessageDetail>(`/message/back/message/systemMessage/${id}`);
}

// 新增系统消息通知
export function saveSystemMessageDetail(data: SystemMessageNamespace.SystemMessageForm) {
  return request.post(`/message/back/message/systemMessage/save`, data);
}

// 修改系统消息通知
export function updateSystemMessageDetail(data: SystemMessageNamespace.SystemMessageForm) {
  return request.put(`/message/back/message/systemMessage/edit`, data);
}

// 删除系统消息通知
export function delSystemMessage(data: string[]) {
  return request.delete(`/message/back/message/systemMessage/${data}`, {});
}

export function sendMessage(data: SystemMessageNamespace.SystemMessageForm) {
  return request.post(`/message/back/system/socket/user`, data);
}
