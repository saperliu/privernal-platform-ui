/**
 * ECharts option 组装（纯函数）。
 *
 * 只吃「投影结果 + 已解析好的颜色」，不碰 CSS、不碰 echarts 实例，且对 echarts 只有类型依赖：
 * 因此可以被 node 直接跑起来断言（scripts/test-datav-utils.mjs），组件里剩下的就只有模板和尺寸。
 * 扩展注册（echarts.use）留在 useDatavChart，那一层才需要真的库。
 */
import type * as echarts from 'echarts/core';
import type {
  BarSeriesOption,
  FunnelSeriesOption,
  GaugeSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
  RadarSeriesOption,
  ScatterSeriesOption
} from 'echarts/charts';
import type {
  GridComponentOption,
  LegendComponentOption,
  RadarComponentOption,
  TooltipComponentOption
} from 'echarts/components';
import type { CategorySeries, PieSlice, ScatterPoint } from '@/utils/datav-data';

export type DatavECOption = echarts.ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | ScatterSeriesOption
  | RadarSeriesOption
  | GaugeSeriesOption
  | FunnelSeriesOption
  | GridComponentOption
  | RadarComponentOption
  | LegendComponentOption
  | TooltipComponentOption
>;

export interface ChartPalette {
  /**
   * 由 useDatavChart 从 CSS 变量读出，因此组件必须渲染在 `.datav-scope` 内；
   * 脱离画布作用域（如列表页缩略图）时这里会读空，颜色交给 ECharts 主题而不是兜底色。
   */
  text: string;

  textSecondary: string;

  /** 数值轴分隔线与类目轴线颜色，取自 --datav-grid */
  splitLine: string;

  series: string[];
}

/**
 * 标题与图例的通用配置（参考 go-view 属性面板的公共配置区）。
 * 各图表现有 Style 接口以 `& CommonChartStyle` 方式并入，默认值经 COMMON_DEFAULTS 展开。
 */
export interface CommonChartStyle {
  titleShow: boolean;

  /** 标题文本；空文本等价于不显示 */
  titleText: string;

  titleSize: number;

  /** 标题水平对齐：left 贴绘图区左缘，center 居中 */
  titleAlign: 'left' | 'center';

  legendOrient: 'horizontal' | 'vertical';

  /** 图例停靠边；默认值各图不同（轴类图 top、饼图 right、漏斗 bottom），由各自 DEFAULT 决定 */
  legendPos: 'top' | 'bottom' | 'left' | 'right';

  legendSize: number;
}

const COMMON_DEFAULTS: CommonChartStyle = {
  titleShow: false,
  titleText: '',
  titleSize: 14,
  titleAlign: 'center',
  legendOrient: 'horizontal',
  legendPos: 'top',
  legendSize: 12
};

/**
 * 把标题/图例配置写进已组装的 option（原地修改）。
 *
 * - 标题显示时占据顶部，同侧图例与 grid 自动下移让位，避免三层叠在一起
 * - 图例停靠 left/right 时强制竖排（横排贴边会把绘图区挤成一条），top/bottom 尊重 orient
 * - legendVisible=false（单系列或用户关闭）时图例整体不渲染，与既有行为一致
 */
function applyCommonOption(
  option: Record<string, any>,
  palette: ChartPalette,
  style: CommonChartStyle,
  legendVisible: boolean
): void {
  const titleVisible = style.titleShow && style.titleText.trim() !== '';
  if (titleVisible) {
    option.title = {
      show: true,
      text: style.titleText,
      left: style.titleAlign === 'center' ? 'center' : 8,
      top: 4,
      textStyle: { color: palette.text, fontSize: style.titleSize, fontWeight: 600 }
    };
  }

  const legendBase = {
    textStyle: { color: palette.textSecondary, fontSize: style.legendSize },
    itemWidth: 10,
    itemHeight: 10,
    icon: 'roundRect'
  };
  if (legendVisible) {
    let placement: Record<string, unknown>;
    if (style.legendPos === 'left' || style.legendPos === 'right') {
      placement = {
        orient: 'vertical',
        [style.legendPos]: 6,
        top: 'middle'
      };
    } else {
      // 标题占了顶部时，顶部图例下移一行；标题居中与图例居中同行会字叠字
      const topOffset = style.legendPos === 'top' && titleVisible ? 26 : 0;
      placement = {
        orient: style.legendOrient,
        [style.legendPos]: topOffset || 0,
        left: 'center'
      };
    }
    option.legend = { show: true, ...legendBase, ...placement };
  } else {
    option.legend = { show: false };
  }

  // 标题占了顶部一行：绘图区下移让位，否则第一根柱子/最高点被压住
  if (titleVisible && option.grid) {
    option.grid.top = Number(option.grid.top ?? 0) + 24;
  }
}

