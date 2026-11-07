/** 高级设置（high-setting.md）相关类型 */

declare namespace AdvancedNamespace {
  /** 表单数据导入导出配置（dynamic_form_io_config） */
  interface IoConfig {
    id?: string;
    formId: string;
    exportEnabled?: 'Y' | 'N';
    importEnabled?: 'Y' | 'N';
    exportScope?: 'SELF' | 'DEPT' | 'ALL';
    exportColumns?: string | null;
    sensitivePolicy?: 'MASK' | 'HIDE';
    dupStrategy?: 'SKIP' | 'OVERWRITE' | 'REJECT';
    strictValidate?: 'Y' | 'N';
    importLimit?: number;
    importAsync?: 'Y' | 'N';
    runBackscript?: 'Y' | 'N';
    triggerMode?: 'SUPPRESS' | 'FIRE';
    importFlowMode?: 'NONE' | 'AUTO_START';
  }

  /** 外链配置（dynamic_form_share） */
  interface ShareForm {
    formId: string;
    shareType: 'FILL' | 'VIEW';
    scopeType?: 'ANON_PUBLIC' | 'LOGIN_ALL' | 'LOGIN_DEPT';
    scopeDeptIds?: string | null;
    password?: string | null;
    expireTime?: string | null;
    submitLimit?: number | null;
    perPersonLimit?: number;
    editableAfterSubmit?: 'Y' | 'N';
    proxyUserId?: string | null;
  }

  interface ShareItem {
    id: string;
    formId: string;
    shareType: 'FILL' | 'VIEW';
    scopeType: string;
    tokenTail: string | null;
    expireTime: string | null;
    submitLimit: number | null;
    perPersonLimit: number;
    editableAfterSubmit: 'Y' | 'N';
    enabled: 'Y' | 'N';
    submitCount: number;
    createdTime?: string;
  }

  interface ShareCreateResult {
    id: string;
    token: string;
    tokenTail: string;
  }

  /** 取链回显结果（D2-①）：url = dynamic.share.public-origin + 免登页路由 */
  interface ShareLink {
    url: string;
    tokenTail: string | null;
    shareType: 'FILL' | 'VIEW';
    expireTime: string | null;
    enabled: 'Y' | 'N';
  }

  /** 单据打印模板（dynamic_doc_template，plan-sheet-print §3.2） */
  interface DocTemplate {
    id?: string;
    templateCode?: string;
    name: string;
    appId?: string | null;
    formId: string;
    sourceType?: 'FORM' | 'DATASET';
    sourceCode?: string | null;
    /** DOC=AiEditor 文档模板；SHEET=Luckysheet 表格模板（第二种打印方式） */
    templateType?: 'DOC' | 'SHEET';
    status?: '0' | '1';
    /** DOC 版式真相（HTML）；SHEET 模板该字段为空。局部更新（如仅设默认）不传，后端回退存量值 */
    contentHtml?: string | null;
    /** SHEET 版式真相：Luckysheet 单 sheet 导出 JSON（celldata + config） */
    contentSheet?: string | null;
    bindingJson?: string | null;
    paramsJson?: string | null;
    printConfig?: string | null;
    isDefault?: 'Y' | 'N';
    sort?: number;
    organizationId?: string;
    departmentId?: string;
  }

  /** binding_json 结构（§3.4） */
  interface DocTemplateBinding {
    placeholders: Array<{ code: string; kind: 'main' | 'detail' }>;
    details: Array<{
      /** 子表字段编码（稳定 key，主定位） */
      detailKey: string;
      /** 兜底定位：文档里第几个 <table> */
      tableIndex?: number;
      /** 兜底定位：模板行行号 */
      templateRow?: number;
      repeatHeader?: boolean;
      summaryRow?: { enabled: boolean; cells: Array<{ col: number; op: 'sum' | 'avg' | 'count' }> };
    }>;
  }

  /** print_config 结构（§3.5） */
  interface DocPrintConfig {
    paper: 'A4' | 'A5' | 'Letter';
    orientation: 'PORTRAIT' | 'LANDSCAPE';
    margins: { top: number; bottom: number; left: number; right: number };
    scale?: number;
  }

  /**
   * params_json 参数定义项（§3.3 参数定义 / §8-③ 运行态临时参数）：设计态在编辑器侧栏维护，
   * 运行态据此在打印弹窗里出参数栏；default 同时是未显式传参时服务端的回落过滤值。
   * op 与列名都会在服务端过白名单（FILTER_OPS / dynamic_form_column），前端只给可选值。
   */
  interface DocTemplateParam {
    field: string;
    op: 'eq' | 'ne' | 'like' | 'gt' | 'ge' | 'lt' | 'le';
    label: string;
    default: string;
  }

  /** /back/print/data 返回（plan-sheet-print §3.3） */
  interface PrintDataResult {
    /** 出站动作摘要（§3.6 留痕）：放响应体首位，服务端操作日志截断后仍能留下份数与行数 */
    summary?: {
      templateCode: string;
      requested: number;
      printed: number;
      detailRows: number;
      warnings: number;
    };
    docs: Array<{
      id: string;
      main: Record<string, any>;
      details: Record<string, Array<Record<string, any>>>;
    }>;
    warnings: string[];
    templateName: string;
  }

  /** 联动规则（dynamic_linkage_rule） */
  interface ConditionRow {
    field: string;
    cmp: string;
    value: string;
  }

  /** 条件组（两层组合：组内 AND/OR + 组间 AND/OR，保存时映射为嵌套条件树） */
  interface ConditionGroup {
    logic: 'AND' | 'OR';
    rows: ConditionRow[];
  }

  interface ConditionModel {
    groupLogic: 'AND' | 'OR';
    groups: ConditionGroup[];
  }

  interface LinkageAction {
    type: 'DATA_UPDATE' | 'DATA_CREATE' | 'DATA_DELETE' | 'MSG_INNER';
    config: Record<string, any>;
    stopOnFail?: boolean;
  }

  interface LinkageRule {
    id?: string;
    formId: string;
    ruleCode: string;
    name: string;
    enabled?: 'Y' | 'N';
    eventType: 'CREATE' | 'UPDATE' | 'DELETE' | 'EFFECTIVE' | 'TIMER' | 'DATE_FIELD';
    eventConfig?: string | null;
    conditionTree?: string | null;
    actions: string;
    asyncMode?: 'ASYNC' | 'SYNC';
    failPolicy?: 'CONTINUE' | 'ABORT';
    maxDepth?: number;
    targetMode?: 'PER_ROW' | 'WHOLE_TABLE';
    recentStatus?: string;
  }

  interface DryRunResult {
    conditionPass: boolean;
    conditionTrace: string;
    actions: Array<{ type: string; preview?: Record<string, any>; error?: string }>;
  }

  interface LogFilter {
    ruleId?: string;
    formId?: string;
    eventType?: string;
    status?: string;
    pageNum: number;
    pageSize: number;
  }

  interface LogPage {
    total: number;
    rows: Array<Record<string, any>>;
  }

  /** 免登外链页 */
  interface PublicFormField {
    field: string;
    label: string;
    type: string;
    required?: boolean;
    options?: Array<{ label: string; value: any }>;
  }

  interface PublicFormMeta {
    formName: string;
    fields: PublicFormField[];
    passwordRequired: boolean;
    captchaRequired: boolean;
    editableAfterSubmit: boolean;
    expireTime?: string;
  }

  interface PublicSubmitResult {
    dataId: string;
    receiptCode?: string;
  }
}
