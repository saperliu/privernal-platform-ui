/**
 * 将warm-flow的定义json数据转成LogicFlow支持的数据格式
 * @param {*} json
 * @returns LogicFlow的数据
 */
export declare const json2LogicFlowJson: (definition: any) => {
    nodes: any[];
    edges: any[];
};
/**
 * 将LogicFlow的数据转成warm-flow的json定义文件
 * @param {*} data(...definitionInfo,nodes,edges)
 * @returns
 */
export declare const logicFlowJsonToWarmFlow: (data: any) => string;
export declare const setCommonStyle: (style: any, properties: any, nodeType: any, type: any) => any;
/**
 * 经典模式「设计态」语义色增强
 *
 * 设计器里节点没有运行状态（status 为空），原本统一渲染成中性灰（notDoneColor），整体偏灰、辨识度低。
 * 这里在「设计器页面内 + 节点无在办/已办状态」时，按节点类型赋予清爽的语义色（开始绿 / 审批蓝 / 结束红 / 网关橙青紫），
 * 让各类节点一眼可辨，同时把发灰的投影替换成同色系柔和阴影。
 *
 * 安全边界（不破坏既有契约）：
 * - 仅在设计器页面生效（window.__WF_FLOW_DESIGN_MODE__）：设计器内一律用新版语义色，不再判断节点运行状态；
 * - 业务侧渲染的流程实例进度图（非设计器）不受影响，继续沿用后端 chartStatusColor 的状态语义；
 * - 仅经典模式节点调用本函数，仿钉钉模式不调用、行为完全不变。
 *
 * @param {Object} style setCommonStyle 处理后的样式对象
 * @param {Object} properties 节点 / 边属性
 * @param {string} rgb 该节点类型的语义色，形如 '64,158,255'
 * @returns {Object} 处理后的样式对象
 */
export declare const applyClassicDesignColor: (style: any, properties: any, rgb: any) => any;
export declare function getPreviousNodes(nodes: any, skips: any, nowNodeCode: any): any;
/**
 * 判断是否经典模式
 */
export declare function isClassics(modelValue: any): boolean;
/**
 * 判断是否网关节点
 */
export declare function isGateWay(nodeType: any): boolean;
