declare namespace UI {
  type ThemeColor = 'danger' | 'primary' | 'info' | 'success' | 'warning';

  type DataTableBaseColumn<T> = Partial<import('element-plus').TableColumnCtx<T extends object ? T : never>>;

  type TableColumnCheck = import('@privernal/hooks').TableColumnCheck;

  type SetTableColumnKey<C, T> = Omit<C, 'prop'> & { prop?: keyof T | (string & {}) };

  type TableColumnWithKey<T> = SetTableColumnKey<DataTableBaseColumn<T>, T>;

  type TableColumn<T> = DataTableBaseColumn<T>;

  /**
   * the type of table operation
   *
   * - add: add table item
   * - edit: edit table item
   */
  type TableOperateType = 'add' | 'edit';
}

// ======================================== element-plus ========================================

declare module 'element-plus/dist/locale/zh-cn.mjs' {
  const locale: any;
  export default locale;
}

declare module 'element-plus/dist/locale/en.mjs' {
  const locale: any;
  export default locale;
}

/**
 * 以下依赖只发布 JS 产物、没有随包附带 .d.ts，按本项目既有做法（见上方 locale 声明）在类型层补声明，
 * 不改动运行时导入。
 */
declare module 'element-plus/es/components/select/src/options.mjs' {
  import type { Component } from 'vue';

  const ElOptions: Component;
  export default ElOptions;
}

declare module 'phoenix-designer/dist/ui/elementPlus' {
  /** 注册 phoenix-designer 的 element-plus 适配层；主入口不传参 */
  export function setupElementPlus(): void;
}

declare module '@wangeditor/editor-for-vue' {
  import type { DefineComponent } from 'vue';

  export const Editor: DefineComponent<Record<string, unknown>>;
  export const Toolbar: DefineComponent<Record<string, unknown>>;
}

declare module 'qrcode' {
  interface QRCodeRenderersOptions {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: string;
  }

  /** 本项目只用到 toCanvas / toDataURL，其余渲染入口需要时再补 */
  const QRCode: {
    toCanvas(
      canvas: HTMLCanvasElement | string,
      text: string,
      options?: QRCodeRenderersOptions,
      callback?: (err: Error | null, canvas?: HTMLCanvasElement) => void
    ): Promise<HTMLCanvasElement>;
    toDataURL(text: string, options?: QRCodeRenderersOptions): Promise<string>;
  };

  export default QRCode;
}
