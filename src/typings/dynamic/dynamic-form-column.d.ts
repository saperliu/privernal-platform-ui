/** form的列的数据 */
declare namespace DynamicFormColumnNamespace {
  interface DynamicFormColumnQuery extends ApiCommon.RequestPage {
    departmentId?: string;

    organizationId?: string;

    title?: string;

    status?: number;

    formId?: string;

    filedCode?: string;

    filedName?: string;

    filedType?: string;

    length?: number;

    scale?: number;

    sort?: number;

    defaultValue?: string;

    /** 查询条件的默认值；列表查询面板自动预填该值 */
    queryDefaultValue?: string;

    /** 列表默认排序方向；ASC/DESC，空为不参与默认排序 */
    orderDir?: string;

    showList?: number;

    showQuery?: number;
    /** 敏感字段标记 Y/N（high-setting §4.4） */
    sensitive?: string;
    /** 业务唯一键标记 Y/N（props.unique 物化只读镜像） */
    uniqueFlag?: string;
  }

  interface DynamicFormColumnPage extends ApiCommon.ResponsePage {
    list: DynamicFormColumnForm[];
  }
  /** form的列的数据 */
  interface DynamicFormColumnForm extends ApiCommon.FormBase {
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

    /** 表单ID */
    formId: string;

    /** 字段编码,数据库表的列表 */
    filedCode: string;

    /** 字段名称 */
    filedName: string;

    /** 字段类型 */
    filedType: string;

    /** 长度 */
    length: number;

    /** 小数点位数 */
    scale: number;

    /** 排序 */
    sort: number;

    /** 默认值 */
    defaultValue: string;

    /** 查询条件的默认值；列表查询面板自动预填该值 */
    queryDefaultValue: string;

    /** 列表默认排序方向；ASC/DESC，空为不参与默认排序 */
    orderDir: string;
    /** 列表是否显示 */
    showList: number;

    /** 查询是否显示 */
    showQuery: number;
    /** 敏感字段标记 Y/N（high-setting §4.4） */
    sensitive?: string;
    /** 业务唯一键标记 Y/N（props.unique 物化只读镜像） */
    uniqueFlag?: string;
  }

  /** form的列的数据 详情 */
  interface DynamicFormColumnDetail extends ApiCommon.FormBase {
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

    /** 表单ID */
    formId: string;

    /** 字段编码,数据库表的列表 */
    filedCode: string;

    /** 字段名称 */
    filedName: string;

    /** 字段类型 */
    filedType: string;

    /** 长度 */
    length: number;

    /** 小数点位数 */
    scale: number;

    /** 排序 */
    sort: number;

    /** 默认值 */
    defaultValue: string;

    /** 查询条件的默认值；列表查询面板自动预填该值 */
    queryDefaultValue: string;

    /** 列表默认排序方向；ASC/DESC，空为不参与默认排序 */
    orderDir: string;
    /** 列表是否显示 */
    showList: number;

    /** 查询是否显示 */
    showQuery: number;
    /** 敏感字段标记 Y/N（high-setting §4.4） */
    sensitive?: string;
    /** 业务唯一键标记 Y/N（props.unique 物化只读镜像） */
    uniqueFlag?: string;
  }
}
