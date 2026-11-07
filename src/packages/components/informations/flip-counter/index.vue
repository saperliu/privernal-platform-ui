<script setup lang="ts">
import { computed } from 'vue';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { useWidgetLinkage } from '@/hooks/datav/useDatavLinkage';
import { formatNumber } from '@/utils/datav-data';

defineOptions({ name: 'DatavFlipCounter' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const { clickFirstRow, isFirstRowSelected } = useWidgetLinkage();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const numberText = computed(() => {
  const rows = view.value?.rows ?? [];
  if (!rows.length) return null;
  const alias = mapping.value?.value || view.value?.measureAliases?.[0] || 'value';
  const raw = rows[0][alias];
  const num = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(num)) return null;
  return formatNumber(num, {
    decimals: Math.max(0, Math.min(4, Number(style.value.decimals) || 0)),
    thousands: style.value.thousands !== false
  });
});

const isCard = computed(() => style.value.digitStyle !== 'plain');

const empty = computed(() => !loading.value && numberText.value === null);
</script>

<template>
  <div
    class="h-full w-full flex items-center justify-center gap-4px overflow-hidden px-8px"
    :class="{ 'datav-linked': isFirstRowSelected(view.rows) }"
    @click="clickFirstRow(view.rows)"
  >
    <span v-if="style.prefix" class="text-14px text-[var(--datav-text-secondary)]">{{ style.prefix }}</span>

    <span v-if="error" class="text-12px text-[var(--datav-error)]">{{ error }}</span>
    <span v-else-if="empty" class="text-12px text-[var(--datav-text-secondary)]">暂无数据</span>
    <template v-else>
      <span
        v-for="(char, index) in numberText"
        :key="`${index}-${char}`"
        class="digit text-34px font-700 leading-1em tabular-nums"
        :class="isCard && char !== ',' && char !== '.' ? 'digit-card' : ''"
      >
        {{ char }}
      </span>
    </template>

    <span v-if="style.suffix" class="text-14px text-[var(--datav-text-secondary)]">{{ style.suffix }}</span>
  </div>
</template>

<style scoped>
.digit {
  color: var(--datav-text-primary);
}

.digit-card {
  min-width: 0.72em;
  padding: 0.08em 0.06em;
  border-radius: var(--datav-radius-sm);
  background: var(--datav-panel);
  border: 1px solid var(--datav-border);
  text-align: center;
  transition: transform 0.3s ease;
}
</style>
