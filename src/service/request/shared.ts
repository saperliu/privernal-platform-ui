import { useAuthStore } from '@/store/modules/auth';
import { localStg } from '@/utils/storage';
import { fetchRefreshToken } from '../api';
import type { RequestInstanceState } from './type';

export function getAuthorization() {
  const token = localStg.get('token');
  const Authorization = token ? `Bearer ${token}` : null;

  return Authorization;
}

/** refresh token */
async function handleRefreshToken() {
  const { resetStore } = useAuthStore();

  const rToken = localStg.get('refreshToken') || '';
  const { error, data } = await fetchRefreshToken(rToken);
  if (!error) {
    localStg.set('token', data.token);
    localStg.set('refreshToken', data.refreshToken);
    return true;
  }

  resetStore();

  return false;
}

export async function handleExpiredRequest(state: RequestInstanceState) {
  if (!state.refreshTokenFn) {
    state.refreshTokenFn = handleRefreshToken();
  }

  const success = await state.refreshTokenFn;

  setTimeout(() => {
    state.refreshTokenFn = null;
  }, 1000);

  return success;
}

export function showErrorMsg(state: RequestInstanceState, message: string) {
  if (!state.errMsgStack?.length) {
    state.errMsgStack = [];
  }

  const isExist = state.errMsgStack.includes(message);

  if (!isExist) {
    state.errMsgStack.push(message);

    // 这个函数在 axios 拦截器里被 await：提示框自己抛错（例如脱离 app 上下文的渲染器里
    // Vue 的 Object.create(appContext.provides) 拿到 undefined）会把「弹提示」变成「请求失败原因」，
    // 调用方读到的 error.message 就成了 JS 内部文案，真实的后端原因（熔断、配置错误）被顶掉。
    // 提示弹不出来是小事，原因被吞掉会让人把排查方向带去查网络。
    try {
      window.$message?.error({
        message,
        onClose: () => {
          state.errMsgStack = state.errMsgStack.filter(msg => msg !== message);

          setTimeout(() => {
            state.errMsgStack = [];
          }, 5000);
        }
      });
    } catch (error) {
      console.error('[request] 错误提示展示失败:', error, message);
      state.errMsgStack = state.errMsgStack.filter(msg => msg !== message);
    }
  }
}
