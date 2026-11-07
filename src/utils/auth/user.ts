import { createStorage } from '@privernal/utils';
import { RoleOrg, RolePlatform } from '@/constants';
import { localStg } from '@/utils';

/**
 * `userInfo` 键未在 `StorageType.Local` 中声明（全局 typings 不在本批次可改范围内），这里仅在本文件内
 * 交叉扩展键集合。底层复用同一个 `createStorage`（同一 window.localStorage、同一 VITE_STORAGE_PREFIX、
 * 同一 JSON 序列化），运行时行为与既有 localStg 完全一致。
 */
type AuthLocal = StorageType.Local & { userInfo: Api.Auth.UserInfo };

const authStg = createStorage<AuthLocal>('local', import.meta.env.VITE_STORAGE_PREFIX || '');

/** 设置token */
export function setToken(token: string) {
  localStg.set('token', token);
}

/** 获取token */
export function getToken() {
  return localStg.get('token') || '';
}

/** 去除token */
export function removeToken() {
  localStg.remove('token');
}

/** 获取refresh token */
export function getRefreshToken() {
  return localStg.get('refreshToken') || '';
}

/** 设置refresh token */
export function setRefreshToken(token: string) {
  localStg.set('refreshToken', token);
}

/** 去除refresh token */
export function removeRefreshToken() {
  localStg.remove('refreshToken');
}

/** 获取用户信息 */
export function getUserInfo() {
  const emptyInfo: Api.Auth.UserInfo = {
    userId: '',
    loginName: '',
    nickName: '',
    permissions: [],
    roles: [],
    roleKeys: [],
    userRole: 'user',
    avatar: '',
    initPassword: false
  };
  const userInfo: Api.Auth.UserInfo = authStg.get('userInfo') || emptyInfo;
  return userInfo;
}

/** 设置用户信息 */
export function setUserInfo(userInfo: Api.Auth.UserInfo) {
  authStg.set('userInfo', userInfo);
}

/** 去除用户信息 */
export function removeUserInfo() {
  authStg.remove('userInfo');
}

/** 去除用户相关缓存 */
export function clearAuthStorage() {
  removeToken();
  removeRefreshToken();
  removeUserInfo();
}

/** 用户是否管理员 */
export function isOrgAdmin() {
  const userInfo: Api.Auth.UserInfo = getUserInfo();
  return userInfo.roleKeys.includes(RoleOrg);
}

export function isPlatformAdmin() {
  const userInfo: Api.Auth.UserInfo = getUserInfo();
  return userInfo.roleKeys.includes(RolePlatform);
}
