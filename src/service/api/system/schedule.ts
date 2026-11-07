import { request } from '../../request';

/** 定时任务查询过滤 */
export interface ScheduleTaskQuery {
  pageNum: number;
  pageSize: number;
  organizationId?: string;
  appId?: string;
  source?: string;
  triggerType?: string;
  status?: string;
  actionType?: string;
  keyword?: string;
}

/** 定时任务行 */
export interface ScheduleTaskRow {
  id: string;
  taskCode?: string;
  title: string;
  appId: string;
  source: string;
  bizKey: string;
  triggerType: string;
  cronExpr?: string;
  intervalSeconds?: number;
  jitterSeconds?: number;
  misfirePolicy?: string;
  concurrentPolicy?: string;
  timeoutSeconds?: number;
  maxRetry?: number;
  actionType: string;
  actionConfig?: string;
  status: string;
  nextFireTime?: string;
  lastFireTime?: string;
  triggerCount?: number;
  failCount?: number;
  lastError?: string;
  version?: number;
  remark?: string;
  nextFireTimestamp?: string;
}

export interface SchedulePageResult<T = ScheduleTaskRow> {
  list: T[];
  total: number;
}

/** 查询定时任务列表 */
export function findScheduleTaskList(data: ScheduleTaskQuery) {
  return request.post<SchedulePageResult>('/system/back/schedule/task/list', data);
}

/** 任务详情 */
export function getScheduleTask(id: string) {
  return request.get<ScheduleTaskRow>(`/system/back/schedule/task/${id}`);
}

/** 新增任务 */
export function saveScheduleTask(data: Partial<ScheduleTaskRow>) {
  return request.post<{ id: string; message: string }>('/system/back/schedule/task', data);
}

/** 编辑任务 */
export function updateScheduleTask(id: string, data: Partial<ScheduleTaskRow>) {
  return request.put<{ id: string; message: string }>(`/system/back/schedule/task/${id}`, data);
}

/** 删除任务（软删+CANCEL） */
export function delScheduleTask(ids: string) {
  return request.delete(`/system/back/schedule/task/${ids}`, {});
}

/** 启用/暂停 */
export function changeScheduleTaskStatus(id: string, status: string) {
  return request.put<{ id: string; message: string }>(`/system/back/schedule/task/${id}/status?status=${status}`, {});
}

/** 按应用/来源批量启停（appId/source 均可空=全组织范围） */
export function batchScheduleTaskStatus(appId: string | undefined, source: string | undefined, status: string) {
  const params = new URLSearchParams();
  if (appId) params.set('appId', appId);
  if (source) params.set('source', source);
  params.set('status', status);
  return request.put<number>(`/system/back/schedule/task/status/batch?${params.toString()}`, {});
}

/** 手动执行 */
export function runScheduleTask(id: string) {
  return request.post<{ id: string; message: string }>(`/system/back/schedule/task/${id}/run`, {});
}

/** 终止运行中 */
export function terminateScheduleTask(id: string) {
  return request.post<{ id: string; message: string }>(`/system/back/schedule/task/${id}/terminate`, {});
}

/** 未来 N 次触发预览 */
export function previewScheduleTask(id: string, n = 5) {
  return request.get<{
    fireTimes: string[];
    jitterSeconds?: number;
    note?: string;
    queue?: Array<{ fireTime: string; cluster: number; estDelaySeconds: number }>;
    queueWarning?: string;
  }>(`/system/back/schedule/task/${id}/preview?n=${n}`);
}

/** cron 校验与预览 */
export function previewCron(cron: string, n = 5) {
  return request.get<{ fireTimes: string[] }>(
    `/system/back/schedule/task/cron-preview?cron=${encodeURIComponent(cron)}&n=${n}`
  );
}

/** ===== 执行记录 ===== */
export interface ScheduleLogQuery {
  pageNum: number;
  pageSize: number;
  organizationId?: string;
  taskId?: string;
  status?: string;
  source?: string;
  fireTimeBegin?: string;
  fireTimeEnd?: string;
}

export interface ScheduleLogRow {
  id: number;
  taskId: string;
  fireTime: string;
  attempt: number;
  taskVersion: number;
  status: string;
  executor?: string;
  startTime?: string;
  endTime?: string;
  costMs?: number;
  errorMsg?: string;
  resultDigest?: string;
  actionSnapshot?: string;
  source: string;
  appId?: string;
}

export function findScheduleLogList(data: ScheduleLogQuery) {
  return request.post<SchedulePageResult<ScheduleLogRow>>('/system/back/schedule/log/list', data);
}

export function getScheduleLog(id: number) {
  return request.get<ScheduleLogRow>(`/system/back/schedule/log/${id}`);
}

export function retryScheduleLog(id: number) {
  return request.post<{ id: string; message: string }>(`/system/back/schedule/log/${id}/retry`, {});
}

/** ===== 实例与配额 ===== */
export interface ScheduleInstanceState {
  instances: Array<{
    instanceId: string;
    role: string;
    leaseUntil: string;
    startTime: string;
    statJson?: string;
  }>;
  locks: Array<{ lockKey: string; holder?: string; leaseUntil: string; version: number }>;
  local: string;
  pool: string;
}

export function findScheduleInstanceState() {
  return request.get<ScheduleInstanceState>('/system/back/schedule/instance/list');
}

export function findScheduleQuota() {
  return request.get<Record<string, unknown>>('/system/back/schedule/quota');
}

/** ===== 任务报警列表（§15，D5-C 一期）===== */
export interface ScheduleAlarmItem {
  code: string;
  title: string;
  value: string;
  threshold: string;
  hit: boolean;
  detail: string;
}

export interface ScheduleAlarmResult {
  alarms: ScheduleAlarmItem[];
  appFailures: Array<{ appId: string; total: number; failed: number; rate: string }>;
  metricTrend: Array<{ metric: string; value: string | number }>;
  hitCount: number;
}

export function findScheduleAlarms() {
  return request.get<ScheduleAlarmResult>('/system/back/schedule/alarm/list');
}
