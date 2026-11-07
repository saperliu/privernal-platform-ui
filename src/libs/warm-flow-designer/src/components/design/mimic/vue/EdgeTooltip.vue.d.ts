interface EdgeTooltipProps {
    /** 浮层位置（画布坐标） */
    position?: {
        x: number;
        y: number;
    };
    /** 关联的边 model */
    tooltipEdge?: Record<string, any>;
}
declare const __VLS_export: import('vue').DefineComponent<__VLS_WithDefaults<__VLS_TypePropsToOption<EdgeTooltipProps>, {
    position: () => {
        x: number;
        y: number;
    };
    tooltipEdge: () => {};
}>, unknown, unknown, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "option-click": (item: any) => void;
    "close-tooltip": () => void;
}, string, import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToOption<EdgeTooltipProps>, {
    position: () => {
        x: number;
        y: number;
    };
    tooltipEdge: () => {};
}>>> & {
    "onOption-click"?: (item: any) => any;
    "onClose-tooltip"?: () => any;
}, {
    position: {
        x: number;
        y: number;
    };
    tooltipEdge: {};
}, {}>;
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
type __VLS_WithDefaults<P, D> = {
    [K in keyof Pick<P, keyof P>]: K extends keyof D ? __VLS_PrettifyLocal<P[K] & {
        default: D[K];
    }> : P[K];
};
type __VLS_PrettifyLocal<T> = (T extends any ? {
    [K in keyof T]: T[K];
} : {
    [K in keyof T as K]: T[K];
}) & {};
