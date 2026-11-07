<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * 画布 / 组件右键菜单（M5.6）
 *
 * 菜单项由调用方给（画布空白处与组件上的可用操作不同），本组件只负责定位、关闭与
 * 「点外面就收起来」。做成受控的而不是自带业务动作，是为了让快捷键和菜单走**同一个**
 * store action——两处各实现一遍的话，很快就会出现菜单能做、快捷键不能做的分叉。
 */
export interface MenuItem {
  key: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  divided?: boolean;
}

const props = defineProps<{ x: number; y: number; items: MenuItem[] }>();
const emit = defineEmits<{ (e: 'pick', key: string): void; (e: 'close'): void }>();

const rootRef = ref<HTMLElement | null>(null);

/** 靠右边/下边时往里收，别让菜单溢出到屏幕外拿不到 */
const position = computed(() => {
  const width = typeof window === 'undefined' ? 0 : window.innerWidth;
  const height = typeof window === 'undefined' ? 0 : window.innerHeight;
  return {
    left: `${Math.max(4, Math.min(props.x, width - 172))}px`,
    top: `${Math.max(4, Math.min(props.y, height - props.items.length * 28 - 12))}px`
  };
});

function onDocPointerDown(event: PointerEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) emit('close');
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close');
}

onMounted(() => {
  window.addEventListener('pointerdown', onDocPointerDown, true);
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onDocPointerDown, true);
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div ref="rootRef" class="datav-menu fixed" :style="position" @contextmenu.prevent.stop>
    <template v-for="item in items" :key="item.key">
      <div v-if="item.divided" class="datav-menu__sep"></div>
      <button
        class="datav-menu__item"
        :class="{ 'is-danger': item.danger, 'is-disabled': item.disabled }"
        :disabled="item.disabled"
        @click="emit('pick', item.key)"
      >
        {{ item.label }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.datav-menu {
  z-index: 2000;
  min-width: 160px;
  padding: 4px 0;
  background: var(--datav-panel);
  border: 1px solid var(--datav-border);
  border-radius: var(--datav-radius-sm);
  box-shadow: var(--datav-shadow-panel);
}

.datav-menu__item {
  display: block;
  width: 100%;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--datav-text-primary);
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
}

.datav-menu__item:hover:not(.is-disabled) {
  background: var(--datav-canvas-panel);
}

.datav-menu__item.is-danger {
  color: var(--datav-error);
}

.datav-menu__item.is-disabled {
  color: var(--datav-text-tertiary);
  cursor: default;
}

.datav-menu__sep {
  height: 1px;
  margin: 4px 0;
  background: var(--datav-border);
}
</style>
