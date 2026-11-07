<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'DatavDivider' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const color = computed(() => `var(--${String(style.value.colorToken || 'datav-border')})`);

const lineStyle = computed(() => ({
  height: `${Math.max(1, Math.min(6, Number(style.value.lineWidth) || 1))}px`,
  background: color.value,
  opacity: style.value.dashed === true ? undefined : 1,
  backgroundImage:
    style.value.dashed === true
      ? `repeating-linear-gradient(90deg, ${color.value} 0 8px, transparent 8px 16px)`
      : undefined
}));
</script>

<template>
  <div class="h-full w-full flex items-center justify-center gap-6px px-4px">
    <div class="flex-1" :style="lineStyle"></div>
    <span v-if="style.withCenter !== false" class="diamond" :style="{ borderColor: color }"></span>
    <div class="flex-1" :style="lineStyle"></div>
  </div>
</template>

<style scoped>
.diamond {
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
  border: 1px solid;
  flex-shrink: 0;
}
</style>
