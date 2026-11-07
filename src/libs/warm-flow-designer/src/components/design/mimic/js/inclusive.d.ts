import { GatewayModel } from './gatewayModel';
import { GatewayView } from './gatewayView';
import { h } from '@logicflow/core';
declare class InclusiveModel extends GatewayModel {
    getNodeStyle(): any;
}
declare class InclusiveView extends GatewayView {
    getSvg(x: number, y: number, width: number, height: number, textValue: string, style: {
        stroke: string;
        fill: string;
    }): h.JSX.Element;
}
declare const _default: {
    type: string;
    view: typeof InclusiveView;
    model: typeof InclusiveModel;
};
export default _default;
