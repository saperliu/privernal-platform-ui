import { h, PolygonNode, PolygonNodeModel } from '@logicflow/core';
declare class InclusiveModel extends PolygonNodeModel {
    static extendKey: string;
    constructor(data: any, graphModel: any);
    getNodeStyle(): any;
}
declare class InclusiveView extends PolygonNode {
    static extendKey: string;
    getShape(): h.JSX.Element;
}
declare const _default: {
    type: string;
    view: typeof InclusiveView;
    model: typeof InclusiveModel;
};
export default _default;
