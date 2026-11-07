<script lang="ts" setup>
import { computed } from 'vue';
import { getPaletteColorByNumber } from '@privernal/color';

defineOptions({ name: 'TechBg' });

interface Props {
  /** Theme color */
  themeColor: string;
  /** Dark mode */
  dark?: boolean;
}

const props = defineProps<Props>();

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 主光晕颜色：跟随主题色 */
const primaryGlow = computed(() => {
  const base = getPaletteColorByNumber(props.themeColor, props.dark ? 400 : 300);
  return hexToRgba(base, props.dark ? 0.38 : 0.55);
});

/** 漂浮粒子布局参数 */
const dots = [
  { left: '12%', top: '26%', size: 6, delay: '0s', duration: '11s' },
  { left: '22%', top: '68%', size: 4, delay: '2s', duration: '13s' },
  { left: '78%', top: '18%', size: 5, delay: '4s', duration: '12s' },
  { left: '86%', top: '56%', size: 4, delay: '1s', duration: '15s' },
  { left: '55%', top: '82%', size: 5, delay: '3s', duration: '14s' }
];
</script>

<template>
  <div class="absolute inset-0 z-1 overflow-hidden" :class="{ 'is-dark': dark }" aria-hidden="true">
    <div class="tech-bg-base"></div>
    <div class="tech-bg-grid"></div>
    <div
      class="tech-bg-orb tech-bg-orb-primary"
      :style="{ background: `radial-gradient(circle, ${primaryGlow} 0%, transparent 68%)` }"
    ></div>
    <div class="tech-bg-orb tech-bg-orb-teal"></div>
    <div class="tech-bg-orb tech-bg-orb-sky"></div>
    <div
      v-for="(dot, index) in dots"
      :key="index"
      class="tech-bg-dot"
      :style="{
        left: dot.left,
        top: dot.top,
        width: `${dot.size}px`,
        height: `${dot.size}px`,
        animationDelay: dot.delay,
        animationDuration: dot.duration
      }"
    ></div>
  </div>
</template>

<style scoped>
.tech-bg-base {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1100px 760px at 88% -8%, rgba(147, 197, 253, 0.28), transparent 62%),
    radial-gradient(900px 680px at -6% 108%, rgba(94, 234, 212, 0.22), transparent 60%),
    linear-gradient(152deg, #edf4ff 0%, #f8fbff 46%, #ecf9f3 100%);
}

.is-dark .tech-bg-base {
  background:
    radial-gradient(1100px 760px at 88% -8%, rgba(56, 120, 255, 0.16), transparent 62%),
    radial-gradient(900px 680px at -6% 108%, rgba(45, 212, 191, 0.1), transparent 60%),
    linear-gradient(152deg, #0a1020 0%, #0c1730 48%, #0a1a20 100%);
}

/* 网格线：边缘清晰、中心淡出，缓慢漂移 */
.tech-bg-grid {
  position: absolute;
  inset: 0;
  -webkit-mask-image: radial-gradient(ellipse 75% 65% at 50% 42%, transparent 26%, #000 100%);
  mask-image: radial-gradient(ellipse 75% 65% at 50% 42%, transparent 26%, #000 100%);
}

.tech-bg-grid::before {
  content: '';
  position: absolute;
  inset: -56px;
  background-image:
    linear-gradient(rgba(96, 125, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(96, 125, 255, 0.1) 1px, transparent 1px);
  background-size: 56px 56px;
  animation: tech-grid-drift 46s linear infinite;
}

.is-dark .tech-bg-grid::before {
  background-image:
    linear-gradient(rgba(125, 211, 252, 0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(125, 211, 252, 0.09) 1px, transparent 1px);
}

/* 柔光晕：低频浮动 */
.tech-bg-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(68px);
  will-change: transform;
}

.tech-bg-orb-primary {
  width: 620px;
  height: 620px;
  top: -16%;
  right: -8%;
  animation: tech-orb-a 24s ease-in-out infinite alternate;
}

.tech-bg-orb-teal {
  width: 520px;
  height: 520px;
  left: -10%;
  bottom: -14%;
  background: radial-gradient(circle, rgba(94, 234, 212, 0.42) 0%, transparent 68%);
  animation: tech-orb-b 30s ease-in-out infinite alternate;
}

.is-dark .tech-bg-orb-teal {
  background: radial-gradient(circle, rgba(45, 212, 191, 0.22) 0%, transparent 68%);
}

.tech-bg-orb-sky {
  width: 380px;
  height: 380px;
  top: 24%;
  left: -6%;
  background: radial-gradient(circle, rgba(147, 197, 253, 0.36) 0%, transparent 68%);
  animation: tech-orb-c 20s ease-in-out infinite alternate;
}

.is-dark .tech-bg-orb-sky {
  background: radial-gradient(circle, rgba(96, 165, 250, 0.2) 0%, transparent 68%);
}

/* 漂浮粒子 */
.tech-bg-dot {
  position: absolute;
  border-radius: 9999px;
  background: rgba(99, 116, 241, 0.38);
  box-shadow: 0 0 10px 1px rgba(99, 116, 241, 0.3);
  animation: tech-dot-rise 12s ease-in-out infinite alternate;
}

.is-dark .tech-bg-dot {
  background: rgba(125, 211, 252, 0.5);
  box-shadow: 0 0 12px 2px rgba(125, 211, 252, 0.28);
}

@keyframes tech-grid-drift {
  to {
    transform: translate3d(56px, 56px, 0);
  }
}

@keyframes tech-orb-a {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(-60px, 50px, 0) scale(1.12);
  }
}

@keyframes tech-orb-b {
  from {
    transform: translate3d(0, 0, 0) scale(1.06);
  }
  to {
    transform: translate3d(70px, -44px, 0) scale(0.94);
  }
}

@keyframes tech-orb-c {
  from {
    transform: translate3d(0, 0, 0) scale(0.96);
  }
  to {
    transform: translate3d(46px, 36px, 0) scale(1.14);
  }
}

@keyframes tech-dot-rise {
  0% {
    transform: translate3d(0, 0, 0);
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translate3d(14px, -46px, 0);
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tech-bg-grid::before,
  .tech-bg-orb,
  .tech-bg-dot {
    animation: none;
  }
}
</style>
