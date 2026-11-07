/** 报表数据集 */
declare namespace ReportDatasetNamespace {
  /** 列快照列 */
  interface DatasetColumn {
    fieldCode: string;

    fieldName: string;

    /** number | date | text */
    dataType: 'number' | 'date' | 'text';
  }

  interface ReportFilter {
    field: string;

    /** eq/ne/like/gt/ge/lt/le */
    op: 'eq' | 'ne' | 'like' | 'gt' | 'ge' | 'lt' | 'le';

    value: string | number | null;
  }

  interface Dataset {
    id?: string;

    datasetCode: string;

    datasetName: string;

    /** 逻辑表编码（不带组织前缀）；HTTP 等外部源为空 */
    tableCode: string;

    /** 数据源类型：dynamic_table（默认）/ http / excel…（M3 多源） */
    sourceType?: string;

    /** 各源类型自己的配置，按 sourceType 解释 */
    sourceConfig?: Record<string, unknown> | null;

    appId?: string;

    columnSnapshot?: { columns: DatasetColumn[] } | null;

    defaultFilter?: { filters: ReportFilter[] } | null;
  }

  /**
   * 数据源健康检查返回（M3.9）。
   * category 是后端分类结果，前端按它给处置建议，而不是把异常文案原样贴出来——
   * 「检查主机与端口」和「重新填写凭据」对用户是两件完全不同的事。
   */
  interface DatasetHealth {
    ok: boolean;

    category: 'ok' | 'network' | 'auth' | 'parse' | 'limit' | 'config' | 'unknown';

    message: string;

    columns?: DatasetColumn[] | null;
  }

  /**
   * CSV 上传返回。fileId 是唯一要进 sourceConfig 的东西；columns 只是保存前的预览，
   * 落库的列快照仍由后端在保存时真实抽样产出。
   */
  interface CsvUploadResult {
    fileId: string;

    fileName: string;

    size: number;

    columns?: DatasetColumn[] | null;

    columnCount?: number;

    /** 抽样没成功时的原因：文件已经收下，但字段要等保存才能定；非空时界面上提示而不是当失败 */
    sampleMessage?: string | null;
  }
}

/** 报表图表 */
declare namespace ReportChartNamespace {
  interface Dimension {
    field: string;

    /** 时间维度粒度：与后端 ComputeSpecs.GRANULARITIES 同集合 */
    granularity?: 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | '';

    /** 关联表显示值翻译（M5 lookup 维度） */
    lookup?: { targetTableCode: string; displayField: string } | null;

    /** 数值分桶（M4.1）：把连续度量折成维度档 */
    bucket?: ValueBucket | null;
  }

  interface Measure {
    field?: string;

    /** 与后端 ComputeSpecs.AGG_FUNCS 同集合；COUNTD 是去重计数，允许文本列 */
    agg: 'SUM' | 'COUNT' | 'COUNTD' | 'AVG' | 'MAX' | 'MIN';
  }

  /** 图表类型：与后端 DynamicReportQueryService.ALLOWED_TYPES 同一份 */
  type ReportType = 'bar' | 'line' | 'pie' | 'stat' | 'gauge' | 'ranking' | 'table';

  interface ReportSort {
    /** 维度/度量字段名，或结果别名 value / m1… */
    field?: string;

    order?: 'ASC' | 'DESC';
  }

  interface ReportConfig {
    reportType?: ReportType;

    dimensions: Dimension[];

    measures: Measure[];

    filters: ReportDatasetNamespace.ReportFilter[];

    limit?: number;

    /** 排序，缺省按第一个度量倒序 */
    sort?: ReportSort | null;

    /** gauge 上限，留空按当前值自动取档 */
    gaugeMax?: number | null;

    /** 榜单显示条数 */
    rankingLimit?: number | null;

    /** 数值展示格式：只影响前端渲染，不参与 SQL 生成 */
    format?: ValueFormat | null;

    /**
     * AND/OR 嵌套过滤树（M4.7）。与旧的平铺 filters 是 AND 合并关系，
     * 所以历史配置不用迁移也能继续生效——后端 normalize 把 filters 当成 and 树。
     */
    filterTree?: FilterNode | null;

