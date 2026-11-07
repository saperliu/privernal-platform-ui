<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'PanelTitle' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

/**
 * 颜色一律按 token 名解析；填了非 token 的原始色值也兼容，
 * 这样用户手写的 `#fff` 不至于变成透明，但 lint 门禁会挡住新写的字面色值。
 */
function resolveColor(value: unknown, fallback: string) {
  if (typeof value !== 'string' || value.trim() === '') return `var(--${fallback})`;
  return value.startsWith('datav-') ? `var(--${value})` : value;
}

/** align 三档映射：只有显式 center/right 才改变贴边方向，缺省左对齐 */
function alignOffset(align: unknown): 'flex-start' | 'flex-end' | 'center' {
  if (align === 'center') return 'center';
  if (align === 'right') return 'flex-end';
  return 'flex-start';
}

const rootStyle = computed(() => ({
  justifyContent: alignOffset(style.value.align),
  color: resolveColor(style.value.textColor, 'datav-text-primary')
}));

const titleStyle = computed(() => ({ fontSize: `${Number(style.value.fontSize) || 20}px` }));

const barColor = computed(() => resolveColor(style.value.accent, 'datav-accent'));
</script>

<template>
  <div class="h-full w-full flex flex-col" :style="rootStyle">
    <div class="w-full flex items-center gap-8px">
      <span v-if="style.showBar !== false" class="datav-title-bar" :style="{ background: barColor }"></span>
      <span class="font-600 tracking-wide" :style="titleStyle">{{ style.text || '标题' }}</span>
      <span v-if="style.subText" class="text-12px opacity-60">{{ style.subText }}</span>
    </div>
    <div v-if="style.showDivider !== false" class="datav-title-divider mt-6px w-full"></div>
  </div>
</template>

<style scoped>
.datav-title-bar {
  width: 3px;
  height: 1em;
  min-height: 14px;
  border-radius: 2px;
}

.datav-title-divider {
  height: 1px;
  background: linear-gradient(to right, var(--datav-canvas-border, currentColor), transparent);
  opacity: 0.7;
}
</style>
