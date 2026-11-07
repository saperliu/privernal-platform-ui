import { request } from '../../request';

// ==================== 大屏 ====================

// 保存大屏（新增/按编码更新，schema 整体覆盖）
export function saveDatavScreen(data: DatavNamespace.ScreenSaveRequest) {
  return request.post<DatavNamespace.Screen>('/dynamic/back/datav/screen/save', data);
}

// 大屏列表（按应用；不返回 schema，避免一次拖进全部画布 JSON）
export function findDatavScreenList(appId?: string) {
  const query = appId ? `?appId=${appId}` : '';
  return request.get<DatavNamespace.ScreenSummary[]>(`/dynamic/back/datav/screen/list${query}`);
}

// 大屏详情（含 schema）。published=1：已发布的大屏返回发布快照（预览/投放用），设计器不传
export function findDatavScreenDetail(screenCode: string, published = false) {
  const query = published ? '?published=1' : '';
  return request.get<DatavNamespace.Screen>(`/dynamic/back/datav/screen/${screenCode}${query}`);
}

// 删除大屏
export function delDatavScreen(screenCode: string) {
  return request.delete(`/dynamic/back/datav/screen/${screenCode}`, {});
}

// 发布 / 下线
export function publishDatavScreen(screenCode: string, status: DatavNamespace.ScreenStatus) {
  return request.put(`/dynamic/back/datav/screen/publish/${screenCode}?status=${status}`);
}

// 复制大屏
export function copyDatavScreen(screenCode: string) {
  return request.post<DatavNamespace.Screen>(`/dynamic/back/datav/screen/copy/${screenCode}`);
}

// ==================== 版本 ====================

export function findDatavScreenVersions(screenCode: string) {
  return request.get<DatavNamespace.ScreenVersion[]>(`/dynamic/back/datav/screen/versions/${screenCode}`);
}

/** 单个版本内容（含 schema），版本对比按版本号各取一次 */
export function findDatavScreenVersionDetail(screenCode: string, versionNo: number) {
  return request.get<DatavNamespace.ScreenVersion>(`/dynamic/back/datav/screen/version/${screenCode}/${versionNo}`);
}

export function rollbackDatavScreen(screenCode: string, versionNo: number) {
  return request.put(`/dynamic/back/datav/screen/rollback/${screenCode}?versionNo=${versionNo}`);
}

// ==================== 素材 ====================

/** 登记素材（文件已先传文件服务拿 URL，这里只登记元数据，返回带 assetCode） */
export function saveDatavAsset(data: Partial<DatavNamespace.DatavAsset>) {
  return request.post<DatavNamespace.DatavAsset>('/dynamic/back/datav/asset/save', data);
}

export function findDatavAssetList(category?: string, keyword?: string) {
  const search = new URLSearchParams();
  if (category) search.set('category', category);
  if (keyword) search.set('keyword', keyword);
  const query = search.toString();
  return request.get<DatavNamespace.DatavAsset[]>(`/dynamic/back/datav/asset/list${query ? `?${query}` : ''}`);
}

/** 删除素材（后端带引用保护：仍被大屏 schema 引用时拒绝并提示引用方） */
export function delDatavAsset(assetCode: string) {
  return request.delete(`/dynamic/back/datav/asset/${assetCode}`, {});
}

// ==================== 外链分享 ====================

/** 创建分享链接：返回 shareCode 与只此一次的 sign（丢了就禁用重建） */
export function createDatavShare(screenCode: string, expireHours: number, refererWhitelist?: string) {
  const search = new URLSearchParams({ screenCode: String(screenCode), expireHours: String(expireHours) });
  if (refererWhitelist) search.set('refererWhitelist', refererWhitelist);
  return request.post<{ share: { shareCode: string; expireTime?: string | null }; sign: string }>(
    `/dynamic/back/datav/share/create?${search.toString()}`
  );
}

export function findDatavShareList(screenCode: string) {
  return request.get<DatavNamespace.DatavShare[]>(`/dynamic/back/datav/share/list/${screenCode}`);
}

/** 禁用分享（吊销），链接立即失效 */
export function disableDatavShare(shareCode: string) {
  return request.post(`/dynamic/back/datav/share/disable/${shareCode}`);
}

/** 免登拿分享的大屏 schema（发布快照）。shareCode/sign 编码，防注入额外查询参数（F6） */
export function findDatavShareSchema(shareCode: string, sign: string) {
  return request.get<{ screenName: string; schemaJson: string }>(
    `/dynamic/pub/datav/${encodeURIComponent(shareCode)}/schema?sign=${encodeURIComponent(sign)}`
  );
}

/** 免登整屏取数：DatavRuntimeTransport 的 pub 实现（shareCode/sign 同口径编码，F6） */
export function queryDatavShareBatch(shareCode: string, sign: string) {
  return function batch(_screenCode: string, params?: Record<string, unknown>, drills?: Record<string, number>) {
    return request.post<DatavNamespace.BatchResult>(
      `/dynamic/pub/datav/${encodeURIComponent(shareCode)}/data?sign=${encodeURIComponent(sign)}`,
      {
        params: params || {},
        ...(drills && Object.keys(drills).length ? { drills } : {})
      }
    );
  };
}

// ==================== 运行时取数 ====================

/**
 * 单组件取数的位置参数：形态与 `DatavRuntimeTransport.single` 一致，调用点仍按 4 个位置参数传。
 *
 * 用元组声明是为了满足 max-params 的 3 参上限，而不是改成对象参数——
 * 改对象参数要同步 `src/hooks/datav/useDatavRuntime.ts` 的 transport 契约，不属本次范围。
 */
type QueryDatavWidgetDataArgs = [
  screenCode: string,
  widgetId: string,
  params?: Record<string, unknown>,
  drillLevel?: number
];

/**
 * 单个组件取数：后端按 screenCode + widgetId 从**库里的画布**取绑定配置，
 * 不接受请求里带 config——否则大屏权限就成了数据集权限的旁路。
 * 设计态改配置的实时预览走 /back/report/data/preview。
 *
 * `drillLevel` 是 M6.2 唯一开出来的运行态口子：它只是一个下标，
 * 可下钻的字段仍然只来自该组件 schema 里声明的 `data.drillFields`。
 */
export function queryDatavWidgetData(...args: QueryDatavWidgetDataArgs) {
  const [screenCode, widgetId, params, drillLevel] = args;
  return request.post<ReportChartNamespace.AggResult>('/dynamic/back/datav/data/query', {
    screenCode,
    widgetId,
    params: params || {},
    ...(drillLevel ? { drillLevel } : {})
  });
}

/** 一次拉齐整屏的取数结果，预览与投放模式用它做首屏；逐组件带成功标志 */
export function queryDatavScreenBatch(
  screenCode: string,
  params?: Record<string, unknown>,
  drills?: Record<string, number>
) {
  return request.post<DatavNamespace.BatchResult>('/dynamic/back/datav/data/batch', {
    screenCode,
    params: params || {},
    ...(drills && Object.keys(drills).length ? { drills } : {})
  });
}
