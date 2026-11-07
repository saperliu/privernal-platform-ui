<script setup lang="ts">
import { computed } from 'vue';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { formatNumber } from '@/utils/datav-data';

defineOptions({ name: 'DatavMetricMatrix' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, loading, error } = useWidgetData(() => props.widget);

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

interface MetricCell {
  label: string;
  text: string;
}

/**
 * 双数据源：静态行（每行一个指标）与数据集（第一行的全部度量按行转列）。
 * 聚合结果给的是「每度量一列」，而矩阵要的是「每度量一格」，所以这里做一次透视。
 */
const cells = computed<MetricCell[]>(() => {
  const format = (raw: unknown) => {
    const num = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(num)) return raw === null || raw === undefined ? '-' : String(raw);
    return formatNumber(num, {
      decimals: Math.max(0, Math.min(4, Number(style.value.decimals) || 0)),
      thousands: style.value.thousands !== false
    });
  };

  const measureAliases = view.value?.measureAliases ?? [];
  const firstRow = view.value?.rows?.[0];
  if (measureAliases.length && firstRow) {
    return measureAliases.map((alias, index) => ({
      label: view.value?.measureLabels?.[index] || alias,
      text: format(firstRow[alias])
    }));
  }

  const raw = props.widget.data?.staticRows;
  if (!Array.isArray(raw)) return [];
  return raw
    .map(item => {
      const record = (item ?? {}) as Record<string, unknown>;
      return { label: String(record.label ?? ''), text: format(record.value) };
    })
    .filter(cell => cell.label);
});

const cols = computed(() => Math.max(2, Math.min(4, Number(style.value.cols) || 3)));
const valueSize = computed(() => Math.max(16, Math.min(48, Number(style.value.valueSize) || 26)));
const labelSize = computed(() => Math.max(10, Math.min(18, Number(style.value.labelSize) || 12)));

const empty = computed(() => !loading.value && cells.value.length === 0);
</script>

<template>
  <div class="relative h-full w-full overflow-hidden p-4px">
    <div
      v-if="!error && !empty"
      class="grid h-full w-full gap-6px"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
    >
      <div
        v-for="(cell, index) in cells"
        :key="`${index}-${cell.label}`"
        class="matrix-cell min-w-0 flex flex-col items-center justify-center gap-2px overflow-hidden px-6px"
      >
        <span
          class="w-full truncate text-center"
          :style="{ fontSize: `${labelSize}px` }"
          style="color: var(--datav-text-secondary)"
        >
          {{ cell.label }}
        </span>
        <span
          class="w-full truncate text-center font-600 tabular-nums"
          :style="{ fontSize: `${valueSize}px` }"
          style="color: var(--datav-text-primary)"
        >
          {{ cell.text }}
        </span>
      </div>
    </div>

    <div
      v-if="error || empty"
      class="absolute inset-0 flex items-center justify-center text-12px"
      :class="error ? 'text-[var(--datav-error)]' : 'text-[var(--datav-text-secondary)]'"
    >
      {{ error || '暂无数据' }}
    </div>
  </div>
</template>

<style scoped>
.matrix-cell {
  border-radius: var(--datav-radius-md);
  background: var(--datav-panel);
  border: 1px solid var(--datav-border);
}
</style>
