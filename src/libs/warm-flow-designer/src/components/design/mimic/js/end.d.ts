import { CircleNode, CircleNodeModel } from '@logicflow/core';
declare class endModel extends CircleNodeModel {
    initNodeData(data: any): void;
    getNodeStyle(): any;
}
declare class endView extends CircleNode {
}
declare const _default: {
    type: string;
    model: typeof endModel;
    view: typeof endView;
};
export default _default;
