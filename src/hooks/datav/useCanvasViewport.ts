import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { Ref } from 'vue';

/** 缩放区间：再小画布上的文字糊成一团，再大没有意义（放大看像素不是设计器的活） */
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 4;

const clamp = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

/**
 * 画布视口：缩放（Ctrl+滚轮 / 工具栏）与平移（工作台空白左键拖拽、空格拖拽、中键拖拽）。
 *
 * 平移是 **transform: translate**（go-view 同款），刻意不用原生滚动承载位移：
 * 滚动有硬边界——画布适配后恰好塞满内容盒时 scrollable overflow 为 0，用户怎么拖都纹丝
 * 不动，看起来就是"画布不可动"；transform 平移没有边界，拖到哪画布到哪。
 * 代价是失去滚动条这条"我在画布哪里"的线索，由标尺实时跟随（拖动中每帧 measure）补偿。
 *
 * 缩放要**锚住光标下的那个点**：不锚的话每次放大都往左上角缩，视线里的东西会跑掉。
 * 锚点用「缩放前后各量一次舞台 rect、差值补平移量」实现，而不是拿布局参数去推算——
 * 画布居中、容器有内边距，推算式每一条都要额外对齐，量一次就完了。
 */
export function useCanvasViewport(options: {
  containerRef: Ref<HTMLElement | null>;

  /** 适配缩放（把整张设计稿塞进可视区的那个比例） */
  getFitScale: () => number;

  /** 舞台元素，用于量锚点 */
  getStageEl: () => HTMLElement | null;
}) {
  const zoom = ref(1);
  const scale = computed(() => (options.getFitScale() || 1) * zoom.value);

  /** 平移偏移（屏幕像素），作用在画布框的 transform 上，无边界 */
  const panX = ref(0);
  const panY = ref(0);
  const panStyle = computed(() => ({ transform: `translate(${panX.value}px, ${panY.value}px)` }));

  /** 舞台与滚动容器的屏幕位置：标尺要按两者的差算出设计稿原点在哪儿 */
  const stageRect = ref<DOMRect | null>(null);
  const containerRect = ref<DOMRect | null>(null);

  function measure() {
    const el = options.getStageEl();
    if (el) stageRect.value = el.getBoundingClientRect();
    const container = options.containerRef.value;
    if (container) containerRect.value = container.getBoundingClientRect();
  }

  function setZoom(next: number, anchor?: { x: number; y: number }) {
    const value = clamp(next);
    if (Math.abs(value - zoom.value) < 1e-4) return;
    const stageBefore = options.getStageEl();
    let pinned: { designX: number; designY: number } | null = null;
    if (anchor && stageBefore) {
      const rect = stageBefore.getBoundingClientRect();
      pinned = { designX: (anchor.x - rect.left) / scale.value, designY: (anchor.y - rect.top) / scale.value };
    }
    zoom.value = value;
    if (!pinned || !anchor) {
      nextTick(measure);
      return;
    }
    nextTick(() => {
      const rect = options.getStageEl()?.getBoundingClientRect();
      if (!rect) {
        measure();
        return;
      }
      // 舞台该落在「锚点屏幕坐标 − 设计稿坐标 × 新比例」上，差值补进平移量；
      // 平移是响应式样式，要等下一次 DOM 刷新后再量，否则标尺拿到的是补偿前的旧位置
      panX.value += anchor.x - pinned.designX * scale.value - rect.left;
      panY.value += anchor.y - pinned.designY * scale.value - rect.top;
      nextTick(measure);
    });
  }

  function zoomBy(factor: number, anchor?: { x: number; y: number }) {
    setZoom(zoom.value * factor, anchor);
  }

  function resetView() {
    zoom.value = 1;
    panX.value = 0;
    panY.value = 0;
    nextTick(measure);
  }

  // —— 滚轮缩放 ——
  function onWheel(event: WheelEvent) {
    if (!event.ctrlKey && !event.metaKey) return;
    // 不 preventDefault 的话浏览器会把它当成页面缩放，整个编辑器一起糊掉
    event.preventDefault();
    zoomBy(Math.exp(-event.deltaY * 0.0015), { x: event.clientX, y: event.clientY });
  }

  // —— 工作台空白左键 / 空格 / 中键拖拽平移 ——
  const panning = ref(false);
  let spaceDown = false;
  let panStart: { x: number; y: number; panX: number; panY: number } | null = null;

  function onPointerMove(event: PointerEvent) {
    if (!panning.value || !panStart) return;
    panX.value = panStart.panX + (event.clientX - panStart.x);
    panY.value = panStart.panY + (event.clientY - panStart.y);
    // 拖动中每帧量一次，标尺实时跟随画布原点（失去滚动条后这是唯一的位置反馈）；
    // 同样要等 DOM 刷新后量
    nextTick(measure);
  }

  function endPan() {
    if (!panning.value) return;
    panning.value = false;
    panStart = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endPan);
    window.removeEventListener('pointercancel', endPan);
    nextTick(measure);
  }

  /**
   * 由容器在 pointerdown 时调用：返回 true 表示这一帧被平移吃掉，画布不该开始框选。
   * force=true 表示调用方已判定这是"画布框以外的工作台空白"——左键直接平移，不必按空格
   * （画布内左键是框选/选中，两者按落点分流不冲突）。
   */
  function tryBeginPan(event: PointerEvent, force = false): boolean {
    const middle = event.button === 1;
    if (!force && !spaceDown && !middle) return false;
    event.preventDefault();
    panning.value = true;
    panStart = { x: event.clientX, y: event.clientY, panX: panX.value, panY: panY.value };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endPan);
    window.addEventListener('pointercancel', endPan);
    return true;
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== ' ' || spaceDown) return;
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
    // 不拦的话空格会把滚动容器焦点下的按钮再点一次，还会让页面往下翻一屏
    event.preventDefault();
    spaceDown = true;
  }

  function onKeyUp(event: KeyboardEvent) {
    if (event.key !== ' ') return;
    spaceDown = false;
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    nextTick(measure);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endPan);
    window.removeEventListener('pointercancel', endPan);
  });

  return {
    zoom,
    scale,
    panX,
    panY,
    panStyle,
    stageRect,
    containerRect,
    setZoom,
    zoomBy,
    resetView,
    onWheel,
    tryBeginPan,
    panning,
    measure
  };
}
