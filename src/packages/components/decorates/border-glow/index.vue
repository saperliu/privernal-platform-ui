<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'DatavBorderGlow' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const colorVar = computed(() => `var(--${String(style.value.colorToken || 'datav-accent')})`);

const frameStyle = computed(() => ({
  borderRadius: `${Math.max(0, Math.min(24, Number(style.value.radius) || 0))}px`,
  border: `1px solid ${colorVar.value}`,
  boxShadow: `0 0 ${Math.max(2, Math.min(20, Number(style.value.glowSpread) || 6))}px color-mix(in srgb, ${colorVar.value} 55%, transparent)`,
  background: style.value.fillPanel !== false ? 'var(--datav-panel)' : 'transparent'
}));
</script>

<template>
  <div class="h-full w-full" :style="frameStyle"></div>
</template>
