interface BetweenProps {
    /** 节点表单数据（v-model） */
    modelValue?: Record<string, any>;
    /** 是否只读 */
    disabled?: boolean;
    /** 是否展示所有协作方式 */
    showWays?: boolean;
    /** 画布节点列表 */
    nodes?: any[];
    /** 画布边列表 */
    skips?: any[];
    /** 自定义表单路径树 */
    formPathList?: any[];
}
declare function validate(): Promise<unknown>;
declare var __VLS_217: {
    form: Record<string, any>;
    disabled: boolean;
};
type __VLS_Slots = {} & {
    'node-form-extra'?: (props: typeof __VLS_217) => any;
};
declare const __VLS_base: import('vue').DefineComponent<__VLS_WithDefaults<__VLS_TypePropsToOption<BetweenProps>, {
    modelValue: () => {};
    disabled: boolean;
    showWays: boolean;
    nodes: () => any[];
    skips: () => any[];
    formPathList: () => any[];
}>, {
    validate: typeof validate;
}, unknown, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (value: any) => void;
}, string, import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToOption<BetweenProps>, {
    modelValue: () => {};
    disabled: boolean;
    showWays: boolean;
    nodes: () => any[];
    skips: () => any[];
    formPathList: () => any[];
}>>> & {
    "onUpdate:modelValue"?: (value: any) => any;
}, {
    modelValue: {};
    disabled: boolean;
    showWays: boolean;
    nodes: any[];
    skips: any[];
    formPathList: any[];
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
