import type { MessageApiInjection } from 'naive-ui/lib/message/src/MessageProvider';

declare global {
  interface Window {
    bpmnInstances: any;
    __messageBox: MessageApiInjection;
  }

  type BpmnElement = { type: string; [key: string]: any };
}

declare interface Window {
  bpmnInstances: any;
}
