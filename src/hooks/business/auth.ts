import { useAuthStore } from '@/store/modules/auth';

export function useAuth() {
  const authStore = useAuthStore();

  /**
   * 按钮权限判断
   *
   * 后端 getInfo 返回的按钮权限在 userInfo.permissions（超管为 *:*:* 通配），
   * 不存在 buttons 字段——读 buttons 会直接 TypeError 导致列表页崩溃
   */
  function hasAuth(codes: string | string[]) {
    if (!authStore.isLogin) {
      return false;
    }

    const owned = authStore.userInfo.permissions ?? [];
    if (owned.includes('*:*:*')) {
      return true;
    }

    const list = typeof codes === 'string' ? [codes] : codes;
    return list.some(code => owned.includes(code));
  }

  return {
    hasAuth
  };
}
