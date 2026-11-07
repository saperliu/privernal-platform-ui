import { request } from '../../request';

/**
 * 基于 warm-flow 的工作流接口（后端 privernal-service-flow，部署于 monolith，网关前缀 /system）
 *
 * 所有 id 均为后端下发的雪花 id 字符串，路径参数统一按 string 传递。
 */

// 查询流程定义列表
export function findFlowDefinitionList(data: FlowNamespace.DefinitionQuery) {
  return request.post<FlowNamespace.Page<FlowNamespace.Definition>>('/system/back/flow/definition/list', data);
}

// 获取流程定义详情（含节点与跳转）
export function findFlowDefinitionDetail(id: string) {
  return request.get<FlowNamespace.Definition>(`/system/back/flow/definition/${id}`);
}

// 发布流程定义
export function publishFlowDefinition(id: string) {
  return request.put(`/system/back/flow/definition/publish/${id}`);
}

// 停用流程定义
export function unpublishFlowDefinition(id: string) {
  return request.put(`/system/back/flow/definition/unpublish/${id}`);
}

// 激活流程定义
export function activeFlowDefinition(id: string) {
  return request.put(`/system/back/flow/definition/active/${id}`);
}

// 挂起流程定义
export function unactiveFlowDefinition(id: string) {
  return request.put(`/system/back/flow/definition/unactive/${id}`);
}

// 复制流程定义
export function copyFlowDefinition(id: string) {
  return request.post(`/system/back/flow/definition/copy/${id}`);
}

// 删除流程定义
export function delFlowDefinition(ids: string) {
  return request.delete(`/system/back/flow/definition/${ids}`, {});
}

// 启动流程
export function startFlowInstance(data: FlowNamespace.StartRequest) {
  return request.post<FlowNamespace.InstanceStatus>('/system/back/flow/instance/save', data);
}

// 我发起的流程分页
export function findMyFlowInstanceList(data: FlowNamespace.InstanceQuery) {
  return request.post<FlowNamespace.Page<FlowNamespace.Instance>>('/system/back/flow/instance/my/list', data);
}

// 全部流程实例分页（管理视角）
export function findFlowInstanceList(data: FlowNamespace.InstanceQuery) {
  return request.post<FlowNamespace.Page<FlowNamespace.Instance>>('/system/back/flow/instance/list', data);
}

// 按业务数据id查询流程状态
export function findFlowStatusByBusinessId(businessId: string) {
  return request.get<FlowNamespace.InstanceStatus>(`/system/back/flow/instance/byBusiness/${businessId}`);
}

// 终止流程
export function terminateFlowInstance(instanceId: string, message?: string) {
  return request.put<FlowNamespace.InstanceStatus>(`/system/back/flow/instance/terminate/${instanceId}`, null, {
    params: { message }
  });
}

// 撤销流程（发起人）
export function revokeFlowInstance(instanceId: string, message?: string) {
  return request.put<FlowNamespace.InstanceStatus>(`/system/back/flow/instance/revoke/${instanceId}`, null, {
    params: { message }
  });
}

// 实例审批记录
export function findFlowRecordByInstanceId(instanceId: string) {
  return request.get<FlowNamespace.HisTask[]>(`/system/back/flow/instance/record/${instanceId}`);
}

// 待办任务分页
export function findFlowTodoList(data: FlowNamespace.TaskQuery) {
  return request.post<FlowNamespace.Page<FlowNamespace.Task>>('/system/back/flow/task/todo/list', data);
}

// 已办任务分页
export function findFlowDoneList(data: FlowNamespace.TaskQuery) {
  return request.post<FlowNamespace.Page<FlowNamespace.HisTask>>('/system/back/flow/task/done/list', data);
}

// 任务数量统计
export function findFlowTaskCount() {
  return request.get<FlowNamespace.Count>('/system/back/flow/task/count');
}

// 任务办理选项（驳回/跳转可选节点、减签可选办理人）
export function findFlowTaskOptions(taskId: string) {
  return request.get<FlowNamespace.TaskOption>(`/system/back/flow/task/options/${taskId}`);
}

// 审批通过
export function approveFlowTask(data: FlowNamespace.TaskHandle) {
  return request.put<FlowNamespace.Instance>('/system/back/flow/task/approve', data);
}

// 驳回（LAST/START/TARGET）
export function rejectFlowTask(data: FlowNamespace.TaskHandle) {
  return request.put<FlowNamespace.Instance>('/system/back/flow/task/reject', data);
}

// 转办
export function transferFlowTask(data: FlowNamespace.TaskHandle) {
  return request.put('/system/back/flow/task/transfer', data);
}

// 委托
export function delegateFlowTask(data: FlowNamespace.TaskHandle) {
  return request.put('/system/back/flow/task/delegate', data);
}

// 加签
export function addSignFlowTask(data: FlowNamespace.TaskHandle) {
  return request.put('/system/back/flow/task/add-sign', data);
}

// 减签
export function reduceSignFlowTask(data: FlowNamespace.TaskHandle) {
  return request.put('/system/back/flow/task/reduce-sign', data);
}

