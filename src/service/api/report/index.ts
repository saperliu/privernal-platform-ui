import { request } from '../../request';

// ==================== 数据集 ====================

// 保存数据集（新增/按编码更新，列快照随保存解析）
export function saveReportDataset(data: ReportDatasetNamespace.Dataset) {
  return request.post<ReportDatasetNamespace.Dataset>('/dynamic/back/report/dataset/save', data);
}

// 刷新列快照
export function refreshReportDataset(datasetCode: string) {
  return request.put(`/dynamic/back/report/dataset/refresh/${datasetCode}`);
}

// 数据源健康检查：按提交的配置真实访问一次，返回可达性与错误分类
export function checkDatasetHealth(data: {
  datasetCode?: string;
  sourceType: string;
  sourceConfig: Record<string, unknown>;
}) {
  return request.post<ReportDatasetNamespace.DatasetHealth>('/dynamic/back/report/dataset/health', data);
}

/**
 * CSV 上传数据源：落库并顺带抽样列，让设计器在保存数据集之前就能看见字段。
 * 分隔符/编码/表头随表单一起提交，否则「界面里选的分隔符」要等保存才第一次真正生效。
 */
export function uploadDatasetCsv(
  file: File,
  options: { datasetCode?: string; delimiter?: string; charset?: string; headerRow?: boolean } = {}
) {
  const form = new FormData();
  form.append('file', file);
  const query = new URLSearchParams();
  if (options.datasetCode) query.set('datasetCode', options.datasetCode);
  if (options.delimiter) query.set('delimiter', options.delimiter);
  if (options.charset) query.set('charset', options.charset);
  if (options.headerRow !== undefined) query.set('headerRow', String(options.headerRow));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request.post<ReportDatasetNamespace.CsvUploadResult>(
    `/dynamic/back/report/dataset/csv/upload${suffix}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

// 数据集列表（按应用）
export function findReportDatasetList(appId: string) {
  return request.get<ReportDatasetNamespace.Dataset[]>(`/dynamic/back/report/dataset/list?appId=${appId}`);
}

// 数据集详情
export function findReportDatasetDetail(datasetCode: string) {
  return request.get<ReportDatasetNamespace.Dataset>(`/dynamic/back/report/dataset/${datasetCode}`);
}

// 删除数据集
export function delReportDataset(datasetCode: string) {
  return request.delete(`/dynamic/back/report/dataset/${datasetCode}`, {});
}

// ==================== 图表 ====================

// 保存图表
export function saveReportChart(data: ReportChartNamespace.Report) {
  return request.post<ReportChartNamespace.Report>('/dynamic/back/report/report/save', data);
}

// 图表列表（按应用）
export function findReportChartList(appId: string) {
  return request.get<ReportChartNamespace.Report[]>(`/dynamic/back/report/report/list?appId=${appId}`);
}

// 删除图表
export function delReportChart(reportCode: string) {
  return request.delete(`/dynamic/back/report/report/${reportCode}`, {});
}

// ==================== 仪表盘 ====================

// 保存仪表盘（含卡片全量重建；新增时自动注册菜单）
export function saveReportDashboard(
  dashboard: ReportDashboardNamespace.Dashboard,
  items: ReportDashboardNamespace.DashboardItem[]
) {
  return request.post<ReportDashboardNamespace.Dashboard>('/dynamic/back/report/dashboard/save', { dashboard, items });
}

// 仪表盘详情（含卡片与图表配置）
export function findReportDashboardDetail(dashboardCode: string) {
  return request.get<ReportDashboardNamespace.DashboardDetail>(
    `/dynamic/back/report/dashboard/detail/${dashboardCode}`
  );
}

// 仪表盘列表（按应用）
export function findReportDashboardList(appId: string) {
  return request.get<ReportDashboardNamespace.Dashboard[]>(`/dynamic/back/report/dashboard/list?appId=${appId}`);
}

// 删除仪表盘
export function delReportDashboard(dashboardCode: string) {
  return request.delete(`/dynamic/back/report/dashboard/${dashboardCode}`, {});
}

// ==================== 数据查询 ====================

// 设计态预览：数据集 + 未保存的图表配置
export function previewReportData(datasetCode: string, config: ReportChartNamespace.ReportConfig) {
  return request.post<ReportChartNamespace.AggResult>('/dynamic/back/report/data/preview', { datasetCode, config });
}

// 运行态取数：仪表盘内的图表
export function queryReportData(
  dashboardCode: string,
  reportCode: string,
  filters?: ReportDatasetNamespace.ReportFilter[]
) {
  return request.post<ReportChartNamespace.AggResult>('/dynamic/back/report/data/query', {
    dashboardCode,
    reportCode,
    filters
  });
}