/** 从组件 style 里提取标题/图例配置；overrides 提供组件特定的缺省（如饼图默认右停靠） */
export function commonStyleFrom(
  style: Record<string, unknown>,
  overrides: Partial<CommonChartStyle> = {}
): CommonChartStyle {
  const merged: CommonChartStyle = { ...COMMON_DEFAULTS, ...overrides };
  const text = typeof style.titleText === 'string' ? style.titleText : merged.titleText;
  const align = style.titleAlign === 'left' || style.titleAlign === 'center' ? style.titleAlign : merged.titleAlign;
  const orient = style.legendOrient === 'vertical' ? 'vertical' : merged.legendOrient;
  const pos = (['top', 'bottom', 'left', 'right'] as const).includes(style.legendPos as never)
    ? (style.legendPos as CommonChartStyle['legendPos'])
    : merged.legendPos;
  return {
    titleShow: style.titleShow === true,
    titleText: text,
    titleSize: Number(style.titleSize) > 0 ? Number(style.titleSize) : merged.titleSize,
    titleAlign: align,
    legendOrient: orient,
    legendPos: pos,
    legendSize: Number(style.legendSize) > 0 ? Number(style.legendSize) : merged.legendSize
  };
}

/** 轴类图从组件 style 提取坐标轴配置（轴名/标签显隐/类目反转/网格线），供 runtime 透传 */
export function axisStyleFrom(
  style: Record<string, unknown>
): Pick<AxisStyle, 'xAxisName' | 'yAxisName' | 'xLabelShow' | 'yLabelShow' | 'inverseX' | 'splitShow'> {
  return {
    xAxisName: typeof style.xAxisName === 'string' ? style.xAxisName : '',
    yAxisName: typeof style.yAxisName === 'string' ? style.yAxisName : '',
    xLabelShow: style.xLabelShow !== false,
    yLabelShow: style.yLabelShow !== false,
    inverseX: style.inverseX === true,
    splitShow: style.splitShow !== false
  };
}

export interface AxisStyle {
  type: 'bar' | 'line';

  /** 柱宽（设计稿像素），0 表示让 ECharts 按类目均分 */
  barWidth: number;

  stack: boolean;

  smooth: boolean;

  /** 折线面积渐变填充 */
  area: boolean;

  /** 阶梯连线（仅折线生效）：空为普通连线；start/middle/end 对应 ECharts 的 step 取值 */
  step: 'start' | 'middle' | 'end' | '';

  /** 数值直标在柱顶/线点上 */
  showLabel: boolean;

  legendShow: boolean;

  /** 类目名最多几个字，超出中间省略；大屏上长类目名会把绘图区挤没 */
  maxCategoryChars: number;

  /** X 轴名称（如「月份」） */
  xAxisName: string;

  /** Y 轴名称（如「销量」） */
  yAxisName: string;

  /** 类目轴标签显隐 */
  xLabelShow: boolean;

  /** 数值轴标签显隐 */
  yLabelShow: boolean;

  /** 类目轴反转（从右往左画） */
  inverseX: boolean;

  /** 数值轴网格分割线显隐 */
  splitShow: boolean;
}

const DEFAULT_AXIS_STYLE: AxisStyle & CommonChartStyle = {
  ...COMMON_DEFAULTS,
  type: 'bar',
  barWidth: 0,
  stack: false,
  smooth: false,
  area: false,
  step: '',
  showLabel: false,
  legendShow: true,
  maxCategoryChars: 6,
  xAxisName: '',
  yAxisName: '',
  xLabelShow: true,
  yLabelShow: true,
  inverseX: false,
  splitShow: true
};

function ellipsis(text: string | number, max: number): string {
  const label = String(text);
  if (label.length <= max || max <= 2) return label;
  const head = Math.ceil((max - 1) / 2);
  return `${label.slice(0, head)}…${label.slice(-(max - head - 1))}`;
}

