<script setup lang="ts">
import { computed } from 'vue';
import type { Placement } from 'element-plus';
import { twMerge } from 'tailwind-merge';

defineOptions({
  name: 'ButtonIcon',
  inheritAttrs: false
});

interface Props {
  /** Button class */
  class?: string;
  /** Iconify icon name */
  icon?: string;
  /** Tooltip content */
  tooltipContent?: string;
  /** Tooltip placement */
  tooltipPlacement?: Placement;
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  icon: '',
  tooltipContent: '',
  tooltipPlacement: 'bottom',
  zIndex: 98
});

const DEFAULT_CLASS = 'h-[36px] text-icon';

// 经 computed 包装，避免模板直接引用 setup 的 import 绑定（rolldown-vite 编译产物可能丢失该绑定）
const mergedClass = computed(() => twMerge(DEFAULT_CLASS, props.class));
</script>

<template>
  <ElTooltip :placement="tooltipPlacement" :content="tooltipContent" :z-index="zIndex" :disabled="!tooltipContent">
    <ElButton text quaternary :class="mergedClass" v-bind="$attrs">
      <div class="flex-center gap-8px text-lg">
        <slot>
          <SvgIcon :icon="icon" />
        </slot>
      </div>
    </ElButton>
  </ElTooltip>
</template>

<style scoped></style>
