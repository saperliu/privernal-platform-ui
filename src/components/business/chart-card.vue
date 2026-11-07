<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useEcharts } from '@/hooks/common/echarts';

export interface Props {
  /** 图表类型：bar/line/pie/gauge 走 echarts，stat/ranking/table 用 DOM 直出 */
  reportType: 'bar' | 'line' | 'pie' | 'stat' | 'gauge' | 'ranking' | 'table';
  /** 卡片标题（同时是数字卡的副标题） */
  reportName: string;
  /** 聚合结果行：dim0/dim1/value/m1… */
  rows?: ReportChartNamespace.AggRow[];
  /** 维度别名，与后端 dimensionAliases 对齐 */
  dimensionAliases?: string[];
  /** 度量别名，第一个恒为 value */
  measureAliases?: string[];
  /** 维度字段名，用作榜单/表格列头 */
  dimensionLabels?: string[];
  /** 度量字段名，用作多系列图例 */
  measureLabels?: string[];
  /** gauge 上限，缺省按当前值放大一档 */
  gaugeMax?: number | null;
  /** 榜单最多显示几条 */
  rankingLimit?: number | null;
  /** 数值展示格式（小数位/单位/千分位），只影响渲染 */
  format?: ReportChartNamespace.ValueFormat | null;
  /** 同比/环比对比模式（M3-1）：rows 带 Compare/Growth 附加列时由调用方透传，stat 卡显示增速徽标 */
  comparison?: 'yoy' | 'mom' | 'prev' | null;
  /** 取数失败原因：非空时卡片给出可读错误，而不是画一张空图 */
  error?: string;
  loading?: boolean;
  /** 点击维度条目（下钻），stat 不触发 */
  onDimClick?: (row: ReportChartNamespace.AggRow) => void;
}

defineOptions({ name: 'ChartCard' });

const props = withDefaults(defineProps<Props>(), {
  rows: () => [],
  dimensionLabels: () => [],
  measureLabels: () => [],
  rankingLimit: 10,
  format: null,
  comparison: null,
  error: '',
  loading: false
});

const ECHARTS_TYPES = ['bar', 'line', 'pie', 'gauge'];

const isEcharts = computed(() => ECHARTS_TYPES.includes(props.reportType));
const latestOption = ref<any>(null);
let chartInstance: any = null;

const rows = computed(() => props.rows ?? []);
const dims = computed(() => (props.dimensionAliases?.length ? props.dimensionAliases : ['dim0']));
const measures = computed(() => (props.measureAliases?.length ? props.measureAliases : ['value']));

/**
 * hook 的 optionsFactory 只在创建时求值一次，所以「数据先到、实例后建」时
 * 必须在 onRender 里补一次 setOption，否则首次渲染出来的是空图。
 */
function applyTo(instance: any) {
  chartInstance = instance;
  if (latestOption.value) {
    instance.setOption({ ...latestOption.value, backgroundColor: 'transparent' });
  }
  bindClick(instance);
}

/**
 * 关键：模板必须绑 useEcharts 自己那个 domRef。
 * 之前是组件自建一个同名 ref 绑上去，hook 内部的 domRef 永远是 null，
 * canRender() 恒 false → 实例从不 init → setOptions 静默 no-op，柱状图画不出来。
 */
const { domRef: renderTarget } = useEcharts(() => ({}) as any, {
  onRender: applyTo,
  onUpdated: applyTo
});

function bindClick(instance: any) {
  instance.off('click');
  instance.on('click', (params: any) => {
    const row = rows.value[params.dataIndex];
    if (row && props.onDimClick) {
      props.onDimClick(row);
    }
  });
}

function toNumber(value: any) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

/**
 * 度量值展示：未指定小数位时按「最多 2 位」收敛，
 * 避免 SUM/AVG 把 0.30000000000000004 这类浮点噪声直接画到图上。
 */
function fmt(value: any): string {
  const num = toNumber(value);
  const decimals = props.format?.decimals;
  let text =
    decimals !== null && decimals !== undefined && decimals >= 0
      ? num.toFixed(Math.min(Math.floor(decimals), 4))
      : String(Number(num.toFixed(2)));
  if (props.format?.thousands) {
    const [int, frac] = text.split('.');
    const negative = int.startsWith('-');
    const digits = negative ? int.slice(1) : int;
    text = `${negative ? '-' : ''}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${frac ? `.${frac}` : ''}`;
  }
  return text + (props.format?.unit ?? '');
}

function measureName(index: number) {
  const label = props.measureLabels?.[index];
  return label || String(measures.value[index]);
}

function dimName(index: number) {
  return props.dimensionLabels?.[index] || dims.value[index];
}

