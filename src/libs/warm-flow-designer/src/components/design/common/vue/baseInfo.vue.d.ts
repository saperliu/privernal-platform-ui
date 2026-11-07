interface BaseInfoProps {
    /** 是否只读 */
    disabled?: boolean;
    /** 流程基础信息（数据源） */
    logicJson?: Record<string, any>;
    /** 流程类别树 */
    categoryList?: any[];
    /** 自定义表单路径树 */
    formPathList?: any[];
    /** 流程定义 id（新建态为 null） */
    definitionId?: string | null;
}
declare function validate(): Promise<unknown>;
declare function getFormData(): {
    id: any;
    flowCode: string;
    flowName: string;
    modelValue: string;
    category: string;
    formCustom: string;
    formPath: string;
    listenerType: string;
    listenerPath: string;
    listenerRows: any[];
};
declare const __VLS_export: import('vue').DefineComponent<__VLS_WithDefaults<__VLS_TypePropsToOption<BaseInfoProps>, {
    disabled: boolean;
    logicJson: () => {};
    categoryList: () => any[];
    formPathList: () => any[];
    definitionId: any;
}>, {
    getFormData: typeof getFormData;
    validate: typeof validate;
}, unknown, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:flow-name": (flowName: string) => void;
    "update:model-value": () => void;
    "validate-error": (fields?: Record<string, any>) => void;
}, string, import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToOption<BaseInfoProps>, {
    disabled: boolean;
    logicJson: () => {};
    categoryList: () => any[];
    formPathList: () => any[];
    definitionId: any;
}>>> & {
    "onUpdate:flow-name"?: (flowName: string) => any;
    "onUpdate:model-value"?: () => any;
    "onValidate-error"?: (fields?: Record<string, any>) => any;
}, {
    disabled: boolean;
    formPathList: any[];
    logicJson: {};
    categoryList: any[];
    definitionId: string | null;
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