/** 系列色不够就循环：配色板固定 8 色，维度值再多也不该出现 ECharts 默认色 */
export function colorAt(palette: ChartPalette, index: number): string {
  if (!palette.series.length) return palette.text;
  return palette.series[index % palette.series.length];
}

export function buildAxisOption(
  data: CategorySeries,
  palette: ChartPalette,
  style: Partial<AxisStyle & CommonChartStyle> = {}
): DatavECOption {
  const resolved: AxisStyle & CommonChartStyle = { ...DEFAULT_AXIS_STYLE, ...style };

  const label = { show: resolved.showLabel, color: palette.textSecondary, fontSize: 11 };
  const legendVisible = resolved.legendShow && data.series.length > 1;

  const series = data.series.map((item, index) => {
    const color = colorAt(palette, index);
    if (resolved.type === 'bar') {
      return {
        name: item.name,
        type: 'bar' as const,
        data: item.values,
        stack: resolved.stack ? 'total' : undefined,
        barWidth: resolved.barWidth > 0 ? resolved.barWidth : undefined,
        label,
        itemStyle: { color, borderRadius: [3, 3, 0, 0] as [number, number, number, number] }
      };
    }
    return {
      name: item.name,
      type: 'line' as const,
      data: item.values,
      stack: resolved.stack ? 'total' : undefined,
      smooth: resolved.smooth,
      // 阶梯与 smooth 互斥：ECharts 里 smooth 优先生效，同时配置会画出「圆角阶梯」的歧义形态
      step: resolved.step ? resolved.step : undefined,
      symbolSize: 6,
      lineStyle: { width: 2, color },
      // 单系列也保留连线：大屏观众靠形状读趋势，只留标记点会被读成散点图
      areaStyle: resolved.area ? { opacity: 0.18, color } : undefined,
      label,
      itemStyle: { color }
    };
  });

  const option: Record<string, any> = {
    animationDuration: 400,
    // ECharts 6 已废弃 grid.containLabel（不注册 LegacyGridContainLabel 就只告警不生效，
    // 轴标签会被裁到画布外），官方等价写法是 outerBoundsMode + outerBoundsContain
    grid: {
      left: 8,
      right: 12,
      top: legendVisible ? 30 : 12,
      bottom: 4,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: resolved.type === 'bar' ? 'shadow' : 'line' }
    },
    xAxis: {
      type: 'category',
      name: resolved.xAxisName || undefined,
      data: data.categories.map(item => ellipsis(item, resolved.maxCategoryChars)),
      inverse: resolved.inverseX,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: palette.splitLine } },
      axisLabel: {
        show: resolved.xLabelShow,
        color: palette.textSecondary,
        fontSize: 11,
        hideOverlap: true
      }
    },
    yAxis: {
      type: 'value',
      name: resolved.yAxisName || undefined,
      splitLine: {
        show: resolved.splitShow,
        lineStyle: { color: palette.splitLine, type: 'dashed' }
      },
      axisLabel: { show: resolved.yLabelShow, color: palette.textSecondary, fontSize: 11 }
    },
    series
  };
  applyCommonOption(option, palette, resolved, legendVisible);
  return option as DatavECOption;
}

export interface PieStyle {
  /** 环形内径百分比，0 就是实心饼 */
  innerRadius: number;

  showLabel: boolean;

  /** 南丁格尔玫瑰：按值大小拉开扇区半径 */
  rose: boolean;
}

const DEFAULT_PIE_STYLE: PieStyle & CommonChartStyle = {
  ...COMMON_DEFAULTS,
  // 饼图惯例：图例竖排停靠右侧，圆心左移避让（见 series.center）
  legendPos: 'right',
  innerRadius: 55,
  showLabel: false,
  rose: false
};

