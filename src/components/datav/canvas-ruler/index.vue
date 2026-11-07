<script setup lang="ts">
import { computed, ref } from 'vue';
import { rulerStep, rulerTicks } from '@/utils/datav-geometry';

/**
 * 画布标尺与人工辅助线（M5.4）
 *
 * 刻度与辅助线都画在**覆盖层**里而不是画布的缩放子树里：一是线宽不必再按 1/scale 补偿，
 * 二是缩放到 20% 时画布里的 1px 线根本看不见。代价是要自己换算设计稿↔屏幕坐标，
 * 换算只有这一处，比让每个覆盖物都去猜缩放比划算。
 *
 * 拖出来的辅助线随 schema 落库（canvas.guides），换人打开还在——它是画布的一部分语义，
 * 不是某个人的临时视图状态，所以不放视口层。
 */
const props = defineProps<{
  /** 设计稿 → 屏幕的总比例 */
  scale: number;

  /** 舞台左上角相对本组件盒子左上角的位置（屏幕像素） */
  originX: number;
  originY: number;

  /** 设计稿尺寸 */
  width: number;
  height: number;

  guides: DatavNamespace.UserGuide[];

  enabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'add', axis: 'x' | 'y', at: number): void;
  (e: 'move', index: number, at: number): void;
  (e: 'remove', index: number): void;
}>();

const rootRef = ref<HTMLElement | null>(null);

/** 拖拽中的临时线：松手才提交，否则一次拖拽会往历史栈里塞几十条 */
const draft = ref<{ axis: 'x' | 'y'; at: number } | null>(null);
const draggingGuide = ref(-1);

const step = computed(() => rulerStep(props.scale));

const ticksX = computed(() => rulerTicks(0, props.width, step.value));
const ticksY = computed(() => rulerTicks(0, props.height, step.value));

const toScreen = (design: number, origin: number) => origin + design * props.scale;
const toDesign = (screen: number, origin: number) => (screen - origin) / props.scale;

function local(event: PointerEvent) {
  const rect = rootRef.value?.getBoundingClientRect();
  return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
}

function designOf(event: PointerEvent, axis: 'x' | 'y') {
  const point = local(event);
  const raw = axis === 'x' ? toDesign(point.x, props.originX) : toDesign(point.y, props.originY);
  return Math.min(axis === 'x' ? props.width : props.height, Math.max(0, raw));
}

function beginDraft(event: PointerEvent, axis: 'x' | 'y') {
  event.preventDefault();
  draft.value = { axis, at: designOf(event, axis) };
  window.addEventListener('pointermove', moveDraft);
  window.addEventListener('pointerup', endDraft);
}

function moveDraft(event: PointerEvent) {
  if (!draft.value) return;
  draft.value = { ...draft.value, at: designOf(event, draft.value.axis) };
}

function endDraft() {
  const current = draft.value;
  window.removeEventListener('pointermove', moveDraft);
  window.removeEventListener('pointerup', endDraft);
  draft.value = null;
  if (current) emit('add', current.axis, current.at);
}

let dragAxis: 'x' | 'y' = 'x';

function onGuideMove(event: PointerEvent) {
  if (draggingGuide.value < 0) return;
  draft.value = { axis: dragAxis, at: designOf(event, dragAxis) };
}

function onGuideUp() {
  window.removeEventListener('pointermove', onGuideMove);
  window.removeEventListener('pointerup', onGuideUp);
  const index = draggingGuide.value;
  const at = draft.value?.at;
  draggingGuide.value = -1;
  draft.value = null;
  if (index >= 0 && at !== undefined) emit('move', index, at);
}

function beginGuideDrag(event: PointerEvent, index: number) {
  event.preventDefault();
  event.stopPropagation();
  dragAxis = props.guides[index]?.axis ?? 'x';
  draggingGuide.value = index;
  draft.value = { axis: dragAxis, at: props.guides[index].at };
  window.addEventListener('pointermove', onGuideMove);
  window.addEventListener('pointerup', onGuideUp);
}

const lines = computed(() => {
  const result = props.guides.map((guide, index) => ({ ...guide, index, draft: false }));
  if (draft.value && draggingGuide.value < 0) result.push({ ...draft.value, index: -1, draft: true });
  return result;
});
</script>

