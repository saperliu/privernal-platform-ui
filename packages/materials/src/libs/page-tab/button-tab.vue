<script setup lang="ts">
import type { PageTabProps } from '../../types';
import style from './index.module.css';
// 显式暴露给模板（新编译器不再自动把 css module import 绑定注入 setup 返回）
const styleBindings = style;

defineOptions({
  name: 'ButtonTab'
});

defineProps<PageTabProps>();

type SlotFn = (props?: Record<string, unknown>) => any;

type Slots = {
  /**
   * Slot
   *
   * The center content of the tab
   */
  default?: SlotFn;
  /**
   * Slot
   *
   * The left content of the tab
   */
  prefix?: SlotFn;
  /**
   * Slot
   *
   * The right content of the tab
   */
  suffix?: SlotFn;
};

defineSlots<Slots>();
</script>

<template>
  <div
    class=":soy: relative inline-flex cursor-pointer items-center justify-center gap-12px whitespace-nowrap border-(1px solid) rounded-4px px-12px py-4px"
    :class="[
      styleBindings['button-tab'],
      { [styleBindings['button-tab_dark']]: darkMode },
      { [styleBindings['button-tab_active']]: active },
      { [styleBindings['button-tab_active_dark']]: active && darkMode }
    ]"
  >
    <slot name="prefix"></slot>
    <slot></slot>
    <slot name="suffix"></slot>
  </div>
</template>

<style scoped></style>
