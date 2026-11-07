/**
 * Warm-Flow UI 统一主题配置中心
 *
 * Single Source of Truth for all theme colors (light + dark).
 * - CSS 变量 (--wf-*) 用于静态样式
 * - JS 运行时颜色用于 LogicFlow 画布 / 动态内联样式 / computed 样式
 * - 外部可通过 URL 参数 darkColors=#111827 替换暗黑底色（8 个字段）
 *
 * @module themeConfig
 */
export declare const lightColors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    primaryLighter: string;
    success: string;
    warning: string;
    danger: string;
    textPrimary: string;
    textRegular: string;
    textSecondary: string;
    textPlaceholder: string;
    borderColor: string;
    borderLight: string;
    borderLighter: string;
    bgColor: string;
    bgWhite: string;
    bgPage: string;
    bgContainer: string;
    gridColor: string;
    nodeTextColor: string;
    nodeTextFill: string;
    edgeTextBg: string;
    snaplineStroke: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipShadow: string;
    tooltipColor: string;
    snapshotBg: string;
    sidebarBg: string;
    sidebarIconBg: string;
    stepTabColor: string;
    stepTabActiveBgStart: string;
    stepTabActiveBgEnd: string;
    saveBtnBgStart: string;
    saveBtnBgEnd: string;
    saveBtnShadow: string;
    flowNameColor: string;
    toolbarBorder: string;
    scrollbarThumb: string;
    scrollbarThumbHover: string;
    drawerDisabledBg: string;
};
export declare const darkColors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    primaryLighter: string;
    success: string;
    warning: string;
    danger: string;
    textPrimary: string;
    textRegular: string;
    textSecondary: string;
    textPlaceholder: string;
    borderColor: string;
    borderLight: string;
    borderLighter: string;
    bgColor: string;
    bgWhite: string;
    bgPage: string;
    bgContainer: string;
    gridColor: string;
    nodeTextColor: string;
    nodeTextFill: string;
    edgeTextBg: string;
    snaplineStroke: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipShadow: string;
    tooltipColor: string;
    snapshotBg: string;
    sidebarBg: string;
    sidebarIconBg: string;
    stepTabColor: string;
    stepTabActiveBgStart: string;
    stepTabActiveBgEnd: string;
    saveBtnBgStart: string;
    saveBtnBgEnd: string;
    saveBtnShadow: string;
    flowNameColor: string;
    toolbarBorder: string;
    scrollbarThumb: string;
    scrollbarThumbHover: string;
    drawerDisabledBg: string;
};
/**
 * 暗黑模式默认底色，darkColors 参数传入新值时替换以下 8 个字段：
 *   bgColor / bgWhite / bgPage / bgContainer / edgeTextBg / snapshotBg / sidebarBg / sidebarIconBg
 */
export declare const DARK_BASE_COLOR = "#141414";
/** 需要被 darkColors 参数替换的字段列表 */
export declare const DARK_BASE_FIELDS: string[];
/**
 * 根据新底色生成覆盖对象
 * 将 8 个暗黑底色字段全部替换为新颜色
 *
 * @param {string} newColor 新的底色值，如 '#111827'
 * @returns {Object} 包含 8 个字段的覆盖对象
 */
export declare function replaceDarkBaseColor(newColor: any): {};
/**
 * 获取合并后的主题颜色
 * @param {'light'|'dark'} mode
 * @param {boolean} [skipMerge=false] 是否跳过用户覆盖（用于获取纯默认值）
 * @returns {Object} 合并后的完整颜色对象
 */
export declare function getThemeColors(mode: any, skipMerge?: boolean): {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    primaryLighter: string;
    success: string;
    warning: string;
    danger: string;
    textPrimary: string;
    textRegular: string;
    textSecondary: string;
    textPlaceholder: string;
    borderColor: string;
    borderLight: string;
    borderLighter: string;
    bgColor: string;
    bgWhite: string;
    bgPage: string;
    bgContainer: string;
    gridColor: string;
    nodeTextColor: string;
    nodeTextFill: string;
    edgeTextBg: string;
    snaplineStroke: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipShadow: string;
    tooltipColor: string;
    snapshotBg: string;
    sidebarBg: string;
    sidebarIconBg: string;
    stepTabColor: string;
    stepTabActiveBgStart: string;
    stepTabActiveBgEnd: string;
    saveBtnBgStart: string;
    saveBtnBgEnd: string;
    saveBtnShadow: string;
    flowNameColor: string;
    toolbarBorder: string;
    scrollbarThumb: string;
    scrollbarThumbHover: string;
    drawerDisabledBg: string;
};
/**
 * 设置外部传入的主题颜色覆盖（由 replaceDarkBaseColor 生成）
 * @param {{dark?: Object}} customColors 覆盖对象，通常为 { dark: replaceDarkBaseColor('#111827') }
 */
export declare function setCustomThemeColors(customColors: any): void;
/**
 * 重置用户覆盖为空（恢复全部默认值）
 */
export declare function resetThemeColors(): void;
/**
 * 获取当前用户覆盖（调试用）
 */
export declare function getUserOverride(): {};
export declare const cssVarMap: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    primaryLighter: string;
    success: string;
    warning: string;
    danger: string;
    textPrimary: string;
    textRegular: string;
    textSecondary: string;
    textPlaceholder: string;
    borderColor: string;
    borderLight: string;
    borderLighter: string;
    bgColor: string;
    bgWhite: string;
    bgPage: string;
    bgContainer: string;
    gridColor: string;
    nodeTextColor: string;
    nodeTextFill: string;
    edgeTextBg: string;
    snaplineStroke: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipShadow: string;
    tooltipColor: string;
    snapshotBg: string;
    sidebarBg: string;
    sidebarIconBg: string;
    stepTabColor: string;
    stepTabActiveBgStart: string;
    stepTabActiveBgEnd: string;
    saveBtnBgStart: string;
    saveBtnBgEnd: string;
    saveBtnShadow: string;
    flowNameColor: string;
    toolbarBorder: string;
    scrollbarThumb: string;
    scrollbarThumbHover: string;
    drawerDisabledBg: string;
};
/**
 * 将 JS 颜色对象同步到 DOM CSS 变量（--wf-*）
 * 外部传入自定义颜色后调用此函数，确保 CSS 样式也能感知变化
 *
 * @param {'light'|'dark'} mode 当前主题模式
 * @param {Object} [colors] 颜色对象，不传则自动从 getThemeColors 获取
 *
 * @example
 *   replaceDarkBaseColor('#111827')  // 生成覆盖对象
 *   applyCssVariables('dark')        // 立即同步到 CSS
 */
export declare function applyCssVariables(mode: any, colors: any): void;
