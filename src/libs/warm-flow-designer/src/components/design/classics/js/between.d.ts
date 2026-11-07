import { RectNode, RectNodeModel, h } from '@logicflow/core';
declare class BetweenModel extends RectNodeModel {
    initNodeData(data: any): void;
    getNodeStyle(): any;
}
declare class BetweenView extends RectNode {
    /** 现代化审批/任务图标 */
    getIconShape(): h.JSX.Element;
    getShape(): h.JSX.Element;
}
declare const _default: {
    type: string;
    model: typeof BetweenModel;
    view: typeof BetweenView;
};
export default _default;
