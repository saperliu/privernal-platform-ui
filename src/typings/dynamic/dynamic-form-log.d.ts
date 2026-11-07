/** form的历史版本 */
declare namespace DynamicFormLogNamespace {
  interface DynamicFormLogQuery extends ApiCommon.RequestPage {
    departmentId?: string;

    organizationId?: string;

    title?: string;

    status?: number;

    formId?: string;

    version?: string;

    metaData?: string;

    isWorkflow?: number;

    workflowCode?: string;

    /** 快照类型；VERSION=正式生效版本，DRAFT=设计草稿（不生效） */
    logType?: string;
  }

  interface DynamicFormLogPage extends ApiCommon.ResponsePage {
    list: DynamicFormLogForm[];
  }
  /** form的历史版本 */
  interface DynamicFormLogForm extends ApiCommon.FormBase {
    /** $column.columnComment */
    id: string;

    /** 所属部门 */
    departmentId: string;

    /** 所属组织 */
    organizationId: string;

    /** 数据标题 */
    title: string;

    /** 状态;业务对象的状态,0:草稿,1审批完成或已提交,2:流程运行中,3:被取消 */
    status: number;

    /** $column.columnComment */
    formId: string;

    /** $column.columnComment */
    version: string;

    /** $column.columnComment */
    metaData: Common.JSONObject<SystemDictionaryDataNamespace.SystemDictionaryDataJson>;

    /** 是否启用工作流 0 未启用 1 启用 */
    isWorkflow: number;

    /** 工作流的标识 */
    workflowCode: string;

    /** 快照类型；VERSION=正式生效版本，DRAFT=设计草稿（不生效） */
    logType?: string;

    /** 所属表单名（join 现取，表单已物理删除时为空） */
    formName?: string;

    /** 所属表单编码（join 现取，表单已物理删除时为空） */
    formCode?: string;
  }

  /** form的历史版本 详情 */
  interface DynamicFormLogDetail extends ApiCommon.FormBase {
    /** $column.columnComment */
    id: string;

    /** 所属部门 */
    departmentId: string;

    /** 所属组织 */
    organizationId: string;

    /** 数据标题 */
    title: string;

    /** 状态;业务对象的状态,0:草稿,1审批完成或已提交,2:流程运行中,3:被取消 */
    status: number;

    /** $column.columnComment */
    formId: string;

    /** $column.columnComment */
    version: string;

    /** $column.columnComment */
    metaData: Common.JSONObject<SystemDictionaryDataNamespace.SystemDictionaryDataJson>;

    /** 是否启用工作流 0 未启用 1 启用 */
    isWorkflow: number;

    /** 工作流的标识 */
    workflowCode: string;
  }
}
