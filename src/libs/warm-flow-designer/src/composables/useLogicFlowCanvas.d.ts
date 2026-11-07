import { Ref } from 'vue';
import { FlowDesignerProps } from '../designer/types';
/**
 * useLogicFlowCanvas 入参：组件把「画布需要、但归属向导/表单/属性面板」的依赖以
 * ref + 回调形式注入，让 composable 专注于 LogicFlow 实例的生命周期与视口/IO 操作。
 */
export interface UseLogicFlowCanvasOptions {
    /** FlowDesigner 的 props（读取 showGrid / lfOptions / customNodes / extraExtensions / onBeforeUse / onRegister，惰性读取保持响应式） */
    props: FlowDesignerProps;
    /** 画布容器 DOM（模板 `ref="containerRef"`），LogicFlow 挂载点 */
    containerRef: Ref<HTMLElement | undefined>;
    /** 当前流程 JSON（读取 modelValue / flowName / version，render 数据源；clear 在仿钉钉模式会重置它） */
    logicJson: Ref<Record<string, any>>;
    /** 只读标志（静默模式 / __WF_DESIGNER_DISABLED__） */
    disabled: Ref<boolean>;
    /** 收集基础信息表单到 logicJson（下载 JSON 前调用），实现由组件提供 */
    getBaseInfo: () => void;
    /** 绑定画布事件（initEvent）：画布 → 属性面板 UI 状态的桥接，逻辑留在组件，由本钩子在合适时机调用 */
    bindEvents: () => void;
    /** 画布渲染完成回调：组件据此显示侧边栏 + emit('ready') */
    onReady: (lf: any) => void;
}
/**
 * LogicFlow 画布生命周期组合式。
 *
 * 从 FlowDesigner.vue 抽出，集中承载：
 * - 实例生命周期：use（扩展）→ new LogicFlow → setTheme → register（节点）→ menu → events → 触摸桥接 → render → fitView → 暗黑主题
 * - 视口操作：放大/缩小/自适应（zoomViewport）、撤销/重做、清空、下载图片 / JSON
 * - 自适应：移动端判定、fitView（限制最大 100%）、resize（防抖 + 抽屉屏蔽）、移动端真机延迟重绘
 * - 移动端触摸 → 鼠标事件桥接（Pointer Events）
 * - 暗黑主题随 isDark 切换
 *
 * 组件保留「向导 / 表单 / 属性面板」状态与事件桥接（initEvent），通过 options 注入。
 *
 * @author warm
 */
export declare function useLogicFlowCanvas(options: UseLogicFlowCanvasOptions): {
    lf: any;
    initLogicFlow: () => void;
    zoomViewport: (zoom: boolean | number | string) => Promise<void>;
    undoOrRedo: (undo: boolean) => Promise<void>;
    clear: () => Promise<void>;
    downLoad: () => void;
    downJson: () => Promise<void>;
    fitViewAll: () => void;
    fitViewIfMobile: () => void;
    handleDragInNode: (type: string, properties?: Record<string, any>, text?: string) => void;
    getGraphData: () => any;
};
