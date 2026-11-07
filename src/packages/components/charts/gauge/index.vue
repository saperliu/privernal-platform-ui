<script setup lang="ts">
import { computed } from 'vue';
import { useDatavChart } from '@/hooks/datav/useDatavChart';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { buildSingleValue } from '@/utils/datav-data';
import { buildGaugeOption } from '../chart-option';

defineOptions({ name: 'DatavGaugeChart' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const value = computed(() => buildSingleValue(view.value, mapping.value));

const empty = computed(() => !loading.value && value.value === null);

const { domRef } = useDatavChart(palette => {
  if (value.value === null) return null;
  return buildGaugeOption(value.value, palette(), {
    max: Number(style.value.max) || 0,
    unit: String(style.value.unit ?? ''),
    showTicks: style.value.showTicks !== false
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