export function buildPieOption(
  slices: PieSlice[],
  palette: ChartPalette,
  style: Partial<PieStyle & CommonChartStyle> = {}
): DatavECOption {
  const resolved: PieStyle & CommonChartStyle = { ...DEFAULT_PIE_STYLE, ...style };
  const inner = Math.max(0, Math.min(85, resolved.innerRadius));

  const option: Record<string, any> = {
    animationDuration: 400,
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie' as const,
        // 图例默认占右侧，圆心左移到 38% 才不会被 16:9 的组件框挤成偏心
        center: resolved.legendPos === 'right' ? ['38%', '50%'] : ['50%', '50%'],
        radius: inner > 0 ? [`${inner}%`, '78%'] : ['0%', '78%'],
        roseType: resolved.rose ? 'radius' : undefined,
        label: { show: resolved.showLabel, color: palette.textSecondary, fontSize: 11 },
        labelLine: { show: resolved.showLabel },
        data: slices.map((slice, index) => ({
          name: slice.name,
          value: slice.value,
          itemStyle: { color: colorAt(palette, index) }
        }))
      }
    ]
  };
  applyCommonOption(option, palette, resolved, true);
  return option as DatavECOption;
}

export interface GaugeStyle {
  /** 0 表示按当前值自动取档 */
  max: number;

  unit: string;

  showTicks: boolean;
}

const DEFAULT_GAUGE_STYLE: GaugeStyle = { max: 0, unit: '', showTicks: true };

/**
 * 仪表盘：单值组件。`max` 留 0 时按当前值上浮 25% 取整档，
 * 否则同一块屏上不同时刻截到的量程会跳变。
 */
export function buildGaugeOption(value: number, palette: ChartPalette, style: Partial<GaugeStyle> = {}): DatavECOption {
  const resolved: GaugeStyle = { ...DEFAULT_GAUGE_STYLE, ...style };
  const accent = colorAt(palette, 0);
  const max = resolved.max > 0 ? resolved.max : Math.max(1, Math.ceil((value * 1.25) / 5) * 5);

  return {
    series: [
      {
        type: 'gauge' as const,
        center: ['50%', '58%'],
        radius: '92%',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max,
        splitNumber: 5,
        axisLine: { lineStyle: { width: 10, color: [[1, palette.splitLine]] } },
        progress: { show: true, width: 10, itemStyle: { color: accent } },
        axisTick: {
          show: resolved.showTicks,
          distance: -14,
          splitNumber: 5,
          lineStyle: { width: 1, color: palette.splitLine }
        },
        splitLine: {
          show: resolved.showTicks,
          distance: -16,
          length: 8,
          lineStyle: { width: 1, color: palette.splitLine }
        },
        axisLabel: {
          show: resolved.showTicks,
          distance: 20,
          color: palette.textSecondary,
          fontSize: 10,
          formatter: (tickValue: number | string) => String(tickValue)
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '58%',
          width: 6,
          offsetCenter: [0, '-10%'],
          itemStyle: { color: accent }
        },
        anchor: { show: true, showAbove: true, size: 10, itemStyle: { color: accent } },
        title: { show: false },
        detail: {
          valueAnimation: true,
          fontSize: 22,
          offsetCenter: [0, '36%'],
          color: palette.text,
          formatter: (detailValue: number) => `${Math.round(detailValue * 100) / 100}${resolved.unit}`
        },
        data: [{ value }]
      }
    ]
  };
}

export interface RadarStyle {
  showArea: boolean;

  legendShow: boolean;
}

const DEFAULT_RADAR_STYLE: RadarStyle & CommonChartStyle = {
  ...COMMON_DEFAULTS,
  showArea: true,
  legendShow: true
};

/**
 * 雷达：类目当指标轴，系列当多条线。
 * 所有轴共用同一个量程（取全部值里的最大往上取整），否则各轴各自缩放会画出「形状相同、
 * 含义完全不同」的两张图，比不缩放更容易读错。
 */
