interface StepItem {
    title: string;
    icon: string;
}
type __VLS_Props = {
    flowName?: string;
    activeStep: number;
    steps: StepItem[];
    disabled?: boolean;
};
declare var __VLS_1: {
    flowName: string;
}, __VLS_14: {
    activeStep: number;
    steps: StepItem[];
    goToStep: (index: number) => void;
}, __VLS_21: {
    save: () => void;
    disabled: boolean;
};
type __VLS_Slots = {} & {
    'header-left'?: (props: typeof __VLS_1) => any;
} & {
    'header-center'?: (props: typeof __VLS_14) => any;
} & {
    'header-actions'?: (props: typeof __VLS_21) => any;
};
declare const __VLS_base: import('vue').DefineComponent<__VLS_TypePropsToOption<__VLS_Props>, unknown, unknown, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "step-click": (index: number) => void;
    save: () => void;
}, string, import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps, Readonly<import('vue').ExtractPropTypes<__VLS_TypePropsToOption<__VLS_Props>>> & {
    onSave?: () => any;
    "onStep-click"?: (index: number) => any;
}, {}, {}>;
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
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
