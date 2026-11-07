/**
 * 数据可视化大屏（datav）
 *
 * 画布与组件的全部配置都以 `ScreenSchema` 形态存进 `dynamic_datav_screen.schema_json`，
 * 因此这里的类型就是「持久化格式」，不是视图模型：字段一旦发布就必须考虑老数据，
 * 新增字段一律可选并带默认值，破坏性调整走 `migrateSchema`。
 */
declare namespace DatavNamespace {
  /** 画布在真实屏幕上的适配策略：等比缩放 / 只锁宽 / 只锁高 / 不缩放 */
  type CanvasFit = 'scale' | 'width' | 'height' | 'none';

  /** absolute 为自由布局（默认），grid 为栅格吸附辅助 */
  type LayoutMode = 'absolute' | 'grid';

  type ThemeScheme = 'dark' | 'light';

  /** 内置配色板，取值见 src/styles/css/datav-theme.css；custom 表示使用下方 customPalette */
  type PaletteKey = 'tech-blue' | 'aurora-purple' | 'graphite-gold' | 'emerald' | 'neon-cyan' | 'custom';

  /** 色值一律写 token 名（如 `datav-accent`）而不是十六进制，见 §4 视觉约定 */
  type ColorToken = string;

  interface Background {
    type: 'color' | 'image';

    /** color 时为 token 或 CSS 色值；image 时为素材 URL */
    value: string;

    size?: 'cover' | 'contain' | 'stretch';
  }

  interface GridConfig {
    show: boolean;

    /** 吸附粒度，设计稿像素 */
    size: number;

    snap: boolean;

    /** 拖拽时的智能对齐参考线 */
    alignGuide: boolean;
  }

  /** 用户从标尺拖出来的辅助线，axis 为 'x' 时是一条位于 at 的竖线（设计稿坐标） */
  interface UserGuide {
    axis: 'x' | 'y';

    at: number;
  }

  interface Canvas {
    width: number;

    height: number;

    fit: CanvasFit;

    background: Background;

    grid: GridConfig;

    theme: ThemeScheme;

    palette: PaletteKey;

    /**
     * 自定义系列色（palette === 'custom' 时生效）：#rrggbb 数组，最多 8 个。
     * 未填的槽位回落 datav-theme.css 的默认系列色。这是用户配置数据，
     * 不受「组件不许硬编码色值」的 lint 约束（那条只管源码）。
     */
    customPalette?: string[];

    /** 人工辅助线：随 schema 落库，换人打开还在 */
    guides?: UserGuide[];
  }

  /** 自由布局坐标：设计稿像素，与 canvas.width/height 同一坐标系 */
  interface Layout {
    x: number;

    y: number;

    w: number;

    h: number;

    /** 角度，顺时针 */
    rotate: number;

    z: number;

    locked: boolean;

    hidden: boolean;
  }

  type WidgetStyle = Record<string, unknown>;

  interface DataRefresh {
    /** none 不刷新；realtime 走 WS/Socket.IO 推送 */
    strategy: 'none' | 'interval' | 'manual' | 'realtime';

    intervalSec?: number;

    /** 取数失败时：保留上次数据（默认）/ 清空 / 显示告警 */
    onError?: 'keepLast' | 'clear' | 'alert';
  }

  /**
   * 大屏参数 → 数据集字段的绑定。
   *
   * 后端把它翻译成报表内核的 runtimeFilters（`{field,op,value}`），所以这里必须直接写
   * 数据集字段编码而不是「reportConfig 的路径」——路径求值会绕开内核的列快照校验。
   */
  interface ParamBinding {
    /** 对应 ScreenParam.code */
    param: string;

    /** 落到数据集的字段编码，仍由后端按列快照二次校验 */
    field: string;

    /** 比较符，缺省 eq；与后端 DynamicReportQueryService.FILTER_OPS 同一份 */
    op?: 'eq' | 'ne' | 'like' | 'gt' | 'ge' | 'lt' | 'le';

    /**
     * 参数没传值时是否报错。缺省 true：设计者既然把它配成条件（通常是组织/租户范围），
     * 缺值就放宽过滤等于把别人的数据聚合出来。确实可选的条件才写 false。
     */
    required?: boolean;
  }

