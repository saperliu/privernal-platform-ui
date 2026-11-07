import { request } from '../../request';

// 查询应用关联的流程单列表
export function findSystemAppWorkflowList(data: SystemAppWorkflowNamespace.SystemAppWorkflowQuery) {
  return request.post<SystemAppWorkflowNamespace.SystemAppWorkflowPage>('/system/back/system/appWorkflow/list', data);
}

// 查询应用关联的流程单详细
export function findSystemAppWorkflowDetail(id: string) {
  return request.get<SystemAppWorkflowNamespace.SystemAppWorkflowDetail>(`/system/back/system/appWorkflow/${id}`);
}

// 新增应用关联的流程单
export function saveSystemAppWorkflowDetail(data: SystemAppWorkflowNamespace.SystemAppWorkflowForm) {
  return request.post(`/system/back/system/appWorkflow/save`, data);
}

// 修改应用关联的流程单
export function updateSystemAppWorkflowDetail(data: SystemAppWorkflowNamespace.SystemAppWorkflowForm) {
  return request.put(`/system/back/system/appWorkflow/edit`, data);
}

// 删除应用关联的流程单
export function delSystemAppWorkflow(data: string[]) {
  return request.delete(`/system/back/system/appWorkflow/${data}`, {});
}
