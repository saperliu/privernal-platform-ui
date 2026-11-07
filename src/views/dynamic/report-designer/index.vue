<script setup lang="tsx">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { VueDraggable as __forwarded_VueDraggable } from 'vue-draggable-plus';
import {
  checkDatasetHealth,
  delReportChart,
  delReportDashboard,
  delReportDataset,
  findDynamicFormList,
  findReportChartList,
  findReportDashboardDetail,
  findReportDashboardList,
  findReportDatasetList,
  findSystemAppListByOrg,
  previewReportData,
  refreshReportDataset,
  saveReportChart,
  saveReportDashboard,
  saveReportDataset,
  uploadDatasetCsv
} from '@/service';
import { useAuth, useLoading } from '@/hooks';
import ChartCard from '@/components/business/chart-card.vue';
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const VueDraggable = __forwarded_VueDraggable;

defineOptions({ name: 'ReportDesign' });
const { startLoading, endLoading } = useLoading(false);
const { hasAuth } = useAuth();

const REPORT_TYPE_OPTIONS: Array<{ label: string; value: ReportChartNamespace.ReportType }> = [
  { label: '柱状图', value: 'bar' },
  { label: '折线图', value: 'line' },
  { label: '饼图', value: 'pie' },
  { label: '数字卡', value: 'stat' },
  { label: '仪表盘', value: 'gauge' },
  { label: '排行榜', value: 'ranking' },
  { label: '汇总表', value: 'table' }
];

/** 单值类型不需要维度（数字卡 / 仪表盘） */
const SINGLE_VALUE_TYPES: ReportChartNamespace.ReportType[] = ['stat', 'gauge'];

const FILTER_OPS = ['eq', 'ne', 'like', 'gt', 'ge', 'lt', 'le'];
const AGGS = ['SUM', 'COUNT', 'COUNTD', 'AVG', 'MAX', 'MIN'];

// ==================== 应用与仪表盘列表 ====================

const appOptions = ref<Array<{ label: string; value: string }>>([]);
const currentAppId = ref('');

const dashboardList = ref<ReportDashboardNamespace.Dashboard[]>([]);

async function loadAppOptions() {
  const res = await findSystemAppListByOrg();
  if (res.error === null && res.data) {
    appOptions.value = res.data.map((item: any) => ({ label: item.appName, value: item.id }));
    if (appOptions.value.length > 0 && !currentAppId.value) {
      currentAppId.value = appOptions.value[0].value;
      await loadDashboardList();
    }
  }
}

async function loadDashboardList() {
  if (!currentAppId.value) return;
  const res = await findReportDashboardList(currentAppId.value);
  dashboardList.value = res.error === null && res.data ? res.data : [];
}

function emptyDashboard(): ReportDashboardNamespace.Dashboard {
  return { dashboardCode: '', dashboardName: '', appId: currentAppId.value };
}

const currentDashboard = ref<ReportDashboardNamespace.Dashboard>(emptyDashboard());
/** 画布卡片：item(布局) + chart(图表配置，可尚未入库) */
interface CanvasCard {
  item: ReportDashboardNamespace.DashboardItem;

  chart: ReportChartNamespace.Report;
}

const cards = ref<CanvasCard[]>([]);
const currentCodeEditable = ref(true);

/** 切换应用：画布与仪表盘选择都作废，重新拉本应用的仪表盘和数据集 */
function handleAppChange() {
  currentDashboard.value = emptyDashboard();
  cards.value = [];
  loadDashboardList();
  loadDatasets();
}

async function openDashboard(dashboard: ReportDashboardNamespace.Dashboard) {
  startLoading();
  try {
    currentAppId.value = dashboard.appId || currentAppId.value;
    const res = await findReportDashboardDetail(dashboard.dashboardCode);
    if (res.error !== null || !res.data) {
      window.$message?.error(res.error?.message || '仪表盘加载失败');
      return;
    }
    currentDashboard.value = { ...res.data.dashboard };
    currentCodeEditable.value = false;
    cards.value = res.data.items.map(item => {
      const chart = res.data.reports.find(report => report.reportCode === item.reportCode);
      return {
        item: { ...item },
        chart: chart ?? {
          reportCode: item.reportCode,
          reportName: item.title ?? '',
          reportType: 'bar' as ReportChartNamespace.ReportType,
          datasetCode: '',
          config: { dimensions: [], measures: [], filters: [] }
        }
      };
    });
  } finally {
    endLoading();
  }
}

function handleNewDashboard() {
  currentDashboard.value = emptyDashboard();
  currentCodeEditable.value = true;
  cards.value = [];
}

