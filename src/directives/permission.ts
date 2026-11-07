import type { App, Directive } from 'vue';
import { usePermission } from './system';

export default function setupPermissionDirective(app: App) {
  const { hasPermission } = usePermission();

  function updateElVisible(el: HTMLElement, permission: string | string[]) {
    // 空权限串（如未配置的导出/导入按钮）不视为错误，直接放行显示
    if (!permission) {
      return;
    }
    if (!hasPermission(permission)) {
      el.parentElement?.removeChild(el);
    }
  }

  const permissionDirective: Directive<HTMLElement, string | string[]> = {
    mounted(el, binding) {
      updateElVisible(el, binding.value);
    },
    beforeUpdate(el, binding) {
      updateElVisible(el, binding.value);
    }
  };

  app.directive('permission', permissionDirective);
}
