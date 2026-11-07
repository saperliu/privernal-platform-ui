import { h, PolygonNode, PolygonNodeModel } from '@logicflow/core';
declare class SerialModel extends PolygonNodeModel {
    static extendKey: string;
    constructor(data: any, graphModel: any);
    getNodeStyle(): any;
}
declare class SerialView extends PolygonNode {
    static extendKey: string;
    getShape(): h.JSX.Element;
}
declare const _default: {
    type: string;
    view: typeof SerialView;
    model: typeof SerialModel;
};
export default _default;
