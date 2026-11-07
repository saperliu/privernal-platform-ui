type __VLS_Props = {
    /** 当前步骤索引（仅 1=流程设计 时显示工具栏） */
    activeStep: number;
    /** 仅画布模式（无基础信息页时，工具栏内提供保存按钮） */
    onlyDesignShow?: boolean;
    /** 是否只读 */
    disabled?: boolean;
    /** 底层 LogicFlow 实例（仅用于透出给 toolbar-extra 插槽） */
    lf?: any;
};
declare var __VLS_172: {
    lf: any;
    disabled: boolean;
};
type __VLS_Slots = {} & {
    'toolbar-extra'?: (props: typeof __VLS_172) => any;
};
declare const __VLS_base: import('vue').DefineComponent<__VLS_TypePropsToOption<__VLS_Props>, unknown, unknown, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "zoom-out": () => void;
    "fit-view": () => void;
    "zoom-in": () => void;
    undo: () => void;
    redo: () => void;
    clear: () => void;
    "download-image": () => void;
    "download-json": () => void;
    save: () => void;
}, string, import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps, Readonly<import('vue').ExtractPropTypes<__VLS_TypePropsToOption<__VLS_Props>>> & {
    onClear?: () => any;
    onSave?: () => any;
    onUndo?: () => any;
    onRedo?: () => any;
    "onZoom-out"?: () => any;
    "onFit-view"?: () => any;
    "onZoom-in"?: () => any;
    "onDownload-image"?: () => any;
    "onDownload-json"?: () => any;
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