function buildBarLineOption() {
  const multi = measures.value.length > 1;
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params];
        return [list[0]?.axisValue ?? '', ...list.map(p => `${p.marker}${p.seriesName}: ${fmt(p.value)}`)].join(
          '<br/>'
        );
      }
    },
    legend: multi ? { bottom: 0, type: 'scroll', data: measures.value.map((_, i) => measureName(i)) } : undefined,
    // ECharts 6 废弃了 grid.containLabel（不注册 LegacyGridContainLabel 只告警不生效，轴标签会被裁出画布），
    // 官方等价写法：outerBoundsMode + outerBoundsContain
    grid: {
      left: 48,
      right: 24,
      top: multi ? 32 : 24,
      bottom: multi ? 52 : 56,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel'
    },
    xAxis: {
      type: 'category',
      data: rows.value.map(row => String(row[dims.value[0]] ?? '—')),
      axisLabel: { interval: 0, rotate: rows.value.length > 6 ? 30 : 0, overflow: 'truncate' }
    },
    yAxis: { type: 'value', axisLabel: { formatter: (value: any) => fmt(value) } },
    series: measures.value.map((alias, index) => ({
      name: measureName(index),
      type: props.reportType === 'line' ? 'line' : 'bar',
      smooth: props.reportType === 'line',
      barMaxWidth: 40,
      // null 保留为断点（对比段没有该期时不能画成 0，会把增速看错一个量级）
      data: rows.value.map(row => (row[alias] === null || row[alias] === undefined ? null : toNumber(row[alias])))
    }))
  };
}

function buildPieOption() {
  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `${p.name}: ${fmt(p.value)} (${p.percent}%)`
    },
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        type: 'pie',
        radius: ['38%', '62%'],
        label: { overflow: 'break' },
        data: rows.value.map(row => ({
          name: String(row[dims.value[0]] ?? '—'),
          value: toNumber(row[measures.value[0]])
        })),
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.3)' } }
      }
    ]
  };
}

function buildGaugeOption() {
  const value = toNumber(rows.value[0]?.[measures.value[0]]);
  const max = props.gaugeMax && props.gaugeMax > 0 ? props.gaugeMax : Math.max(value * 1.25, 1);
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: Number(max.toFixed(2)),
        progress: { show: true, width: 14 },
        axisLine: { lineStyle: { width: 14 } },
        axisTick: { show: false },
        splitLine: { length: 8, lineStyle: { width: 1, opacity: 0.35 } },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '6%'],
          fontSize: 28,
          fontWeight: 600,
          formatter: (v: any) => fmt(v)
        },
        data: [{ value }]
      }
    ]
  };
}

function buildOption() {
  if (!rows.value.length) {
    // 空数据也要出图：否则只剩一块空白，用户分不清是「没数」还是「坏了」
    return { title: { text: '暂无数据', left: 'center', top: 'middle', textStyle: { fontSize: 13, opacity: 0.5 } } };
  }
  if (props.reportType === 'gauge') {
    return buildGaugeOption();
  }
  if (props.reportType === 'pie') {
    return buildPieOption();
  }
  return buildBarLineOption();
}

function apply() {
  if (!isEcharts.value) {
    return;
  }
  const option = buildOption();
  latestOption.value = option;
  if (!chartInstance) {
    // 还没 init：实例创建时会用工厂取到的这份 option，不需要额外补一次 setOption
    return;
  }
  chartInstance.clear();
  chartInstance.setOption({ ...option, backgroundColor: 'transparent' });
  bindClick(chartInstance);
}

/** 类型切换后容器才可见，等一帧拿到尺寸再渲染 */
watch(
  () => [
    props.reportType,
    props.rows,
    props.measureLabels,
    props.dimensionLabels,
    props.dimensionAliases,
    props.measureAliases,
    props.gaugeMax,
    props.format
  ],
  async () => {
    await nextTick();
    apply();
  },
  { deep: true }
);

const statValue = computed(() => (rows.value.length ? fmt(rows.value[0]?.[measures.value[0]]) : fmt(0)));

const COMPARISON_LABELS: Record<string, string> = { yoy: '同比', mom: '环比', prev: '上期' };

/** stat 卡增速徽标（M3-1）：后端 growth=(本期−对比)/对比，缺对比期或对比为 0 时为 null → 显示「—」 */
const statGrowth = computed<{ label: string; text: string; up: boolean } | null>(() => {
  const growth = rows.value.length ? rows.value[0]?.[`${measures.value[0]}Growth`] : null;
  if (growth === null || growth === undefined) {
    return props.comparison ? { label: COMPARISON_LABELS[props.comparison] ?? '对比', text: '—', up: true } : null;
  }
  const percent = (Number(growth) * 100).toFixed(1);
  const up = Number(growth) >= 0;
  const label = props.comparison ? (COMPARISON_LABELS[props.comparison] ?? '对比') : '对比';
  return { label, text: `${up ? '+' : ''}${percent}%`, up };
});

