import { App, Component } from 'vue';
/** 注册名（wf-xxx）-> 中性透传组件 */
export declare const wfComponents: Record<string, Component>;
/**
 * 全局注册全部 Wf* 中性组件（迁移期与 el-* 并存，互不影响）。
 * 由 main.js（应用）与 designer/index.ts 的 install（库）调用。
 */
export declare function registerWfComponents(app: App): void;
