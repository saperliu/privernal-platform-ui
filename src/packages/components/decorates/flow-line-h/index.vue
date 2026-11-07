<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'DatavFlowLineH' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const thickness = computed(() => `${Math.max(1, Math.min(8, Number(style.value.thickness) || 2))}px`);
const color = computed(() => `var(--${String(style.value.colorToken || 'datav-accent')})`);
const animate = computed(() => (Number(style.value.speedSec) || 0) > 0);
const duration = computed(() => `${Math.max(1, Number(style.value.speedSec) || 3)}s`);
</script>

<template>
  <!-- 底线恒在（静态渐变），高光用绝对定位光斑平移；装饰动效关闭或被 prefers-reduced-motion 掐掉时底线仍在 -->
  <div class="relative h-full w-full overflow-hidden">
    <div
      class="flow-track"
      :style="{ height: thickness, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }"
    ></div>
    <div
      v-if="animate"
      class="flow-spot"
      :style="{ height: thickness, background: color, color, animationDuration: duration }"
    ></div>
  </div>
</template>

<style scoped>
.flow-track {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 999px;
  opacity: 0.45;
}

/* 光斑宽 22%，从 -22% 平移到 100% 父宽，首尾都藏在容器外所以不需要反向动画 */
.flow-spot {
  position: absolute;
  top: 50%;
  left: 0;
  width: 22%;
  border-radius: 999px;
  box-shadow: 0 0 8px 1px currentColor;
  animation: flow-sweep linear infinite;
  will-change: transform;
}

@keyframes flow-sweep {
  0% {
    transform: translate(-100%, -50%);
  }

  100% {
    transform: translate(calc(100% / 0.22), -50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flow-spot {
    animation: none;
    display: none;
  }
}
</style>