export function buildRadarOption(
  data: CategorySeries,
  palette: ChartPalette,
  style: Partial<RadarStyle & CommonChartStyle> = {}
): DatavECOption {
  const resolved: RadarStyle & CommonChartStyle = { ...DEFAULT_RADAR_STYLE, ...style };
  const maxValue = data.series
    .flatMap(item => item.values)
    .reduce<number>((max, value) => (value !== null && value > max ? value : max), 0);
  // 全 0 时留 1 避免出现 `max: 0` 的除零形状
  const indicatorMax = maxValue > 0 ? Math.ceil(maxValue / 4) * 4 : 1;

  const option: Record<string, any> = {
    animationDuration: 400,
    tooltip: { trigger: 'item' },
    radar: {
      indicator: data.categories.map(category => ({ name: String(category), max: indicatorMax })),
      center: ['50%', '56%'],
      radius: '68%',
      axisName: { color: palette.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: palette.splitLine } },
      splitLine: { lineStyle: { color: palette.splitLine } },
      splitArea: { show: false }
    },
    series: [
      {
        type: 'radar' as const,
        symbolSize: 4,
        data: data.series.map((item, index) => {
          const color = colorAt(palette, index);
          return {
            name: item.name,
            value: item.values.map(value => value ?? 0),
            lineStyle: { color, width: 2 },
            itemStyle: { color },
            areaStyle: resolved.showArea ? { color, opacity: 0.15 } : undefined
          };
        })
      }
    ]
  };
  applyCommonOption(option, palette, resolved, resolved.legendShow && data.series.length > 1);
  return option as DatavECOption;
}

export interface ScatterStyle {
  /** 无尺寸列时的点直径；有尺寸列时它被当作最小直径下限 */
  symbolSize: number;

  sizeMin: number;

  sizeMax: number;

  xName: string;

  yName: string;

  sizeName: string;
}

const DEFAULT_SCATTER_STYLE: ScatterStyle = {
  symbolSize: 12,
  sizeMin: 6,
  sizeMax: 42,
  xName: 'X',
  yName: 'Y',
  sizeName: 'SIZE'
};

/** 投影层用 size===undefined 区分「没有尺寸列」，这里据此决定要不要换成函数型 symbolSize */
const hasSizeValue = (points: ScatterPoint[]) => points.some(point => point.size !== undefined);

/** 散点：两列都必须是数值，空位（无数据）交给组件的占位层而不是画成 0 点 */
export function buildScatterOption(
  points: ScatterPoint[],
  palette: ChartPalette,
  style: Partial<ScatterStyle> = {}
): DatavECOption {
  const resolved: ScatterStyle = { ...DEFAULT_SCATTER_STYLE, ...style };
  const hasSize = hasSizeValue(points);
  const maxSize = points.reduce((acc, point) => Math.max(acc, point.size ?? 0), 0);

  return {
    animationDuration: 400,
    grid: { left: 8, right: 12, top: 12, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const record = params as { name?: string; value?: number[] };
        // F2：name/维度名来自数据（匿名分享页可触达），进 HTML tooltip 前必须转义
        const base = `${escapeTooltipHtml(record.name ?? '')}<br/>${escapeTooltipHtml(resolved.xName)} ${record.value?.[0] ?? ''} / ${escapeTooltipHtml(resolved.yName)} ${record.value?.[1] ?? ''}`;
        if (record.value?.length !== 3) return base;
        // 气泡必须有第三值说明：只看到点大小却不知道它代表什么，比没有气泡更难读
        return `${base}<br/>${escapeTooltipHtml(resolved.sizeName)} ${record.value[2] ?? ''}`;
      }
    },
    xAxis: {
      type: 'value',
      name: resolved.xName,
      nameLocation: 'middle',
      nameGap: 24,
      nameTextStyle: { color: palette.textSecondary, fontSize: 11 },
      splitLine: { lineStyle: { color: palette.splitLine, type: 'dashed' } },
      axisLine: { lineStyle: { color: palette.splitLine } },
      axisLabel: { color: palette.textSecondary, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: resolved.yName,
      nameTextStyle: { color: palette.textSecondary, fontSize: 11 },
      splitLine: { lineStyle: { color: palette.splitLine, type: 'dashed' } },
      axisLabel: { color: palette.textSecondary, fontSize: 11 }
    },
    series: [
      {
        type: 'scatter' as const,
        // 气泡按**面积**正比于值来映射，所以开方：半径线性对应会把大值视觉上放大一倍以上
        symbolSize: hasSize
          ? (value: number | number[]) => bubbleDiameter(toFinite(value), maxSize, resolved)
          : Math.max(4, resolved.symbolSize),
        itemStyle: { color: colorAt(palette, 0), opacity: 0.85 },
        data: points.map(point => ({
          name: point.name,
          value: point.size === undefined ? [point.x, point.y] : [point.x, point.y, point.size]
        }))
      }
    ]
  };
}

function toFinite(value: number | number[]): number {
  const raw = Array.isArray(value) ? value[2] : Number(value);
  return Number.isFinite(raw) ? Math.max(0, raw as number) : 0;
}

