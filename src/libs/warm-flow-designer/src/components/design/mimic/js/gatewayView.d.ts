import { RectNode, h } from '@logicflow/core';
export declare abstract class GatewayView extends RectNode {
    abstract getSvg(x: number, y: number, width: number, height: number, textValue: string, style: any): h.JSX.Element;
    getLabelShape(): h.JSX.Element;
    getShape(): h.JSX.Element;
}
