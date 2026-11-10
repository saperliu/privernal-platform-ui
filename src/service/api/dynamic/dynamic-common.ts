import { request } from '../../request';

// 查询前端form配置列表
export function findDynamicFormDataList(data: DynamicFormNamespace.DynamicFormQuery) {
  return request.post<DynamicFormNamespace.DynamicFormPage>('/dynamic/dbs/open/dynamic/data/list', data);
}

/**
 * 关联表单显示数据（只读）：被关联表只要被某个当前用户可用的表单配置为关联数据源即可读取，
 * 返回列由后端按关联配置（displayField + 回填源字段）收敛。
 * fromTableCode 为引用方表单编码，运行态入口（列表翻译、表单/审批详情）恒传，
 * 后端据此查 dynamic_form_relation 引用登记表判定授权与收敛列；缺失时按被关联表反查登记表。
 */
export function findDynamicRelationDataList(data: Record<string, any>) {
  return request.post<DynamicFormNamespace.DynamicFormPage>('/dynamic/dbs/open/dynamic/data/relationList', data);
}

// 查询前端form配置详细
export function findDynamicFormData(id: string, tableName: string) {
  return request.get<DynamicFormNamespace.DynamicFormDetail>(`/dynamic/dbs/open/dynamic/${tableName}/${id}`);
}

// 新增前端form配置
export function saveDynamicFormData(data: any) {
  return request.post(`/dynamic/dbs/open/dynamic/data/add`, data);
}

/**
 * 草稿数据发起流程：后端按表单绑定的流程编码（dynamic_form.workflow_code）发起，
 * 已有运行中实例时返回失败提示，不会重复发起
 */
export function startDynamicDataFlow(tableCode: string, id: string) {
  return request.post<FlowNamespace.InstanceStatus>('/dynamic/dbs/open/dynamic/data/startFlow', { tableCode, id });
}

// 删除前端form配置
export function delDynamicFormData(id: string, tableName: string) {
  return request.delete(`/dynamic/dbs/open/dynamic/${tableName}/${id}`, {});
}

// ===== 回收站（软删行；权限=对应表单的 remove）=====

/** 回收站分页列表（软删行，按删除时间倒序） */
export function fetchRecycleBin(tableName: string, data: { pageNum?: number; pageSize?: number }) {
  return request.post<{ list: Record<string, any>[]; total: number; pageNum: number; pages: number }>(
    `/dynamic/dbs/open/dynamic/${tableName}/recycle-bin`,
    data
  );
}

/** 回收站还原：软删行回活跃态，同业务唯一值与活跃行冲突时由后端唯一索引报错 */
export function restoreRecycleBinRow(tableName: string, id: string) {
  return request.put(`/dynamic/dbs/open/dynamic/${tableName}/${id}/restore`, {});
}

/** 回收站彻底删除（物理清除，不可逆） */
export function purgeRecycleBinRow(tableName: string, id: string) {
  return request.delete(`/dynamic/dbs/open/dynamic/${tableName}/${id}/purge`, {});
}

/** 批量还原 */
export function batchRestoreRecycleBin(tableName: string, ids: string[]) {
  return request.post(`/dynamic/dbs/open/dynamic/${tableName}/batch-restore`, { ids });
}

/** 批量彻底删除 */
export function batchPurgeRecycleBin(tableName: string, ids: string[]) {
  return request.post(`/dynamic/dbs/open/dynamic/${tableName}/batch-purge`, { ids });
}
