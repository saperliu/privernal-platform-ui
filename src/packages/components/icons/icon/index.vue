<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

defineOptions({ name: 'DatavIconGlyph' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const iconName = computed(() => String(style.value.icon ?? '').trim() || 'mdi:star-circle');
const size = computed(() => Math.max(16, Math.min(200, Number(style.value.size) || 64)));
const color = computed(() => `var(--${String(style.value.colorToken || 'datav-accent')})`);
</script>

<template>
  <div class="h-full w-full flex items-center justify-center overflow-hidden">
    <Icon :icon="iconName" :style="{ fontSize: `${size}px`, color }" aria-hidden="true" />
  </div>
</template>
