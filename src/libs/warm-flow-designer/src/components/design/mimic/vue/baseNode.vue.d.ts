interface BaseNodeProps {
    /** 节点文本（节点名） */
    text?: string;
    /** 办理人权限标识（@@ 分隔） */
    permissionFlag?: string;
    /** 实例进度图状态色（有值=运行态） */
    chartStatusColor?: any[];
    /** 节点状态 */
    status?: number | null;
    /** 节点类型 */
    type?: string;
    /** 填充色 */
    fill?: string;
    /** 描边色 */
    stroke?: string;
}
declare const __VLS_export: import('vue').DefineComponent<__VLS_WithDefaults<__VLS_TypePropsToOption<BaseNodeProps>, {
    text: string;
    permissionFlag: string;
    chartStatusColor: () => any[];
    status: any;
    type: string;
    fill: string;
    stroke: string;
}>, unknown, unknown, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    updateNodeName: (nodeName: string) => void;
    deleteNode: () => void;
    editNode: () => void;
}, string, import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToOption<BaseNodeProps>, {
    text: string;
    permissionFlag: string;
    chartStatusColor: () => any[];
    status: any;
    type: string;
    fill: string;
    stroke: string;
}>>> & {
    onUpdateNodeName?: (nodeName: string) => any;
    onDeleteNode?: () => any;
    onEditNode?: () => any;
}, {
    text: string;
    type: string;
    fill: string;
    permissionFlag: string;
    status: number | null;
    chartStatusColor: any[];
    stroke: string;
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