// 跳转
export function jumpFlowTask(data: FlowNamespace.TaskHandle) {
  return request.put<FlowNamespace.Instance>('/system/back/flow/task/jump', data);
}

// 拿回
export function retrieveFlowTask(data: FlowNamespace.TaskHandle) {
  return request.put<FlowNamespace.Instance>('/system/back/flow/task/retrieve', data);
}

// 查询流程表单绑定列表（旧 flow_form_bind，已弃用，仅过渡期兼容）
export function findFlowFormBindList(data: Partial<FlowNamespace.FormBind> & Api.Common.RequestPage) {
  return request.post<FlowNamespace.Page<FlowNamespace.FormBind>>('/system/back/flow/form/list', data);
}

// 新增流程表单绑定（已弃用，绑定关系并入 flow_form_version）
export function saveFlowFormBind(data: FlowNamespace.FormBind) {
  return request.post('/system/back/flow/form/save', data);
}

// 修改流程表单绑定（已弃用）
export function updateFlowFormBind(data: FlowNamespace.FormBind) {
  return request.put('/system/back/flow/form/edit', data);
}

// 删除流程表单绑定（已弃用）
export function delFlowFormBind(ids: string) {
  return request.delete(`/system/back/flow/form/${ids}`, {});
}

// 查询节点表单配置列表（已弃用，被 flow_form_version + 权限明细表取代）
export function findFlowNodeConfigList(definitionCode: string) {
  return request.get<FlowNamespace.FormNodeConfig[]>('/system/back/flow/form/node-config/list', {
    params: { definitionCode }
  });
}

// 保存节点表单配置（已弃用）
export function saveFlowNodeConfig(data: FlowNamespace.FormNodeConfig) {
  return request.post('/system/back/flow/form/node-config/save', data);
}

// ==================== 流程表单配置版本（flow_form_version，替代旧绑定/节点配置接口） ====================

// 查询表单配置版本列表
export function findFlowFormVersionList(params: { flowCode?: string; tableCode?: string; publishStatus?: number }) {
  return request.get<FlowNamespace.FormVersion[]>('/system/back/flow/form/version/list', { params });
}

// 查询表单配置版本详情（含字段/按钮权限明细）
export function findFlowFormVersionDetail(id: string) {
  return request.get<FlowNamespace.FormVersion>(`/system/back/flow/form/version/${id}`);
}

// 初始化表单配置草稿（字段全集后端自动取自动态表单模块，按钮取内置枚举）
export function initFlowFormVersion(flowCode: string, tableCode: string) {
  return request.post('/system/back/flow/form/version/init', null, { params: { flowCode, tableCode } });
}

// 保存表单配置草稿（仅草稿可保存，明细全量替换）
export function saveFlowFormVersion(data: FlowNamespace.FormVersion) {
  return request.post('/system/back/flow/form/version/save', data);
}

// 从历史版本复制出下一版本号草稿
export function copyFlowFormVersion(id: string) {
  return request.post(`/system/back/flow/form/version/copy/${id}`);
}

// 发布表单配置版本（置为当前生效）
export function publishFlowFormVersion(id: string) {
  return request.post(`/system/back/flow/form/version/publish/${id}`);
}

// 回滚到历史发布版本
export function rollbackFlowFormVersion(id: string) {
  return request.post(`/system/back/flow/form/version/rollback/${id}`);
}

// 删除表单配置版本（仅草稿或非当前生效发布版）
export function delFlowFormVersion(id: string) {
  return request.delete(`/system/back/flow/form/version/${id}`, {});
}

// 旧表数据迁移：flow_form_bind + flow_form_node_config → 发布版 v1
export function migrateFlowFormVersionFromLegacy() {
  return request.post<number>('/system/back/flow/form/version/migrate-from-legacy');
}

// 运行时表单权限（兼容旧 form-command 契约）
export function findFlowFormPermission(tableCode: string, businessId: string) {
  return request.post<FlowNamespace.FormPermission>('/system/back/flow/form/runtime/field-permission', null, {
    params: { tableCode, businessId }
  });
}

// 签收任务（多实例竞争领取场景）
export function claimFlowTask(taskId: string) {
  return request.put('/system/back/flow/task/claim', { taskId });
}

// 更换审批人
export function changePersonFlowTask(data: FlowNamespace.TaskHandle) {
  return request.put('/system/back/flow/task/change-person', data);
}

// 流程调整（节点跳转加签等）
export function adjustFlowTask(data: FlowNamespace.TaskHandle) {
  return request.put('/system/back/flow/task/adjust', data);
}

// 重启流程（终止/作废后重新发起）
export function restartFlowInstance(instanceId: string, targetNodeCode?: string, message?: string) {
  return request.post<FlowNamespace.InstanceStatus>(`/system/back/flow/instance/restart`, {
    instanceId,
    targetNodeCode,
    message
  });
}

// 查询流程实例节点信息（含高亮状态）
export function getFlowInstanceNodes(instanceId: string) {
  return request.get<FlowNamespace.FlowNodeInfoDTO[]>(`/system/back/flow/instance/nodes/${instanceId}`);
}
