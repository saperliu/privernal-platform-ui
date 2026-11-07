/**
 * 大屏运行态取数调度。
 *
 * 一个屏只有一个 runtime 实例（由预览/投放页 provide），画布上所有组件从同一份结果里读：
 * 首屏走一次整屏批量接口，而不是几十个组件各自发请求——那样会把后端连接占满，
 * 也让「整屏数据是同一时刻的」这件事无从保证。
 */
import { inject, onScopeDispose, provide, reactive, ref, toValue, watch } from 'vue';
import type { InjectionKey, MaybeRefOrGetter, Ref } from 'vue';
import { queryDatavScreenBatch, queryDatavWidgetData } from '@/service';
import { INITIAL_CONNECTION, noteFailure, noteSuccess } from '@/utils/datav-connection';
import type { ConnectionState } from '@/utils/datav-connection';

/** 后端与浏览器的共同下限：低于 5s 的刷新周期在大屏上只会变成压测 */
const MIN_INTERVAL_SEC = 5;

/** 单次补取的组件上限，与后端 MAX_BATCH_WIDGETS 同量级 */
const MAX_CONCURRENT_REFRESH = 8;

/**
 * 实时组件在 WS 不在时的兜底轮询周期。
 * 没有这条兜底，「实时组件」会在通道断开后变成永远不动的组件——那比刷新慢更糟，
 * 因为画面看起来一切正常。
 */
const REALTIME_FALLBACK_SEC = 30;

export interface DatavRuntime {
  /** 批量首屏 + 之后按各组件 refresh 策略续期 */
  refreshAll(): Promise<void>;

  /** 只刷指定组件（联动、参数变更后局部重取用） */
  refreshWidgets(widgetIds: string[]): Promise<void>;

  /** widgetId → 取数结果；组件直接读这里，不需要自己发请求 */
  results: Record<string, DatavNamespace.WidgetResult>;

  /**
   * 整屏连接状态（M6.3 断线重连提示）。
   * 只反映「请求这一层通不通」，单组件的配置错误不算断线，见 utils/datav-connection。
   */
  connection: Ref<ConnectionState>;
}

const RUNTIME_KEY: InjectionKey<DatavRuntime> = Symbol('DatavRuntime');

/**
 * 取数通道：默认走登录态接口（/back/datav/data/*）；外链免登页注入 /pub 通道。
 * 独立成接口而不是加个 boolean：pub 通道还带 shareCode/sign 两个身份参数，布尔开关装不下。
 */
export interface DatavRuntimeTransport {
  batch(
    screenCode: string,
    params?: Record<string, unknown>,
    drills?: Record<string, number>
  ): Promise<{
    error: { message: string } | null;
    data: DatavNamespace.BatchResult | null;
  }>;

  single(
    screenCode: string,
    widgetId: string,
    params?: Record<string, unknown>,
    drillLevel?: number
  ): Promise<{ error: { message: string } | null; data: ReportChartNamespace.AggResult | null }>;
}

export interface DatavRuntimeOptions {
  screenCode: MaybeRefOrGetter<string>;

  /** 取数通道（外链免登页用）；缺省走登录态接口 */
  transport?: DatavRuntimeTransport;

  /** 画布组件（含隐藏判定） */
  widgets: MaybeRefOrGetter<DatavNamespace.Widget[]>;

  /** 大屏运行时参数：变化即整屏重取 */
  params?: MaybeRefOrGetter<Record<string, unknown>>;

  /**
   * 联动覆盖项（M6.2）：参数与下钻层级。
   *
   * 刻意**不**并进 `params` 也不参与它的比较：联动是观众点出来的，
   * 走 params 会让每次点击都触发整屏重取，而 6.2 要的是「只刷受影响的那几个组件」。
   * 这里给的值只在发请求那一刻读一次，所以定时器续期与补取都自动带着当前联动状态。
   */
  overrides?: MaybeRefOrGetter<DatavRuntimeOverrides | null>;

  /**
   * 实时节拍通道是否在线。在线时 strategy=realtime 的组件由 tick 驱动、不再自己排期；
   * 不在线时它们退回 {@link REALTIME_FALLBACK_SEC} 轮询。
   */
  realtimeLive?: MaybeRefOrGetter<boolean>;
}

export interface DatavRuntimeOverrides {
  params?: Record<string, unknown>;

  drills?: Record<string, number>;
}

function emptyResult(status: DatavNamespace.WidgetResult['status']): DatavNamespace.WidgetResult {
  return { status, rows: [] };
}