    /** 聚合后过滤（HAVING 语义），字段用聚合别名 value/m1/dim0 */
    having?: FilterNode | null;

    /** TopN 与「其他」归并（M4.4） */
    topN?: TopNConfig | null;
  }

  /** 过滤条件树节点：组有 op + when，叶子有 field + op + value */
  type FilterNode = FilterGroup | FilterLeaf;

  interface FilterGroup {
    op: 'and' | 'or';

    when: FilterNode[];
  }

  interface FilterLeaf {
    field: string;

    op: 'eq' | 'ne' | 'like' | 'gt' | 'ge' | 'lt' | 'le';

    value: unknown;
  }

  interface TopNConfig {
    /** 依据哪个别名排序，留空取第一个度量 */
    by?: string;

    /** 保留前 N 组；<=0 视为不启用 */
    n: number;

    order?: 'asc' | 'desc';

    /** 剩余组合并成的档位名；留空表示只截断不归并 */
    mergeRestAs?: string | null;
  }

  interface ValueBucketBin {
    label: string;

    /** 左闭右开区间：min <= v < max，缺一侧即表示不设边界 */
    min?: number | null;

    max?: number | null;
  }

  interface ValueBucket {
    bins: ValueBucketBin[];

    /** 非数值与区间外的值归入此档；留空则原样输出 */
    elseLabel?: string | null;
  }

  interface ValueFormat {
    /** 小数位（0-4）；留空则最多保留 2 位并去掉浮点噪声 */
    decimals?: number | null;

    /** 单位后缀，如 元 / % / 人 */
    unit?: string | null;

    /** 千分位分隔（NSwitch 只接 boolean，不留 null） */
    thousands?: boolean;

    /**
     * 百分比：把 0–1 的比例按 100 显示。
     * 只在后端给的是比例时用——数据本身已经是 23.5 再勾一次会变成 2350%。
     */
    percent?: boolean;

    /** 负数着色（颜色走 --datav-danger，不写字面色值） */
    negativeColor?: boolean;

    /** 空值显示文本，默认「—」 */
    emptyText?: string | null;
  }

  interface Report {
    id?: string;

    reportCode: string;

    reportName: string;

    reportType: ReportType;

    datasetCode: string;

    appId?: string;

    config?: ReportConfig;
  }

  /** 聚合结果行：dim0/dim1、value、m1…（含 dim0Code 等下钻辅助键） */
  /** growth/Compare 系列在对比段缺失时为 null，前端按「—」显示 */
  type AggRow = Record<string, string | number | null>;

  interface AggResult {
    /**
     * 后端降级标记：源站失败时回退到上一次成功快照，数据是旧的但画面不能空白。
     * 只有这一个字段能区分「刚取到的数」和「上次的数」，所以前端必须显示它——
     * 否则运维对着旧数字排查半天，症状和「取数返回空」一模一样。
     */
    stale?: boolean;

    reportType: string;

    limit: number;

    rows: AggRow[];

    /** 后端回传的别名清单，前端画多系列不必自己猜列名 */
    dimensionAliases?: string[];

    measureAliases?: string[];

    /** 后端按列快照回传的中文名，运行时页与导出表头用它，拿不到再回退字段编码 */
    dimensionLabels?: string[];

    measureLabels?: string[];

    /** 同比/环比对比模式（M3-1）：结果行带 {alias}Compare/{alias}Growth 附加列 */
    comparison?: 'yoy' | 'mom' | 'prev';
  }
}

/** 报表仪表盘 */
declare namespace ReportDashboardNamespace {
  interface DashboardItem {
    id?: string;

    dashboardCode?: string;

    reportCode: string;

    title?: string;

    /** 栅格跨度 1-12 */
    span?: number;

    orderNum?: number;
  }

  interface Dashboard {
    id?: string;

    dashboardCode: string;

    dashboardName: string;

    appId?: string;
  }

  interface DashboardDetail {
    dashboard: Dashboard;

    items: DashboardItem[];

    reports: ReportChartNamespace.Report[];
  }
}
