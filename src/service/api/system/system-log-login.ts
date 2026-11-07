import { request } from '../../request';

// 查询系统登录日志列表
export function findSystemLogLoginList(data: SystemLogLoginNamespace.SystemLogLoginQuery) {
  return request.post<SystemLogLoginNamespace.SystemLogLoginPage>('/message/back/message/systemLogLogin/list', data);
}

// 查询系统登录日志详细
export function findSystemLogLoginDetail(id: string) {
  return request.get<SystemLogLoginNamespace.SystemLogLoginDetail>(`/message/back/message/systemLogLogin/${id}`);
}

// 新增系统登录日志
export function saveSystemLogLoginDetail(data: SystemLogLoginNamespace.SystemLogLoginForm) {
  return request.post(`/message/back/message/systemLogLogin/save`, data);
}

// 修改系统登录日志
export function updateSystemLogLoginDetail(data: SystemLogLoginNamespace.SystemLogLoginForm) {
  return request.put(`/message/back/message/systemLogLogin/edit`, data);
}

// 删除系统登录日志
export function delSystemLogLogin(data: string[]) {
  return request.delete(`/message/back/message/systemLogLogin/${data}`, {});
}
