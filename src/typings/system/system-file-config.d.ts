/**
 * 文件配置
 */
declare namespace SystemFileConfigNamespace {
  interface SystemFileConfigQuery extends ApiCommon.RequestPage {
    name?: string;
    type?: string;
  }

  interface SystemFileConfigPage extends ApiCommon.ResponsePage {
    list: SystemFileConfigForm[];
  }

  /**
   * 文件配置
   */
  interface SystemFileConfigForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 部门ID */
    departmentId: string;

    /** 所属组织 */
    organizationId: string;

    /** 标题 */
    title: string;

    /** 名称 */
    name: string;

    /** 类型: OSS，LOCAL,MINIO */
    type: string;

    /** 存储地址 */
    endpoint: string;

    /** 存储的ID */
    accessid: string;

    /** 存储的KEY */
    accesskey: string;

    /** 桶 */
    bucket: string;

    /** 存储的目录 */
    storePath: string;

    /** 网络访问的地址 */
    netPath: string;
  }
}
