/**
 * 基于 warm-flow 的平台工作流类型定义（对接 /back/flow/** 接口）
 *
 * 后端全局把 Long 序列化为字符串（雪花 id 超出 JS 安全整数范围），
 * 因此所有 id / 关联 id 字段统一声明为 string，不再使用 number。
 */
declare namespace FlowNamespace {
  /** 分页响应 */
  interface Page<T> {
    list: T[];
    total: number;
  }

  /** 分页查询条件 */
  interface Query extends Api.Common.RequestPage {
    keywords: string[];
  }

  /** 流程定义（warm-flow flow_definition） */
  interface Definition {
    id: string;
    flowCode: string;
    flowName: string;
    category?: string;
    version: string;
    /** 0未发布 1已发布 9已失效 */
    isPublish: number;
    /** 0挂起 1激活 */
    activityStatus: number;
    formCustom?: string;
    formPath?: string;
    createTime?: string;
    updateTime?: string;
    createBy?: string;
    updateBy?: string;
  }

  /** 流程定义查询 */
  interface DefinitionQuery extends Query {
    flowCode?: string;
    flowName?: string;
    category?: string;
    isPublish?: number;
  }

  /** 流程实例（warm-flow flow_instance） */
  interface Instance {
    /** 业务表单标题（基础数据） */
    businessTitle?: string;
    /** 流程编码（按钮权限配置按此加载） */
    flowCode?: string;
    id: string;
    definitionId: string;
    businessId: string;
    flowName: string;
    /** 实例流程名（流程版本变更后与定义 flowName 可能不同，列表标题兜底链用） */
    instanceFlowName?: string;
    nodeCode: string;
    nodeName: string;
    /** 0待提交 1审批中 2通过 4终止 5作废 6撤销 8已完成 9已退回 11拿回 */
    flowStatus: string;
    activityStatus?: number;
    createBy: string;
    createTime?: string;
    updateTime?: string;
  }

  /** 实例查询 */
  interface InstanceQuery extends Query {
    businessId?: string;
    flowCode?: string;
    flowName?: string;
    createBy?: string;
    flowStatus?: string;
    /** 发起时间范围-起（yyyy-MM-dd） */
    timeStart?: string;
    /** 发起时间范围-止（yyyy-MM-dd，含当日） */
    timeEnd?: string;
  }

  /** 实例状态结果 */
  interface InstanceStatus {
    instanceId: string;
    flowCode: string;
    businessId: string;
    /** 业务数据所在的动态表单编码；审批详情据此渲染申请单 */
    tableCode?: string;
    flowStatus: string;
    /** 0草稿 1已完成 2运行中 3取消 */
    dataStatus: number;
    running: boolean;
    nodeCode?: string;
    nodeName?: string;
  }

  /** 启动流程参数 */
  interface StartRequest {
    flowCode?: string;
    tableCode?: string;
    businessId: string;
    variables?: Record<string, unknown>;
    handler?: string;
  }

  /** 待办任务（warm-flow flow_task） */
  interface Task {
    /** 业务表单标题（基础数据） */
    businessTitle?: string;
    /** 流程编码（按钮权限配置按此加载） */
    flowCode?: string;
    id: string;
    definitionId: string;
    instanceId: string;
    businessId: string;
    flowName: string;
    /** 实例流程名（标题兜底链用，与后端 FlowTaskListDTO.instanceFlowName 对齐） */
    instanceFlowName?: string;
    nodeCode: string;
    nodeName: string;
    flowStatus: string;
    createTime?: string;
    updateTime?: string;
  }

  /** 已办任务（warm-flow flow_his_task） */
  interface HisTask {
    /** 业务表单标题（基础数据） */
    businessTitle?: string;
    /** 流程编码（按钮权限配置按此加载） */
    flowCode?: string;
    id: string;
    instanceId: string;
    taskId: string;
    businessId: string;
    flowName: string;
    /** 实例流程名（标题兜底链用，与后端 FlowHisTaskListDTO.instanceFlowName 对齐） */
    instanceFlowName?: string;
    nodeCode: string;
    nodeName: string;
    targetNodeCode?: string;
    targetNodeName?: string;
    approver?: string;
    collaborator?: string;
    /** 1审批 2转办 3委派 4会签 5票签 6加签 7减签 */
    cooperateType?: number;
    skipType?: string;
    flowStatus?: string;
    message?: string;
    createTime?: string;
    updateTime?: string;
  }

  /** 任务查询 */
  interface TaskQuery extends Query {
    flowName?: string;
    businessId?: string;
    nodeName?: string;
    nodeCode?: string;
    /** 到达/办理时间范围-起（yyyy-MM-dd） */
    timeStart?: string;
    /** 到达/办理时间范围-止（yyyy-MM-dd，含当日） */
    timeEnd?: string;
  }

