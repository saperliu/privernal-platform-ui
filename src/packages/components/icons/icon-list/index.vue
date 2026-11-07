<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

defineOptions({ name: 'DatavIconList' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

interface IconRow {
  icon: string;
  label: string;
  value: string;
}

const rows = computed<IconRow[]>(() => {
  const raw = props.widget.data?.staticRows;
  if (!Array.isArray(raw)) return [];
  return raw
    .map(item => {
      const record = (item ?? {}) as Record<string, unknown>;
      return {
        icon: String(record.icon ?? 'mdi:circle-medium'),
        label: String(record.label ?? ''),
        value: String(record.value ?? '')
      };
    })
    .filter(row => row.label || row.value);
});

const iconSize = computed(() => Math.max(16, Math.min(64, Number(style.value.iconSize) || 28)));
const fontSize = computed(() => Math.max(11, Math.min(24, Number(style.value.fontSize) || 14)));
const color = computed(() => `var(--${String(style.value.colorToken || 'datav-accent')})`);
const horizontal = computed(() => style.value.direction === 'horizontal');
</script>

<template>
  <div
    class="h-full w-full overflow-hidden"
    :class="horizontal ? 'flex items-center justify-around gap-8px' : 'flex flex-col justify-around gap-4px'"
  >
    <div
      v-for="(row, index) in rows"
      :key="`${index}-${row.label}`"
      class="min-w-0 flex items-center gap-8px"
      :class="horizontal ? 'flex-col gap-2px' : ''"
    >
      <Icon :icon="row.icon" :style="{ fontSize: `${iconSize}px`, color }" aria-hidden="true" />
      <div v-if="!horizontal" class="min-w-0 flex flex-1 items-baseline justify-between gap-8px">
        <span class="truncate" :style="{ fontSize: `${fontSize}px` }" style="color: var(--datav-text-secondary)">
          {{ row.label }}
        </span>
        <span
          v-if="style.showValue !== false"
          class="tabular-nums"
          :style="{ fontSize: `${fontSize}px` }"
          style="color: var(--datav-text-primary)"
        >
          {{ row.value }}
        </span>
      </div>
      <template v-else>
        <span
          class="max-w-full truncate"
          :style="{ fontSize: `${fontSize - 1}px` }"
          style="color: var(--datav-text-secondary)"
        >
          {{ row.label }}
        </span>
        <span
          v-if="style.showValue !== false"
          class="tabular-nums"
          :style="{ fontSize: `${fontSize}px` }"
          style="color: var(--datav-text-primary)"
        >
          {{ row.value }}
        </span>
      </template>
    </div>
    <div
      v-if="!rows.length"
      class="h-full w-full flex items-center justify-center text-12px text-[var(--datav-text-secondary)]"
    >
      未配置列表项
    </div>
  </div>
</template>
