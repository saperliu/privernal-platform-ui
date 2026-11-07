export const LISTENER_ALLOWED_TYPES = [
  'bpmn:Activity',
  'bpmn:Event',
  'bpmn:Gateway',
  'bpmn:SequenceFlow',
  'bpmn:Process',
  'bpmn:Participant'
];

export const scriptTypeOptions: { value: string; label: string }[] = [
  { label: '外链脚本( External Resource )', value: 'external' },
  { label: '内联脚本( Inline Script )', value: 'inline' },
  { label: '无( None )', value: 'none' }
];

export const rejectRuleOptions: { value: string; label: string }[] = [
  { label: '驳回到上一节点', value: 'REJECT_TO_LAST' },
  { label: '驳回到发起人', value: 'REJECT_TO_START' },
  { label: '驳回到指定节点', value: 'REJECT_TO_TARGET' },
  { label: '结束流程', value: 'REJECT_FINISH' }
];

export const rejectRuleLabels: Record<string, string> = {
  REJECT_TO_LAST: '驳回到上一节点',
  REJECT_TO_START: '驳回到发起人',
  REJECT_TARGET: '驳回到指定节点',
  REJECT_FINISH: '结束流程'
};
export const bpmnLoopOptions: { value: string; label: string }[] = [
  { label: '所有审批人同时处理', value: 'ParallelMultiInstance' },
  { label: '按审批人设置顺序依次处理', value: 'SequentialMultiInstance' }
];
export const bpmnNoFoundOptions: { value: string; label: string }[] = [
  { label: '自动进入下一节点', value: 'NEXT' },
  { label: '交给管理员', value: 'MANAGE' }
];
export const bpmnTimeLimitOptions: { value: string; label: string }[] = [
  { label: '不限时', value: 'NO' },
  { label: '自定义', value: 'CUSTOM' }
];
export const bpmnTimeLimitProcessOptions: { value: string; label: string }[] = [
  { label: '自动同意', value: 'AGREE' },
  { label: '自动驳回上一节点', value: 'FRONT' },
  { label: '自动驳回到发起节点', value: 'START' }
];
export const bpmnRuleOptions: { value: string; label: string }[] = [
  { label: '按百分比', value: 'P' },
  { label: '按人数', value: 'N' }
];

export const definitionStatusLabels: Record<number, string> = {
  1: '发布',
  0: '未发布'
};

export const definitionStatusColors: Record<string, string> = {
  '0': '#BEBEBE',
  '1': '#00da00'
};

export const workflowResultLabels: Record<string, string> = {
  PROCESS: '处理中',
  APPROVE: '通过',
  DISAPPROVE: '不通过',
  CANCEL: '已取消',
  REJECT: '退回/驳回',
  SUBMIT: '提交'
};

export const bpmnRuleTypeOptions: { value: string; label: string }[] = [
  { label: '角色成员', value: 'ROLE' },
  { label: '部门成员', value: 'DEPT' },
  { label: '用户', value: 'USER' },
  { label: '部门主管', value: 'DEPT_LEADER' },
  { label: '用户组成员', value: 'USER_GROUP' },
  { label: '组合', value: 'SCRIPT' }
];

export const bpmnRuleScriptOptions: { value: string; label: string }[] = [
  { label: '发起人', value: 'START_USER' },
  { label: '发起人部门的主管', value: 'START_USER_LEADER' },
  { label: '数据所属部门的主管', value: 'DATA_DEPT_LEADER' },
  { label: '发起人部门', value: 'START_USER_DEPT' },
  { label: '数据所属部门', value: 'DATA_DEPT' },
  { label: '数据部门表单数据编码', value: 'DATA_DEPT_DYNAMIC_CODE' },
  { label: '数据部门节点编码', value: 'DATA_DEPT_TASK_DEFINITION_KEY_CODE' },
  { label: '数据部门节点拼表单数据编码', value: 'DATA_DEPT_TASK_DEFINITION_KEY_DYNAMIC_CODE' },
  { label: '数据部门表单内置人员', value: 'DATA_DEPT_TABLE_PERSON' },
  { label: '数据部门公共组编码', value: 'DATA_DEPT_COMMON_CODE' }
];

export const bpmnRuleScriptLabels: Record<string, string> = {
  START_USER: '发起人',
  START_USER_LEADER: '发起人部门的主管',
  DATA_DEPT_LEADER: '数据所属部门的主管',
  START_USER_DEPT: '发起人部门',
  DATA_DEPT: '数据所属部门'
};

export const bpmnRuleScriptSubOptions: { value: string; label: string }[] = [
  { label: '角色成员', value: 'ROLE' },
  { label: '用户组成员', value: 'USER_GROUP' }
];

//
export const bpmnSendTypeOptions: { value: string; label: string }[] = [
  { label: '实时发送', value: 'R' },
  { label: '延时发送', value: 'D' },
  { label: '不发送', value: 'N' }
];

// CUSTOM: '自定义'
export const bpmnDelayTypeOptions: { value: string; label: string }[] = [{ label: '按固定时间', value: 'LEVEL' }];
// 18个等级分别为：1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h
export const bpmnDelayLevelOptions: { value: number; label: string }[] = [
  { label: '1s', value: 1 },
  { label: '5s', value: 2 },
  { label: '10s', value: 3 },
  { label: '30s', value: 4 },
  { label: '1m', value: 5 },
  { label: '2m', value: 6 },
  { label: '3m', value: 7 },
  { label: '4m', value: 8 },
  { label: '5m', value: 9 },
  { label: '6m', value: 10 },
  { label: '7m', value: 11 },
  { label: '8m', value: 12 },
  { label: '9m', value: 13 },
  { label: '10m', value: 14 },
  { label: '20m', value: 15 },
  { label: '30m', value: 16 },
  { label: '1h', value: 17 },
  { label: '2h', value: 18 }
];

export const RULE_TYPE_ROLE = 'ROLE';
export const RULE_TYPE_DEPT = 'DEPT';
export const RULE_TYPE_DEPT_LEADER = 'DEPT_LEADER';
export const RULE_TYPE_USER = 'USER';
export const RULE_TYPE_USER_GROUP = 'USER_GROUP';
export const RULE_TYPE_SCRIPT = 'SCRIPT';

export const extensionRuleAssignment = 'assignmentRule';
export const extensionRuleProcess = 'processRule';
