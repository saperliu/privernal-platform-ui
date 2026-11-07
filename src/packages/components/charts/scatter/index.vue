<script setup lang="ts">
import { computed } from 'vue';
import { useDatavChart } from '@/hooks/datav/useDatavChart';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { buildScatterSeries } from '@/utils/datav-data';
import { buildScatterOption } from '../chart-option';

defineOptions({ name: 'DatavScatterChart' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const points = computed(() => buildScatterSeries(view.value, mapping.value));

const empty = computed(() => !loading.value && points.value.length === 0);

const { domRef } = useDatavChart(palette => {
  if (!points.value.length) return null;
  return buildScatterOption(points.value, palette(), {
    symbolSize: Number(style.value.symbolSize) || 12,
    sizeMin: Number(style.value.sizeMin) || 6,
    sizeMax: Number(style.value.sizeMax) || 42,
    // 轴标题优先用设计者写的，留空回落到后端列快照里的中文名
    xName: String(style.value.xName ?? '') || view.value.dimensionLabels?.[0] || 'X',
    yName: String(style.value.yName ?? '') || view.value.measureLabels?.[0] || 'Y',
    sizeName: String(style.value.sizeName ?? '') || view.value.measureLabels?.[1] || 'SIZE'
  });
});
</script>

<template>
  <div class="relative h-full w-full">
    <div ref="domRef" class="h-full w-full"></div>

    <div
      v-if="error || empty"
      class="absolute inset-0 flex flex-col items-center justify-center gap-2px text-12px"
      :class="error ? 'text-[var(--datav-error)]' : 'text-[var(--datav-text-secondary)]'"
    >
      <span>{{ error || '暂无数据' }}</span>
      <span v-if="!error" class="opacity-70">X 轴需要数值列</span>
    </div>
  </div>
</template>
