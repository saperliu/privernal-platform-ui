import { CircleNode, CircleNodeModel, h } from '@logicflow/core';
declare class StartModel extends CircleNodeModel {
    initNodeData(data: any): void;
    getNodeStyle(): any;
}
declare class StartView extends CircleNode {
    getShape(): h.JSX.Element;
}
declare const _default: {
    type: string;
    model: typeof StartModel;
    view: typeof StartView;
};
export default _default;
