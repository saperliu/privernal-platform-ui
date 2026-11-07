import { CircleNode, CircleNodeModel, h } from '@logicflow/core';
declare class endModel extends CircleNodeModel {
    initNodeData(data: any): void;
    getNodeStyle(): any;
}
declare class endView extends CircleNode {
    getShape(): h.JSX.Element;
}
declare const _default: {
    type: string;
    model: typeof endModel;
    view: typeof endView;
};
export default _default;
