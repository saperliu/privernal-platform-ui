import { request } from '../../request';

// 查询系统通知人员列表
export function findSystemMessageUserList(data: SystemMessageUserNamespace.SystemMessageUserQuery) {
  return request.post<SystemMessageUserNamespace.SystemMessageUserPage>(
    '/message/back/message/systemMessageUser/list',
    data
  );
}

// 查询系统通知人员详细
export function findSystemMessageUserDetail(id: string) {
  return request.get<SystemMessageUserNamespace.SystemMessageUserDetail>(
    `/message/back/message/systemMessageUser/${id}`
  );
}

// 新增系统通知人员
export function saveSystemMessageUserDetail(data: SystemMessageUserNamespace.SystemMessageUserForm) {
  return request.post(`/message/back/message/systemMessageUser/save`, data);
}

// 修改系统通知人员
export function updateSystemMessageUserDetail(data: SystemMessageUserNamespace.SystemMessageUserForm) {
  return request.put(`/message/back/message/systemMessageUser/edit`, data);
}

// 删除系统通知人员
export function delSystemMessageUser(data: string[]) {
  return request.delete(`/message/back/message/systemMessageUser/${data}`, {});
}
