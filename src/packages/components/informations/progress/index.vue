<script setup lang="ts">
import { computed } from 'vue';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { useWidgetLinkage } from '@/hooks/datav/useDatavLinkage';
import { buildSingleValue, formatNumber, toRatio } from '@/utils/datav-data';

defineOptions({ name: 'DatavProgress' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const { clickFirstRow, isFirstRowSelected } = useWidgetLinkage();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const value = computed(() => buildSingleValue(view.value, mapping.value));

const max = computed(() => {
  const parsed = Number(style.value.max);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
});

const ratio = computed(() => toRatio(value.value, max.value));

const width = computed(() => `${Math.round((ratio.value ?? 0) * 1000) / 10}%`);

const displayValue = computed(() =>
  value.value === null
    ? '—'
    : `${formatNumber(value.value, { decimals: style.value.decimals })}${style.value.unit ?? ''}`
);

const trackHeight = computed(() => `${Number(style.value.height) || 10}px`);
</script>

<template>
  <div
    class="h-full w-full flex flex-col justify-center gap-6px px-10px"
    :class="{ 'datav-linked': isFirstRowSelected(view.rows) }"
    @click="clickFirstRow(view.rows)"
  >
    <div
      v-if="style.label || style.showValue !== false"
      class="flex items-baseline justify-between text-12px text-[var(--datav-text-secondary)]"
    >
      <span class="truncate">{{ style.label }}</span>
      <span v-if="style.showValue !== false" class="text-[var(--datav-text-primary)] tabular-nums">
        {{ displayValue }}
      </span>
    </div>

    <div class="datav-progress__track w-full overflow-hidden" :style="{ height: trackHeight }">
      <div
        class="datav-progress__bar h-full"
        :class="{ 'is-error': Boolean(error) }"
        :style="{ width, height: trackHeight }"
      ></div>
    </div>

    <div v-if="error" class="truncate text-11px text-[var(--datav-error)]" :title="error">{{ error }}</div>
    <div v-else-if="loading" class="text-11px opacity-60">取数中…</div>
  </div>
</template>

<style scoped>
.datav-progress__track {
  background: var(--datav-canvas-panel);
  border: 1px solid var(--datav-border);
  border-radius: 999px;
}

.datav-progress__bar {
  background: var(--datav-accent);
  border-radius: 999px;
  box-shadow: var(--datav-glow);
  transition: width 0.4s ease;
}

.datav-progress__bar.is-error {
  background: var(--datav-error);
  box-shadow: none;
}
</style>
