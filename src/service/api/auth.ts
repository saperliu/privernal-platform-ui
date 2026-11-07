import { request } from '../request';
import LoginDTO = Api.Auth.LoginDTO;

/**
 * 获取验证码
 *
 * @param phone - 手机号
 * @returns - 返回boolean值表示是否发送成功
 */
export function fetchSmsCode(phone: string) {
  return request.post<boolean>('/getSmsCode', { phone });
}

/**
 * 退出登录：让服务端作废当前会话（F3——只清本地缓存时，token 在过期前仍然有效可重放）
 */
export function fetchLogout() {
  return request.delete<boolean>('/auth/logout', {});
}

/**
 * A2：APP web-view 令牌握手——用一次性行权码兑换登录 token。
 * ek 由 APP 登录态生成（60 秒/单次，兑换即作废），URL 里不再出现 token 本体
 */
export function exchangeAppToken(ek: string) {
  return request.post<string>('/auth/web/exchange', { ek });
}

/** 获取验证码 */
export function fetchCaptcha() {
  /*
   * todo 微服务是 /code
   */
  return request.get<Api.Auth.Captcha>('/auth/auth/code');
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return request.post<Api.Auth.LoginToken>('/auth/refreshToken', {
    refreshToken
  });
}

/**
 * 登录
 *
 * @param login
 */
export function fetchLogin(login: LoginDTO) {
  return request.post<Api.Auth.LoginToken>('/auth/auth/login', login);
}

/**
 * F4 登录挑战签发：一次性 nonce（60 秒/单次）+ 迁移标志；未配主密钥时 enabled=false
 *
 * @param loginName 登录名或手机号
 */
export function fetchLoginChallenge(loginName: string) {
  return request.get<Api.Auth.LoginChallenge>('/auth/auth/login/challenge', { params: { loginName } });
}

/**
 * 钉钉工作台免登
 *
 * @param authCode 授权码
 * @param corpId 企业的ID
 */
export function fetchDingLogin(authCode: string, corpId: string) {
  return request.get<Api.Auth.LoginToken>('/auth/auth/dingtalk/login', { params: { authCode, corpId } });
}

/** 获取用户信息 */
export function fetchUserInfo() {
  return request.get<Api.Auth.UserInfo>('/system/back/system/user/getInfo');
}

/**
 * 获取用户路由数据
 *
 * 后端根据用户id查询到对应的角色类型，并将路由筛选出对应角色的路由数据返回前端
 *
 * @param userId - 用户id
 */
export function fetchUserRoutes() {
  return request.get<Api.Route.UserRoute>('/system/back/system/menu/getRouters');
}

/**
 * 应用有的菜单
 *
 * @param id
 * @param code
 */
export function fetchAppUserRoutes(id: string, code: string) {
  return request.get<Api.Route.UserRoute>('/system/back/system/menu/app/getRouters', {
    params: { id, code }
  });
}

/**
 * 选择登录的组织
 *
 * 账号有多个组织时，登录返回的是临时令牌，选完组织才换到正式令牌
 *
 * @param id 组织的ID
 */
export function fetchOrganization(id: string) {
  return request.put<Api.Auth.LoginToken>(`/auth/auth/organization/${id}`, {});
}

/**
 * 登录后切换组织
 *
 * @param id 组织的ID
 */
export function fetchChangeOrganization(id: string) {
  return request.put<Api.Auth.LoginToken>(`/auth/auth/change/organization/${id}`, {});
}

/** 查询个人数据范围 */
export function fetchUserDataScope() {
  return request.put<Array<any>>(`/system/back/system/user/manual/data/scope`, {});
}

/** 修改个人密码 */
export function updatePassword(resetPasswordDTO: Api.UserManagement.ResetPasswordDTO) {
  return request.put(`/system/back/system/user/manual/updatePwd`, resetPasswordDTO);
}

/**
 * 修改个人信息。
 * 后端 updateById 会把收到的非空字段直接落库，且只回写这四个字段的会话缓存，
 * 因此类型收窄到这四项，避免个人信息页误传 status/deptId 等改坏账号。
 */
export function updateProfile(
  data: Pick<SystemUserNamespace.SystemUserForm, 'nickName' | 'phone' | 'email' | 'gender'>
) {
  return request.put(`/system/back/system/user/manual/profile`, data);
}

/** 修改头像，后端返回新头像 url */
export function updateAvatar(file: File) {
  return request.post<string>(
    `/system/back/system/user/manual/avatar`,
    { avatarfile: file },
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}
