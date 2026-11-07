/**
 * 系统配置
 */
declare namespace SystemDefaultConfigNamespace {
  interface SystemDefaultConfigQuery extends ApiCommon.RequestPage {
    /** 配置的键名 */
    configKey?: string;
  }

  interface SystemDefaultConfigPage extends ApiCommon.ResponsePage {
    list: SystemDefaultConfigForm[];
  }

  /**
   * 系统配置
   */
  interface SystemDefaultConfigForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 组织ID;所属组织的配置 */
    organizationId: string;

    /** 配置的键名 */
    configKey: string;

    /** 配置的数据 */
    configValue: string;

    /** 配置的名称 */
    configName: string;
  }
}
