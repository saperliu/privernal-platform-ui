import { PolylineEdge, PolylineEdgeModel } from '@logicflow/core';
declare class SkipModel extends PolylineEdgeModel {
    setAttributes(): void;
    getEdgeStyle(): any;
    getTextStyle(): import("@logicflow/core").LogicFlow.EdgeTextTheme;
    /**
     * 重写此方法，使保存数据是能带上锚点数据。
     */
    getData(): import("@logicflow/core").LogicFlow.EdgeData & {
        pointsList: {
            x: number;
            y: number;
        }[];
    };
}
declare const _default: {
    type: string;
    view: typeof PolylineEdge;
    model: typeof SkipModel;
};
export default _default;
