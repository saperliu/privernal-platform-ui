<script setup lang="ts">
import { computed } from 'vue';
import { registerWordCloudChart, registerWordCloudSeries, registerWordCloudShapeChart } from '@visactor/vchart';
import { useDatavVChart } from '@/hooks/datav/useDatavVChart';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { buildPieSeries } from '@/utils/datav-data';
import type { ChartPalette } from '../chart-option';

registerWordCloudSeries();
registerWordCloudChart();
registerWordCloudShapeChart();

defineOptions({ name: 'DatavWordCloud' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const words = computed(() => buildPieSeries(view.value, mapping.value));

const empty = computed(() => !loading.value && words.value.length === 0);

function fontSizeRange(): [number, number] {
  const raw = style.value.fontSizeRange;
  if (Array.isArray(raw) && raw.length === 2 && Number(raw[0]) > 0 && Number(raw[1]) > Number(raw[0])) {
    return [Number(raw[0]), Number(raw[1])];
  }
  return [14, 44];
}

const { domRef } = useDatavVChart((palette: ChartPalette, _mode: 'dark' | 'light') => {
  if (!words.value.length) return null;
  const [min, max] = fontSizeRange();
  return {
    type: 'wordCloud',
    data: [{ id: 'words', values: words.value }],
    nameField: 'name',
    valueField: 'value',
    seriesField: 'name',
    word: {
      style: {
        fontFamily: 'inherit',
        fill: { gradient: 'linear', stops: palette.series.length ? palette.series : [palette.text] },
        fontWeight: 600
      }
    },
    fontSizeRange: [min, max],
    maskShape: false,
    blurMethod: false,
    background: 'transparent',
    tooltip: { isVisible: true },
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
