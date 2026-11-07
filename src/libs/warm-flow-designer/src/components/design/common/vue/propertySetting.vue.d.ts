interface PropertySettingProps {
    /** 表单值（保留字段） */
    value?: Record<string, any>;
    /** 当前选中的节点 / 边 model */
    node?: Record<string, any>;
    /** LogicFlow 实例 */
    lf?: any;
    /** 是否只读 */
    disabled?: boolean;
    /** 是否显示跳转条件 */
    skipConditionShow?: boolean;
    /** 画布节点列表 */
    nodes?: any[];
    /** 画布边列表 */
    skips?: any[];
    /** 自定义表单路径树 */
    formPathList?: any[];
}
declare function show(): void;
declare function handleClose(): Promise<void>;
declare var __VLS_17: string, __VLS_18: any;
type __VLS_Slots = {} & {
    [K in NonNullable<typeof __VLS_17>]?: (props: typeof __VLS_18) => any;
};
declare const __VLS_base: import('vue').DefineComponent<__VLS_WithDefaults<__VLS_TypePropsToOption<PropertySettingProps>, {
    value: () => {};
    node: () => {};
    lf: any;
    disabled: boolean;
    skipConditionShow: boolean;
    nodes: () => any[];
    skips: () => any[];
    formPathList: () => any[];
}>, {
    show: typeof show;
    handleClose: typeof handleClose;
}, unknown, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToOption<PropertySettingProps>, {
    value: () => {};
    node: () => {};
    lf: any;
    disabled: boolean;
    skipConditionShow: boolean;
    nodes: () => any[];
    skips: () => any[];
    formPathList: () => any[];
}>>>, {
    node: {};
    value: {};
    disabled: boolean;
    nodes: any[];
    skips: any[];
    formPathList: any[];
    skipConditionShow: boolean;
    lf: any;
}, {}>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
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
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
type __VLS_PrettifyLocal<T> = (T extends any ? {
    [K in keyof T]: T[K];
} : {
    [K in keyof T as K]: T[K];
}) & {};
