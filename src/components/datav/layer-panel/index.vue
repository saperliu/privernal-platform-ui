<script setup lang="ts">
import { computed } from 'vue';

/**
 * 图层面板（M5.5）
 *
 * 行序按 z **降序**（最上面的组件排在列表最前），与 Figma / PPT 的直觉一致；
 * 而 schema 里 z 是升序渲染的，所以这里必须显式反转，别指望调用方记得。
 *
 * 面板只发意图、不改状态：选中、锁定、隐藏、换层全部回给 store，
 * 这样每条操作都能走同一处 commit，撤销栈才不会漏项。
 */
const props = defineProps<{
  /** z 升序的组件列表，由 store.orderedWidgets 给出 */
  widgets: DatavNamespace.Widget[];

  selectedIds: string[];
}>();

const emit = defineEmits<{
  (e: 'select', ids: string[], additive: boolean): void;
  (e: 'rename', id: string, name: string): void;
  (e: 'toggleLock', id: string): void;
  (e: 'toggleHidden', id: string): void;
  (e: 'move', id: string, direction: 'up' | 'down'): void;
}>();

const rows = computed(() => [...props.widgets].reverse());

function onRowClick(widget: DatavNamespace.Widget, event: MouseEvent) {
  emit('select', [widget.id], event.shiftKey || event.ctrlKey || event.metaKey);
}

function onRename(widget: DatavNamespace.Widget, event: FocusEvent) {
  const value = (event.target as HTMLInputElement).value.trim();
  if (value && value !== widget.name) emit('rename', widget.id, value);
}
</script>

<template>
  <div class="datav-layer h-full min-h-0 flex flex-col">
    <div class="flex items-center justify-between px-10px py-8px text-12px opacity-70">
      <span>图层（{{ widgets.length }}）</span>
      <span>点选 / Shift 多选</span>
    </div>
    <div class="min-h-0 flex-1 overflow-auto">
      <div
        v-for="(widget, index) in rows"
        :key="widget.id"
        class="datav-layer__row flex items-center gap-6px px-8px py-4px text-12px"
        :class="{ 'is-active': selectedIds.includes(widget.id), 'is-quiet': widget.layout.hidden }"
        @click="onRowClick(widget, $event)"
      >
        <span class="w-16px shrink-0 opacity-50">{{ rows.length - index }}</span>
        <input
          class="datav-layer__name min-w-0 flex-1"
          :defaultValue="widget.name"
          :title="widget.type"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
          @blur="onRename(widget, $event)"
          @click.stop
        />
        <button
          class="datav-layer__btn"
          :title="widget.layout.locked ? '解锁' : '锁定'"
          @click.stop="emit('toggleLock', widget.id)"
        >
          {{ widget.layout.locked ? '锁' : '—' }}
        </button>
        <button
          class="datav-layer__btn"
          :title="widget.layout.hidden ? '显示' : '隐藏'"
          @click.stop="emit('toggleHidden', widget.id)"
        >
          {{ widget.layout.hidden ? '闭' : '眼' }}
        </button>
        <button
          class="datav-layer__btn"
          :disabled="index === 0"
          title="上移一层"
          @click.stop="emit('move', widget.id, 'up')"
        >
          ↑
        </button>
        <button
          class="datav-layer__btn"
          :disabled="index === rows.length - 1"
          title="下移一层"
          @click.stop="emit('move', widget.id, 'down')"
        >
          ↓
        </button>
      </div>
      <div v-if="!rows.length" class="px-12px py-16px text-12px opacity-50">画布还没有组件</div>
    </div>
  </div>
</template>

<style scoped>
.datav-layer__row {
  cursor: pointer;
  border-left: 2px solid transparent;
}

.datav-layer__row:hover {
  background: var(--datav-canvas-panel);
}

.datav-layer__row.is-active {
  background: var(--datav-canvas-panel);
  border-left-color: var(--datav-accent);
}

.datav-layer__row.is-quiet {
  opacity: 0.55;
}

.datav-layer__name {
  background: transparent;
  border: 1px solid transparent;
  color: inherit;
  font-size: 12px;
  outline: none;
}

.datav-layer__name:focus {
  border-color: var(--datav-accent);
  background: var(--datav-panel);
}

.datav-layer__btn {
  flex: none;
  width: 20px;
  height: 18px;
  font-size: 11px;
  line-height: 1;
  color: inherit;
  background: transparent;
  border: 1px solid var(--datav-border);
  border-radius: 2px;
  cursor: pointer;
}

.datav-layer__btn:disabled {
  opacity: 0.35;
  cursor: default;
}
</style>