/**
 * 直径按 `sqrt(size / maxSize)` 映射：面积正比于值才是气泡图的读法，直接对原始值开方会让
 * 稍大的值一起顶到上限、失去区分度；maxSize<=0（整列都是 0 或负）时退回最小直径而不是 NaN。
 */
function bubbleDiameter(size: number, maxSize: number, style: ScatterStyle): number {
  const min = Math.max(2, style.sizeMin);
  const max = Math.max(min + 2, style.sizeMax);
  if (!(maxSize > 0)) return min;
  const ratio = Math.min(1, Math.max(0, size / maxSize));
  return min + (max - min) * Math.sqrt(ratio);
}

export interface FunnelStyle {
  /** 排序方向：desc 漏斗从大到小（默认），asc 倒梯形 */
  order: 'desc' | 'asc';

  showLabel: boolean;

  legendShow: boolean;
}

const DEFAULT_FUNNEL_STYLE: FunnelStyle & CommonChartStyle = {
  ...COMMON_DEFAULTS,
  legendPos: 'bottom',
  order: 'desc',
  showLabel: true,
  legendShow: false
};

/** 漏斗：与饼共用 PieSlice 投影（类目 + 单值），排序后按宽度递减画梯形 */
export function buildFunnelOption(
  slices: PieSlice[],
  palette: ChartPalette,
  style: Partial<FunnelStyle & CommonChartStyle> = {}
): DatavECOption {
  const resolved: FunnelStyle & CommonChartStyle = { ...DEFAULT_FUNNEL_STYLE, ...style };
  const sorted = [...slices].sort((a, b) => (resolved.order === 'asc' ? a.value - b.value : b.value - a.value));

  const option: Record<string, any> = {
    animationDuration: 400,
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [
      {
        type: 'funnel' as const,
        left: '10%',
        right: '10%',
        top: resolved.legendShow ? 12 : 24,
        bottom: resolved.legendShow && resolved.legendPos === 'bottom' ? 34 : 12,
        minSize: '18%',
        sort: 'none',
        gap: 2,
        label: {
          show: resolved.showLabel,
          position: 'inside',
          color: palette.text,
          fontSize: 12,
          formatter: '{b} {c}'
        },
        itemStyle: { borderColor: 'transparent' },
        data: sorted.map((slice, index) => ({
          name: slice.name,
          value: slice.value,
          itemStyle: { color: colorAt(palette, index) }
        }))
      }
    ]
  };
  applyCommonOption(option, palette, resolved, resolved.legendShow);
  return option as DatavECOption;
}

export interface BarHStyle {
  /** 数值直标在条尾 */
  showLabel: boolean;

  legendShow: boolean;

  /** 类目名最多几个字 */
  maxCategoryChars: number;

  /** 类目轴（Y）名称 */
  xAxisName: string;

  /** 数值轴（X）名称 */
  yAxisName: string;

  /** 类目轴标签显隐 */
  xLabelShow: boolean;

  /** 数值轴标签显隐 */
  yLabelShow: boolean;

  /** 数值轴（X）网格分割线显隐 */
  splitShow: boolean;
}

export interface GraphStyle {
  nodeSize: number;

  showLabel: boolean;

  /** 力导向布局的斥力：越大节点分得越开 */
  repulsion: number;
}

const DEFAULT_GRAPH_STYLE: GraphStyle = { nodeSize: 22, showLabel: true, repulsion: 220 };

