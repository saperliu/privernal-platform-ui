<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { useMarquee, useWidgetManipulation } from '@/hooks/datav/useWidgetManipulation';
import { DATAV_STAGE_KEY } from '@/hooks/datav/useDatavStage';
import { useDatavRuntime } from '@/hooks/datav/useDatavRuntime';
import type { HandleKey } from '@/hooks/datav/useWidgetManipulation';
import { hitTest } from '@/utils/datav-geometry';
import DatavWidgetRuntime from '../widget-runtime/index.vue';

defineOptions({ name: 'DatavCanvasStage' });

const props = withDefaults(
  defineProps<{
    widgets: DatavNamespace.Widget[];

    canvas: DatavNamespace.Canvas;

    selectedIds?: string[];

    /** 预览与投放模式下关闭全部操纵 */
    interactive?: boolean;

    /** 解析成组成员：拖一个等于拖一组 */
    resolveMembers?: (widgetId: string) => string[];

    /**
     * 设计稿 → 屏幕的缩放比，必须由调用方给：
     * stage 自身的 offsetWidth 始终是设计稿宽度（transform 不改布局），在这里反算只会恒等于 1
     */
    scale?: number;
  }>(),
  { selectedIds: () => [], interactive: true, resolveMembers: undefined, scale: 1 }
);

const emit = defineEmits<{
  (e: 'select', ids: string[], additive: boolean): void;

  (e: 'clear-select'): void;

  (e: 'commit', patches: Record<string, Partial<DatavNamespace.Layout>>): void;

  /** 右键落在某个组件上：菜单项要按它来算，否则「右键这个组件→锁定」根本无从谈起 */
  (e: 'widget-contextmenu', widgetId: string, event: MouseEvent): void;
}>();

const stageRef = ref<HTMLElement | null>(null);

/** 运行态才有 runtime；编辑器里 provide 缺失时给空对象，模板不必到处判空 */
const runtimeResults = computed(() => useDatavRuntime()?.results ?? {});

/** 鼠标位移换算与手柄命中都在设计稿坐标系里做，统一除以此缩放比 */
const viewScale = computed(() => props.scale || 1);

/** 主题、配色板、缩放比都是画布级设置，由舞台下发；组件不该为拿一个 theme 层层透传 prop */
provide(DATAV_STAGE_KEY, { canvas: computed(() => props.canvas), scale: viewScale });

const {
  live,
  readout,
  manipulating,
  alignGuides,
  begin: beginManipulation
} = useWidgetManipulation({
  getScale: () => viewScale.value,
  getGrid: () => ({
    size: props.canvas.grid?.size ?? 10,
    snap: Boolean(props.canvas.grid?.snap),
    alignGuide: props.canvas.grid?.alignGuide !== false
  }),
  getCanvas: () => ({ width: props.canvas.width, height: props.canvas.height }),
  // 锁定的组件照样当参照：对齐到「不许动的那块」正是锁定的用法之一；隐藏的组件排除
  getAlignBoxes: excludeIds => {
    const skip = new Set(excludeIds);
    return props.widgets
      .filter(widget => !skip.has(widget.id) && !widget.layout.hidden)
      .map(widget => ({
        x: widget.layout.x,
        y: widget.layout.y,
        w: widget.layout.w,
        h: widget.layout.h
      }));
  },
  resolveMembers: id => (props.resolveMembers ? props.resolveMembers(id) : [id]),
  getLayout: id => layoutById(id),
  commit: patches => emit('commit', patches)
});

/** 参考线画在设计稿坐标系里，线宽要除以缩放比才在屏幕上保持一条发丝线 */
function guideStyle(guide: { axis: 'x' | 'y'; at: number }) {
  const hair = `${1 / viewScale.value}px`;
  return guide.axis === 'x'
    ? { left: `${guide.at}px`, top: '0', width: hair, height: `${props.canvas.height}px` }
    : { top: `${guide.at}px`, left: '0', height: hair, width: `${props.canvas.width}px` };
}

const { marquee: marqueeRect, begin: beginMarquee } = useMarquee({
  getScale: () => viewScale.value,
  onSelect: (rect, additive) => {
    const hit = props.widgets.filter(widget => hitTest(widget.layout, rect)).map(widget => widget.id);
    emit('select', hit, additive);
  }
});

/**
 * 增量渲染的判据（M5.8）：位置尺寸走字符串签名，样式与数据走对象身份。
 *
 * 二者必须分开——store 的 action 是 `target.layout = {...}` / `target.style = {...}` 这种
 * 整体替换，所以 style/data 换没换看引用就够了；而 layout 每帧都在变，只有拖中的那个组件
 * 签名会变，其余组件因此被 v-memo 整棵子树跳过（图表实例不再被重新 patch）。
 * 只比 widget 身份不行：就地改 layout 时身份不变，会漏渲染。
 */
