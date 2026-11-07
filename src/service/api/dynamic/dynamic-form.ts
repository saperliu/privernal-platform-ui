import { request } from '../../request';

// 查询前端form配置列表
export function findDynamicFormList(data: DynamicFormNamespace.DynamicFormQuery) {
  return request.post<DynamicFormNamespace.DynamicFormPage>('/dynamic/back/dynamic/form/list', data);
}

// 查询前端form配置详细
export function findDynamicFormDetail(id: string) {
  return request.get<DynamicFormNamespace.DynamicFormDetail>(`/dynamic/back/dynamic/form/${id}`);
}

// 新增前端form配置
export function saveDynamicFormDetail(data: DynamicFormNamespace.DynamicFormForm) {
  return request.post(`/dynamic/back/dynamic/form/save`, data);
}

// 修改前端form配置
export function updateDynamicFormDetail(data: DynamicFormNamespace.DynamicFormForm) {
  return request.put(`/dynamic/back/dynamic/form/edit`, data);
}

// 删除前端form配置
export function delDynamicForm(data: string[]) {
  return request.delete(`/dynamic/back/dynamic/form/${data}`, {});
}

// 查询前端form通过code
export function findDynamicFormByCode(code: string) {
  return request.get<DynamicFormNamespace.DynamicFormDetail>(`/dynamic/back/dynamic/form/code/${code}`);
}

// 保存表单设计草稿（仅留痕，不生效、不改物理表）
export function saveDynamicFormDraft(data: DynamicFormNamespace.DynamicFormForm) {
  return request.post<DynamicFormLogNamespace.DynamicFormLogForm>(`/dynamic/back/dynamic/form/draft`, data);
}

// 查询表单最新的未发布设计草稿
export function findDynamicFormDraft(formId: string) {
  return request.get<DynamicFormLogNamespace.DynamicFormLogForm>(`/dynamic/back/dynamic/form/draft/${formId}`);
}

// 发布指定版本快照（快照内容应用为生效定义）
export function publishDynamicFormLog(logId: string) {
  return request.put(`/dynamic/back/dynamic/form/publish/${logId}`);
}

// 回滚到指定正式版本（VERSION 快照重新应用为生效定义）
export function rollbackDynamicFormLog(logId: string) {
  return request.put(`/dynamic/back/dynamic/form/rollback/${logId}`);
}
