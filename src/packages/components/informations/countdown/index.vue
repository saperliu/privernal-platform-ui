<script setup lang="ts">
import { computed, ref } from 'vue';
import { useIntervalFn } from '@vueuse/core';

defineOptions({ name: 'DatavCountdown' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const now = ref(Date.now());
useIntervalFn(() => {
  now.value = Date.now();
}, 1000);

const target = computed(() => {
  const raw = String(style.value.target || '')
    .trim()
    .replace('T', ' ');
  const parsed = new Date(raw.length === 16 ? `${raw}:00` : raw).getTime();
  return Number.isFinite(parsed) ? parsed : Number.NaN;
});

const targetValid = computed(() => !Number.isNaN(target.value));

interface Part {
  value: number;
  label: string;
}

/** 倒计时到 0 后保持 0 而不是变成负数：大屏上出现负数秒会被读成故障 */
const parts = computed<Part[]>(() => {
  const diff = Math.max(0, (target.value || 0) - now.value);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const list: Part[] = [];
  if (style.value.showDays !== false) list.push({ value: days, label: '天' });
  list.push({ value: hours, label: '时' }, { value: minutes, label: '分' });
  if (style.value.showSeconds !== false) list.push({ value: seconds, label: '秒' });
  return list;
});
</script>

<template>
  <div class="h-full w-full flex items-center justify-center gap-14px overflow-hidden px-8px">
    <span v-if="style.label" class="text-15px text-[var(--datav-text-secondary)]">{{ style.label }}</span>

    <template v-if="targetValid">
      <div v-for="part in parts" :key="part.label" class="flex flex-col items-center gap-2px">
        <span
          class="border border-[var(--datav-border)] rounded-6px bg-[var(--datav-panel)] px-10px py-4px text-30px text-[var(--datav-text-primary)] font-700 leading-1em tabular-nums"
        >
          {{ String(part.value).padStart(2, '0') }}
        </span>
        <span class="text-12px text-[var(--datav-text-secondary)]">{{ part.label }}</span>
      </div>
    </template>
    <span v-else class="text-12px text-[var(--datav-error)]">目标时间无效</span>
  </div>
</template>