function memoKey(widget: DatavNamespace.Widget) {
  const layout = layoutById(widget.id) ?? widget.layout;
  // name 必须在依赖里：aria-label 由它拼出来，而改名只动 name 不动 style/data，
  // 漏进来就是「图层面板改了名、读屏念出来的还是旧名字」——memo 命中时整棵子树连模板都不重算
  return `${layout.x},${layout.y},${layout.w},${layout.h},${layout.rotate},${layout.z},${layout.hidden},${layout.locked}|${widget.name}|${
    widget.style
  }|${widget.data}`;
}

/** 背景由舞台负责：编辑器与预览共用同一份渲染口径，避免两处各写一遍 */
const backgroundStyle = computed(() => {
  const bg = props.canvas.background;
  if (!bg?.value) return {};
  if (bg.type === 'image') {
    return { background: `url(${bg.value}) center / ${bg.size || 'cover'} no-repeat` };
  }
  // 允许写 token 名（datav-bg）或直接写 CSS 色值
  return { background: bg.value.startsWith('datav-') ? `var(--${bg.value})` : bg.value };
});

const selectedList = computed(() => props.selectedIds ?? []);

/** 缩放手柄只在单选时出现：多选按包围盒操纵会牵连锁定成员，语义不清 */
const singleSelected = computed(() =>
  props.interactive && selectedList.value.length === 1
    ? props.widgets.find(item => item.id === selectedList.value[0])
    : undefined
);

/**
 * 手柄尺寸按缩放比反向换算。
 *
 * 操纵层与组件在同一个 transform: scale() 容器里（这样手柄才会随组件一起转），
 * 于是 9px 的手柄在 19.7% 缩放的编辑器里实测只有 1.8px——鼠标根本抓不到。
 * 除以缩放比后它在屏幕上恒定约 11px，与画布缩放无关。
 */
const HANDLE_SCREEN_PX = 11;

const handleStyle = computed(() => {
  const size = HANDLE_SCREEN_PX / viewScale.value;
  return { width: `${size}px`, height: `${size}px`, margin: `${-size / 2}px 0 0 ${-size / 2}px` };
});

const rotateStyle = computed(() => {
  const size = (HANDLE_SCREEN_PX + 2) / viewScale.value;
  return {
    width: `${size}px`,
    height: `${size}px`,
    marginLeft: `${-size / 2}px`,
    top: `${-26 / viewScale.value}px`
  };
});

const HANDLES: Array<{ key: HandleKey; cls: string; cursor: string }> = [
  { key: 'nw', cls: 'left-0 top-0', cursor: 'nwse-resize' },
  { key: 'n', cls: 'left-1/2 top-0', cursor: 'ns-resize' },
  { key: 'ne', cls: 'right-0 top-0', cursor: 'nesw-resize' },
  { key: 'e', cls: 'right-0 top-1/2', cursor: 'ew-resize' },
  { key: 'se', cls: 'right-0 bottom-0', cursor: 'nwse-resize' },
  { key: 's', cls: 'left-1/2 bottom-0', cursor: 'ns-resize' },
  { key: 'sw', cls: 'left-0 bottom-0', cursor: 'nesw-resize' },
  { key: 'w', cls: 'left-0 top-1/2', cursor: 'ew-resize' }
];

/** 一次拖拽要给每个组件各查一次布局，find 在 100 组件时是 O(n²)——先建成表再查 */
const layoutIndex = computed(() => {
  const map = new Map<string, DatavNamespace.Layout>();
  props.widgets.forEach(item => map.set(item.id, item.layout));
  return map;
});

function layoutById(widgetId: string): DatavNamespace.Layout | null {
  return live[widgetId] ?? layoutIndex.value.get(widgetId) ?? null;
}

function boxStyle(widgetId: string) {
  const layout = layoutById(widgetId);
  if (!layout) return { display: 'none' };
  // 位置走 translate 而不是 left/top：拖一格改一次 left，浏览器要把整个绝对定位子树
  // 连同里面每个图表一起重新布局。100 个组件实测只有 26fps，换成 transform 后位移落在合成阶段。
  const transform = `translate(${layout.x}px, ${layout.y}px)${layout.rotate ? ` rotate(${layout.rotate}deg)` : ''}`;
  return {
    left: '0',
    top: '0',
    width: `${layout.w}px`,
    height: `${layout.h}px`,
    zIndex: layout.z,
    transform
  };
}

/** 屏幕坐标 → 设计稿坐标 */
function toDesignPoint(event: MouseEvent | PointerEvent) {
  const el = stageRef.value;
  if (!el) return { x: 0, y: 0 };
  const rect = el.getBoundingClientRect();
  const s = viewScale.value || 1;
  return { x: (event.clientX - rect.left) / s, y: (event.clientY - rect.top) / s };
}

