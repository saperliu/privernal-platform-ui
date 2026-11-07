<script setup lang="ts">
import { computed, ref } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import { formatClock } from '@/utils/datav-data';
import { resolveColor } from '@/packages/components/protocol';

defineOptions({ name: 'DatavClock' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const now = ref(new Date());

// 1s 一跳；useIntervalFn 自带组件卸载清理，投放屏常年不关，不能留裸 setInterval
useIntervalFn(() => {
  now.value = new Date();
}, 1000);

const text = computed(() =>
  formatClock(now.value, {
    showDate: style.value.showDate !== false,
    showWeek: Boolean(style.value.showWeek),
    showSeconds: style.value.showSeconds !== false
  })
);

const textStyle = computed(() => ({
  fontSize: `${Number(style.value.fontSize) || 26}px`,
  color: resolveColor(style.value.color, 'datav-text-primary')
}));
</script>

<template>
  <div class="h-full w-full flex items-center justify-end whitespace-nowrap px-6px tabular-nums" :style="textStyle">
    {{ text }}
  </div>
</template>
