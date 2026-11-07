import { IconifyJSON } from '@iconify/types';
/**
 * Warm-Flow 设计器用到的 Element Plus 图标子集（iconify 格式，前缀 ep）。
 *
 * 仅内联设计器实际使用的 10 个 EP 图标（工具栏缩放/排列/下载/删除/搜索 + 属性面板提示 warning-filled），
 * 避免运行时 import 整个 @iconify-json/ep/icons.json（数百图标）导致库产物体积膨胀。
 * 数据由 @iconify-json/ep（devDependency）提取生成；新增图标在此登记 body 即可。
 *
 * @author warm
 */
export declare const epIcons: IconifyJSON;
