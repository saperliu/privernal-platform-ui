/** 前端form配置 */
declare namespace DynamicFormNamespace {
  interface DynamicFormQuery extends ApiCommon.RequestPage {
    departmentId?: string;

    organizationId?: string;

    title?: string;

    status?: number;

    tableCode?: string;

    tableName?: string;

    metaData?: string;

    isWorkflow?: number;

    workflowCode?: string;

    /** 所属应用ID */
    appId?: string;
  }

  interface DynamicFormPage extends ApiCommon.ResponsePage {
    list: DynamicFormForm[];
  }
  /** 前端form配置 */
  interface DynamicFormForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 所属部门 */
    departmentId: string;

    /** 所属组织 */
    organizationId: string;

    /** 数据标题 */
    title: string;

    /** 状态;业务对象的状态,0:草稿,1审批完成或已提交,2:流程运行中,3:被取消 */
    status: number;

    /** 表单编码,数据库表的表名 */
    tableCode: string;

    /** 表单名称 */
    tableName: string;

    /** 配置的前端界面的json */
    metaData: Common.JSONObject<SystemDictionaryDataNamespace.SystemDictionaryDataJson>;

    /** 是否启用工作流 0 未启用 1 启用 */
    isWorkflow: number;

    /** 工作流的标识 */
    workflowCode: string;

    /** 所属应用ID */
    appId: string;
  }

  /** 前端form配置 详情 */
  interface DynamicFormDetail extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 所属部门 */
    departmentId: string;

    /** 所属组织 */
    organizationId: string;

    /** 数据标题 */
    title: string;

    /** 状态;业务对象的状态,0:草稿,1审批完成或已提交,2:流程运行中,3:被取消 */
    status: number;

    /** 表单编码,数据库表的表名 */
    tableCode: string;

    /** 表单名称 */
    tableName: string;

    /** 配置的前端界面的json */
    metaData: Common.JSONObject<SystemDictionaryDataNamespace.SystemDictionaryDataJson>;

    /** 是否启用工作流 0 未启用 1 启用 */
    isWorkflow: number;

    /** 工作流的标识 */
    workflowCode: string;

    /** 所属应用ID */
    appId: string;
  }
}
