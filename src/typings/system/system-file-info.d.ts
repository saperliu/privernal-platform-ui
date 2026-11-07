/**
 * 文件信息
 */
declare namespace SystemFileInfoNamespace {
  interface SystemFileInfoQuery extends ApiCommon.RequestPage {
    originalName?: string;
    module?: string;
    sourceId?: string;
    sourceStage?: string;
    type?: string;
  }

  interface SystemFileInfoPage extends ApiCommon.ResponsePage {
    list: SystemFileInfoForm[];
  }

  /**
   * 文件信息
   */
  interface SystemFileInfoForm extends ApiCommon.FormBase {
    /** 主键 */
    id: string;

    /** 部门ID */
    departmentId: string;

    /** 所属组织 */
    organizationId: string;

    /** 模块 */
    module: string;

    /** 来源ID */
    sourceId: string;

    /** 来源内不同阶段的图片，如申请、审批、验收 */
    sourceStage: string;

    /** 类型: IMAGE,FILE */
    type: string;

    /** 图片存储地址 */
    imagePath: string;

    /** 图片访问地址 */
    imageUrl: string;

    /** 原名称 */
    originalName: string;

    /** 新名称 */
    newName: string;

    /** 文件大小(字节数) */
    fileSize: number;

    /** 文件存储类型: AliOSS,MINIO,LOCAL */
    fileStoreType: string;
  }

  interface SystemFileInfoTable extends SystemFileInfoForm {
    /** 序号 */
    index: number;
  }

  /**
   * 文件信息
   */
  interface SystemFileDTO {
    /** 主键 */
    id: string;

    /** 模块 */
    module: string;

    /** 来源ID */
    sourceId: string;

    /** 来源内不同阶段的图片，如申请、审批、验收 */
    sourceStage: string;

    /** 图片存储地址 */
    path: string;

    /** 图片访问地址 */
    url: string;

    /** 原名称 */
    originalName: string;

    /** 新名称 */
    name: string;

    /**
     * 如果是识别二维码，则是二维码的内容
     */
    qrCode: string;
  }
  interface SystemFileUploadDTO {
    /** 模块 */
    module: string;

    /** 来源ID */
    sourceId: string;

    /** 来源内不同阶段的图片，如申请、审批、验收 */
    sourceStage: string;

    /** 文件 */
    file: File[];

    /** 存储目录 */
    filePath?: string;

    /** 类型，IMAGE, FILE */
    type: string;
  }
}
