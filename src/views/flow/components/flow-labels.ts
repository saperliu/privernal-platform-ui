/** 流程状态与流转动作文案（我的流程各列表、流程记录共用） */

export type FlowTone = 'default' | 'info' | 'success' | 'warning' | 'error';

/** warm-flow flow_status */
export const flowStatusLabels: Record<string, string> = {
  '0': '待提交',
  '1': '审批中',
  '2': '审批通过',
  '3': '自动完成',
  '4': '终止',
  '5': '作废',
  '6': '撤销',
  '7': '取回',
  '8': '已完成',
  '9': '已退回',
  '10': '失效',
  '11': '拿回',
  '12': '重启'
};

export const flowStatusTones: Record<string, FlowTone> = {
  '0': 'default',
  '1': 'info',
  '2': 'success',
  '3': 'success',
  '4': 'warning',
  '5': 'warning',
  '6': 'warning',
  '7': 'info',
  '8': 'success',
  '9': 'error',
  '10': 'warning',
  '11': 'info',
  '12': 'info'
};

/** 流转动作：办理结果（skipType）与设计器侧动作取值合并 */
export const skipTypeLabels: Record<string, string> = {
  NONE: '提交',
  SUBMIT: '提交',
  PASS: '通过',
  APPROVE: '通过',
  AUTO_PASS: '自动通过',
  REJECT: '退回',
  DISAPPROVE: '不通过',
  AUTO_REJECT: '自动退回',
  PROCESS: '审批中',
  CANCEL: '撤销',
  TIMEOUT: '超时',
  UNDO: '撤回',
  JUMP: '跳转',
  CHANGE: '更换'
};

export const skipTypeTones: Record<string, FlowTone> = {
  NONE: 'info',
  SUBMIT: 'info',
  PROCESS: 'info',
  PASS: 'success',
  APPROVE: 'success',
  AUTO_PASS: 'success',
  REJECT: 'error',
  DISAPPROVE: 'error',
  AUTO_REJECT: 'error',
  CANCEL: 'error',
  TIMEOUT: 'warning',
  UNDO: 'warning',
  JUMP: 'warning',
  CHANGE: 'warning'
};

/** warm-flow cooperate_type：1审批 2转办 3委派 4会签 5票签 6加签 7减签 */
export const cooperateTypeLabels: Record<number, string> = {
  1: '审批',
  2: '转办',
  3: '委派',
  4: '会签',
  5: '票签',
  6: '加签',
  7: '减签'
};
