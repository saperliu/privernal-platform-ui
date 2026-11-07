<script setup lang="ts">
import { computed } from 'vue';
import { useDatavChart } from '@/hooks/datav/useDatavChart';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { buildPieSeries } from '@/utils/datav-data';
import { buildFunnelOption, commonStyleFrom } from '../chart-option';

defineOptions({ name: 'DatavFunnelChart' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const slices = computed(() => buildPieSeries(view.value, mapping.value));

const empty = computed(() => !loading.value && slices.value.length === 0);

const { domRef } = useDatavChart(palette => {
  if (!slices.value.length) return null;
  return buildFunnelOption(slices.value, palette(), {
    order: style.value.order === 'asc' ? 'asc' : 'desc',
    showLabel: style.value.showLabel !== false,
    legendShow: style.value.legendShow === true,
    ...commonStyleFrom(style.value, { legendPos: 'bottom' })
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