function handleDeleteDashboard(dashboard: ReportDashboardNamespace.Dashboard) {
  window.$dialog?.warning({
    title: '删除确认',
    content: `确定删除仪表盘「${dashboard.dashboardName}」吗？其菜单与卡片将一并删除。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      const res = await delReportDashboard(dashboard.dashboardCode);
      if (res.error === null) {
        window.$message?.success('删除成功');
        if (currentDashboard.value.dashboardCode === dashboard.dashboardCode) {
          handleNewDashboard();
        }
        await loadDashboardList();
      } else {
        window.$message?.error(res.error?.message || '删除失败');
      }
    }
  });
}

async function handleSaveDashboard() {
  if (!currentDashboard.value.dashboardName) {
    window.$message?.error('请填写仪表盘名称');
    return;
  }
  if (cards.value.length === 0) {
    window.$message?.error('请至少添加一个图表卡片');
    return;
  }
  currentDashboard.value.appId = currentAppId.value;
  const items = cards.value.map((card, index) => ({
    ...card.item,
    dashboardCode: currentDashboard.value.dashboardCode,
    orderNum: index
  }));
  const res = await saveReportDashboard(currentDashboard.value, items);
  if (res.error === null) {
    const created = !currentDashboard.value.dashboardCode;
    currentDashboard.value = {
      ...currentDashboard.value,
      dashboardCode: res.data?.dashboardCode ?? currentDashboard.value.dashboardCode
    };
    currentCodeEditable.value = false;
    window.$message?.success(created ? '保存成功，已自动生成仪表盘菜单与权限' : '保存成功');
    await loadDashboardList();
  } else {
    window.$message?.error(res.error?.message || '保存失败');
  }
}

// ==================== 数据集 ====================

const datasets = ref<ReportDatasetNamespace.Dataset[]>([]);
/** 默认过滤行：输入框只能给字符串，保存时再落成 ReportFilter */
interface DatasetFilterRow {
  field: string;

  op: string;

  value: string;
}

const datasetModalVisible = ref(false);
const datasetEditing = ref(false);
const datasetForm = reactive<ReportDatasetNamespace.Dataset>({ datasetCode: '', datasetName: '', tableCode: '' });
const datasetFilterRows = ref<DatasetFilterRow[]>([]);
const formOptions = ref<Array<{ label: string; value: string }>>([]);

/**
 * 计算字段（M4.8）。提交时只带这些派生列：后端保存时会重新抽样/解析出物理列，
 * 再把这里提交的派生列并回去（DerivedColumnSpec.mergeInto），所以前端不需要回传整份快照。
 */
interface DerivedRow {
  fieldCode: string;
  fieldName: string;
  /** 用列快照的同一类型，否则提交时 dataType 的字符串会撞上字面量联合 */
  dataType: ReportDatasetNamespace.DatasetColumn['dataType'];
  expression: string;
}

/** 派生列与连通性结果：打开数据集弹窗（新建/编辑）都要重置，所以声明在两个 open* 之前 */
const derivedRows = ref<DerivedRow[]>([]);
const healthResult = ref<ReportDatasetNamespace.DatasetHealth | null>(null);

/** HTTP 源配置（编辑态从 sourceConfig 还原） */
const httpConfig = reactive({ url: '', method: 'GET', body: '', resultPath: '', timeoutMs: 8000 });

/**
 * CSV 源配置。取数闸门与 HTTP 源共用同一份实现，所以这里只有「怎么解释文件」的选项；
 * storage 是形态开关（url / upload），两个形态互斥、各留各的键。
 */
const csvConfig = reactive({
  storage: 'url' as 'url' | 'upload',
  url: '',
  method: 'GET',
  delimiter: '',
  headerRow: true,
  charset: '',
  timeoutMs: 8000,
  fileId: '',
  fileName: '',
  fileSize: 0
});

/** 与服务端同源的上限；前端先拦一次是为了让人当场知道，真正的闸门仍在服务端 */
const CSV_MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const csvUploading = ref(false);
const csvSampleHint = ref('');

/** 新建时传空对象，编辑时传已存的 sourceConfig —— 缺省值只有「有没有表头」需要保持 true */
function loadCsvConfig(saved: Record<string, any>) {
  csvConfig.storage = String(saved.storage ?? 'url') === 'upload' ? 'upload' : 'url';
  csvConfig.url = String(saved.url ?? '');
  csvConfig.method = String(saved.method ?? 'GET');
  csvConfig.delimiter = String(saved.delimiter ?? '');
  csvConfig.headerRow = saved.headerRow === undefined ? true : Boolean(saved.headerRow);
  csvConfig.charset = String(saved.charset ?? '');
  csvConfig.timeoutMs = Number(saved.timeoutMs) || 8000;
  csvConfig.fileId = String(saved.fileId ?? '');
  csvConfig.fileName = String(saved.fileName ?? '');
  csvConfig.fileSize = Number(saved.fileSize) || 0;
  // 抽样提示只属于这一次上传，重新打开弹窗不该留下上一次的字段数
  csvSampleHint.value = '';
}

/**
 * 选完文件即上传：拿到 fileId 才能顺带把列抽出来，设计器在保存数据集之前就能看见字段。
 * 分隔符/编码/表头随表单一起交给服务端抽样，否则界面上选的分隔符要等保存才第一次真正生效。
 */
async function handleCsvFileChange(file: any) {
  const raw: File | undefined = file?.raw ?? undefined;
  if (!raw) return;
  if (raw.size > CSV_MAX_UPLOAD_BYTES) {
    window.$message?.error(`文件超过 ${CSV_MAX_UPLOAD_BYTES / 1024 / 1024}MB 上限`);
    return;
  }
  csvUploading.value = true;
  const { data, error } = await uploadDatasetCsv(raw, {
    datasetCode: datasetEditing.value ? datasetForm.datasetCode : undefined,
    delimiter: csvConfig.delimiter.trim() === '' ? undefined : csvConfig.delimiter.trim(),
    charset: csvConfig.charset.trim() === '' ? undefined : csvConfig.charset.trim(),
    headerRow: csvConfig.headerRow
  });
  csvUploading.value = false;
  if (error || !data?.fileId) {
    csvConfig.fileId = '';
    csvSampleHint.value = '';
    window.$message?.error(error?.message || '上传失败');
    return;
  }
  csvConfig.fileId = data.fileId;
  csvConfig.fileName = data.fileName;
  csvConfig.fileSize = Number(data.size) || 0;
  // 抽样失败不算上传失败：文件已收下，保存数据集时后端还会真抽一次并把错暴露在那里
  csvSampleHint.value = data.sampleMessage
    ? `已收下文件，字段抽样未完成：${data.sampleMessage}`
    : `已识别 ${data.columnCount ?? 0} 个字段`;
  window.$message?.success('文件已上传');
}

/**
 * 外部数据库源配置。密码编辑态拿到的是后端下发的 ******** 掩码：原样提交回去即可，
 * 服务端会识别掩码并沿用库里已有密文，所以这里既不能清空也不要提示用户"必须重填"。
 */
const dbConfig = reactive({
  host: '',
  port: 3306,
  database: '',
  table: '',
  userName: '',
  password: '',
  columns: '',
  useSsl: false,
  timeoutMs: 8000
});

function resetDbConfig() {
  dbConfig.host = '';
  dbConfig.port = 3306;
  dbConfig.database = '';
  dbConfig.table = '';
  dbConfig.userName = '';
  dbConfig.password = '';
  dbConfig.columns = '';
  dbConfig.useSsl = false;
  dbConfig.timeoutMs = 8000;
}

async function loadDatasets() {
  if (!currentAppId.value) return;
  const res = await findReportDatasetList(currentAppId.value);
  datasets.value = res.error === null && res.data ? res.data : [];
}

async function loadFormOptions() {
  const res = await findDynamicFormList({ appId: currentAppId.value, pageNum: 1, pageSize: 200 } as any);
  if (res.error === null && res.data) {
    formOptions.value =
      (res.data as any).list?.map((form: any) => ({
        label: `${form.tableName}（${form.tableCode}）`,
        value: form.tableCode
      })) ?? [];
  }
}

function openDatasetModal() {
  datasetEditing.value = false;
  datasetForm.datasetCode = '';
  datasetForm.datasetName = '';
  datasetForm.tableCode = '';
  datasetForm.id = undefined;
  datasetForm.sourceType = 'dynamic_table';
  datasetForm.sourceConfig = undefined;
  httpConfig.url = '';
  httpConfig.method = 'GET';
  httpConfig.body = '';
  httpConfig.resultPath = '';
  httpConfig.timeoutMs = 8000;
  loadCsvConfig({});
  resetDbConfig();
  healthResult.value = null;
  derivedRows.value = [];
  datasetFilterRows.value = [];
  loadFormOptions();
  datasetModalVisible.value = true;
}

/** 编辑已有数据集：默认过滤在这里改，字段候选直接用它已解析的列快照 */
function openDatasetEdit(dataset: ReportDatasetNamespace.Dataset) {
  datasetEditing.value = true;
  datasetForm.id = dataset.id;
  datasetForm.datasetCode = dataset.datasetCode;
  datasetForm.datasetName = dataset.datasetName;
  datasetForm.tableCode = dataset.tableCode;
  datasetForm.sourceType = dataset.sourceType || 'dynamic_table';
  const saved = (dataset.sourceConfig ?? {}) as Record<string, any>;
  httpConfig.url = String(saved.url ?? '');
  httpConfig.method = String(saved.method ?? 'GET');
  httpConfig.body = String(saved.body ?? '');
  httpConfig.resultPath = String(saved.resultPath ?? '');
  httpConfig.timeoutMs = Number(saved.timeoutMs) || 8000;
  loadCsvConfig(saved);
  resetDbConfig();
  dbConfig.host = String(saved.host ?? '');
  dbConfig.port = Number(saved.port) || 3306;
  dbConfig.database = String(saved.database ?? '');
  dbConfig.table = String(saved.table ?? '');
  dbConfig.userName = String(saved.userName ?? '');
  // 掩码原样回填，用户不动它就等于不动密码
  dbConfig.password = String(saved.password ?? '');
  dbConfig.useSsl = Boolean(saved.useSsl);
  dbConfig.timeoutMs = Number(saved.timeoutMs) || 8000;
  dbConfig.columns = Array.isArray(saved.columns) ? saved.columns.join(',') : '';
  healthResult.value = null;
  derivedRows.value = (((dataset.columnSnapshot as any)?.columns ?? []) as any[])
    .filter(column => typeof column.expression === 'string' && column.expression !== '')
    .map(column => ({
      fieldCode: column.fieldCode,
      fieldName: column.fieldName || '',
      dataType: (column.dataType || 'number') as ReportDatasetNamespace.DatasetColumn['dataType'],
      expression: column.expression
    }));
  datasetFilterRows.value = (dataset.defaultFilter?.filters ?? []).map(filter => ({
    field: filter.field,
    op: String(filter.op ?? 'eq'),
    value: String(filter.value ?? '')
  }));
  loadFormOptions();
  datasetModalVisible.value = true;
}

const datasetColumnOptions = computed(() => {
  const columns =
    datasets.value.find(item => item.datasetCode === datasetForm.datasetCode)?.columnSnapshot?.columns ?? [];
  return columns.map(column => ({ label: `${column.fieldName}(${column.fieldCode})`, value: column.fieldCode }));
});

/** 画布卡片是占位，共享一个空数组避免每帧新建引用 */
const emptyRows: ReportChartNamespace.AggRow[] = [];

function addDatasetFilterRow() {
  datasetFilterRows.value.push({ field: '', op: 'eq', value: '' });
}

/**
 * 按当前表单组装 sourceConfig；动态表返回 null。
 *
 * 保存与健康检查必须共用这一份组装，否则会出现「测的是 A、存的是 B」：
 * 测试连接通过、保存后取数失败，比两个都失败更难排查。
 */
function buildSourceConfig(): Record<string, unknown> | null {
  if (datasetForm.sourceType === 'http') {
    return {
      url: httpConfig.url.trim(),
      method: httpConfig.method,
      body: httpConfig.body.trim() === '' ? null : httpConfig.body,
      resultPath: httpConfig.resultPath.trim(),
      timeoutMs: httpConfig.timeoutMs
    };
  }
  if (datasetForm.sourceType === 'csv') {
    // 两个形态各交各的键：一份 sourceConfig 里同时留着 url 和 fileId，服务端按谁解释就成了猜
    if (csvConfig.storage === 'upload') {
      return {
        storage: 'upload',
        fileId: csvConfig.fileId,
        fileName: csvConfig.fileName,
        fileSize: csvConfig.fileSize,
        delimiter: csvConfig.delimiter.trim() === '' ? null : csvConfig.delimiter.trim(),
        headerRow: csvConfig.headerRow,
        charset: csvConfig.charset.trim() === '' ? null : csvConfig.charset.trim()
      };
    }
    return {
      url: csvConfig.url.trim(),
      method: csvConfig.method,
      // 留空 = 交给服务端按首行嗅探；填 \t 表示制表符
      delimiter: csvConfig.delimiter.trim() === '' ? null : csvConfig.delimiter.trim(),
      headerRow: csvConfig.headerRow,
      charset: csvConfig.charset.trim() === '' ? null : csvConfig.charset.trim(),
      timeoutMs: csvConfig.timeoutMs
    };
  }
  if (datasetForm.sourceType === 'db') {
    return {
      dbType: 'mysql',
      host: dbConfig.host.trim(),
      port: dbConfig.port,
      database: dbConfig.database.trim(),
      table: dbConfig.table.trim(),
      userName: dbConfig.userName.trim(),
      // 空串表示"这张表不需要密码"，掩码表示"沿用原密码"，两种情况都由服务端区分处理
      password: dbConfig.password.trim(),
      useSsl: dbConfig.useSsl,
      timeoutMs: dbConfig.timeoutMs,
      columns: dbConfig.columns
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    };
  }
  return null;
}

/** 计算字段的类型候选（模板里渲染下拉，值域与 DatasetColumn['dataType'] 一致） */
const DERIVED_TYPES = ['number', 'text', 'date'];

function addDerivedRow() {
  derivedRows.value = [
    ...derivedRows.value,
    { fieldCode: `calc_${derivedRows.value.length + 1}`, fieldName: '', dataType: 'number', expression: '' }
  ];
}

function removeDerivedRow(index: number) {
  derivedRows.value = derivedRows.value.filter((_, i) => i !== index);
}

/**
 * 表达式里可引用的物理列提示。
 * 新建态拿不到（列快照要保存后才由后端产出），所以提示改成引导语而不是显示空列表——
 * 空列表会让人以为「没有列可引用」而放弃配置。
 */
const physicalColumnTokens = computed(() => {
  const target = datasets.value.find(item => item.datasetCode === datasetForm.datasetCode);
  const columns = (((target as any)?.columnSnapshot as any)?.columns ?? []) as any[];
  return columns
    .filter(column => typeof column.expression !== 'string' || column.expression === '')
    .map(column => `[${column.fieldCode}]`)
    .join(' ');
});

const healthChecking = ref(false);

/** 按后端分类给处置建议：原样贴异常文案等于没分类 */
const HEALTH_ADVICE: Record<string, string> = {
  network: '请检查主机、端口与网络是否可达',
  auth: '请检查账号与密码，以及该账号是否有权访问目标库表',
  parse: '请检查返回结构与数据路径（JSON 源）或分隔符与编码（CSV 源）',
  limit: '请缩小取值范围或减少列数',
  config: '请按提示修正配置项：地址协议、端口、内网限制或服务端允许清单'
};

async function handleCheckHealth() {
  if (datasetForm.sourceType !== 'http' && datasetForm.sourceType !== 'csv' && datasetForm.sourceType !== 'db') {
    window.$message?.info('动态表不需要连通性检查，保存时会按当前列重建快照');
    return;
  }
  const sourceConfig = buildSourceConfig();
  if (!sourceConfig) return;
  // 上传形态还没落库就没有可检的对象：直接问一句，而不是换回一段服务端 config 错误
  if (datasetForm.sourceType === 'csv' && csvConfig.storage === 'upload' && !csvConfig.fileId) {
    window.$message?.warning('请先上传 CSV 文件');
    return;
  }
  healthChecking.value = true;
  healthResult.value = null;
  const res = await checkDatasetHealth({
    datasetCode: datasetEditing.value ? datasetForm.datasetCode : undefined,
    sourceType: datasetForm.sourceType,
    sourceConfig
  });
  healthChecking.value = false;
  if (res.error !== null || !res.data) {
    // 主密钥缺失之类的失败走的是异常通道（不是 ok:false），这里同样要能显示出来
    healthResult.value = { ok: false, category: 'config', message: res.error?.message || '健康检查请求失败' };
    return;
  }
  healthResult.value = res.data;
}

/**
 * 当前数据源自身的必填闸门；编码是所有源共用的前置条件，不在这里判。
 * CSV 两种形态各缺各的东西：URL 形态缺地址，上传形态是还没落库的文件。
 */
function currentSourceMissing(): boolean {
  if (datasetForm.sourceType === 'http') {
    return !httpConfig.url.trim();
  }
  if (datasetForm.sourceType === 'csv') {
    return csvConfig.storage === 'upload' ? !csvConfig.fileId : !csvConfig.url.trim();
  }
  if (datasetForm.sourceType === 'db') {
    return !(dbConfig.host && dbConfig.database && dbConfig.table && dbConfig.userName);
  }
  return !datasetForm.tableCode;
}

/** 闸门没过时按数据源给一句能照着改的提示 */
function currentSourceMissingMessage(): string {
  if (datasetForm.sourceType === 'http') {
    return '请填写数据集编码与接口地址';
  }
  if (datasetForm.sourceType === 'csv') {
    if (csvConfig.storage === 'upload') {
      return '请上传 CSV 文件（内网地址会被服务端拦截，上传形态不需要填写地址）';
    }
    return '请填写数据集编码与 CSV 文件地址';
  }
  if (datasetForm.sourceType === 'db') {
    return '请填写数据集编码、主机、数据库、表名与只读账号';
  }
  return '请填写数据集编码并选择动态表';
}

async function handleSaveDataset() {
  if (!datasetForm.datasetCode || currentSourceMissing()) {
    window.$message?.error(currentSourceMissingMessage());
    return;
  }
  const invalidFilterRow = datasetFilterRows.value.some(row => !row.field || row.value === '' || row.value === null);
  if (invalidFilterRow) {
    window.$message?.error('默认过滤每行都要填字段与值（不需要就删掉该行）');
    return;
  }
  datasetForm.appId = currentAppId.value;
  const payload = buildSourceConfig();
  if (payload) {
    // 外部源没有 tableCode；后端按 sourceConfig 真实抽样生成列快照
    datasetForm.tableCode = '';
    datasetForm.sourceConfig = payload;
  } else {
    datasetForm.sourceConfig = undefined;
  }
  // 传 {filters:[]} 才能把已存的默认过滤清空：MyBatis-Plus 的 update 不写 null 字段
  datasetForm.defaultFilter = {
    filters: datasetFilterRows.value.map(row => ({
      field: row.field,
      op: row.op as ReportDatasetNamespace.ReportFilter['op'],
      value: row.value
    }))
  };
  // 只提交派生列：物理列由后端按数据源重新产出，前端回传整份快照反而会盖掉真实类型
  datasetForm.columnSnapshot = derivedRows.value.length
    ? { columns: derivedRows.value.map(row => ({ ...row, expression: row.expression.trim() })) }
    : undefined;
  const res = await saveReportDataset({ ...datasetForm });
  if (res.error === null) {
    window.$message?.success('数据集已保存，列快照已重新解析');
    datasetModalVisible.value = false;
    await loadDatasets();
  } else {
    window.$message?.error(res.error?.message || '保存失败');
  }
}

function handleRefreshDataset(datasetCode: string) {
  refreshReportDataset(datasetCode).then(res => {
    if (res.error === null) {
      window.$message?.success('列快照已刷新');
      loadDatasets();
    } else {
      window.$message?.error(res.error?.message || '刷新列快照失败');
    }
  });
}

function handleDeleteDataset(dataset: ReportDatasetNamespace.Dataset) {
  window.$dialog?.warning({
    title: '删除确认',
    content: `删除数据集「${dataset.datasetName}」？引用它的图表会先删不掉。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      const res = await delReportDataset(dataset.datasetCode);
      if (res.error === null) {
        window.$message?.success('删除成功');
        await loadDatasets();
      } else {
        window.$message?.error(res.error?.message || '删除失败');
      }
    }
  });
}

