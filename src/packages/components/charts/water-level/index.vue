<script setup lang="ts">
import { computed } from 'vue';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { buildSingleValue, formatNumber, toRatio } from '@/utils/datav-data';

defineOptions({ name: 'DatavWaterLevel' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const value = computed(() => buildSingleValue(view.value, mapping.value));

const max = computed(() => {
  const raw = Number(style.value.max);
  return Number.isFinite(raw) && raw > 0 ? raw : 100;
});

const ratio = computed(() => toRatio(value.value, max.value));

const percentText = computed(() => {
  if (ratio.value === null) return '—';
  const decimals = Math.max(0, Math.min(4, Number(style.value.decimals) || 0));
  return `${formatNumber(ratio.value * 100, { decimals })}%`;
});

const heightPercent = computed(() => (ratio.value === null ? 0 : Math.max(0, Math.min(100, ratio.value * 100))));

const fillStyle = computed(() => ({
  height: `${heightPercent.value}%`,
  background: `linear-gradient(180deg, var(--${String(style.value.colorToken || 'datav-series-1')}) 0%, color-mix(in srgb, var(--${String(style.value.colorToken || 'datav-series-1')}) 55%, transparent) 100%)`,
  transition: 'height .6s ease'
}));

const empty = computed(() => !loading.value && value.value === null);
</script>

<template>
  <div class="water-level relative h-full w-full overflow-hidden">
    <!-- 刻度线：0/25/50/75，弱化到次要色，帮助观众读比例 -->
    <div v-for="tick in [25, 50, 75]" :key="tick" class="tick" :style="{ bottom: `${tick}%` }"></div>

    <div class="fill" :style="fillStyle"></div>

    <div class="readout absolute inset-0 flex flex-col items-center justify-center">
      <span v-if="style.showPercent !== false" class="text-30px text-[var(--datav-text-primary)] font-600 tabular-nums">
        {{ percentText }}
      </span>
      <span v-if="error" class="text-12px text-[var(--datav-error)]">{{ error }}</span>
      <span v-else-if="empty" class="text-12px text-[var(--datav-text-secondary)]">暂无数据</span>
    </div>
  </div>
</template>

<style scoped>
.water-level {
  border-radius: 10px;
  border: 1px solid var(--datav-border);
  background: var(--datav-panel);
}

.fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0 0 9px 9px;
}

.tick {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--datav-grid);
  opacity: 0.5;
}
</style>