/** 关系图（ECharts graph + force）：节点按位取板着色，边宽随权重 */
export function buildGraphOption(
  data: import('@/utils/datav-data').LinkGraph,
  palette: ChartPalette,
  style: Partial<GraphStyle> = {}
): DatavECOption {
  const resolved: GraphStyle = { ...DEFAULT_GRAPH_STYLE, ...style };
  const nodeSize = Math.max(8, Math.min(60, resolved.nodeSize));
  const maxWeight = data.links.reduce((acc, link) => Math.max(acc, link.value), 0) || 1;

  return {
    animationDuration: 400,
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const record = params as { dataType?: string; name?: string; value?: number };
        // F2：同上，节点/边名转义后再进 HTML tooltip
        if (record.dataType === 'edge') return `${escapeTooltipHtml(record.name ?? '')}：${record.value ?? ''}`;
        return escapeTooltipHtml(record.name ?? '');
      }
    },
    series: [
      {
        type: 'graph' as never,
        layout: 'force',
        roam: false,
        draggable: true,
        force: { repulsion: Math.max(40, resolved.repulsion), edgeLength: [50, 120] },
        label: {
          show: resolved.showLabel,
          color: palette.text,
          fontSize: 11,
          position: 'right'
        },
        lineStyle: { color: palette.textSecondary, opacity: 0.4, curveness: 0.1 },
        edgeLabel: { show: false },
        emphasis: { focus: 'adjacency' as const },
        data: data.nodes.map((node, index) => ({
          name: node.name,
          symbolSize: nodeSize,
          itemStyle: { color: colorAt(palette, index) }
        })),
        links: data.links.map(link => ({
          source: link.source,
          target: link.target,
          value: link.value,
          lineStyle: { width: 1 + (link.value / maxWeight) * 3 }
        }))
      }
    ]
  } as DatavECOption;
}

const DEFAULT_BAR_H_STYLE: BarHStyle & CommonChartStyle = {
  ...COMMON_DEFAULTS,
  showLabel: true,
  legendShow: true,
  maxCategoryChars: 6,
  xAxisName: '',
  yAxisName: '',
  xLabelShow: true,
  yLabelShow: true,
  splitShow: true
};

/** 横向条：类目在左侧 Y 轴、值在 X 轴，适合类目名长的排行场景；按第一个系列降序排列 */
export function buildBarHOption(
  data: CategorySeries,
  palette: ChartPalette,
  style: Partial<BarHStyle & CommonChartStyle> = {}
): DatavECOption {
  const resolved: BarHStyle & CommonChartStyle = { ...DEFAULT_BAR_H_STYLE, ...style };

  const pairs = data.categories.map((category, index) => ({
    category: ellipsis(category, resolved.maxCategoryChars),
    values: data.series.map(item => item.values[index] ?? 0)
  }));
  // 横向条的视觉习惯：最大者在最上；ECharts y 轴类目自下而上，因此升序排
  pairs.sort((a, b) => (a.values[0] ?? 0) - (b.values[0] ?? 0));
  const legendVisible = resolved.legendShow && data.series.length > 1;

  const series = data.series.map((item, index) => ({
    name: item.name,
    type: 'bar' as const,
    data: pairs.map(pair => pair.values[index]),
    barWidth: undefined,
    label: {
      show: resolved.showLabel && index === 0,
      position: 'right' as const,
      color: palette.textSecondary,
      fontSize: 11
    },
    itemStyle: { color: colorAt(palette, index), borderRadius: [0, 3, 3, 0] as [number, number, number, number] }
  }));

  const option: Record<string, any> = {
    animationDuration: 400,
    grid: {
      left: 8,
      right: 24,
      top: legendVisible ? 30 : 12,
      bottom: 4,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel'
    },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'value',
      name: resolved.yAxisName || undefined,
      splitLine: {
        show: resolved.splitShow,
        lineStyle: { color: palette.splitLine, type: 'dashed' }
      },
      axisLabel: { show: resolved.yLabelShow, color: palette.textSecondary, fontSize: 11 }
    },
    yAxis: {
      type: 'category',
      name: resolved.xAxisName || undefined,
      data: pairs.map(pair => pair.category),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: palette.splitLine } },
      axisLabel: { show: resolved.xLabelShow, color: palette.textSecondary, fontSize: 11 }
    },
    series
  };
  applyCommonOption(option, palette, resolved, legendVisible);
  return option as DatavECOption;
}

export interface DualAxisStyle {
  /** 左轴系列形态。双轴的惯例是「柱在左、线在右」，但量纲反过来时也要能把柱放右 */
  leftType: 'bar' | 'line';

  smooth: boolean;

  barWidth: number;

  showLabel: boolean;

  legendShow: boolean;

  maxCategoryChars: number;

  /** 类目轴（X）名称 */
  xAxisName: string;

  /** 类目轴标签显隐 */
  xLabelShow: boolean;

  /** 数值轴（左右两轴）标签显隐 */
  yLabelShow: boolean;

  /** 左轴名称；留空取第一个系列名（既有行为） */
  yAxisName: string;

