<script setup lang="ts">
import type { PageTabProps } from '../../types';
import ChromeTabBg from './chrome-tab-bg.vue';
import style from './index.module.css';
// 显式暴露给模板（新编译器不再自动把 css module import 绑定注入 setup 返回）
const styleBindings = style;

defineOptions({
  name: 'ChromeTab'
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
    class=":soy: relative inline-flex cursor-pointer items-center justify-center gap-16px whitespace-nowrap px-24px py-6px -mr-18px"
    :class="[
      styleBindings['chrome-tab'],
      { [styleBindings['chrome-tab_dark']]: darkMode },
      { [styleBindings['chrome-tab_active']]: active },
      { [styleBindings['chrome-tab_active_dark']]: active && darkMode }
    ]"
  >
    <div
      class=":soy: pointer-events-none absolute left-0 top-0 h-full w-full -z-1"
      :class="[styleBindings['chrome-tab__bg']]"
    >
      <ChromeTabBg />
    </div>
    <slot name="prefix"></slot>
    <slot></slot>
    <slot name="suffix"></slot>
    <div class=":soy: absolute right-7px h-16px w-1px bg-#1f2225" :class="[styleBindings['chrome-tab-divider']]"></div>
  </div>
</template>

<style scoped></style>
