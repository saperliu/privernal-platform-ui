/**
 * 应用包：应用级元数据的导出与导入
 */
declare namespace AppPackageNamespace {
  interface Package {
    /** 应用包结构版本 */
    specVersion?: string;

    exportedAt?: string;

    /** specVersion 1.5 起：模板市场元数据（官方模板包必填，普通应用包为空） */
    template?: TemplateMeta;

    /** specVersion 1.5 起：包内引用的字典类型+数据项（导入按 dictType 幂等补缺） */
    dicts?: DictTypePackage[];

    /** specVersion 1.5 起：源环境角色菜单绑定（按 roleKey 匹配目标环境角色重挂） */
    roleBindings?: RoleBinding[];

    /** specVersion 1.5 起：包体校验和 sha256(canonical) */
    checksum?: string;

    signatureAlgorithm?: string;

    signedAt?: string;

    /** specVersion 1.5 起：HMAC-SHA256 包签名（密钥随环境主密钥走） */
    signature?: string;

    app: App;

    forms: Form[];

    flows: Flow[];

    /** specVersion 1.1 起：报表数据集（只存逻辑 tableCode，列快照在目标环境重解析） */
    datasets?: ReportDatasetNamespace.Dataset[];

    /** specVersion 1.1 起：图表配置 */
    reports?: ReportChartNamespace.Report[];

    /** specVersion 1.1 起：仪表盘与卡片布局 */
    dashboards?: ReportDashboardNamespace.Dashboard[];
  }

  interface App {
    /** 应用编码，跨环境的业务主键 */
    code: string;

    appName?: string;

    icon?: string;

    type?: string;

    pcPath?: string;

    appPath?: string;

    status?: number;

    sort?: number;
  }

  interface Form {
    /** 表单编码，即物理表名 */
    tableCode: string;

    tableName?: string;

    isWorkflow?: number;

    workflowCode?: string;

    /** 设计器 schema */
    metaData?: Record<string, any>;

    /** 列表设计配置 */
    columns?: Column[];
  }

  interface Column {
    filedCode?: string;

    filedName?: string;

    filedType?: string;

    length?: number;

    scale?: number;

    sort?: number;

    defaultValue?: string;

    showList?: number;

    showQuery?: number;
  }

  interface Flow {
    flowCode: string;

    flowName?: string;

    /** warm-flow 流程定义 JSON，导入端会忽略其中的 id/version */
    definition?: Record<string, any>;

    formVersions?: FormVersion[];
  }

  interface FormVersion {
    tableCode?: string;

    formName?: string;

    fields?: FieldPerm[];

    buttons?: BtnPerm[];
  }

  interface FieldPerm {
    /** global 为全局默认节点 */
    nodeCode?: string;

    fieldCode?: string;

    fieldName?: string;

    isShow?: number;

    isEdit?: number;

    isRequired?: number;

    defaultType?: string;

    defaultValue?: string;

    dictType?: string;

    sort?: number;
  }

  interface BtnPerm {
    nodeCode?: string;

    btnCode?: string;

    btnName?: string;

    aliasName?: string;

    isShow?: number;

    showDialog?: number;

    color?: string;

    sort?: number;
  }

  interface TemplateMeta {
    /** 模板编码（模板列表主键） */
    code: string;

    name?: string;

    /** 行业/场景分类 */
    category?: string;

    description?: string;

    /** 模板自身版本（独立于包结构 specVersion） */
    version?: string;

    /** official=官方内置，custom=客户沉淀 */
    author?: string;
  }

  interface DictTypePackage {
    dictType: string;

    dictName?: string;

    status?: number;

    dataList?: DictDataPackage[];
  }

  interface DictDataPackage {
    dictValue: string;

    dictLabel?: string;

    dictSort?: number;

    cssClass?: string;

    listClass?: string;

    isDefault?: string;

    status?: number;
  }

  interface RoleBinding {
    /** 角色编码（跨环境业务键） */
    roleKey: string;

    roleName?: string;

    /** 该角色在源环境被授权的应用菜单编码清单 */
    menuCodes?: string[];
  }

  interface ImportResult {
    appCode?: string;

    /** 应用本身是新建还是复用 */
    appAction?: string;

    /** 签名回执（1.5 起）：已验签/验签失败/未签名/无法验签（未配主密钥） */
    signatureStatus?: string;

    signatureDetail?: string;

    items: ImportItem[];
  }

  interface ImportItem {
    /** app / form / flow / flowForm / dataset / report / dashboard / datavScreen / datavAsset / schedule / docTemplate / dict / roleBinding */
    type: string;

    code: string;

    /** created / updated / skipped / failed */
    action: string;

    message?: string;
  }

  /** dry-run 预检报告（1.5 起）：解析包并比对目标环境后的「将发生什么」，全程只读 */
  interface DryRunResult {
    appCode?: string;

    appName?: string;

    specVersion?: string;

    /** verified / mismatch / notSigned / keyMissing */
    signatureStatus?: string;

    signatureDetail?: string;

    checksumMatch?: boolean;

    signatureKeyConfigured?: boolean;

    overwrite?: boolean;

    items: DryRunItem[];

    warnings: string[];
  }

  interface DryRunItem {
    type: string;

    code: string;

    name?: string;

    /** create / update / skip / reuse / conflict */
    predicted: string;

    message?: string;
  }

  /** 官方模板列表行（manifest 展示面，不解析包体） */
  interface TemplateSummary {
    code: string;

    name?: string;

    category?: string;

    description?: string;

    version?: string;

    author?: string;

    appCode?: string;

    appName?: string;

    formCount?: number;

    flowCount?: number;

    screenCount?: number;

    dictCount?: number;

    specVersion?: string;
  }
}
