interface StartProps {
    /** 节点表单数据（v-model） */
    modelValue?: Record<string, any>;
    /** 是否只读 */
    disabled?: boolean;
}
declare var __VLS_9: {
    model: Record<string, any>;
    field: string;
}, __VLS_22: {
    model: Record<string, any>;
    field: string;
}, __VLS_39: {
    form: Record<string, any>;
    disabled: boolean;
}, __VLS_41: {
    model: Record<string, any>;
    field: string;
};
type __VLS_Slots = {} & {
    'form-item-task-name'?: (props: typeof __VLS_9) => any;
} & {
    'form-item-task-name'?: (props: typeof __VLS_22) => any;
} & {
    'node-form-extra'?: (props: typeof __VLS_39) => any;
} & {
    'form-item-task-listenerType'?: (props: typeof __VLS_41) => any;
};
declare const __VLS_base: import('vue').DefineComponent<__VLS_WithDefaults<__VLS_TypePropsToOption<StartProps>, {
    modelValue: () => {};
    disabled: boolean;
}>, unknown, unknown, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    change: (value: any) => void;
}, string, import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToOption<StartProps>, {
    modelValue: () => {};
    disabled: boolean;
}>>> & {
    onChange?: (value: any) => any;
}, {
    modelValue: {};
    disabled: boolean;
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
