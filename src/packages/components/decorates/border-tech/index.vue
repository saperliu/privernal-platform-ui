<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'DatavBorderTech' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const cut = computed(() => Math.max(4, Math.min(40, Number(style.value.cutSize) || 16)));
const lineWidth = computed(() => Math.max(1, Math.min(4, Number(style.value.lineWidth) || 1)));
const color = computed(() => `var(--${String(style.value.colorToken || 'datav-accent')})`);

const frameStyle = computed(() => ({
  clipPath: `polygon(${cut.value}px 0, 100% 0, 100% calc(100% - ${cut.value}px), calc(100% - ${cut.value}px) 100%, 0 100%, 0 ${cut.value}px)`,
  background: style.value.fillPanel !== false ? 'var(--datav-panel)' : 'transparent'
}));

// clip-path 会把 border 一起裁掉，描边用一层放大 1px 的同形状伪层实现：
// 外层描边色 + 内层实际背景，两层同 clip-path 叠出 1px 边线
const outlineStyle = computed(() => ({
  ...frameStyle.value,
  background: color.value,
  padding: `${lineWidth.value}px`
}));
</script>

<template>
  <div class="relative h-full w-full">
    <div class="absolute inset-0" :style="outlineStyle">
      <div class="h-full w-full" :style="frameStyle"></div>
    </div>
  </div>
</template>