// ==================== 图表卡片 ====================

const chartModalVisible = ref(false);
const chartForm = reactive<ReportChartNamespace.Report>({
  reportCode: '',
  reportName: '',
  reportType: 'bar',
  datasetCode: '',
  config: {
    dimensions: [],
    measures: [{ field: '', agg: 'COUNT' }],
    filters: [],
    limit: 50,
    sort: { field: '', order: 'DESC' }
  }
});
const chartColumns = ref<ReportDatasetNamespace.DatasetColumn[]>([]);
const previewRows = ref<ReportChartNamespace.AggRow[]>([]);
const previewAliases = reactive<{ dimensionAliases: string[]; measureAliases: string[] }>({
  dimensionAliases: ['dim0'],
  measureAliases: ['value']
});
const previewError = ref('');
const previewing = ref(false);
/** 编辑中的画布卡片下标（-1 表示新建） */
const editingCardIndex = ref(-1);

const isSingleValueChart = computed(() => SINGLE_VALUE_TYPES.includes(chartForm.reportType));

function currentDataset() {
  return datasets.value.find(item => item.datasetCode === chartForm.datasetCode) ?? null;
}

function syncChartColumns() {
  chartColumns.value = currentDataset()?.columnSnapshot?.columns ?? [];
}

watch(
  () => chartForm.datasetCode,
  () => {
    syncChartColumns();
  }
);

