import { request } from '../../request';

// 查询凭证列表
export function findOpenApiCredentialList(data: SystemOpenapiNamespace.OpenApiCredentialQuery) {
  return request.post<SystemOpenapiNamespace.OpenApiCredentialPage>(
    '/system/back/system/openapi/credential/list',
    data
  );
}

// 查询凭证详细
export function findOpenApiCredentialDetail(id: string) {
  return request.get<SystemOpenapiNamespace.OpenApiCredentialForm>(`/system/back/system/openapi/credential/${id}`);
}

// 新增凭证（返回的 secret 是唯一的明文出口）
export function saveOpenApiCredentialDetail(data: SystemOpenapiNamespace.OpenApiCredentialForm) {
  return request.post<SystemOpenapiNamespace.OpenApiCredentialForm>(
    '/system/back/system/openapi/credential/save',
    data
  );
}

// 修改凭证
export function updateOpenApiCredentialDetail(data: SystemOpenapiNamespace.OpenApiCredentialForm) {
  return request.put('/system/back/system/openapi/credential/edit', data);
}

// 删除凭证
export function delOpenApiCredential(data: string[]) {
  return request.delete(`/system/back/system/openapi/credential/${data}`, {});
}

// 轮换密钥（返回新的明文 secret）
export function rotateOpenApiCredential(id: string) {
  return request.put<SystemOpenapiNamespace.OpenApiCredentialForm>(
    `/system/back/system/openapi/credential/rotate/${id}`,
    {}
  );
}

// 调用流水列表
export function findOpenApiCallLogList(data: SystemOpenapiNamespace.OpenApiCallLogQuery) {
  return request.post<SystemOpenapiNamespace.OpenApiCallLogPage>('/system/back/system/openapi/callLog/list', data);
}

// 调用统计（groupByDay=true 按天聚合，否则按凭证聚合）
export function findOpenApiCallLogStat(data: SystemOpenapiNamespace.OpenApiCallLogQuery, groupByDay: boolean) {
  return request.post<SystemOpenapiNamespace.OpenApiCallStatForm[]>('/system/back/system/openapi/callLog/stat', data, {
    params: { groupByDay }
  });
}
