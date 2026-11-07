/**
 * 字典数据
 */
declare namespace SystemDictionaryDataNamespace {
  interface SystemDictionaryDataQuery extends ApiCommon.RequestPage {
    dictLabel?: string;
    dictValue?: string;
    dictType?: string;
  }

  interface SystemDictionaryDataPage extends ApiCommon.ResponsePage {
    list: SystemDictionaryDataForm[];
  }

  /**
   * 字典数据
   */
  interface SystemDictionaryDataForm extends ApiCommon.FormBase {
    /** 字典id */
    id: string;

    /** 字典排序 */
    dictSort: number;

    /** 字典标签 */
    dictLabel: string;

    /** 字典键值 */
    dictValue: string;

    /** 字典类型 */
    dictType: string;

    /** 样式属性（其他样式扩展） */
    cssClass: string;

    /** 表格回显样式 */
    listClass: string;

    /** 是否默认（Y是 N否） */
    isDefault: string;

    /** 状态（0正常 1停用） */
    status: number;

    /** 组织 */
    organizationId: string;

    /** 部门 */
    departmentId: string;
  }

  interface SystemDictionaryDataTable extends SystemDictionaryDataForm {
    /** 序号 */
    index: number;
  }

  /**
   * 字典数据
   */
  interface SystemDictionaryDataJson {
    /** 字典id */
    id: string;

    /** 字典标签 */
    dictLabel: string;

    /** 字典键值 */
    dictValue: string;

    /** 字典类型 */
    dictType: string;
  }
}
