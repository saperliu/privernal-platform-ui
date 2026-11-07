export {};

declare global {
  export interface Window {
    /** NProgress instance */
    NProgress?: import('nprogress').NProgress;
    /** MessageBox instance */
    $messageBox?: import('element-plus').IElMessageBox;
    /** Loading 实例（EP ElLoading service 适配） */
    $loadingBar?: {
      start: () => void;
      finish: () => void;
      error: () => void;
    };
    /** Dialog 实例（naive 风格适配器，见 utils/dialog-adapter.ts） */
    $dialog?: {
      success: (options?: Record<string, any>) => void;
      warning: (options?: Record<string, any>) => void;
      error: (options?: Record<string, any>) => void;
      info: (options?: Record<string, any>) => void;
    };
    /** Message instance */
    $message?: import('element-plus').Message;
    /** Notification instance */
    $notification?: import('element-plus').Notify;
  }

  /** Build time of the project */
  export const BUILD_TIME: string;
}

declare module '**/*.es.js' {
  const mod: any;
  export default mod;
  export const FlowDesigner: any;
  export const WarmFlowDesigner: any;
  export const naiveAdapter: any;
  export const elementPlusAdapter: any;
  export function setUiAdapter(adapter: any): void;
  export function setDataProvider(provider: any): void;
  export function createMockProvider(): any;
  export function useFlowDesigner(): any;
  export function useFlowJson(ref: any): any;
}
