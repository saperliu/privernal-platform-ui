<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'DatavUnderline' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const fontSize = computed(() => Math.max(12, Math.min(48, Number(style.value.fontSize) || 22)));
const color = computed(() => `var(--${String(style.value.colorToken || 'datav-text-primary')})`);
const lineColor = computed(() => `var(--${String(style.value.lineToken || 'datav-accent')})`);
const align = computed(() => String(style.value.align || 'left'));
</script>

<template>
  <div class="h-full w-full flex flex-col justify-center overflow-hidden" :style="{ alignItems: align }">
    <span class="max-w-full truncate font-600" :style="{ fontSize: `${fontSize}px`, color }">
      {{ style.text || '标题' }}
    </span>
    <!-- 两端收窄的渐变线：与文字同宽时按文字中心对齐的语义画，不用百分比硬编码线长 -->
    <span
      class="underline-line"
      :style="{ background: `linear-gradient(90deg, transparent, ${lineColor}, transparent)` }"
    ></span>
  </div>
</template>

<style scoped>
.underline-line {
  display: block;
  width: 100%;
  height: 2px;
  margin-top: 6px;
  border-radius: 2px;
}
</style>
