/**
 * 大屏图表组件的 ECharts 生命周期。
 *
 * 与 @/hooks/common/echarts 分开是有意的：那个钩子跟随**后台界面**的暗色模式，
 * 而大屏的明暗由画布自己的 `canvas.theme` 决定（同一块屏嵌在浅色后台里也得是深色）；
 * 投放时整屏被 CSS 放大，画布还要按缩放比抬高 devicePixelRatio，否则文字发糊。
 *
 * 颜色不在这里写死：一律从 `.datav-scope` 上的 CSS 变量读，切配色板时图表跟着变。
 */
import { onMounted, onScopeDispose, ref, shallowRef, watch } from 'vue';
import type { Ref } from 'vue';
import { useElementSize } from '@vueuse/core';
import * as echarts from 'echarts/core';
import {
  BarChart,
  FunnelChart,
  GaugeChart,
  GraphChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart
} from 'echarts/charts';
import { GridComponent, LegendComponent, RadarComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { findClickedRow, findPointIndexForCode } from '@/utils/datav-linkage';
import type { ChartPalette, DatavECOption } from '@/packages/components/charts/chart-option';
import { useDatavRuntime } from './useDatavRuntime';
import { useWidgetLinkage } from './useDatavLinkage';
import { useDatavStage } from './useDatavStage';

// RadarComponent 必须显式注册：RadarChart 只带系列，坐标系不在里面，
// 漏掉时 ECharts 报「component radar is not registered」并画不出东西。
// 后台的 hooks/common/echarts 注册了 RadarChart 却没注册 RadarComponent，所以那边也不能直接用雷达。
echarts.use([
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
  // 图表标题（属性面板「标题」分组）走 option.title，不注册时静默不渲染
  TitleComponent,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart,
  FunnelChart,
  GraphChart,
  LabelLayout,
  CanvasRenderer
]);

/** 配色板固定 8 色，见 src/styles/css/datav-theme.css */
const SERIES_TOKEN_COUNT = 8;

const TOKEN_TEXT = '--datav-text-primary';

const TOKEN_TEXT_SECONDARY = '--datav-text-secondary';

const TOKEN_SPLIT_LINE = '--datav-grid';

function readToken(styles: CSSStyleDeclaration, token: string): string {
  return styles.getPropertyValue(token).trim();
}

/** 可写的 series 视图：联动要往已构建的 option 里补 select 相关配置 */
type WritableSeries = {
  selectedMode?: string;

  select?: { itemStyle?: Record<string, unknown> };

  [key: string]: unknown;
};

/**
 * option.series 可能是单个对象也可能是数组，统一成数组视图。
 * 不复制元素，改的就是 option 里那份。
 */
function seriesOf(option: unknown): WritableSeries[] {
  const raw = (option as { series?: unknown } | null)?.series;
  if (Array.isArray(raw)) return raw as WritableSeries[];
  if (raw && typeof raw === 'object') return [raw as WritableSeries];
  return [];
}

export interface DatavChartHandle {
  domRef: Ref<HTMLElement | null>;

  /** 在 option 构建期间调用：从当前 DOM 读主题色与配色板 */
  palette: () => ChartPalette;
}

/**
 * @param build 每次数据、样式或配色板变化时重建 option；
 *              构建函数里读到的响应式依赖（取数结果、widget.style）都会被自动跟踪，
 *              配色板、主题与缩放比额外由画布触发，因为它们体现在 CSS 变量和 DPR 上而不是响应式数据里。
 *
 * palette 以参数传入而不是让组件从返回值解构后在闭包里引用：
 * watch 建 getter 时会同步执行一次 build()，若 build 里引用的是
 * `const { palette } = useDatavChart(...)` 的解构产物，那一刻 const 还没赋值（TDZ），
 * 带数据的组件会直接 ReferenceError 并打断整个调度器。
 */
export function useDatavChart(build: (palette: () => ChartPalette) => DatavECOption | null): DatavChartHandle {
  const domRef = ref<HTMLElement | null>(null);
  const chart = shallowRef<echarts.ECharts | null>(null);
  const stage = useDatavStage();
  const runtime = useDatavRuntime();
  const { widget, linkage } = useWidgetLinkage();

  /** 上一轮高亮落在哪个数据点上；换选中或换组件时必须先撤下来，否则屏上会留着两根「都选中」 */
  let selectedPoint: { seriesIndex: number; dataIndex: number } | null = null;

  /** 最近一次真正画上去的 option，选中变化时按它重算高亮落点 */
  let lastOption: DatavECOption | null = null;

  function currentRows(): ReportChartNamespace.AggRow[] {
    if (!widget || !runtime) return [];
    return runtime.results[widget.id]?.rows ?? [];
  }

  function accentColor(): string {
    if (!domRef.value) return '';
    return readToken(getComputedStyle(domRef.value), '--datav-accent');
  }

  /**
   * 联动高亮用 ECharts 原生 select，而不是把高亮画进 option。
   *
   * option 每次取数都整份重建（notMerge），写进 option 就得让 14 个构建函数都认识这个状态；
   * select 是实例上的状态，代价是**重建后必须重新打一遍**，所以它挂在 apply 末尾。
   * `selectedMode` 必须在 setOption 之前就位——series 上没有它，select 动作是空操作。
   */
  function prepareSelection(option: DatavECOption | null) {
    if (!option || !widget || !linkage) return;
    if (!linkage.highlightLabel(widget)) return;
    const accent = accentColor();
    seriesOf(option).forEach(series => {
      series.selectedMode = 'single';
      series.select = {
        ...(series.select || {}),
        itemStyle: { borderColor: accent, borderWidth: 2, ...(series.select?.itemStyle || {}) }
      };
    });
  }

  function applyHighlight(option: DatavECOption | null) {
    const instance = chart.value;
    if (!instance || !widget || !linkage) return;
    if (selectedPoint) {
      instance.dispatchAction({ type: 'unselect', ...selectedPoint });
      selectedPoint = null;
    }
    const selection = linkage.selection;
    if (!selection || !option || !linkage.highlightLabel(widget)) return;
    const point = findPointIndexForCode(option, currentRows(), {
      alias: selection.alias,
      code: selection.code,
      split: widget.data?.mapping?.split || undefined
    });
    if (!point) return;
    instance.dispatchAction({ type: 'select', ...point });
    selectedPoint = point;
  }

  function bindClick(instance: echarts.ECharts) {
    if (!widget || !linkage) return;
    instance.on('click', event => {
      const params = event as unknown as { name?: unknown; seriesName?: unknown; dataIndex?: number };
      const row = findClickedRow(currentRows(), {
        name: params.name,
        seriesName: params.seriesName,
        dataIndex: params.dataIndex,
        seriesCount: seriesOf(instance.getOption()).length
      });
      if (row) linkage.click(widget, row);
    });
  }

  /** 实例创建时定死的两个参数，变了只能重建：ECharts 的 theme 与 DPR 不能setOption 改 */
  let createdTheme = '';

  let createdRatio = 0;

  const { width, height } = useElementSize(domRef, { width: 0, height: 0 });

  function pixelRatio() {
    const base = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    // 缩放比钳在 0.5~4：缩略图模式下画布被压到极小，按实际倍率建图只是浪费显存
    return base * Math.max(0.5, Math.min(4, stage?.scale.value || 1));
  }

  function palette(): ChartPalette {
    const styles = domRef.value ? getComputedStyle(domRef.value) : null;
    const series: string[] = [];
    if (styles) {
      for (let i = 1; i <= SERIES_TOKEN_COUNT; i += 1) {
        const color = readToken(styles, `--datav-series-${i}`);
        if (color) series.push(color);
      }
    }
    return {
      text: styles ? readToken(styles, TOKEN_TEXT) : '',
      textSecondary: styles ? readToken(styles, TOKEN_TEXT_SECONDARY) : '',
      splitLine: styles ? readToken(styles, TOKEN_SPLIT_LINE) : '',
      series
    };
  }

  function dispose() {
    chart.value?.dispose();
    chart.value = null;
    createdTheme = '';
    createdRatio = 0;
    // 实例没了，高亮落点也就失效了：留着旧下标会在重建后 select 到另一根柱子上
    selectedPoint = null;
  }

  function apply(option: DatavECOption | null) {
    if (!option) {
      dispose();
      return;
    }
    const el = domRef.value;
    if (!el || width.value <= 0 || height.value <= 0) return;

    const theme = stage?.canvas.value.theme === 'light' ? 'light' : 'dark';
    const ratio = pixelRatio();
    if (chart.value && (theme !== createdTheme || ratio !== createdRatio)) {
      dispose();
    }
    if (!chart.value) {
      // light 走 ECharts 默认主题（内置 'dark' 的坐标轴样式并不完整）
      chart.value = echarts.init(el, theme === 'light' ? undefined : theme, { devicePixelRatio: ratio });
      createdTheme = theme;
      createdRatio = ratio;
      bindClick(chart.value);
    }
    prepareSelection(option);
    // notMerge：系列数量随维度变化，合并更新会留下上一次多出来的系列
    chart.value.setOption(option, true);
    lastOption = option;
    applyHighlight(option);
  }

  watch([width, height], () => {
    // 首帧容器尺寸往往还是 0，等到这里才有真正的宽高可以建实例
    if (chart.value) chart.value.resize();
    else apply(build(palette));
  });

  onMounted(() => {
    apply(build(palette));
  });

  // 不写 immediate：首次建图统一交给 onMounted，watch 只负责「依赖变了就重建」。
  // getter 里必须真的调 build()：取数结果与 widget.style 的依赖靠它跟踪，
  // 挪进回调就断链了。palette 走参数所以这里没有 TDZ 问题。
  // flush: 'post' 是必需的——配色板由 data-datav-palette 属性驱动 CSS 变量，
  // 必须在 DOM 更新之后再读，否则切板时读到的是上一块板的颜色
  watch(
    () => ({
      theme: stage?.canvas.value.theme,
      paletteKey: stage?.canvas.value.palette,
      // 缩放比按 0.1 档取整：连续拖窗口时逐像素重建几十个图表会把编辑器卡死，
      // 而 10% 以内的 DPR 误差肉眼看不出来
      ratioStep: Math.round((stage?.scale.value || 1) * 10) / 10,
      option: build(palette)
    }),
    next => apply(next.option),
    { flush: 'post' }
  );

  /**
   * 选中变了但本组件的数据没变（典型：点的是别的组件，本组件只是跟着亮）时，
   * 上面那个 watch 不会触发 apply，高亮会停在上一轮。
   */
  if (widget && linkage) {
    const stopHighlight = watch(
      () => `${linkage.highlightLabel(widget)}|${linkage.selection?.code ?? ''}`,
      () => applyHighlight(lastOption),
      { flush: 'post' }
    );
    onScopeDispose(stopHighlight);
  }

  onScopeDispose(dispose);

  return { domRef, palette };
}