const rankingRows = computed(() => {
  // 显式传 null 时不走 withDefaults 默认值，这里再兜一次
  const limit = props.rankingLimit ?? 10;
  const list = rows.value.slice(0, limit);
  const max = Math.max(...list.map(row => toNumber(row[measures.value[0]])), 1);
  return list.map((row, index) => ({
    row,
    index,
    label: String(row[dims.value[0]] ?? '—'),
    value: toNumber(row[measures.value[0]]),
    text: fmt(row[measures.value[0]]),
    ratio: Math.round((toNumber(row[measures.value[0]]) / max) * 100)
  }));
});

const tableColumns = computed(() => {
  const dimensionColumns = dims.value.map((alias, index) => ({ alias, title: dimName(index), numeric: false }));
  const measureColumns = measures.value.map((alias, index) => ({ alias, title: measureName(index), numeric: true }));
  return [...dimensionColumns, ...measureColumns];
});

/** 汇总表里度量列走格式化，维度列（含 lookup 后的文本）原样显示 */
function cellText(row: ReportChartNamespace.AggRow, column: { alias: string; numeric: boolean }) {
  const raw = row[column.alias];
  if (raw === null || raw === undefined || raw === '') return '—';
  return column.numeric ? fmt(raw) : String(raw);
}

function clickRow(row: ReportChartNamespace.AggRow) {
  props.onDimClick?.(row);
}
</script>

<template>
  <div class="relative h-full w-full">
    <ElAlert v-if="error" type="error" class="absolute inset-0 z-2 flex-center" :bordered="false">
      {{ error }}
    </ElAlert>

    <div v-if="loading" class="absolute inset-0 z-1 flex-center bg-white/60">
      <div v-loading="true" />
    </div>

    <div class="h-full w-full">
      <!-- v-show 而不是 v-if：卸载容器会让实例失去 DOM，切回图形类型时就不再渲染 -->
      <div v-show="isEcharts" ref="renderTarget" class="h-full w-full"></div>

      <div v-if="reportType === 'stat'" class="h-full flex-col justify-center px-16px">
        <div class="text-14px text-gray-400">{{ reportName }}</div>
        <div class="mt-8px flex items-center gap-8px">
          <span class="text-32px font-600 leading-40px">{{ statValue }}</span>
          <span
            v-if="statGrowth"
            class="rounded-4px px-6px py-2px text-12px font-500"
            :class="statGrowth.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'"
          >
            {{ statGrowth.label }} {{ statGrowth.text }}
          </span>
        </div>
        <div v-if="!rows.length" class="mt-4px text-12px text-gray-400">无匹配数据</div>
      </div>

      <div v-else-if="reportType === 'ranking'" class="h-full overflow-auto px-12px py-8px">
        <div
          v-for="item in rankingRows"
          :key="item.index"
          class="flex items-center gap-8px py-4px"
          :class="onDimClick ? 'cursor-pointer hover:bg-gray-50' : ''"
          @click="clickRow(item.row)"
        >
          <span class="w-20px text-12px text-gray-400">{{ item.index + 1 }}</span>
          <span class="w-120px truncate text-13px" :title="item.label">{{ item.label }}</span>
          <div class="h-8px flex-1 overflow-hidden rounded-4px bg-gray-100">
            <div class="h-full rounded-4px" :style="{ width: `${item.ratio}%`, background: '#18a05899' }"></div>
          </div>
          <span class="w-64px text-right text-13px font-500">{{ item.text }}</span>
        </div>
        <ElEmpty v-if="!rankingRows.length" description="无匹配数据" class="py-24px" />
      </div>

      <div v-else-if="reportType === 'table'" class="h-full overflow-auto">
        <table class="w-full border-collapse text-13px">
          <thead>
            <tr class="bg-gray-50 text-left">
              <th v-for="column in tableColumns" :key="column.alias" class="px-10px py-6px font-500">
                {{ column.title }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in rows"
              :key="index"
              class="border-b border-gray-100"
              :class="onDimClick ? 'cursor-pointer hover:bg-gray-50' : ''"
              @click="clickRow(row)"
            >
              <td
                v-for="column in tableColumns"
                :key="column.alias"
                class="px-10px py-6px"
                :class="column.numeric ? 'text-right' : ''"
              >
                {{ cellText(row, column) }}
              </td>
            </tr>
          </tbody>
        </table>
        <ElEmpty v-if="!rows.length" description="无匹配数据" class="py-24px" />
      </div>
    </div>
  </div>
</template>
