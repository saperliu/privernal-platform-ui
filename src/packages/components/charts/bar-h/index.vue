<script setup lang="ts">
import { computed } from 'vue';
import { useDatavChart } from '@/hooks/datav/useDatavChart';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { buildCategorySeries } from '@/utils/datav-data';
import { axisStyleFrom, buildBarHOption, commonStyleFrom } from '../chart-option';

defineOptions({ name: 'DatavBarHChart' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const series = computed(() => buildCategorySeries(view.value, mapping.value));

const empty = computed(() => !loading.value && series.value.categories.length === 0);

const { domRef } = useDatavChart(palette => {
  if (!series.value.categories.length) return null;
  return buildBarHOption(series.value, palette(), {
    showLabel: Boolean(style.value.showLabel),
    legendShow: style.value.showLegend !== false,
    maxCategoryChars: Number(style.value.maxCategoryChars) || 6,
    ...axisStyleFrom(style.value),
    ...commonStyleFrom(style.value)
  });
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
