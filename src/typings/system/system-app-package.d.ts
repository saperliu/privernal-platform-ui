/**
 * 应用包：应用级元数据的导出与导入
 */
declare namespace AppPackageNamespace {
  interface Package {
    /** 应用包结构版本 */
    specVersion?: string;

    exportedAt?: string;

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

  interface ImportResult {
    appCode?: string;

    /** 应用本身是新建还是复用 */
    appAction?: string;

    items: ImportItem[];
  }

  interface ImportItem {
    /** app / form / flow / flowForm */
    type: string;

    code: string;

    /** created / updated / skipped / failed */
    action: string;

    message?: string;
  }
}