/** 只有绑定了数据集且当前可见的组件才需要取数 */
function queryable(widgets: DatavNamespace.Widget[]): string[] {
  return widgets
    .filter(widget => !widget.layout.hidden && widget.data?.mode === 'dataset' && widget.data.datasetCode)
    .map(widget => widget.id);
}

export function createDatavRuntime(options: DatavRuntimeOptions): DatavRuntime {
  const results = reactive<Record<string, DatavNamespace.WidgetResult>>({});
  const connection = ref<ConnectionState>(INITIAL_CONNECTION);

  /** widgetId → 下次应刷新时间戳；只有 interval 策略会写这里 */
  const dueAt = new Map<string, number>();

  let timer: ReturnType<typeof setInterval> | null = null;

  function widgetById(widgetId: string): DatavNamespace.Widget | undefined {
    return toValue(options.widgets).find(widget => widget.id === widgetId);
  }

  function schedule(widgetId: string) {
    const refresh = widgetById(widgetId)?.data?.refresh;
    if (!refresh || refresh.strategy === 'none' || refresh.strategy === 'manual') return;

    if (refresh.strategy === 'realtime') {
      // 节拍在线：由 useDatavRealtime 统一叫醒，这里不重复排期（否则等于白多打一次库）
      if (toValue(options.realtimeLive)) return;
      dueAt.set(
        widgetId,
        Date.now() + Math.max(MIN_INTERVAL_SEC, Math.round(refresh.intervalSec || REALTIME_FALLBACK_SEC)) * 1000
      );
      return;
    }

    const sec = Math.max(MIN_INTERVAL_SEC, Math.round(refresh.intervalSec || MIN_INTERVAL_SEC));
    dueAt.set(widgetId, Date.now() + sec * 1000);
  }

  /** 失败时按组件自己的 onError 决定留不留上一次的数 */
  function applyError(widgetId: string, message: string) {
    const previous = results[widgetId];
    const onError = widgetById(widgetId)?.data?.refresh?.onError ?? 'keepLast';

    if (onError === 'clear') {
      results[widgetId] = { status: 'error', rows: [], error: message };
      return;
    }
    results[widgetId] = {
      status: 'error',
      rows: previous?.rows ?? [],
      dimensionAliases: previous?.dimensionAliases,
      measureAliases: previous?.measureAliases,
      dimensionLabels: previous?.dimensionLabels,
      measureLabels: previous?.measureLabels,
      fetchedAt: previous?.fetchedAt,
      error: message
    };
    // 只在「好→坏」的沿报警一次，否则每轮刷新失败都弹一条，投放屏很快就全是提示
    if (onError === 'alert' && previous?.status !== 'error') {
      window.$message?.warning?.(`${widgetById(widgetId)?.name || widgetId} 取数失败：${message}`);
    }
  }

  function applySuccess(widgetId: string, data: ReportChartNamespace.AggResult) {
    results[widgetId] = {
      status: 'ok',
      rows: data.rows ?? [],
      dimensionAliases: data.dimensionAliases,
      measureAliases: data.measureAliases,
      dimensionLabels: data.dimensionLabels,
      measureLabels: data.measureLabels,
      // 降级必须透传：丢了它，投屏上摆的是三天前的数字而所有人都以为是一分钟前的
      stale: data.stale,
      fetchedAt: Date.now()
    };
    schedule(widgetId);
  }

  /** 整屏批量是否在进行中；进行中再来的请求只记一次「稍后再补」，避免慢后端下请求堆积 */
  let batching = false;

  let refetchQueued = false;

  async function refreshAll() {
    if (batching) {
      refetchQueued = true;
      return;
    }
    const screenCode = toValue(options.screenCode);
    const ids = queryable(toValue(options.widgets));
    if (!screenCode || !ids.length) return;

    batching = true;
    try {
      await runBatch(screenCode, ids);
    } finally {
      batching = false;
    }

    if (refetchQueued) {
      refetchQueued = false;
      await refreshAll();
    }
  }

  /** 发请求那一刻的实参：画布参数打底，联动覆盖在后（同一参数以联动为准） */
  function requestParams(): Record<string, unknown> {
    return { ...(toValue(options.params) ?? {}), ...(toValue(options.overrides)?.params ?? {}) };
  }

  function requestDrills(): Record<string, number> | undefined {
    return toValue(options.overrides)?.drills;
  }

  async function runBatch(screenCode: string, ids: string[]) {
    ids.forEach(id => {
      if (results[id]?.status !== 'ok') results[id] = emptyResult('loading');
    });

    const batchCall = options.transport?.batch ?? queryDatavScreenBatch;
    const { error, data } = await batchCall(screenCode, requestParams(), requestDrills());
    if (error || !data) {
      connection.value = noteFailure(connection.value, Date.now());
      ids.forEach(id => applyError(id, error?.message || '整屏取数失败'));
      // 整屏失败也要续期，否则一次网络抖动后这屏就永久停在旧数据上
      ids.forEach(id => schedule(id));
      return;
    }
    connection.value = noteSuccess(connection.value, Date.now());

    ids.forEach(id => {
      const item = data.items[id];
      if (!item) {
        applyError(id, '后端未返回该组件的结果，可能未绑定数据集');
        return;
      }
      if (item.success && item.data) applySuccess(id, item.data);
      else applyError(id, item.error || '取数失败');
      schedule(id);
    });
  }

  async function refreshWidgets(widgetIds: string[]) {
    const screenCode = toValue(options.screenCode);
    if (!screenCode) return;

    const params = requestParams();
    const drills = requestDrills() ?? {};

    /** 一组内并发取数，返回这一组里是否有过成功（用于汇总连接状态） */
    async function refreshChunk(chunk: string[]) {
      let chunkOk = false;
      await Promise.all(
        chunk.map(async widgetId => {
          results[widgetId] = { ...(results[widgetId] ?? emptyResult('loading')), status: 'loading' };
          const singleCall = options.transport?.single ?? queryDatavWidgetData;
          const { error, data } = await singleCall(screenCode, widgetId, params, drills[widgetId]);
          if (error || !data) applyError(widgetId, error?.message || '取数失败');
          else {
            chunkOk = true;
            applySuccess(widgetId, data);
          }
          schedule(widgetId);
        })
      );
      return chunkOk;
    }

    // 分批而不是 Promise.all 全量：8 个一组，避免一次联动把整屏几十个查询同时打出去
    const chunks: string[][] = [];
    for (let from = 0; from < widgetIds.length; from += MAX_CONCURRENT_REFRESH) {
      chunks.push(widgetIds.slice(from, from + MAX_CONCURRENT_REFRESH));
    }

    // 组间串行、组内并发：逐组等待，任一组成功即视为本次局部刷新成功
    const anyOk = await chunks.reduce(
      (chain, chunk) =>
        chain.then(async prev => {
          const ok = await refreshChunk(chunk);
          return prev || ok;
        }),
      Promise.resolve(false)
    );

    /**
     * 局部刷新也要更新连接状态，否则首屏之后就再也没有整屏请求，横幅会永远停在旧判断上。
     * 但「全组都失败」只有在一次补取多个组件时才算断线证据：只点了一个组件时，
     * 全失败可能就是它自己的配置坏了，说成断线会把人支去查网络。
     */
    if (anyOk) connection.value = noteSuccess(connection.value, Date.now());
    else if (widgetIds.length > 1) connection.value = noteFailure(connection.value, Date.now());
  }

  function tick() {
    const now = Date.now();
    const due: string[] = [];
    dueAt.forEach((time, widgetId) => {
      if (time <= now) due.push(widgetId);
    });
    if (!due.length) return;
    due.forEach(widgetId => dueAt.delete(widgetId));
    refreshWidgets(due);
  }

  // 单一 1s 定时器统一管所有组件的续期：几十个组件各挂一个 setInterval 时，
  // 刷新时刻会随机错开，投放屏上看到的就是一屏数据永远不在同一时刻
  timer = setInterval(tick, 1000);

  if (options.params) {
    // 参数一变整屏重取：大屏参数通常是组织/时间范围，留着旧结果的组件会和新参数对不上。
    // 比较必须走序列化值而不是对象引用：params 每次重算都是新建对象，
    // 按引用比较会把「内容完全没变」也当成变化——端到端实测过，首屏因此多打了一次整屏批量请求。
    const stop = watch(
      () => JSON.stringify(toValue(options.params) ?? {}),
      () => {
        refreshAll();
      }
    );
    onScopeDispose(stop);
  }

  onScopeDispose(() => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  });

  const runtime: DatavRuntime = { results, connection, refreshAll, refreshWidgets };

  return runtime;
}

/** 由宿主页面注入，组件侧只读不写 */
export function provideDatavRuntime(runtime: DatavRuntime) {
  provide(RUNTIME_KEY, runtime);
}

/** 编辑器里没有 runtime（设计态不实时取数），返回 null 由调用方回落到静态样例行 */
export function useDatavRuntime(): DatavRuntime | null {
  return inject(RUNTIME_KEY, null);
}
