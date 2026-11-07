/**
 * 应用关联的流程单
 */
declare namespace SystemAppWorkflowNamespace {
  interface SystemAppWorkflowQuery extends ApiCommon.RequestPage {
    appId?: string;
    name?: string;

    workflowFormId?: string;

    status?: number;

    organizationId?: string;
  }

  interface SystemAppWorkflowPage extends ApiCommon.ResponsePage {
    list: SystemAppWorkflowForm[];
  }
  /**
   * 应用关联的流程单
   */
  interface SystemAppWorkflowForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 应用的ID */
    appId: string;

    /** 关联的工作流表单ID */
    workflowFormId: string;

    /** 状态 */
    status: number;

    /** 组织ID */
    organizationId: string;

    name: string;

    actionTag: string;
  }

  /**
   * 应用关联的流程单
   * 详情
   */
  interface SystemAppWorkflowDetail extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 应用的ID */
    appId: string;

    /** 关联的工作流表单ID */
    workflowFormId: string;

    /** 状态 */
    status: number;

    /** 组织ID */
    organizationId: string;
    name: string;

    actionTag: string;
  }
}
