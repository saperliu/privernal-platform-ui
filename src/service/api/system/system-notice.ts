import { request } from '../../request';

// 查询通知列表
export function findSystemNoticeList(data: SystemNoticeNamespace.SystemNoticeQuery) {
  return request.post<SystemNoticeNamespace.SystemNoticePage>('/system/back/system/notice/list', data);
}

// 查询通知详细
export function findSystemNoticeDetail(id: string) {
  return request.get<SystemNoticeNamespace.SystemNoticeForm>(`/system/back/system/notice/${id}`);
}

// 新增通知
export function saveSystemNoticeDetail(data: SystemNoticeNamespace.SystemNoticeForm) {
  return request.post(`/system/back/system/notice/save`, data);
}

// 修改通知
export function updateSystemNoticeDetail(data: SystemNoticeNamespace.SystemNoticeForm) {
  return request.put(`/system/back/system/notice/edit`, data);
}

// 删除通知
export function delSystemNotice(data: string[]) {
  return request.delete(`/system/back/system/notice/${data}`, {});
}

export function findIndexSystemNoticeList() {
  return request.get<SystemNoticeNamespace.SystemNoticePage>('/system/back/system/notice/bulletin/list', {});
}
