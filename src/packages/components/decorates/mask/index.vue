<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'DatavMask' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const strength = computed(() => Math.max(0, Math.min(100, Number(style.value.strength) || 0)) / 100);
const spread = computed(() => Math.max(10, Math.min(100, Number(style.value.spread) || 60)));

/** 渐晕只压角不压边：radial 从中心透明到四角半透明，遮罩色取画布背景色保证任何配色板下都协调 */
const maskStyle = computed(() => ({
  background: `radial-gradient(ellipse ${spread.value}% ${spread.value}% at 50% 50%, transparent 55%, color-mix(in srgb, var(--datav-canvas-bg) ${Math.round(strength.value * 100)}%, transparent) 100%)`
}));
</script>

<template>
  <div class="pointer-events-none h-full w-full" :style="maskStyle"></div>
</template>
