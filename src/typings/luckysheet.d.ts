/**
 * Luckysheet（MIT，vendored 2.1.13）类型声明。
 * UMD 产物挂 window.luckysheet 全局；本项目只用其公开 API 的一个子集，
 * 这里按"调用了什么声明什么"的口径做宽松声明（v 类型一律 any，不复制官方 .d.ts——
 * 官方包不带类型，重写整份等于自造契约）。渲染所需的 celldata/config 结构由
 * utils/doc-print/sheet.ts 自行定义并收口，不经此文件。
 */
declare module 'luckysheet/dist/luckysheet.umd.js';
declare module 'luckysheet/dist/css/luckysheet.css';
declare module 'luckysheet/dist/plugins/css/pluginsCss.css';
declare module 'luckysheet/dist/assets/iconfont/iconfont.css';
declare module 'jquery-mousewheel';
/** jquery@2（luckysheet 依赖树引入）无自带类型；loader 只取 default 挂全局，宽松声明即可 */
declare module 'jquery';

interface Window {
  /** Luckysheet 运行时依赖的全局 jQuery（loader 注入，仅 SHEET 模板编辑器链路存在） */
  jQuery?: unknown;
  $?: unknown;
  luckysheet?: {
    create: (options: Record<string, any>) => void;
    destroy: () => void;
    /** 当前 sheet 全量配置（含编辑后的 data 网格与 config） */
    getLuckysheetfile: () => Record<string, any>;
    getAllSheets: () => Array<Record<string, any>>;
    /** 二维网格 → celldata（[{r,c,v}]） */
    transToCellData: (data: any[][]) => any[];
    getRange: () => Array<{
      row: [number, number];
      column: [number, number];
      row_focus?: number;
      column_focus?: number;
    }>;
    getCellValue: (row: number, column: number) => any;
    setCellValue: (row: number, column: number, value: any) => void;
    [key: string]: any;
  };
}
