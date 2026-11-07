import { h, PolygonNode, PolygonNodeModel } from '@logicflow/core';
declare class ParallelModel extends PolygonNodeModel {
    static extendKey: string;
    constructor(data: any, graphModel: any);
    getNodeStyle(): any;
}
declare class ParallelView extends PolygonNode {
    static extendKey: string;
    getShape(): h.JSX.Element;
}
declare const _default: {
    type: string;
    view: typeof ParallelView;
    model: typeof ParallelModel;
};
export default _default;