  /** 行级过滤条件（AND 组合）：投影前对取数结果/静态行统一应用 */
  interface DataFilter {
    field: string;

    op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'notContains' | 'empty' | 'notEmpty';

    /** eq~lte 数值优先、字符串兜底；contains/notContains 纯字符串；empty/notEmpty 忽略该值 */
    value: string;
  }

  interface DataSorter {
    field: string;

    order: 'asc' | 'desc';
  }

  /**
   * 数据加工管线（参考 go-view 的数据过滤能力，做成结构化配置以保证可序列化进 schema）。
   * 顺序：过滤 → 排序 → Top N，全部在前端内存中执行，静态数据与数据集结果同等生效。
   */
  interface DataPipeline {
    filters?: DataFilter[];

    sorters?: DataSorter[];

    /** 只保留前 N 行；0 或缺省表示不限制 */
    limit?: number;
  }

  interface WidgetData {
    mode: 'dataset' | 'static';

    datasetCode?: string;

    /** 复用现有报表查询契约，后端不为此新增结构 */
    reportConfig?: ReportChartNamespace.ReportConfig;

    /**
     * AggResult 别名 → 组件字段 的映射，如 `{ x: 'dim0', series: 'value' }`。
     * 组件只认这里的键，不直接读字段编码，这样换数据集不必改组件。
     */
    mapping?: Record<string, string>;

    staticRows?: Record<string, string | number>[];

    /** 行级过滤/排序/Top N，投影前统一应用 */
    pipeline?: DataPipeline;

    refresh?: DataRefresh;

    paramBindings?: ParamBinding[];

    /**
     * 下钻链（数据集字段编码，第 0 项应与组件配置的顶层维度一致，只用于面包屑标签）。
     *
     * 运行态请求只带**层级**、不带字段名，后端只认这份 schema 里声明过的链：
     * 一旦允许请求指定维度，`datav:screen:query` 就成了「对着别人的表任意聚合」的旁路。
     */
    drillFields?: string[];
  }

  /**
   * 组件交互（M6.2 联动）。一条只干一件事，所以是数组：
   * 「点击 → 传播两个参数 + 自己下钻一层」就是三条。
   */
  interface WidgetInteraction {
    /** 目前只有点击；interval 留给 M6.4 的自动轮播 */
    trigger: 'click';

    action: 'set_param' | 'drill' | 'open_screen';

    /**
     * set_param：写进哪个全局参数（ScreenParam.code）。
     * 目标组件靠自己的 paramBindings 命中这个参数才会被刷新——
     * 联动走参数通道而不是「前端直接改别人的查询条件」，取数契约才不用开口子。
     */
    param?: string;

    /** 点击时取哪个维度别名的值，缺省 dim0 */
    field?: string;

    /** set_param 时为 '*'（默认，传播给所有绑定该参数的组件）或指定组件 id；open_screen 时是目标大屏 code */
    target?: string;
  }

  interface Widget {
    id: string;

    name: string;

    /** 组件注册表的键，见 src/packages/components 与 components/datav/registry */
    type: string;

    layout: Layout;

    /** 所属分组 id，未成组为 null */
    group?: string | null;

    /** 所属页 id；缺省归到第一页（老数据与手工 JSON 都不该因为少一个键就消失） */
    pageId?: string;

    style: WidgetStyle;

    data: WidgetData;

    interactions?: WidgetInteraction[];
  }

  interface WidgetGroup {
    id: string;

    name?: string;

    widgetIds: string[];
  }

  interface ScreenParam {
    code: string;

    name: string;

    type: 'select' | 'date' | 'daterange' | 'text';

    defaultValue?: string | number | null;

    /** 下拉选项来源：静态串或数据集编码 */
    dataSource?: string;
  }

  /**
   * 大屏的一页（M6.3 轮播）。
   *
   * 组件不嵌在页里，而是平铺在 `schema.widgets` 上、各自带 `pageId`：
   * 嵌套会让历史分片、图层面板、批量取数、复制粘贴全部要改一遍选择逻辑，
   * 而平铺只需要在渲染与取数处多一个 filter。老屏没有 pages 时迁移成「第 1 页」，
   * 不改库、不要求设计者动手。
   */
  interface ScreenPage {
    id: string;

    name: string;