<template>
  <div v-if="enabled !== false" ref="rootRef" class="datav-ruler pointer-events-none absolute inset-0 overflow-hidden">
    <!-- 顶尺 -->
    <div class="datav-ruler__strip datav-ruler__strip--x absolute left-0 right-0 top-0">
      <div
        v-for="tick in ticksX"
        :key="`tx-${tick}`"
        class="datav-ruler__tick absolute"
        :style="{ left: `${toScreen(tick, originX)}px` }"
      >
        <span class="datav-ruler__label">{{ tick }}</span>
      </div>
      <div
        v-for="guide in lines.filter(item => item.axis === 'x')"
        :key="`gx-${guide.index}`"
        class="datav-ruler__mark absolute"
        :style="{ left: `${toScreen(guide.at, originX)}px` }"
        :title="`双击删除辅助线 ${Math.round(guide.at)}`"
        @pointerdown="guide.index >= 0 && beginGuideDrag($event, guide.index)"
        @dblclick="guide.index >= 0 && emit('remove', guide.index)"
      ></div>
      <div class="datav-ruler__grab pointer-events-auto absolute inset-0" @pointerdown="beginDraft($event, 'x')"></div>
    </div>
    <!-- 左尺 -->
    <div class="datav-ruler__strip datav-ruler__strip--y absolute bottom-0 left-0 top-0">
      <div
        v-for="tick in ticksY"
        :key="`ty-${tick}`"
        class="datav-ruler__tick datav-ruler__tick--y absolute"
        :style="{ top: `${toScreen(tick, originY)}px` }"
      >
        <span class="datav-ruler__label">{{ tick }}</span>
      </div>
      <div
        v-for="guide in lines.filter(item => item.axis === 'y')"
        :key="`gy-${guide.index}`"
        class="datav-ruler__mark datav-ruler__mark--y absolute"
        :style="{ top: `${toScreen(guide.at, originY)}px` }"
        :title="`双击删除辅助线 ${Math.round(guide.at)}`"
        @pointerdown="guide.index >= 0 && beginGuideDrag($event, guide.index)"
        @dblclick="guide.index >= 0 && emit('remove', guide.index)"
      ></div>
      <div class="datav-ruler__grab pointer-events-auto absolute inset-0" @pointerdown="beginDraft($event, 'y')"></div>
    </div>
    <!-- 辅助线本体 -->
    <div
      v-for="guide in lines.filter(item => item.axis === 'x')"
      :key="`gl-x-${guide.index}-${guide.at}`"
      class="datav-ruler__line absolute bottom-0 top-0"
      :style="{ left: `${toScreen(guide.at, originX)}px` }"
    ></div>
    <div
      v-for="guide in lines.filter(item => item.axis === 'y')"
      :key="`gl-y-${guide.index}-${guide.at}`"
      class="datav-ruler__line datav-ruler__line--h absolute left-0 right-0"
      :style="{ top: `${toScreen(guide.at, originY)}px` }"
    ></div>
  </div>
</template>

<style scoped>
.datav-ruler__strip {
  z-index: 6;
  background: var(--datav-panel);
  border-color: var(--datav-border);
}

.datav-ruler__strip--x {
  height: 20px;
  border-bottom: 1px solid var(--datav-border);
}

.datav-ruler__strip--y {
  width: 20px;
  border-right: 1px solid var(--datav-border);
}

.datav-ruler__tick {
  top: 0;
  height: 100%;
  border-left: 1px solid var(--datav-border);
}

.datav-ruler__tick--y {
  left: 0;
  width: 100%;
  border-top: 1px solid var(--datav-border);
  border-left: none;
}

.datav-ruler__label {
  position: absolute;
  top: 1px;
  left: 2px;
  font-size: 9px;
  line-height: 1;
  color: var(--datav-text-tertiary);
  white-space: nowrap;
}

.datav-ruler__tick--y .datav-ruler__label {
  top: 2px;
  left: 2px;
}

.datav-ruler__line {
  z-index: 5;
  width: 1px;
  background: var(--datav-accent);
  opacity: 0.75;
}

.datav-ruler__line--h {
  height: 1px;
}

.datav-ruler__mark {
  top: 0;
  width: 7px;
  height: 20px;
  margin-left: -3px;
  background: var(--datav-accent);
  cursor: ns-resize;
  pointer-events: auto;
}

.datav-ruler__mark--y {
  top: auto;
  left: 0;
  width: 20px;
  height: 7px;
  margin-top: -3px;
  margin-left: 0;
  cursor: ew-resize;
}

.datav-ruler__grab {
  cursor: copy;
}
</style>
