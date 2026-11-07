<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import { resolveColor } from '@/packages/components/protocol';

defineOptions({ name: 'DatavText' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

/** align 三档映射：缺省左对齐，返回值必须是字面量联合才能塞进 CSSProperties.textAlign */
function alignValue(align: unknown): 'left' | 'center' | 'right' {
  if (align === 'center') return 'center';
  if (align === 'right') return 'right';
  return 'left';
}

// 标成 CSSProperties：不标注时 textAlign 会被推成 string，Vue 的样式类型只认字面量联合
const textStyle = computed<CSSProperties>(() => ({
  fontSize: `${Number(style.value.fontSize) || 24}px`,
  color: resolveColor(style.value.color, 'datav-text-primary'),
  fontWeight: style.value.bold === false ? '400' : '700',
  textAlign: alignValue(style.value.align)
}));
</script>

<template>
  <div class="h-full w-full overflow-hidden whitespace-pre-wrap px-6px py-4px leading-tight" :style="textStyle">
    {{ style.content || '' }}
  </div>
</template>