    /** 轮播到这一页时停留多少秒；不填用 `rotation.intervalSec` */
    intervalSec?: number;
  }

  /** 整屏轮播设置；关闭时 pages 只是分组，投放页不自动切 */
  interface ScreenRotation {
    enabled: boolean;

    /** 建议生产值 ≥ 单屏最慢组件的取数耗时 + 观众读数时间，低于 5 秒观众读不完一屏 */
    intervalSec: number;
  }

  interface ScreenSchema {
    schemaVersion: number;

    canvas: Canvas;

    params: ScreenParam[];

    widgets: Widget[];

    groups: WidgetGroup[];

    /** 缺省视为只有一页（老屏）；由 migrateSchema 补齐，渲染层不必再判空 */
    pages?: ScreenPage[];

    rotation?: ScreenRotation;
  }

  /** 0 草稿 1 已发布 2 已下线，与后端 status 对齐 */
  type ScreenStatus = 0 | 1 | 2;

  interface Screen {
    id?: string;

    screenCode: string;

    screenName: string;

    appId?: string;

    departmentId?: string;

    organizationId?: string;

    layoutMode: LayoutMode;

    schemaJson: ScreenSchema;

    status: ScreenStatus;

    thumbnail?: string | null;

    createTime?: string;

    updateTime?: string;
  }

  /** 列表项不带 schema，避免一次性把所有大屏的画布 JSON 拖进列表 */
  interface ScreenSummary {
    screenCode: string;

    screenName: string;

    appId?: string;

    layoutMode: LayoutMode;

    status: ScreenStatus;

    thumbnail?: string | null;

    widgetCount?: number;

    updateTime?: string;
  }

  interface ScreenVersion {
    versionNo: number;

    remark?: string;

    createTime?: string;

    createBy?: string;

    /** 只有单版本内容端点返回；版本列表刻意不带（一次全量 JSON 没有意义） */
    schemaJson?: string;
  }

  /** 大屏外链分享：链接 = /pub/datav?sc={shareCode}&sign={sign}（sign 只在创建时下发一次） */
  interface DatavShare {
    id: string;

    shareCode: string;

    screenCode: string;

    expireTime?: string | null;

    refererWhitelist?: string | null;

    enabled: 'Y' | 'N';

    createBy?: string;

    createTime?: string;
  }

  /** 大屏素材：文件字节在平台文件服务（本地/OSS/MinIO），这里只是元数据 */
  interface DatavAsset {
    id: string;

    assetCode: string;

    assetName: string;

    /** 业务分类（背景/边框/视频等自由文本），缺省「通用」 */
    category: string;

    assetType: 'image' | 'video';

    /** 文件服务返回的可访问 URL；大屏 schema 里引用的就是它 */
    fileUrl: string;

    originalName?: string;

    fileSize?: number;

    updatedTime?: string;
  }

  /** 保存请求：只提交必要字段，后端按 screenCode 判新增或更新 */
  interface ScreenSaveRequest {
    screenCode?: string;

    screenName: string;

    appId?: string;

    layoutMode: LayoutMode;

    schemaJson: ScreenSchema;

    thumbnail?: string | null;
  }

  /**
   * 单个组件的运行态取数结果 = 报表聚合结果 + 取数状态。
   *
   * 直接交叉继承 `AggResult` 而不是把别名字段再抄一遍：两处各写一份必然漂移，
   * 后端加了 label 清单时前端这里就自动跟着走。
   * `status` 与 `rows` 分开是因为整屏批量接口逐组件返回，一个组件失败不能把整屏拖成空白。
   */
  type WidgetResult = {
    status: 'idle' | 'loading' | 'ok' | 'error';

    /** 最近一次成功取数的时间戳，用于「数据截至」提示与刷新去重 */
    fetchedAt?: number;

    error?: string;
  } & Omit<ReportChartNamespace.AggResult, 'reportType' | 'limit'>;

  /** /back/datav/data/batch 返回体 */
  interface BatchResult {
    screenCode: string;

    total: number;

    queried: number;

    /** widgetId → {success, data?|error?}：后端逐组件兜错，所以这里允许混合成功与失败 */
    items: Record<string, { success: boolean; data?: ReportChartNamespace.AggResult; error?: string }>;
  }
}
