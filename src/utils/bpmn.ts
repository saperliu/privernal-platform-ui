import { definitionStatusLabels, rejectRuleLabels, workflowResultLabels } from '@/constants/bpmn';

export function getWorkflowResultLabel(status: string) {
  return workflowResultLabels[status] ?? status;
}

export function getRejectRuleLabel(type: string) {
  return rejectRuleLabels[type] ?? type;
}

export function getDefinitionStatusLabel(status: number) {
  return definitionStatusLabels[status] ?? String(status);
}

export function getDefinitionStatusColor(status: number) {
  return status === 1 ? '#00da00' : '#BEBEBE';
}

export function isBpmnElementType(type: string) {
  return type?.startsWith('bpmn:');
}

export function getBpmnElementType(type: string) {
  if (!type) return '';
  return type.replace('bpmn:', '');
}