const columnOptions = computed(() =>
  chartColumns.value.map(column => ({
    label: `${column.fieldName}(${column.fieldCode})`,
    value: column.fieldCode
  }))
);

const numberColumnOptions = computed(() =>
  chartColumns.value
    .filter(column => column.dataType === 'number')
    .map(column => ({ label: `${column.fieldName}(${column.fieldCode})`, value: column.fieldCode }))
);

function columnLabel(field?: string) {
  if (!field) {
    return '';
  }
  const column = chartColumns.value.find(item => item.fieldCode === field);
  return column ? column.fieldName : field;
}

function measureLabel(measure?: ReportChartNamespace.Measure) {
  if (!measure) {
    return '计数';
  }
  if (measure.agg === 'COUNT' && !measure.field) {
    return '计数';
  }
  return `${columnLabel(measure.field)}（${measure.agg}）`;
}

/** 排序只能落在结果别名上（后端按 dimensionAliases/measureAliases 白名单校验） */
const sortOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = [];
  (chartForm.config?.dimensions ?? []).forEach((dim, index) => {
    options.push({ label: `${columnLabel(dim.field) || `维度${index + 1}`}（维度）`, value: `dim${index}` });
  });
  (chartForm.config?.measures ?? []).forEach((measure, index) => {
    options.push({ label: measureLabel(measure), value: index === 0 ? 'value' : `m${index}` });
  });
  return options;
});

/** 展示格式默认值：旧图表 config 里没这个键，绑定前必须补齐 */
function defaultFormat(): ReportChartNamespace.ValueFormat {
  return { decimals: null, unit: '', thousands: false };
}

function openAddChart() {
  if (datasets.value.length === 0) {
    window.$message?.error('请先创建数据集');
    return;
  }
  editingCardIndex.value = -1;
  chartForm.reportCode = `chart_${Date.now()}`;
  chartForm.reportName = '';
  chartForm.reportType = 'bar';
  chartForm.datasetCode = datasets.value[0].datasetCode;
  chartForm.config = {
    dimensions: [{ field: '', granularity: '', lookup: null }],
    measures: [{ field: '', agg: 'COUNT' }],
    filters: [],
    limit: 50,
    sort: { field: '', order: 'DESC' },
    gaugeMax: null,
    rankingLimit: 10,
    format: defaultFormat()
  };
  syncChartColumns();
  resetPreview();
  chartModalVisible.value = true;
}

function openEditChart(card: CanvasCard, index: number) {
  editingCardIndex.value = index;
  Object.assign(chartForm, JSON.parse(JSON.stringify(card.chart)));
  if (!chartForm.config) {
    chartForm.config = { dimensions: [], measures: [], filters: [] };
  }
  if (!chartForm.config.measures || chartForm.config.measures.length === 0) {
    chartForm.config.measures = [{ field: '', agg: 'COUNT' }];
  }
  if (!chartForm.config.dimensions) {
    chartForm.config.dimensions = [];
  }
  if (!chartForm.config.filters) {
    chartForm.config.filters = [];
  }
  if (!chartForm.config.sort) {
    chartForm.config.sort = { field: '', order: 'DESC' };
  }
  if (!chartForm.config.format) {
    chartForm.config.format = defaultFormat();
  }
  syncChartColumns();
  resetPreview();
  chartModalVisible.value = true;
}

function resetPreview() {
  previewRows.value = [];
  previewError.value = '';
  previewAliases.dimensionAliases = ['dim0'];
  previewAliases.measureAliases = ['value'];
}

function addDimension() {
  chartForm.config?.dimensions.push({ field: '', granularity: '', lookup: null });
}

function removeDimension(index: number) {
  chartForm.config?.dimensions.splice(index, 1);
}

