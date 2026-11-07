<script setup lang="ts">
/**
 * 大屏空态插画：抽象的「图表画布」轮廓（柱 + 折线 + 环形），全部走 --datav-* token，
 * 配色板与明暗主题切换自动跟随。用在空画布引导、空数据等场景，替代一行灰字。
 */
defineOptions({ name: 'DatavEmpty' });

withDefaults(defineProps<{ text?: string; size?: number }>(), { text: '暂无数据', size: 96 });
</script>

<template>
  <div class="datav-empty flex flex-col select-none items-center justify-center gap-8px" aria-live="polite">
    <svg
      :width="size"
      :height="size * 0.62"
      viewBox="0 0 120 74"
      fill="none"
      aria-hidden="true"
      class="datav-empty__art"
    >
      <!-- 画布底板 -->
      <rect x="4" y="4" width="112" height="66" rx="6" stroke="var(--datav-border)" stroke-width="1.5" />
      <!-- 三根柱 -->
      <rect x="18" y="42" width="9" height="20" rx="1.5" class="datav-empty__bar" />
      <rect x="33" y="30" width="9" height="32" rx="1.5" class="datav-empty__bar" />
      <rect x="48" y="48" width="9" height="14" rx="1.5" class="datav-empty__bar" />
      <!-- 折线 -->
      <polyline
        points="20,36 38,24 56,42 74,18 92,30"
        stroke="var(--datav-series-2)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.85"
      />
      <!-- 环形 -->
      <circle cx="100" cy="22" r="9" stroke="var(--datav-series-3)" stroke-width="3" opacity="0.85" />
    </svg>
    <div class="text-12px" style="color: var(--datav-text-secondary)">{{ text }}</div>
  </div>
</template>

<style scoped>
.datav-empty__bar {
  fill: var(--datav-series-1);
  opacity: 0.5;
}

.datav-empty__art {
  opacity: 0.8;
}
</style>
