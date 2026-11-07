/**
 * 兼容旧 WFS 命名空间类型定义，映射到 warm-flow 新结构
 * 用于保持现有业务组件的类型引用不报错
 */

declare namespace WorkflowInstanceFormNamespace {
  interface WorkflowInstanceFormForm {
    id?: string;
    tableCode?: string;
    tableName?: string;
    departmentId?: string;
    organizationId?: string;
    haveUser: boolean;
    fieldDTOList: WorkflowInstanceFormFieldTaskNamespace.WorkflowInstanceFormFieldTaskForm[];
    btnDTOList: WorkflowInstanceFormBtnTaskNamespace.WorkflowInstanceFormBtnTaskForm[];
  }

  interface WorkflowFormBtnReleaseFilterDTO {
    tableCode: string;
    businessKey: string;
    processDefinitionId: string;
  }

  interface WorkflowProcessInstanceResultDTO {
    id?: number;
    status: number;
    startUserId?: string;
    workflowTaskDTO?: Array<{
      taskDefinitionKey: string;
      taskName?: string;
      assignee?: string;
    }>;
  }
}

declare namespace WorkflowInstanceFormFieldTaskNamespace {
  interface WorkflowInstanceFormFieldTaskForm {
    fieldValue: string;
    fieldName?: string;
    isShow: number;
    isEdit: number;
    isRequired: number;
    defaultValue?: string;
    dict?: string;
  }
}

declare namespace WorkflowInstanceFormBtnTaskNamespace {
  interface WorkflowInstanceFormBtnTaskForm {
    fieldValue: string;
    fieldName?: string;
    aliasName?: string;
    status?: number;
    showDialog?: number;
    color?: string;
  }
}

declare namespace WfsCommonNamespace {
  interface WorkflowApprove {
    pass: boolean;
    fileList: any[];
    imageList: any[];
    reason: string;
    userId: string;
  }
}
