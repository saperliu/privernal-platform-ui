/**
 * 字典类型
 */
declare namespace SystemDictionaryTypeNamespace {
  type SystemDictionaryTypeQuery = ApiCommon.RequestPage;

  interface SystemDictionaryTypePage extends ApiCommon.ResponsePage {
    list: SystemDictionaryTypeForm[];
  }

  /**
   * 字典类型
   */
  interface SystemDictionaryTypeForm extends ApiCommon.FormBase {
    /** 字典主键 */
    id: string;

    /** 字典名称 */
    dictName: string;

    /** 字典类型 */
    dictType: string;

    /** 状态（0正常 1停用） */
    status: number;

    /** 组织 */
    organizationId: string;

    /** 部门 */
    departmentId: string;
  }

  interface SystemDictionaryTypeTable extends SystemDictionaryTypeForm {
    /** 序号 */
    index: number;
  }
}