function onWidgetPointerDown(widget: DatavNamespace.Widget, event: PointerEvent) {
  if (!props.interactive || event.button !== 0) return;
  event.stopPropagation();

  if (event.shiftKey) emit('select', [widget.id], true);
  else if (!selectedList.value.includes(widget.id)) emit('select', [widget.id], false);

  if (widget.layout.locked) return;
  beginManipulation('move', event, { id: widget.id });
}

/**
 * 键盘可达：Tab 落到组件即选中，之后方向键微调、Delete 删除、Esc 取消都才有的可用。
 *
 * 之前这些快捷键全都依赖「已经用鼠标选中了组件」，键盘用户没有任何办法进入那个状态——
 * 快捷键写了等于没写。Shift+Tab 不做到加选：FocusEvent 不带 shiftKey，硬猜会让键盘用户
 * 偶尔「把前一个组件丢了」，那比只能单选更糟。
 *
 * 只在编辑态给焦点。投放页不给组件 tabindex：读屏用户 Tab 进一个按了没反应的组件，
 * 比 Tab 不到它更误导（行级键盘选要 14 个图表各自配合，是另一件事）。
 */
function onWidgetFocus(widget: DatavNamespace.Widget) {
  if (!props.interactive) return;
  if (selectedList.value.includes(widget.id)) return;
  emit('select', [widget.id], false);
}

function onHandleDown(handle: HandleKey, event: PointerEvent) {
  if (!singleSelected.value) return;
  event.stopPropagation();
  beginManipulation('resize', event, { id: singleSelected.value.id, handle });
}

function onRotateDown(event: PointerEvent) {
  if (!singleSelected.value) return;
  event.stopPropagation();
  beginManipulation('rotate', event, { id: singleSelected.value.id });
}

let emptyDownAt = { x: 0, y: 0 };

function onEmptyPointerDown(event: PointerEvent) {
  if (event.button !== 0) return;
  emptyDownAt = { x: event.clientX, y: event.clientY };
  beginMarquee(event, toDesignPoint(event));
}

function onStagePointerUp(event: PointerEvent) {
  // 按下后没位移就是「点空白」：清空选择，而不是留下一个零尺寸框
  const moved = Math.abs(event.clientX - emptyDownAt.x) + Math.abs(event.clientY - emptyDownAt.y);
  if (moved < 4 && props.interactive) emit('clear-select');
}
</script>

<template>
  <div
    ref="stageRef"
    class="datav-stage datav-canvas"
    :class="{ 'is-manipulating': manipulating }"
    data-stage="1"
    :style="{
      width: `${canvas.width}px`,
      height: `${canvas.height}px`,
      transform: `scale(${viewScale})`,
      ...backgroundStyle,
      '--datav-grid-size': `${canvas.grid?.size ?? 10}px`
    }"
    @pointerdown="onEmptyPointerDown"
    @pointerup="onStagePointerUp"
  >
    <!--
      网格画在独立覆盖层而不是舞台的 background-image：
      背景色/背景图的 background 简写会连带重置 background-image，网格线因此从未显示过。
      覆盖层只在编辑态出现——投放/预览不该带设计辅助线。
    -->
    <div v-if="interactive && canvas.grid?.show" class="datav-stage__grid" aria-hidden="true"></div>
    <!--
 降级标志必须进 memo 依赖：它不由 widget 对象驱动。v-memo 命中时整棵子树连 v-if 都不再求值，
         漏掉它就是「横幅说 N 个组件是旧数据、角标却永远不出现」 