function addMeasure() {
  const measures = chartForm.config?.measures;
  if (!measures) {
    return;
  }
  if (measures.length >= 5) {
    window.$message?.error('单个图表最多 5 个度量');
    return;
  }
  measures.push({ field: '', agg: 'SUM' });
}

function removeMeasure(index: number) {
  chartForm.config?.measures.splice(index, 1);
}

/** 时间粒度只在时间列上有意义 */
function isDateColumn(field?: string) {
  return Boolean(field && chartColumns.value.find(column => column.fieldCode === field)?.dataType === 'date');
}

function handlePreview() {
  if (!chartForm.datasetCode) {
    window.$message?.error('请选择数据集');
    return;
  }
  previewing.value = true;
  previewError.value = '';
  previewReportData(chartForm.datasetCode, chartForm.config ?? { dimensions: [], measures: [], filters: [] })
    .then(res => {
      if (res.error === null && res.data) {
        previewRows.value = res.data.rows ?? [];
        previewAliases.dimensionAliases = res.data.dimensionAliases?.length ? res.data.dimensionAliases : ['dim0'];
        previewAliases.measureAliases = res.data.measureAliases?.length ? res.data.measureAliases : ['value'];
      } else {
        previewRows.value = [];
        previewError.value = res.error?.message || '预览失败';
      }
    })
    .finally(() => {
      previewing.value = false;
    });
}

/** 图表配置的必填闸门：返回要提示的话，null 表示可以保存 */
function chartInvalidMessage(): string | null {
  if (!chartForm.reportName) {
    return '请填写图表名称';
  }
  const dimensions = chartForm.config?.dimensions ?? [];
  const measures = chartForm.config?.measures ?? [];
  if (!isSingleValueChart.value && dimensions.filter(dim => dim.field).length === 0) {
    return '请至少配置一个维度字段';
  }
  if (dimensions.some(dim => !dim.field)) {
    return '有未选字段的维度行，请补全或删除';
  }
  if (measures.some(measure => measure.agg !== 'COUNT' && !measure.field)) {
    return '非 COUNT 的度量必须选一个数值字段';
  }
  return null;
}

/** 组装画布卡片：编辑已有卡片时沿用它的布局，新建时给默认跨栏 */
function buildCanvasCard(saved: ReportChartNamespace.Report, config: ReportChartNamespace.ReportConfig): CanvasCard {
  const existingCard = editingCardIndex.value >= 0 ? cards.value[editingCardIndex.value] : null;
  return {
    item: existingCard
      ? { ...existingCard.item, reportCode: saved.reportCode, title: existingCard.item.title || saved.reportName }
      : { reportCode: saved.reportCode, title: saved.reportName, span: 6, orderNum: 0 },
    chart: { ...saved, config }
  };
}

async function handleSaveChart() {
  const invalidMessage = chartInvalidMessage();
  if (invalidMessage) {
    window.$message?.error(invalidMessage);
    return;
  }
  chartForm.appId = currentAppId.value;
  // 单值图不保留维度，避免保存出「有维度但无分组」的歧义配置
  const config = { ...chartForm.config } as ReportChartNamespace.ReportConfig;
  if (isSingleValueChart.value) {
    config.dimensions = [];
  }
  if (config.sort && !config.sort.field) {
    delete config.sort;
  }
  const res = await saveReportChart({ ...chartForm, config });
  if (res.error !== null) {
    window.$message?.error(res.error?.message || '保存失败');
    return;
  }
  const saved = res.data ?? chartForm;
  const card = buildCanvasCard(saved, config);
  if (editingCardIndex.value >= 0) {
    cards.value[editingCardIndex.value] = card;
  } else {
    cards.value.push(card);
  }
  chartModalVisible.value = false;
  window.$message?.success(editingCardIndex.value >= 0 ? '图表已更新' : '图表已保存并加入画布');
}

function handleRemoveCard(index: number) {
  const card = cards.value[index];
  window.$dialog?.warning({
    title: '移除确认',
    content: `从画布移除卡片「${card.item.title || card.chart.reportName}」？（图表本身保留，可被别的仪表盘再次引用）`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      cards.value.splice(index, 1);
    }
  });
}