  /** 类目轴反转 */
  inverseX: boolean;

  /** 数值轴网格分割线显隐（右轴本就不画分割线） */
  splitShow: boolean;
}

const DEFAULT_DUAL_AXIS_STYLE: DualAxisStyle & CommonChartStyle = {
  ...COMMON_DEFAULTS,
  leftType: 'bar',
  smooth: true,
  barWidth: 0,
  showLabel: false,
  legendShow: true,
  maxCategoryChars: 6,
  xAxisName: '',
  xLabelShow: true,
  yLabelShow: true,
  yAxisName: '',
  inverseX: false,
  splitShow: true
};

/**
 * 双轴图：第一个系列绑左轴，其余全部绑右轴。
 * <p>
 * 只有一个系列时**退化成单轴**而不是画一条空右轴——空轴会被观众读成「这一列没数据」，
 * 而实际上只是没配第二个度量。右轴一律不画 splitLine：两套虚线叠在一起会把绘图区切成网格。
 */
export function buildDualAxisOption(
  data: CategorySeries,
  palette: ChartPalette,
  style: Partial<DualAxisStyle & CommonChartStyle> = {}
): DatavECOption {
  const resolved: DualAxisStyle & CommonChartStyle = { ...DEFAULT_DUAL_AXIS_STYLE, ...style };
  const hasRight = data.series.length > 1;
  const label = { show: resolved.showLabel, color: palette.textSecondary, fontSize: 11 };
  const legendVisible = resolved.legendShow && data.series.length > 1;

  const series = data.series.map((item, index) => {
    const color = colorAt(palette, index);
    const onRight = hasRight && index > 0;
    const yAxisIndex = onRight ? 1 : 0;
    if (!onRight && resolved.leftType === 'bar') {
      return {
        name: item.name,
        type: 'bar' as const,
        yAxisIndex,
        data: item.values,
        barWidth: resolved.barWidth > 0 ? resolved.barWidth : undefined,
        label,
        itemStyle: { color, borderRadius: [3, 3, 0, 0] as [number, number, number, number] }
      };
    }
    return {
      name: item.name,
      type: 'line' as const,
      yAxisIndex,
      data: item.values,
      smooth: resolved.smooth,
      symbolSize: 6,
      lineStyle: { width: 2, color },
      label,
      itemStyle: { color }
    };
  });

  const axes: Array<Record<string, unknown>> = [
    {
      type: 'value',
      name: resolved.yAxisName || data.series[0]?.name || '',
      nameTextStyle: { color: palette.textSecondary, fontSize: 11 },
      splitLine: {
        show: resolved.splitShow,
        lineStyle: { color: palette.splitLine, type: 'dashed' }
      },
      axisLabel: { show: resolved.yLabelShow, color: palette.textSecondary, fontSize: 11 }
    }
  ];
  if (hasRight) {
    axes.push({
      type: 'value',
      position: 'right',
      name: data.series[1]?.name ?? '',
      nameTextStyle: { color: palette.textSecondary, fontSize: 11 },
      // 右轴不重复画网格：与左轴两套虚线交叠后绘图区会被切成棋盘
      splitLine: { show: false },
      axisLabel: { show: resolved.yLabelShow, color: palette.textSecondary, fontSize: 11 }
    });
  }

  const option: Record<string, any> = {
    animationDuration: 400,
    grid: {
      left: 8,
      // 右轴有刻度和轴名，不留出宽度就会被 outerBounds 裁掉
      right: hasRight ? 44 : 12,
      top: legendVisible ? 30 : 16,
      bottom: 4,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: resolved.leftType === 'bar' ? 'shadow' : 'line' }
    },
    xAxis: {
      type: 'category',
      name: resolved.xAxisName || undefined,
      data: data.categories.map(item => ellipsis(item, resolved.maxCategoryChars)),
      inverse: resolved.inverseX,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: palette.splitLine } },
      axisLabel: { show: resolved.xLabelShow, color: palette.textSecondary, fontSize: 11, hideOverlap: true }
    },
    yAxis: axes.length > 1 ? axes : axes[0],
    series
  };
  applyCommonOption(option, palette, resolved, legendVisible);
  return option as DatavECOption;
}

/** F2：tooltip 走 HTML 渲染，数据侧的 name/维度名一律先转义 */
function escapeTooltipHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
