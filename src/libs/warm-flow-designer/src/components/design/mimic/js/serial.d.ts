import { GatewayModel } from './gatewayModel';
import { GatewayView } from './gatewayView';
import { h } from '@logicflow/core';
declare class SerialModel extends GatewayModel {
    getNodeStyle(): any;
}
declare class SerialView extends GatewayView {
    getSvg(x: number, y: number, width: number, height: number, textValue: string, style: {
        stroke: string;
        fill: string;
    }): h.JSX.Element;
}
declare const _default: {
    type: string;
    view: typeof SerialView;
    model: typeof SerialModel;
};
export default _default;
