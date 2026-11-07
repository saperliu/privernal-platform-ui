/** 动态数据库 */
declare namespace DynamicDatabaseNamespace {
  interface DynamicDatabaseQuery extends ApiCommon.RequestPage {
    departmentId?: string;

    organizationId?: string;

    title?: string;

    status?: number;

    databaseName?: string;

    databaseType?: string;

    driver?: string;

    password?: string;

    url?: string;

    userName?: string;
  }

  interface DynamicDatabasePage extends ApiCommon.ResponsePage {
    list: DynamicDatabaseForm[];
  }
  /** 动态数据库 */
  interface DynamicDatabaseForm extends ApiCommon.FormBase {
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

    /** 数据库名称 */
    databaseName: string;

    /** 数据库的类型 */
    databaseType: string;

    /** 数据库使用的驱动 */
    driver: string;

    /** 数据库的密码 */
    password: string;

    /** 使用的URL连接 */
    url: string;

    /** 数据库的用户名 */
    userName: string;
  }

  /** 动态数据库 详情 */
  interface DynamicDatabaseDetail extends ApiCommon.FormBase {
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

    /** 数据库名称 */
    databaseName: string;

    /** 数据库的类型 */
    databaseType: string;

    /** 数据库使用的驱动 */
    driver: string;

    /** 数据库的密码 */
    password: string;

    /** 使用的URL连接 */
    url: string;

    /** 数据库的用户名 */
    userName: string;
  }
}
