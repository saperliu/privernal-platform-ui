<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'DatavBorderCorner' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const cornerSize = computed(() => `${Math.max(8, Math.min(60, Number(style.value.cornerSize) || 18))}px`);
const lineWidth = computed(() => `${Math.max(1, Math.min(6, Number(style.value.lineWidth) || 2))}px`);
const color = computed(() => `var(--${String(style.value.colorToken || 'datav-accent')})`);

const cornerBase = {
  position: 'absolute',
  width: cornerSize.value,
  height: cornerSize.value,
  borderColor: color.value,
  borderStyle: 'solid'
} as const;
</script>

<template>
  <div class="relative h-full w-full">
    <span :style="{ ...cornerBase, left: 0, top: 0, borderWidth: `${lineWidth} 0 0 ${lineWidth}` }"></span>
    <span :style="{ ...cornerBase, right: 0, top: 0, borderWidth: `${lineWidth} ${lineWidth} 0 0` }"></span>
    <span :style="{ ...cornerBase, left: 0, bottom: 0, borderWidth: `0 0 ${lineWidth} ${lineWidth}` }"></span>
    <span :style="{ ...cornerBase, right: 0, bottom: 0, borderWidth: `0 ${lineWidth} ${lineWidth} 0` }"></span>
  </div>
</template>
