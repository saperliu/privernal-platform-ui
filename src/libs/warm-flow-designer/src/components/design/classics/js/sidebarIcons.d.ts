/**
 * 侧边栏节点图标定义
 * 形状与画布节点 (classics/js/*.js) 保持完全一致；
 * 配色与画布「设计态语义色」(applyClassicDesignColor) 一致，避免发灰、提升辨识度。
 * 所有图标均为内联 SVG 字符串，可直接通过 v-html 渲染
 */
/**
 * 开始节点：圆环 + 内核实心渐变圆（与 start.js 一致）
 */
export declare const startIcon: string;
/**
 * 中间节点：圆角矩形卡片 + 审批图标（与 between.js 一致）
 */
export declare const betweenIcon: string;
/**
 * 结束节点：双环圆 — 粗外环 + 细内环（与 end.js 一致）
 */
export declare const endIcon: string;
/**
 * 互斥网关：正方形 + X + 四端圆点
 */
export declare const serialIcon: string;
/**
 * 并行网关：正方形 + 十字 + 四端圆点
 */
export declare const parallelIcon: string;
/**
 * 包含网关：正方形 + 同心双圆 + 中心点
 */
export declare const inclusiveIcon: string;
/**
 * 节点图标映射表
 * key: node type, value: svg string
 */
export declare const nodeIcons: {
    start: string;
    between: string;
    end: string;
    serial: string;
    parallel: string;
    inclusive: string;
};
