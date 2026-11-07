interface SkipProps {
    /** 边表单数据（v-model） */
    modelValue?: Record<string, any>;
    /** 是否只读 */
    disabled?: boolean;
    /** 是否显示跳转条件 */
    skipConditionShow?: boolean;
}
declare var __VLS_122: {
    form: Record<string, any>;
    disabled: boolean;
};
type __VLS_Slots = {} & {
    'node-form-extra'?: (props: typeof __VLS_122) => any;
};
declare const __VLS_base: import('vue').DefineComponent<__VLS_WithDefaults<__VLS_TypePropsToOption<SkipProps>, {
    modelValue: () => {};
    disabled: boolean;
    skipConditionShow: boolean;
}>, unknown, unknown, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToOption<SkipProps>, {
    modelValue: () => {};
    disabled: boolean;
    skipConditionShow: boolean;
}>>>, {
    modelValue: {};
    disabled: boolean;
    skipConditionShow: boolean;
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
