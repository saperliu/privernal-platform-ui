<script setup lang="ts">
import { computed } from 'vue';
import { registerHeatmapChart, registerHeatmapSeries } from '@visactor/vchart';
import { useDatavVChart } from '@/hooks/datav/useDatavVChart';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { buildHeatCells } from '@/utils/datav-data';
import type { ChartPalette } from '../chart-option';

registerHeatmapSeries();
registerHeatmapChart();

defineOptions({ name: 'DatavHeatmapChart' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const cells = computed(() => buildHeatCells(view.value, mapping.value));

const empty = computed(() => !loading.value && cells.value.length === 0);

const { domRef } = useDatavVChart((palette: ChartPalette) => {
  if (!cells.value.length) return null;
  const low = palette.series[1] || palette.textSecondary;
  const high = palette.series[0] || palette.text;
  return {
    type: 'common',
    series: [
      {
        type: 'heatmap',
        data: { id: 'heat', values: cells.value },
        xField: 'x',
        yField: 'y',
        valueField: 'value',
        cell: {
          style: {
            fill: {
              gradient: 'linear',
              stops: [
                { offset: 0, color: low },
                { offset: 1, color: high }
              ]
            },
            fillOpacity: 0.9
          }
        },
        label: {
          visible: style.value.showLabel !== false,
          style: { fill: palette.text, fontSize: 10 }
        },
        tooltip: { isVisible: true }
      }
    ],
    axes: [
      { orient: 'bottom', label: { style: { fill: palette.textSecondary } } },
      { orient: 'left', label: { style: { fill: palette.textSecondary } } }
    ],
    background: 'transparent',
    animations: false
  } as never;
});
</script>

<template>
  <div class="relative h-full w-full">
    <div ref="domRef" class="h-full w-full"></div>

    <div
      v-if="error || empty"
      class="absolute inset-0 flex items-center justify-center text-12px"
      :class="error ? 'text-[var(--datav-error)]' : 'text-[var(--datav-text-secondary)]'"
    >
      {{ error || '暂无数据' }}
    </div>
  </div>
</template>
