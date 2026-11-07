<script setup lang="ts">
import { computed } from 'vue';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { useDatavChart } from '@/hooks/datav/useDatavChart';
import { buildCategorySeries } from '@/utils/datav-data';
import { axisStyleFrom, buildAxisOption, commonStyleFrom } from '../chart-option';

defineOptions({ name: 'DatavStepLineChart' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const series = computed(() => buildCategorySeries(view.value, mapping.value));

const empty = computed(() => !loading.value && series.value.categories.length === 0);

const { domRef } = useDatavChart(palette => {
  if (!series.value.categories.length) return null;
  return buildAxisOption(series.value, palette(), {
    type: 'line',
    // 阶梯线刻意不开 smooth：圆角阶梯会让观众读不出值到底在段首还是段尾生效
    smooth: false,
    step: (style.value.stepMode || 'middle') as 'start' | 'middle' | 'end',
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
