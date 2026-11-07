/**
 * 系统操作日志
 */
declare namespace SystemLogOperationNamespace {
  interface SystemLogOperationQuery extends ApiCommon.RequestPage {
    name?: string;

    operationType?: string;

    method?: string;

    requestMethod?: string;

    businessType?: string;

    operationUrl?: string;

    operationIp?: string;

    operationLocation?: string;

    operationParam?: string;

    operationResult?: string;

    status?: number;

    operationPerson?: string;

    message?: string;

    organizationId?: string;

    departmentId?: string;
    parameters?: {
      beginDate?: string;
      endDate?: string;
    };
    dateList?: string[];
  }

  interface SystemLogOperationPage extends ApiCommon.ResponsePage {
    list: SystemLogOperationForm[];
  }
  /**
   * 系统操作日志
   */
  interface SystemLogOperationForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 模块名称 */
    name: string;

    /** 操作类型;操作类型（0其它 1新增 2修改 3删除） */
    operationType: string;

    /** 方法名称 */
    method: string;

    /** 请求方式 */
    requestMethod: string;

    /** 业务类型;0其它 1后台用户 2手机端用户 */
    businessType: string;

    /** 请求URL */
    operationUrl: string;

    /** 主机地址 */
    operationIp: string;

    /** 操作地点 */
    operationLocation: string;

    /** 请求参数 */
    operationParam: string;

    /** 返回参数 */
    operationResult: string;

    /** 操作状态;操作状态（0正常 1异常） */
    status: number;

    /** 操作人员;操作人名称 */
    operationPerson: string;

    /** 操作消息 */
    message: string;

    /** 组织ID */
    organizationId: string;

    /** 部门 */
    departmentId: string;
  }

  /**
   * 系统操作日志
   * 详情
   */
  interface SystemLogOperationDetail extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 模块名称 */
    name: string;

    /** 操作类型;操作类型（0其它 1新增 2修改 3删除） */
    operationType: string;

    /** 方法名称 */
    method: string;

    /** 请求方式 */
    requestMethod: string;

    /** 业务类型;0其它 1后台用户 2手机端用户 */
    businessType: string;

    /** 请求URL */
    operationUrl: string;

    /** 主机地址 */
    operationIp: string;

    /** 操作地点 */
    operationLocation: string;

    /** 请求参数 */
    operationParam: string;

    /** 返回参数 */
    operationResult: string;

    /** 操作状态;操作状态（0正常 1异常） */
    status: number;

    /** 操作人员;操作人名称 */
    operationPerson: string;

    /** 操作消息 */
    message: string;

    /** 组织ID */
    organizationId: string;

    /** 部门 */
    departmentId: string;
  }
}
