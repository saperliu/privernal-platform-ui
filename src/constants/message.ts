import { transformObjectToOption } from '@/constants/_shared';

export const messageTypeLabels: Record<string, string> = {
  WORKFLOW: '审批消息',
  ALARM: '报警消息',
  NOTICE: '通知消息'
};

export const messageTypeOptions = transformObjectToOption(messageTypeLabels);

export const operationTypeLabels: Record<number, string> = {
  0: '其它',
  1: '新增',
  2: '修改',
  3: '删除',
  4: '授权',
  5: '导出',
  6: '导入',
  7: '强退',
  8: '清空数据',
  9: '查询'
};
