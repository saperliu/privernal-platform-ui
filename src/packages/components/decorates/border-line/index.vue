<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'DatavBorderLine' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const frameStyle = computed(() => ({
  borderWidth: `${Math.max(1, Math.min(6, Number(style.value.lineWidth) || 1))}px`,
  borderRadius: `${Math.max(0, Math.min(24, Number(style.value.radius) || 0))}px`,
  borderColor: `var(--${String(style.value.colorToken || 'datav-border')})`
}));
</script>

<template>
  <div class="h-full w-full border border-solid" :style="frameStyle"></div>
</template>
