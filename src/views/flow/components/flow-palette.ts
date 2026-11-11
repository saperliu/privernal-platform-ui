/**
 * 流程设计器调色板（两个宿主共用：动态表单流程设计页 / /flow/designer 独立设计器页）。
 * SVG 字符串经 innerHTML 渲染，风格对齐设计器内置图标。
 * 基础节点：开始/中间/抄送/子流程/结束（R2-18 起补齐子流程）；
 * 抄送与子流程都是 between + ext.nodeKind 标记，运行时由后端按标记分流。
 */

const WF_ICON_BG = 'var(--wf-icon-bg, #ffffff)';

const WF_START_ICON = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="42" fill="${WF_ICON_BG}" stroke="rgb(56,161,105)" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="30" fill="rgba(56,161,105,0.35)"/>
</svg>`;

const WF_BETWEEN_ICON = `
<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="90" height="70" rx="8" fill="${WF_ICON_BG}" stroke="rgb(37,99,235)" stroke-width="1.5"/>
  <rect x="12" y="10" width="32" height="26" rx="5" ry="5" fill="rgba(37,99,235,0.08)" stroke="rgb(37,99,235)" stroke-width="1.2"/>
  <circle cx="28" cy="23" r="5.5" fill="rgba(37,99,235,0.15)" stroke="rgb(37,99,235)" stroke-width="1"/>
  <path d="M24 23l4 4l6-6" fill="none" stroke="rgb(37,99,235)" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"/>
</svg>`;

/** 抄送节点：卡片 + 信封 + 右上角纸飞机，青绿色区分审批节点 */
const WF_CC_ICON = `
<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="90" height="70" rx="8" fill="${WF_ICON_BG}" stroke="rgb(13,148,136)" stroke-width="1.5"/>
  <rect x="12" y="14" width="46" height="32" rx="5" ry="5" fill="rgba(13,148,136,0.08)" stroke="rgb(13,148,136)" stroke-width="1.2"/>
  <path d="M15 18 L35 35 L55 18" fill="none" stroke="rgb(13,148,136)" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M64 18 L84 12 L76 26 L84 28 L64 42 Z" fill="rgb(13,148,136)" opacity="0.85"/>
</svg>`;

/** 子流程节点：卡片 + 嵌套小卡片 + 右上角链接箭头，紫色区分审批/抄送节点（R2-18 ②） */
const WF_SUBFLOW_ICON = `
<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="90" height="70" rx="8" fill="${WF_ICON_BG}" stroke="rgb(124,58,237)" stroke-width="1.5"/>
  <rect x="12" y="12" width="42" height="26" rx="5" ry="5" fill="rgba(124,58,237,0.08)" stroke="rgb(124,58,237)" stroke-width="1.2"/>
  <rect x="22" y="20" width="42" height="26" rx="5" ry="5" fill="rgba(124,58,237,0.14)" stroke="rgb(124,58,237)" stroke-width="1.2"/>
  <path d="M70 14 L82 22 L70 30" fill="none" stroke="rgb(124,58,237)" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter"/>
</svg>`;

const WF_END_ICON = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="42" fill="${WF_ICON_BG}" stroke="rgb(229,57,53)" stroke-width="3.5"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(229,57,53,0.25)" stroke-width="1"/>
</svg>`;

export const FLOW_PALETTE_NODES = {
  flowNodes: [
    { type: 'start', text: '开始', label: '开始', icon: WF_START_ICON },
    {
      type: 'between',
      text: '中间节点',
      label: '中间节点',
      icon: WF_BETWEEN_ICON,
      // 默认或签（collaborativeWay 1=或签 2=票签 3=会签），规则页签可切换协作方式
      properties: { collaborativeWay: '1' }
    },
    {
      type: 'between',
      text: '抄送节点',
      label: '抄送',
      icon: WF_CC_ICON,
      properties: { collaborativeWay: '1', ext: { nodeKind: 'cc' } }
    },
    {
      type: 'between',
      text: '子流程节点',
      label: '子流程',
      icon: WF_SUBFLOW_ICON,
      // 子流程为 between + ext.nodeKind=subflow 标记：运行时自动发起 ext.subflowCode 指定的已发布流程，
      // 子流程办结后自动流转到下一节点（后端 FlowInstanceServiceImpl.launchSubflowTasks 桥接）
      properties: { collaborativeWay: '1', ext: { nodeKind: 'subflow' } }
    },
    { type: 'end', text: '结束', label: '结束', icon: WF_END_ICON }
  ]
};
