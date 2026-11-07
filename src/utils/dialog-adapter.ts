import { ElMessageBox } from 'element-plus';

/**
 * naive-ui DialogProvider 的 Element Plus 适配层。
 *
 * perfect-cloud-ui 迁移来的代码统一用 `window.$dialog?.warning({ title, content,
 * positiveText, onPositiveClick, ... })` 的 naive 风格调用，这里在挂载点把参数
 * 翻译成 ElMessageBox，业务代码无需逐处改写。
 */
type NaiveDialogOptions = {
  title?: string;
  content?: string;
  positiveText?: string;
  negativeText?: string;
  onPositiveClick?: () => unknown;
  onNegativeClick?: () => unknown;
  onClose?: () => unknown;
  maskClosable?: boolean;
  closeOnEsc?: boolean;
  closable?: boolean;
};

function createDialog(type: 'info' | 'success' | 'warning' | 'error') {
  return (options: NaiveDialogOptions = {}) => {
    ElMessageBox.confirm(options.content ?? '', options.title ?? '', {
      type,
      confirmButtonText: options.positiveText ?? '确定',
      cancelButtonText: options.negativeText ?? '取消',
      closeOnClickModal: options.maskClosable ?? false,
      closeOnPressEscape: options.closeOnEsc ?? false,
      showCancelButton: Boolean(options.negativeText || options.onNegativeClick || options.onClose),
      distinguishCancelAndClose: Boolean(options.onClose)
    })
      .then(async () => {
        await options.onPositiveClick?.();
      })
      .catch((action: string) => {
        if (action === 'close') {
          options.onClose?.();
        } else if (action === 'cancel') {
          options.onNegativeClick?.();
        }
        // action === 'cancel' 且未提供 onNegativeClick 时静默
      });
  };
}

export function createDialogAdapters() {
  return {
    info: createDialog('info'),
    success: createDialog('success'),
    warning: createDialog('warning'),
    error: createDialog('error')
  };
}
