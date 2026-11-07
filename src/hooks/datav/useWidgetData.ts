/**
 * 组件侧的取数视图。
 *
 * 组件一律通过这里拿数据，而不是自己调接口，三处来源在这里收敛成同一条投影路径：
 * - 预览/投放：整屏 runtime 的批量结果（唯一会持续刷新的来源）
 * - 编辑器：`store.designPreview` 的缓存（属性面板点「预览取数」写进来，不属 schema）
 * - 两者都没有：回落到 `staticRows`
 *
 * 因此同一份组件代码在编辑器与投放屏上都能跑，不需要 `if (isDesign)` 分支。
 */
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useDatavStore } from '@/store';
import { applyPipeline } from '@/utils/datav-data';
import { useDatavRuntime } from './useDatavRuntime';

export function useWidgetData(widget: MaybeRefOrGetter<DatavNamespace.Widget>) {
  const runtime = useDatavRuntime();
  const store = useDatavStore();

  const isDataset = computed(() => toValue(widget).data?.mode === 'dataset');

  /**
   * 运行态结果优先：编辑器缓存只该在设计态出现，
   * 否则预览页一次失败的刷新会被一份旧缓存盖过去，屏幕上看到的是「成功」的假象。
   */
  const result = computed<DatavNamespace.WidgetResult | null>(() => {
    if (!isDataset.value) return null;
    const widgetId = toValue(widget).id;
    if (runtime) return runtime.results[widgetId] ?? null;

    const cached = store.designPreview[widgetId];
    if (!cached) return null;
    return {
      status: 'ok',
      rows: cached.rows ?? [],
      dimensionAliases: cached.dimensionAliases,
      measureAliases: cached.measureAliases,
      dimensionLabels: cached.dimensionLabels,
      measureLabels: cached.measureLabels
    };
  });

  /**
   * 组件统一按 `AggResult` 投影：静态模式下别名清单为空，
   * 投影层自然回落到 `dim0` / `value`。
   * 数据加工管线（过滤/排序/Top N）在两路来源汇合后统一应用——
   * 静态数据与数据集结果的行为因此一致，编辑器所见即投放所得。
   */
  const view = computed<ReportChartNamespace.AggResult>(() => {
    const pipeline = toValue(widget).data?.pipeline;
    if (isDataset.value) {
      // 取数结果里没有 reportType/limit（画什么由组件类型决定），这里补齐投影层需要的最小外壳
      const merged = { reportType: '', limit: 0, rows: [], ...result.value };
      return { ...merged, rows: applyPipeline(merged.rows, pipeline) };
    }
    const staticRows = toValue(widget).data?.staticRows ?? [];
    return { reportType: 'table', limit: staticRows.length, rows: applyPipeline(staticRows, pipeline) };
  });

  const rows = computed<ReportChartNamespace.AggRow[]>(() => view.value.rows);

  const mapping = computed(() => toValue(widget).data?.mapping);

  const loading = computed(() => result.value?.status === 'loading');

  /** 出错时保留上次数据的组件会同时有 error 与 rows，渲染层用 error 只做角标提示 */
  const error = computed(() => (result.value?.status === 'error' ? result.value?.error : undefined));

  const fetchedAt = computed(() => result.value?.fetchedAt);

  async function refresh() {
    if (!runtime || !isDataset.value) return;
    await runtime.refreshWidgets([toValue(widget).id]);
  }

  /** 数据是上次快照的降级标记（仅运行态有意义） */
  const stale = computed(() => Boolean(result.value?.stale));

  return {
    rows,
    view,
    mapping,
    result,
    loading,
    error,
    stale,
    fetchedAt,
    refresh,
    hasRuntime: Boolean(runtime)
  };
}
