import { UiAdapter } from './uiAdapter';
/**
 * Element Plus 实现的 UI 适配器（设计器默认 UI 库）。
 *
 * 把统一的 uiAdapter 契约映射到 EP 的 ElMessage / ElNotification / ElMessageBox / ElLoading
 * 与 ClickOutside 指令；行为对齐迁移前 plugins/modal.js 与 utils/request.js。
 *
 * @author warm
 */
export declare const elementPlusAdapter: UiAdapter;
export default elementPlusAdapter;
