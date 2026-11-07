import { request } from '../../request';

// 查询系统操作日志列表
export function findSystemLogOperationList(data: SystemLogOperationNamespace.SystemLogOperationQuery) {
  return request.post<SystemLogOperationNamespace.SystemLogOperationPage>(
    '/message/back/message/systemLogOperation/list',
    data
  );
}

// 查询系统操作日志详细
export function findSystemLogOperationDetail(id: string) {
  return request.get<SystemLogOperationNamespace.SystemLogOperationDetail>(
    `/message/back/message/systemLogOperation/${id}`
  );
}

// 新增系统操作日志
export function saveSystemLogOperationDetail(data: SystemLogOperationNamespace.SystemLogOperationForm) {
  return request.post(`/message/back/message/systemLogOperation/save`, data);
}

// 修改系统操作日志
export function updateSystemLogOperationDetail(data: SystemLogOperationNamespace.SystemLogOperationForm) {
  return request.put(`/message/back/message/systemLogOperation/edit`, data);
}

// 删除系统操作日志
export function delSystemLogOperation(data: string[]) {
  return request.delete(`/message/back/message/systemLogOperation/${data}`, {});
}