function handleDeleteChart(card: CanvasCard, index: number) {
  window.$dialog?.error({
    title: '删除图表',
    content: `删除图表「${card.chart.reportName}」并从画布移除？被其他仪表盘引用时会失败。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      const res = await delReportChart(card.chart.reportCode);
      if (res.error === null) {
        cards.value.splice(index, 1);
        window.$message?.success('图表已删除');
        loadChartLibrary();
      } else {
        window.$message?.error(res.error?.message || '删除失败');
      }
    }
  });
}

/** 本应用已有的图表库：新画布可以直接引用已配好的图表，不必重复配一遍 */
const chartLibrary = ref<ReportChartNamespace.Report[]>([]);
const chartLibraryVisible = ref(false);

async function loadChartLibrary() {
  if (!currentAppId.value) {
    chartLibrary.value = [];
    return;
  }
  const res = await findReportChartList(currentAppId.value);
  chartLibrary.value = res.error === null && res.data ? res.data : [];
}

function openChartLibrary() {
  loadChartLibrary();
  chartLibraryVisible.value = true;
}

function reuseChart(chart: ReportChartNamespace.Report) {
  if (cards.value.some(card => card.chart.reportCode === chart.reportCode)) {
    window.$message?.warning('该图表已在画布上');
    return;
  }
  cards.value.push({
    item: { reportCode: chart.reportCode, title: chart.reportName, span: 6, orderNum: cards.value.length },
    chart: JSON.parse(JSON.stringify(chart))
  });
  chartLibraryVisible.value = false;
  window.$message?.success('已加入画布');
}

/** 卡片可占的栏数（画布是 12 栅格） */
function spanOptions() {
  return [3, 4, 6, 8, 9, 12].map(value => ({ label: `${value}栏`, value }));
}

onMounted(() => {
  loadAppOptions().then(() => loadDatasets());
});
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col overflow-hidden">
        <!-- 顶栏：应用选择 + 仪表盘名称/编码 + 保存 -->
        <div class="mb-12px flex flex-wrap items-center gap-12px">
          <span class="text-15px font-600">报表设计器</span>
          <ElSelect
            v-model="currentAppId"
            size="small"
            class="w-200px"
            placeholder="选择应用"
            @change="handleAppChange"
          >
            <ElOption v-for="opt in appOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
          <ElInput v-model="currentDashboard.dashboardName" size="small" class="w-200px" placeholder="仪表盘名称" />
          <ElInput
            v-model="currentDashboard.dashboardCode"
            size="small"
            class="w-220px"
            placeholder="仪表盘编码"
            :disabled="!currentCodeEditable"
          />
          <ElButton v-if="hasAuth('report:dashboard:add')" type="primary" size="small" @click="handleSaveDashboard">
            保存仪表盘
          </ElButton>
          <ElButton size="small" secondary @click="openChartLibrary">引用已有图表</ElButton>
        </div>

        <div class="flex flex-1 gap-12px overflow-hidden">
          <!-- 左栏：仪表盘 + 数据集 -->
          <div class="w-280px flex flex-col gap-8px overflow-auto">
            <ElCard title="仪表盘" size="small" class="rounded-8px">
              <template #header-extra>
                <ElButton v-if="hasAuth('report:dashboard:add')" quaternary size="small" @click="handleNewDashboard">
                  新建
                </ElButton>
              </template>
              <div
                v-for="dashboard in dashboardList"
                :key="dashboard.dashboardCode"
                class="mb-4px flex cursor-pointer items-center justify-between rounded-4px px-8px py-6px hover:bg-gray-100"
                :class="{ 'bg-gray-100': dashboard.dashboardCode === currentDashboard.dashboardCode }"
                @click="openDashboard(dashboard)"
              >
                <span class="truncate">{{ dashboard.dashboardName }}</span>
                <ElButton
                  v-if="hasAuth('report:dashboard:remove')"
                  quaternary
                  size="small"
                  type="danger"
                  @click.stop="handleDeleteDashboard(dashboard)"
                >
                  删
                </ElButton>
              </div>
              <ElEmpty v-if="dashboardList.length === 0" size="small" description="暂无仪表盘" />
            </ElCard>

            <ElCard title="数据集" size="small" class="rounded-8px">
              <template #header-extra>
                <ElButton v-if="hasAuth('report:dataset:add')" quaternary size="small" @click="openDatasetModal">
                  新建
                </ElButton>
              </template>
              <div
                v-for="dataset in datasets"
                :key="dataset.datasetCode"
                class="mb-4px flex items-center justify-between rounded-4px px-8px py-6px hover:bg-gray-100"
              >
                <span class="cursor-pointer truncate" @click="openDatasetEdit(dataset)">
                  {{ dataset.datasetName }}（{{ dataset.datasetCode }}）
                </span>
                <ElSpace :size="4">
                  <ElButton
                    v-if="hasAuth('report:dataset:edit')"
                    quaternary
                    size="small"
                    @click.stop="handleRefreshDataset(dataset.datasetCode)"
                  >
                    刷新
                  </ElButton>
                  <ElButton
                    v-if="hasAuth('report:dataset:remove')"
                    quaternary
                    size="small"
                    type="danger"
                    @click.stop="handleDeleteDataset(dataset)"
                  >
                    删
                  </ElButton>
                </ElSpace>
              </div>
              <ElEmpty v-if="datasets.length === 0" size="small" description="暂无数据集" />
            </ElCard>
          </div>

          <!-- 右侧画布 -->
          <div class="flex-1 overflow-auto rounded-8px bg-gray-50 p-12px">
            <div class="mb-8px">
              <ElButton v-if="hasAuth('report:report:add')" size="small" type="primary" @click="openAddChart">
                + 添加图表
              </ElButton>
            </div>
            <!-- 必须显式 import VueDraggable：项目没有 auto-import，之前漏了导致拖拽静默失效 -->
            <VueDraggable v-model="cards" :animation="150" class="grid grid-cols-12 gap-12px">
              <div
                v-for="(card, index) in cards"
                :key="card.chart.reportCode"
                class="col-span-6 cursor-move border border-gray-200 rounded-8px bg-white p-8px"
                :style="{ gridColumn: `span ${Math.min(Math.max(card.item.span ?? 6, 3), 12)}` }"
              >
                <div class="mb-4px flex items-center justify-between">
                  <span class="truncate text-14px font-500">{{ card.item.title || card.chart.reportName }}</span>
                  <ElSpace :size="4">
                    <ElSelect v-model="card.item.span" size="small" class="w-70px">
                      <ElOption v-for="opt in spanOptions()" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </ElSelect>
                    <ElButton quaternary size="small" @click="openEditChart(card, index)">编辑</ElButton>
                    <ElButton quaternary size="small" @click="handleRemoveCard(index)">移除</ElButton>
                    <ElButton
                      v-if="hasAuth('report:report:remove')"
                      quaternary
                      size="small"
                      type="danger"
                      @click="handleDeleteChart(card, index)"
                    >
                      删图表
                    </ElButton>
                  </ElSpace>
                </div>
                <div class="h-240px">
                  <ChartCard
                    :report-type="card.chart.reportType"
                    :report-name="card.chart.reportName"
                    :rows="emptyRows"
                    :dimension-labels="(card.chart.config?.dimensions ?? []).map(dim => dim.field)"
                    :measure-labels="(card.chart.config?.measures ?? []).map(measure => measure.field || '计数')"
                  />
                  <div class="px-8px text-12px text-gray-400">画布内为占位，数据在运行时按查看者权限渲染</div>
                </div>
              </div>
            </VueDraggable>
            <ElEmpty v-if="cards.length === 0" description="点击「+ 添加图表」开始搭建仪表盘" class="mt-60px" />
          </div>
        </div>
      </div>
    </ElCard>

    <!-- 数据集新建 / 编辑 -->
    <ElDialog v-model="datasetModalVisible" :title="datasetEditing ? '编辑数据集' : '新建数据集'" class="w-640px">
      <ElForm label-position="left" label-width="100">
        <ElFormItem label="数据源">
          <ElRadioGroup v-model="datasetForm.sourceType" :disabled="datasetEditing">
            <ElRadioButton value="dynamic_table">动态表</ElRadioButton>
            <ElRadioButton value="http">HTTP 接口</ElRadioButton>
            <ElRadioButton value="csv">CSV 文件</ElRadioButton>
            <ElRadioButton value="db">外部数据库</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="数据集编码" required>
          <ElInput v-model="datasetForm.datasetCode" placeholder="如 ds_repair_order" :disabled="datasetEditing" />
        </ElFormItem>
        <ElFormItem label="数据集名称" required>
          <ElInput v-model="datasetForm.datasetName" placeholder="如 报修工单数据集" />
        </ElFormItem>
        <template v-if="datasetForm.sourceType === 'dynamic_table'">
          <ElFormItem label="动态表" required>
            <ElSelect v-model="datasetForm.tableCode" placeholder="选择本应用下的动态表">
              <ElOption v-for="opt in formOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>
        </template>
        <template v-else-if="datasetForm.sourceType === 'http'">
          <ElFormItem label="接口地址" required>
            <ElInput v-model="httpConfig.url" placeholder="https://…（内网地址会被服务端拦截）" />
          </ElFormItem>
          <ElFormItem label="请求方法">
            <ElSelect v-model="httpConfig.method" class="w-120px">
              <ElOption v-for="m in ['GET', 'POST']" :key="m" :label="m" :value="m" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem v-if="httpConfig.method === 'POST'" label="请求体">
            <ElInput v-model="httpConfig.body" type="textarea" :rows="3" placeholder='JSON 请求体，如 {"page":1}' />
          </ElFormItem>
          <ElFormItem label="数据路径">
            <ElInput v-model="httpConfig.resultPath" placeholder="JSONPath，如 $.data.list；留空取根数组" />
          </ElFormItem>
          <ElFormItem label="超时(ms)">
            <ElInputNumber v-model="httpConfig.timeoutMs" :min="500" :max="10000" :step="500" />
          </ElFormItem>
          <div class="mb-8px text-12px text-gray-400">
            保存时会真实调用一次接口抽样生成列快照；嵌套字段会拍平成点号路径。HTTPS 公网地址可直接用，
            服务端会拒绝环回/内网/元数据地址。
          </div>
        </template>
        <template v-else-if="datasetForm.sourceType === 'csv'">
          <ElFormItem label="取数方式">
            <ElRadioGroup v-model="csvConfig.storage">
              <ElRadioButton value="url">文件地址</ElRadioButton>
              <ElRadioButton value="upload">上传文件</ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
          <!-- 两个形态互斥、由用户显式选：地址与 fileId 不共存，也没必要从填了哪个猜 -->
          <template v-if="csvConfig.storage === 'upload'">
            <ElFormItem label="CSV 文件" required>
              <ElUpload accept=".csv,.txt" :auto-upload="false" :show-file-list="false" @change="handleCsvFileChange">
                <ElButton size="small" :loading="csvUploading">
                  {{ csvConfig.fileId ? '重新选择文件' : '选择 .csv / .txt 文件（≤2MB）' }}
                </ElButton>
              </ElUpload>
              <div v-if="csvConfig.fileId" class="mt-4px text-12px text-gray-400">
                {{ csvConfig.fileName }}（{{ (csvConfig.fileSize / 1024).toFixed(1) }} KB）
                <span v-if="csvSampleHint">，{{ csvSampleHint }}</span>
              </div>
            </ElFormItem>
            <div class="mb-8px text-12px text-gray-400">
              私有化部署里内网地址会被服务端拦住，文件是唯一能取到数的方式：字节存进平台自己的表，
              跟着数据集一起删除，取数时只交给服务端的 CSV 解析器读，不落盘、不执行、不渲染。
            </div>
          </template>
          <template v-else>
            <ElFormItem label="文件地址" required>
              <ElInput v-model="csvConfig.url" placeholder="https://…/export.csv（内网地址会被服务端拦截）" />
            </ElFormItem>
            <ElFormItem label="请求方法">
              <ElSelect v-model="csvConfig.method" class="w-120px">
                <ElOption v-for="m in ['GET', 'POST']" :key="m" :label="m" :value="m" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="超时(ms)">
              <ElInputNumber v-model="csvConfig.timeoutMs" :min="500" :max="10000" :step="500" />
            </ElFormItem>
          </template>
          <ElFormItem label="分隔符">
            <ElInput v-model="csvConfig.delimiter" class="w-120px" placeholder="自动" />
            <span class="ml-8px text-12px text-gray-400">留空按首行自动识别；制表符填 \t</span>
          </ElFormItem>
          <ElFormItem label="编码">
            <ElInput v-model="csvConfig.charset" class="w-160px" placeholder="自动（UTF-8）" />
            <span class="ml-8px text-12px text-gray-400">中文 Excel 另存的 CSV 通常是 GBK</span>
          </ElFormItem>
          <ElFormItem label="首行为表头">
            <ElSwitch v-model="csvConfig.headerRow" />
          </ElFormItem>
          <div class="mb-8px text-12px text-gray-400">
            保存时按首 20 行推断列类型；单文件上限 2MB、上限 1000 行，
            列名重复或为空会自动改名，行数与列数不一致会直接报错而不是静默补齐。
          </div>
        </template>
        <template v-else-if="datasetForm.sourceType === 'db'">
          <ElFormItem label="主机" required>
            <ElInput v-model="dbConfig.host" placeholder="如 192.168.1.10（须在服务端允许清单内）" />
          </ElFormItem>
          <ElFormItem label="端口">
            <ElInputNumber v-model="dbConfig.port" :min="1" :max="65535" />
          </ElFormItem>
          <ElFormItem label="数据库" required>
            <ElInput v-model="dbConfig.database" placeholder="只允许字母、数字、下划线" />
          </ElFormItem>
          <ElFormItem label="表名" required>
            <ElInput v-model="dbConfig.table" placeholder="只允许字母、数字、下划线" />
          </ElFormItem>
          <ElFormItem label="只读账号" required>
            <ElInput v-model="dbConfig.userName" placeholder="建议只对这张表授 SELECT" />
          </ElFormItem>
          <ElFormItem label="密码">
            <ElInput
              v-model="dbConfig.password"
              type="password"
              show-password
              placeholder="留空表示无密码；显示 ******** 表示沿用原密码"
            />
          </ElFormItem>
          <ElFormItem label="列白名单">
            <ElInput v-model="dbConfig.columns" placeholder="逗号分隔，如 order_date,amount；留空取整表" />
          </ElFormItem>
          <ElFormItem label="TLS 加密">
            <ElSwitch v-model="dbConfig.useSsl" />
          </ElFormItem>
          <ElFormItem label="超时(ms)">
            <ElInputNumber v-model="dbConfig.timeoutMs" :min="500" :max="15000" :step="500" />
          </ElFormItem>
          <div class="mb-8px text-12px text-gray-400">
            外部库直连默认关闭：需服务端配置 privernal.datav.db-source-enabled=true，并把主机写进
            privernal.datav.db-host-whitelist。查询由服务端拼成单条 SELECT、连接强制只读、行数与超时都有硬上限；
            保存时会真实连一次抽样生成列快照。当前仅支持 MySQL。
          </div>
        </template>
        <ElFormItem
          v-if="
            datasetForm.sourceType === 'http' || datasetForm.sourceType === 'csv' || datasetForm.sourceType === 'db'
          "
          label="连通性"
        >
          <div class="w-full">
            <ElButton size="small" :loading="healthChecking" @click="handleCheckHealth">测试连接</ElButton>
            <div v-if="healthResult" class="mt-6px text-12px leading-18px">
              <div :class="healthResult.ok ? 'text-[var(--el-color-success)]' : 'text-[var(--el-color-danger)]'">
                {{ healthResult.message }}
              </div>
              <div v-if="!healthResult.ok && HEALTH_ADVICE[healthResult.category]" class="text-gray-400">
                {{ HEALTH_ADVICE[healthResult.category] }}
              </div>
            </div>
          </div>
        </ElFormItem>
        <ElFormItem label="计算字段">
          <div class="w-full">
            <div class="mb-6px flex items-center justify-between">
              <span class="text-12px opacity-60">
                引用列要加方括号，如 [amount] - [cost]；支持 IF / COALESCE / ROUND / CONCAT / YEAR 等
              </span>
              <ElButton size="small" text @click="addDerivedRow">+ 计算字段</ElButton>
            </div>
            <div v-for="(row, index) in derivedRows" :key="index" class="mb-6px flex items-center gap-6px">
              <ElInput v-model="row.fieldCode" size="small" class="w-120px" placeholder="编码(字母开头)" />
              <ElInput v-model="row.fieldName" size="small" class="w-100px" placeholder="显示名" />
              <ElSelect v-model="row.dataType" size="small" class="w-90px">
                <ElOption v-for="t in DERIVED_TYPES" :key="t" :label="t" :value="t" />
              </ElSelect>
              <ElInput v-model="row.expression" size="small" class="min-w-0 flex-1" placeholder="[amount] - [cost]" />
              <ElButton size="small" text type="danger" @click="removeDerivedRow(index)">删</ElButton>
            </div>
            <div v-if="derivedRows.length && !physicalColumnTokens" class="text-12px opacity-60">
              保存一次后才能引用本数据集的物理列。
            </div>
            <div v-else-if="physicalColumnTokens" class="text-12px opacity-60">可引用：{{ physicalColumnTokens }}</div>
          </div>
        </ElFormItem>
        <ElFormItem label="默认过滤">
          <div class="w-full">
            <div v-for="(row, index) in datasetFilterRows" :key="index" class="mb-6px flex items-center gap-6px">
              <ElSelect
                v-if="datasetEditing"
                v-model="row.field"
                size="small"
                class="flex-1"
                placeholder="字段"
                filterable
                tag
              >
                <ElOption v-for="opt in datasetColumnOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </ElSelect>
              <ElInput v-else v-model="row.field" size="small" class="flex-1" placeholder="字段编码（保存后可编辑）" />
              <ElSelect v-model="row.op" size="small" class="w-90px">
                <ElOption
                  v-for="opt in FILTER_OPS.map(op => ({ label: op, value: op }))"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
              <ElInput v-model="row.value" size="small" class="w-140px" placeholder="值" />
              <ElButton quaternary size="small" type="danger" @click="datasetFilterRows.splice(index, 1)">删</ElButton>
            </div>
            <ElButton size="small" dashed block @click="addDatasetFilterRow">+ 过滤条件</ElButton>
            <div class="mt-4px text-12px text-gray-400">
              每次查询都会带上的条件（等值/包含/区间），看板级的过滤在查看者那边。
            </div>
          </div>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElSpace justify="end">
          <ElButton @click="datasetModalVisible = false">取消</ElButton>
          <ElButton type="primary" @click="handleSaveDataset">保存</ElButton>
        </ElSpace>
      </template>
    </ElDialog>

    <!-- 图表配置 -->
    <ElDialog v-model="chartModalVisible" title="图表配置" class="w-900px">
      <div class="flex gap-16px">
        <ElForm label-position="left" label-width="90" class="flex-1">
          <ElFormItem label="图表名称" required>
            <ElInput v-model="chartForm.reportName" placeholder="如 按类型统计单量" />
          </ElFormItem>
          <ElFormItem label="图表类型">
            <ElSelect v-model="chartForm.reportType" class="w-200px">
              <ElOption v-for="opt in REPORT_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="数据集">
            <ElSelect v-model="chartForm.datasetCode">
              <ElOption
                v-for="opt in datasets.map(item => ({
                  label: `${item.datasetName}（${item.datasetCode}）`,
                  value: item.datasetCode
                }))"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem v-if="!isSingleValueChart" label="维度">
            <div class="w-full">
              <div
                v-for="(dim, index) in chartForm.config?.dimensions"
                :key="index"
                class="mb-6px flex flex-wrap items-center gap-6px"
              >
                <ElSelect v-model="dim.field" class="w-220px" size="small" filterable placeholder="维度字段">
                  <ElOption v-for="opt in columnOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
                <ElSelect
                  v-if="isDateColumn(dim.field)"
                  v-model="dim.granularity"
                  size="small"
                  class="w-110px"
                  placeholder="粒度"
                >
                  <ElOption
                    v-for="opt in [
                      { label: '按分钟', value: 'MINUTE' },
                      { label: '按小时', value: 'HOUR' },
                      { label: '按日', value: 'DAY' },
                      { label: '按周', value: 'WEEK' },
                      { label: '按月', value: 'MONTH' },
                      { label: '按年', value: 'YEAR' }
                    ]"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
                <ElButton quaternary size="small" type="danger" @click="removeDimension(index)">删</ElButton>
              </div>
              <ElButton size="small" dashed @click="addDimension">+ 维度</ElButton>
            </div>
          </ElFormItem>

          <ElFormItem label="度量">
            <div class="w-full">
              <div
                v-for="(measure, index) in chartForm.config?.measures"
                :key="index"
                class="mb-6px flex items-center gap-6px"
              >
                <ElSelect v-model="measure.agg" class="w-110px" size="small">
                  <ElOption
                    v-for="opt in AGGS.map(agg => ({ label: agg, value: agg }))"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
                <ElSelect
                  v-if="measure.agg !== 'COUNT'"
                  v-model="measure.field"
                  class="w-220px"
                  size="small"
                  filterable
                  placeholder="数值字段"
                >
                  <ElOption v-for="opt in numberColumnOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
                <span v-else class="text-12px text-gray-400">留空字段即按行计数</span>
                <ElButton
                  v-if="(chartForm.config?.measures.length ?? 0) > 1"
                  quaternary
                  size="small"
                  type="danger"
                  @click="removeMeasure(index)"
                >
                  删
                </ElButton>
              </div>
              <ElButton size="small" dashed @click="addMeasure">+ 度量</ElButton>
            </div>
          </ElFormItem>

          <ElFormItem label="排序">
            <ElSpace>
              <ElSelect
                v-model="chartForm.config!.sort!.field"
                size="small"
                class="w-220px"
                clearable
                placeholder="默认按第一个度量倒序"
              >
                <ElOption v-for="opt in sortOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </ElSelect>
              <ElSelect v-model="chartForm.config!.sort!.order" size="small" class="w-100px">
                <ElOption
                  v-for="opt in [
                    { label: '倒序', value: 'DESC' },
                    { label: '正序', value: 'ASC' }
                  ]"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElSpace>
          </ElFormItem>

          <ElFormItem v-if="!isSingleValueChart" label="分组上限">
            <ElInputNumber v-model="chartForm.config!.limit" :min="5" :max="1000" class="w-160px" />
            <span class="ml-8px text-12px text-gray-400">超过即报错，不静默截断</span>
          </ElFormItem>

          <ElFormItem v-if="chartForm.reportType === 'gauge'" label="量程上限">
            <ElInputNumber v-model="chartForm.config!.gaugeMax" :min="1" class="w-160px" />
            <span class="ml-8px text-12px text-gray-400">留空按当前值自动取档</span>
          </ElFormItem>

          <ElFormItem v-if="chartForm.reportType === 'ranking'" label="榜单条数">
            <ElInputNumber v-model="chartForm.config!.rankingLimit" :min="1" :max="50" class="w-160px" />
          </ElFormItem>

          <ElFormItem label="展示格式">
            <ElSpace :size="8" align="center">
              <ElInputNumber
                v-model="chartForm.config!.format!.decimals"
                :min="0"
                :max="4"
                :precision="0"
                class="w-110px"
                placeholder="小数位"
                clearable
              />
              <ElInput v-model="chartForm.config!.format!.unit" class="w-90px" placeholder="单位" clearable />
              <ElSwitch v-model="chartForm.config!.format!.thousands" size="small" />
              <span class="text-12px text-gray-400">小数位留空＝最多 2 位；单位接在数值后（元 / % / 人）</span>
            </ElSpace>
          </ElFormItem>
        </ElForm>

        <div class="w-320px">
          <div class="mb-4px text-13px text-gray-400">预览</div>
          <div class="h-300px border border-gray-200 rounded-8px">
            <ChartCard
              :report-type="chartForm.reportType"
              :report-name="chartForm.reportName"
              :rows="previewRows"
              :dimension-aliases="previewAliases.dimensionAliases"
              :measure-aliases="previewAliases.measureAliases"
              :dimension-labels="(chartForm.config?.dimensions ?? []).map(dim => columnLabel(dim.field) || dim.field)"
              :measure-labels="(chartForm.config?.measures ?? []).map(measure => measureLabel(measure))"
              :gauge-max="chartForm.config?.gaugeMax"
              :ranking-limit="chartForm.config?.rankingLimit ?? 10"
              :format="chartForm.config?.format ?? null"
              :error="previewError"
              :loading="previewing"
            />
          </div>
          <ElButton class="mt-8px" size="small" block :loading="previewing" @click="handlePreview">预览</ElButton>
        </div>
      </div>
      <template #footer>
        <ElSpace justify="end">
          <ElButton @click="chartModalVisible = false">取消</ElButton>
          <ElButton type="primary" @click="handleSaveChart">
            {{ editingCardIndex >= 0 ? '保存并更新卡片' : '保存并加入画布' }}
          </ElButton>
        </ElSpace>
      </template>
    </ElDialog>

    <!-- 引用已有图表 -->
    <ElDialog v-model="chartLibraryVisible" title="本应用已有的图表" class="w-640px">
      <div v-if="chartLibrary.length > 0" class="flex-col gap-8px">
        <div v-for="chart in chartLibrary" :key="chart.reportCode" class="flex-col gap-8px" Item>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-14px">{{ chart.reportName }}</div>
              <div class="text-12px text-gray-400">{{ chart.reportType }} · {{ chart.datasetCode }}</div>
            </div>
            <ElButton size="small" tertiary @click="reuseChart(chart)">加入画布</ElButton>
          </div>
        </div>
      </div>
      <ElEmpty v-else description="本应用还没有图表" />
    </ElDialog>
  </div>
</template>

<style scoped></style>
