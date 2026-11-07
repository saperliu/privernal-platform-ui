import { useAuthStore, useFormCommandStore } from '@/store';
import { getUserInfo } from '@/utils';
import { isArray, isString } from '@/utils/constant/typeof';

/** 权限判断 */
export function usePermission() {
  const auth = useAuthStore();

  // 必须保持同步：此前声明为 async，v-permission 指令拿到的是 Promise（恒真值），
  // 导致按钮级权限整体失效。getUserInfo 本身就是同步读 localStorage，无需 await
  function hasPermission(permission: string | string[]) {
    let permissions = auth.userInfo.permissions ?? [];
    // 刷新时内存态权限会丢失，回退读本地缓存的 userInfo
    if (permissions.length === 0) {
      const userInfoLocal = getUserInfo();
      permissions = userInfoLocal.permissions ?? [];
    }
    if (permissions.includes('*:*:*')) {
      return true;
    }
    let has = false;
    if (isArray(permission)) {
      const re = permissions.find(i => permission.includes(i));
      has = re !== undefined;
    }
    if (isString(permission)) {
      has = permissions.includes(permission);
    }
    return has;
  }

  return {
    hasPermission
  };
}

/** 字段判断 */
export function useFormCommand() {
  const formCommandStore = useFormCommandStore();

  function hasShow(name: string) {
    const { fieldMap } = formCommandStore;

    const field = fieldMap.get(name);
    if (field !== undefined) {
      const { isShow } = field;
      if (isShow === 1) {
        return true;
      }
      return false;
    }
    return true;
  }

  function hasEdit(name: string) {
    const { fieldMap } = formCommandStore;

    const field = fieldMap.get(name);
    if (field !== undefined) {
      const { isEdit } = field;
      if (isEdit === 1) {
        return true;
      }
    }
    return false;
  }

  function hasMust(name: string) {
    const { fieldMap } = formCommandStore;

    const field = fieldMap.get(name);
    if (field !== undefined) {
      const { isRequired } = field;
      if (isRequired === 1) {
        return true;
      }
    }
    return false;
  }
  return {
    hasShow,
    hasEdit,
    hasMust
  };
}
