<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'DatavFlowLineV' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const thickness = computed(() => `${Math.max(1, Math.min(8, Number(style.value.thickness) || 2))}px`);
const color = computed(() => `var(--${String(style.value.colorToken || 'datav-accent')})`);
const animate = computed(() => (Number(style.value.speedSec) || 0) > 0);
const duration = computed(() => `${Math.max(1, Number(style.value.speedSec) || 3)}s`);
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <div
      class="flow-track"
      :style="{ width: thickness, background: `linear-gradient(180deg, transparent, ${color}, transparent)` }"
    ></div>
    <div
      v-if="animate"
      class="flow-spot"
      :style="{ width: thickness, background: color, color, animationDuration: duration }"
    ></div>
  </div>
</template>

<style scoped>
.flow-track {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 999px;
  opacity: 0.45;
}

/* 纵向变体：光斑高 22%，自上而下平移；与横向流光线同一套时长与颜色口径 */
.flow-spot {
  position: absolute;
  top: 0;
  left: 50%;
  height: 22%;
  border-radius: 999px;
  box-shadow: 0 0 8px 1px currentColor;
  animation: flow-sweep-v linear infinite;
  will-change: transform;
}

@keyframes flow-sweep-v {
  0% {
    transform: translate(-50%, -100%);
  }

  100% {
    transform: translate(-50%, calc(100% / 0.22));
  }
}

@media (prefers-reduced-motion: reduce) {
  .flow-spot {
    animation: none;
    display: none;
  }
}
</style>
