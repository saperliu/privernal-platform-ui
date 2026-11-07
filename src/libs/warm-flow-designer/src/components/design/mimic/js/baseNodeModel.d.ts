import { HtmlNodeModel } from '@logicflow/core';
export declare class BaseNodeModel extends HtmlNodeModel {
    setAttributes(): void;
    getNodeStyle(): any;
    getData(): import("@logicflow/core").LogicFlow.NodeData;
    getTextStyle(): {
        [x: string]: unknown;
        fill?: string | undefined;
        stroke?: string | undefined;
        strokeWidth?: number | undefined;
        radius?: number | undefined;
        rx?: number | undefined;
        ry?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
        path?: string | undefined;
        overflowMode?: "default" | "autoWrap" | "ellipsis" | undefined;
        textWidth?: number | undefined;
        background?: import("@logicflow/core").LogicFlow.CommonTheme | undefined;
        wrapPadding?: string | undefined;
        color?: string | undefined;
        fontSize: number;
        lineHeight?: number | undefined;
        textAnchor?: "middle" | "start" | "end" | undefined;
        dominantBaseline?: "middle" | "central" | "auto" | "text-bottom" | "alphabetic" | "ideographic" | "mathematical" | "hanging" | "text-top" | undefined;
    };
}
