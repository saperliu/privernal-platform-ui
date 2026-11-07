import { request } from '../../request';

// 查询 OIDC 渠道列表
export function findSsoConfigList(data: SystemSsoNamespace.SsoOidcConfigQuery) {
  return request.post<SystemSsoNamespace.SsoOidcConfigPage>('/system/back/system/sso/config/list', data);
}

// 查询 OIDC 渠道详细
export function findSsoConfigDetail(id: string) {
  return request.get<SystemSsoNamespace.SsoOidcConfigForm>(`/system/back/system/sso/config/${id}`);
}

// 新增渠道（返回的 clientSecret 是唯一的明文出口）
export function saveSsoConfig(data: SystemSsoNamespace.SsoOidcConfigForm) {
  return request.post<SystemSsoNamespace.SsoOidcConfigForm>('/system/back/system/sso/config/save', data);
}

// 修改渠道
export function updateSsoConfig(data: SystemSsoNamespace.SsoOidcConfigForm) {
  return request.put('/system/back/system/sso/config/edit', data);
}

// 删除渠道
export function delSsoConfig(data: string[]) {
  return request.delete(`/system/back/system/sso/config/${data}`, {});
}

// 发现文档连通性测试，后端会把解析到的端点回填
export function testSsoConfig(id: string) {
  return request.put<SystemSsoNamespace.SsoOidcConfigForm>(`/system/back/system/sso/config/test/${id}`, {});
}

/**
 * 登录页用的可用渠道（免登接口，走 auth 服务前缀）
 */
export function findSsoLoginChannels() {
  return request.get<SystemSsoNamespace.SsoLoginChannel[]>('/auth/auth/oidc/configs');
}