-->
    <div
      v-for="widget in widgets"
      v-show="!widget.layout.hidden"
      :key="widget.id"
      v-memo="[memoKey(widget), selectedList.includes(widget.id), !!runtimeResults[widget.id]?.stale]"
      class="datav-stage__item absolute"
      :class="{ 'is-selected': selectedList.includes(widget.id), 'is-locked': widget.layout.locked }"
      :style="boxStyle(widget.id)"
      :tabindex="interactive ? 0 : -1"
      role="button"
      :aria-label="`${widget.name}（方向键移动，Shift 方向键加速，Delete 删除）`"
      :aria-pressed="selectedList.includes(widget.id)"
      @focus="onWidgetFocus(widget)"
      @pointerdown="onWidgetPointerDown(widget, $event)"
      @contextmenu.stop.prevent="emit('widget-contextmenu', widget.id, $event)"
    >
      <DatavWidgetRuntime :widget="widget" />

      <span v-if="widget.layout.locked" class="datav-stage__lock" title="已锁定">锁</span>

      <!-- 降级角标：一块屏 30 个组件时，只给一条整屏横幅说不清是哪几个在吃旧数据 -->
      <span
        v-if="!interactive && runtimeResults[widget.id]?.stale"
        class="datav-stage__stale"
        title="显示的是上一次成功取数的快照"
      >
        旧数据
      </span>
    </div>

    <!-- 智能对齐参考线：拖拽过程中实时出现，松手即消 -->
    <div v-for="(guide, index) in alignGuides" :key="`guide-${index}`" class="datav-guide" :style="guideStyle(guide)" />

    <!-- 操纵层与组件同一变换容器内，手柄因此跟着组件一起转 -->
    <div
      v-if="singleSelected"
      class="datav-stage__overlay pointer-events-none absolute"
      :style="boxStyle(singleSelected.id)"
    >
      <div class="datav-stage__frame"></div>

      <div
        v-for="handle in HANDLES"
        :key="handle.key"
        class="datav-stage__handle pointer-events-auto absolute"
        :class="handle.cls"
        :style="{ ...handleStyle, cursor: handle.cursor }"
        @pointerdown="onHandleDown(handle.key, $event)"
      ></div>

      <div class="datav-stage__rotate pointer-events-auto" :style="rotateStyle" @pointerdown="onRotateDown"></div>
    </div>

    <div
      v-if="marqueeRect.active"
      class="datav-stage__marquee"
      :style="{
        left: `${marqueeRect.x}px`,
        top: `${marqueeRect.y}px`,
        width: `${marqueeRect.w}px`,
        height: `${marqueeRect.h}px`
      }"
    ></div>

    <div
      v-if="readout.visible && singleSelected"
      class="datav-stage__readout"
      :style="{ left: `${singleSelected.layout.x}px`, top: `${singleSelected.layout.y - 24}px` }"
    >
      {{ readout.text }}
    </div>
  </div>
</template>

<style scoped>
.datav-stage {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  background: var(--datav-canvas-bg);
}

.datav-stage__grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, var(--datav-grid) 1px, transparent 1px),
    linear-gradient(to bottom, var(--datav-grid) 1px, transparent 1px);
  background-size: var(--datav-grid-size, 10px) var(--datav-grid-size, 10px);
}

.datav-stage.is-manipulating {
  cursor: default;
  user-select: none;
}

/* 拖拽中只把**被拖的那个**提到独立合成层：其余 90 多个图表 canvas 留在原层，
   位移就是一次合成而不是把压住的 canvas 全部重绘一遍。给全部元素加 will-change 会
   直接造出上百个层，显存代价比省下的重绘更贵。 */
.datav-stage.is-manipulating .datav-stage__item.is-selected {
  will-change: transform;
}

.datav-stage__item {
  box-sizing: border-box;
  cursor: move;
}

.datav-stage__item.is-selected {
  outline: 1px solid var(--datav-accent);
}

.datav-stage__item.is-locked {
  cursor: default;
}

/* 键盘聚焦必须看得见：Tab 落点与鼠标选中的描边刻意不同（双圈），
   否则键盘用户无法判断自己到底站在哪个组件上 */
.datav-stage__item:focus-visible {
  outline: 2px solid var(--datav-accent);
  outline-offset: 2px;
}

.datav-stage__stale {
  position: absolute;
  bottom: 2px;
  right: 4px;
  padding: 0 3px;
  font-size: 10px;
  line-height: 1.5;
  color: var(--datav-warning);
  background: var(--datav-panel);
  border: 1px solid var(--datav-warning);
  border-radius: 2px;
}

.datav-stage__lock {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  line-height: 1;
  color: var(--datav-warning);
  opacity: 0.9;
}

.datav-stage__frame {
  position: absolute;
  inset: 0;
  border: 1px solid var(--datav-accent);
}

/* 尺寸与偏移全部由内联样式按缩放比换算给出，这里只管外观 */
.datav-stage__handle {
  background: var(--datav-panel);
  border: 1px solid var(--datav-accent);
  border-radius: 2px;
}

.datav-stage__rotate {
  position: absolute;
  left: 50%;
  background: var(--datav-panel);
  border: 1px solid var(--datav-accent);
  border-radius: 50%;
  cursor: grab;
}

.datav-stage__marquee {
  position: absolute;
  border: 1px dashed var(--datav-accent);
  background: color-mix(in srgb, var(--datav-accent) 12%, transparent);
  pointer-events: none;
}

.datav-stage__readout {
  position: absolute;
  z-index: 9999;
  padding: 1px 6px;
  font-size: 11px;
  white-space: nowrap;
  color: var(--datav-text-primary);
  background: var(--datav-panel);
  border: 1px solid var(--datav-border);
  border-radius: 3px;
  pointer-events: none;
}
</style>
