import { CurvedEdge, CurvedEdgeModel } from '@logicflow/extension';
import { h } from '@logicflow/core';
declare class SkipModel extends CurvedEdgeModel {
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
declare class SkipView extends CurvedEdge {
    getEdge(): h.JSX.Element;
    private getForeignObject;
    private getPlusElements;
    private getAddElements;
    private getEventHandlers;
    private pointFilter;
}
declare const _default: {
    type: string;
    view: typeof SkipView;
    model: typeof SkipModel;
};
export default _default;