  /** 任务操作参数（通过/驳回/委托/转办/加减签/跳转等） */
  interface TaskHandle {
    taskId: string;
    message?: string;
    variable?: Record<string, unknown>;
    /** LAST 上一节点 / START 发起节点 / TARGET 指定节点 */
    rejectType?: string;
    targetNodeCode?: string;
    /** 跳转接口：PASS / REJECT */
    skipType?: string;
    userIds?: string[];
  }

  /** 数量统计 */
  interface Count {
    todo: number;
    done: number;
    start: number;
  }

  /** 流程表单绑定（flow_form_bind） */
  interface FormBind {
    id: string;
    flowCode: string;
    flowName?: string;
    tableCode: string;
    formName?: string;
    organizationId?: string;
    departmentId?: string;
    createdTime?: string;
  }

  /** 节点表单配置（flow_form_node_config） */
  interface FormNodeConfig {
    id?: string;
    definitionCode: string;
    definitionId?: string;
    nodeCode: string;
    tableCode?: string;
    /** [{fieldCode,fieldName,show,edit,required,defaultValue,dict}] */
    fieldConfig?: string;
    /** [{btnCode,name,show,color,status,showDialog}] */
    btnConfig?: string;
  }

  /** 字段权限项 */
  interface FieldItem {
    fieldValue: string;
    fieldName?: string;
    isShow: number;
    isEdit: number;
    isRequired: number;
    defaultValue?: string;
    dict?: string;
  }

  /** 按钮权限项 */
  interface BtnItem {
    fieldValue: string;
    fieldName?: string;
    aliasName?: string;
    isShow: number;
    status?: number;
    showDialog?: number;
    color?: string;
  }

  /** 运行时表单权限（兼容旧 form-command 契约） */
  interface FormPermission {
    id: string;
    tableCode: string;
    tableName?: string;
    departmentId?: string;
    organizationId?: string;
    haveUser: boolean;
    fieldDTOList: FieldItem[];
    btnDTOList: BtnItem[];
  }

  /** 流程节点运行时信息（含高亮状态） */
  interface FlowNodeInfoDTO {
    nodeCode: string;
    nodeName: string;
    /** 0开始 1审批 2抄送 3互斥网关 4并行网关 5结束 */
    nodeType: number;
    /** 节点状态：PENDING 未到达 / ACTIVE 正在办理 / COMPLETED 已流转 */
    nodeStatus: string;
    assigneeName?: string;
    startTime?: string;
    endTime?: string;
  }

  /** 任务办理人选项（减签） */
  interface TaskUserOption {
    /** flow_user.processed_by 原值（减签提交原样传回） */
    userId: string;
    /** 展示名 */
    userName: string;
  }

  /** 任务办理选项（驳回/跳转可选节点、减签可选办理人） */
  interface TaskOption {
    nodeList: FlowNodeInfoDTO[];
    taskUserList: TaskUserOption[];
  }

  /** 流程定义详情（含节点列表） */
  interface DefinitionDetail extends Definition {
    nodeList?: Array<{
      nodeCode: string;
      nodeName: string;
      nodeType?: number;
      x?: number;
      y?: number;
    }>;
    flowDefinition?: string | Record<string, unknown>;
  }

  /** 流程表单配置版本（flow_form_version，草稿/发布/多版本） */
  interface FormVersion {
    id: string;
    flowCode: string;
    flowName?: string;
    /** 动态表单编码（dynamic_form.table_code） */
    tableCode: string;
    formName?: string;
    /** 版本号（同 flowCode 下递增，从1开始） */
    version?: number;
    /** 发布状态 0草稿 1已发布 */
    publishStatus?: number;
    /** 是否当前生效发布版 Y/N */
    currentFlag?: string;
    publishTime?: string;
    publishBy?: string;
    remark?: string;
    departmentId?: string;
    organizationId?: string;
    fieldPermList?: FormFieldPerm[];
    btnPermList?: FormBtnPerm[];
  }

  /** 节点字段权限明细（nodeCode='global' 为全局默认配置） */
  interface FormFieldPerm {
    id?: string;
    versionId?: string;
    flowCode?: string;
    version?: number;
    nodeCode: string;
    /** 字段编码（dynamic_form_column.filed_code） */
    fieldCode: string;
    fieldName?: string;
    /** 是否显示 0否 1是 */
    isShow?: number;
    /** 是否可编辑 0否 1是 */
    isEdit?: number;
    /** 是否必填 0否 1是 */
    isRequired?: number;
    defaultType?: string;
    defaultValue?: string;
    dictType?: string;
    sort?: number;
  }

  /** 节点按钮权限明细（nodeCode='global' 为全局默认配置） */
  interface FormBtnPerm {
    id?: string;
    versionId?: string;
    flowCode?: string;
    version?: number;
    nodeCode: string;
    /** 按钮编码（save/approve/reject/transfer/delegate/addSign/reduceSign/jump/terminate/revoke） */
    btnCode: string;
    btnName?: string;
    aliasName?: string;
    /** 是否显示 0否 1是 */
    isShow?: number;
    /** 是否显示确认弹窗 0否 1是 */
    showDialog?: number;
    color?: string;
    sort?: number;
  }
}
