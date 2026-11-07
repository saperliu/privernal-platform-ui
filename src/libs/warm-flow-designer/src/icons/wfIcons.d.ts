import { IconifyJSON } from '@iconify/types';
/**
 * Warm-Flow 设计器自定义图标集（iconify 格式，前缀 wf）。
 *
 * 由原 src/assets/icons/svg/*.svg 迁移而来，统一走 iconify 渲染，去除对 vite-plugin-svg-icons
 * 的 sprite 依赖。24×24 为描边图标（fill=none + currentColor 跟随字体色），1024×1024 为多色节点图标。
 *
 * 使用：<svg-icon icon-class="flowName" /> 或 <Icon icon="wf:flowName" />
 *
 * @author warm
 */
export declare const wfIcons: IconifyJSON;
