import type { EditorSettings } from '@/typings/editor/settings';
import { defaultLang } from '@/locales';

/**
 * `Object.prototype.toString` 可识别的类型键
 *
 * 原为 naive 时代的全局 `TypeUtil` 命名空间，迁移后在本文件内声明
 */
type DataTypeStringKey =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'symbol'
  | 'bigInt'
  | 'object'
  | 'function'
  | 'array'
  | 'date'
  | 'regExp'
  | 'promise'
  | 'set'
  | 'map'
  | 'file';

/** `[object Xxx]` 形式的类型标签 */
type DataTypeString<K extends DataTypeStringKey> = `[object ${Capitalize<K>}]`;

export const defaultSettings: EditorSettings = {
  language: defaultLang,
  processId: `Process_${new Date().getTime()}`,
  processName: `业务流程`,
  processEngine: 'camunda',
  paletteMode: 'rewrite',
  penalMode: 'custom',
  contextPadMode: 'enhancement',
  rendererMode: 'default',
  bg: 'grid-image',
  toolbar: true,
  miniMap: false,
  contextmenu: true,
  customContextmenu: true,
  otherModule: true,
  templateChooser: false,
  useLint: false,
  customTheme: {}
};

export const dataTypeLabels: { [K in DataTypeStringKey]: DataTypeString<K> } = {
  string: '[object String]',
  number: '[object Number]',
  boolean: '[object Boolean]',
  null: '[object Null]',
  undefined: '[object Undefined]',
  symbol: '[object Symbol]',
  bigInt: '[object BigInt]',
  object: '[object Object]',
  function: '[object Function]',
  array: '[object Array]',
  date: '[object Date]',
  regExp: '[object RegExp]',
  promise: '[object Promise]',
  set: '[object Set]',
  map: '[object Map]',
  file: '[object File]'
};

// tooltip的样式的处理
//
// 原实现读取 `window.sessionStorage` 的 themeSettings 并按对象取 darkMode，
// 但主题设置由 `localStg`（localStorage）写入（见 store/modules/theme），
// sessionStorage 中从来没有 themeSettings 键，故该判断恒为亮色分支；
// 深色分支用到的 n-component.scss `:export` 变量也已随 naive-ui 一起下线。
// 这里保留与运行时完全一致的亮色样式。
export const tableTooltipStyle = {
  arrowStyle: {
    backgroundColor: '#ffffff'
  },
  style: 'maxWidth:400px;background-color:#ffffff;color:#000000;'
};
