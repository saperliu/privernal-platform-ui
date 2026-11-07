import { GatewayModel } from './gatewayModel';
import { GatewayView } from './gatewayView';
import { h } from '@logicflow/core';
declare class ParallelModel extends GatewayModel {
    getNodeStyle(): any;
}
declare class ParallelView extends GatewayView {
    getSvg(x: number, y: number, width: number, height: number, textValue: string, style: {
        stroke: string;
        fill: string;
    }): h.JSX.Element;
}
declare const _default: {
    type: string;
    view: typeof ParallelView;
    model: typeof ParallelModel;
};
export default _default;
