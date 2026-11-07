import { PaletteNode } from '../../../../designer/types';
/**
 * 节点列表可由外部覆盖（FlowDesigner 的 paletteNodes 透传）：
 * 不传用内置默认（默认列表走 computed + t()，随 setLocale 响应式刷新）；
 * 传空数组可隐藏对应分组（effective* 用 props.* ?? 默认，`[]` 不会被回落，故保留「传 [] 隐藏」语义）。
 */
type __VLS_Props = {
    /** 基础节点组（不传用内置默认：开始 / 中间 / 结束） */
    flowNodes?: PaletteNode[];
    /** 网关节点组（不传用内置默认：互斥 / 并行 / 包含；传 [] 隐藏网关组） */
    gatewayNodes?: PaletteNode[];
};
declare const __VLS_export: import('vue').DefineComponent<__VLS_TypePropsToOption<__VLS_Props>, unknown, unknown, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    dragInNode: (type: string, properties: Record<string, any>, text: any) => void;
}, string, import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps, Readonly<import('vue').ExtractPropTypes<__VLS_TypePropsToOption<__VLS_Props>>> & {
    onDragInNode?: (type: string, properties: Record<string, any>, text: any) => any;
}, {}, {}>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_TypePropsToOption<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? {
        type: import('vue').PropType<Required<T>[K]>;
    } : {
        type: import('vue').PropType<T[K]>;
        required: true;
    };
};
