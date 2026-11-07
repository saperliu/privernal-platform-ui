import { reactive, ref } from 'vue';
import {
  boundingBox,
  computeAlignedMove,
  computeResized,
  computeRotated,
  normalizeRect,
  pointerAngle,
  snap
} from '@/utils/datav-geometry';
import type { AlignGuide, Box } from '@/utils/datav-geometry';

/** 三种直接操纵 */
export type ManipMode = 'move' | 'resize' | 'rotate';

/** 八向缩放手柄 */
export type HandleKey = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface ManipulationReadout {
  visible: boolean;

  text: string;
}

/**
 * 画布直接操纵：移动、缩放、旋转
 *
 * 两条不可妥协的规则：
 * 1. 拖拽过程中只写本组件的 `live` 状态，松手时才通过 commit 落一条历史——
 *    否则一次拖拽会产生上百条撤销记录，撤销栈等于废掉。
 * 2. 鼠标位移必须除以画布缩放比换算成设计稿像素，否则在非 1920 宽的屏幕上
 *    组件会与光标脱节（scale<1 时组件跑得比手慢）。
 */
export function useWidgetManipulation(options: {
  /** 当前画布缩放比（设计稿 → 屏幕） */
  getScale: () => number;

  /** 吸附网格尺寸、开关，以及是否启用智能对齐参考线 */
  getGrid: () => { size: number; snap: boolean; alignGuide?: boolean };

  /** 画布尺寸，用于把组件夹在可视范围内 */
  getCanvas: () => { width: number; height: number };

  /**
   * 智能对齐的参照盒：除本次移动成员之外的可见组件（锁定项要保留——正是要对齐到它）。
   * 不传或返回空时等于只做网格吸附。
   */
  getAlignBoxes?: (excludeIds: string[]) => Box[];

  /** 拖某组件时应一起动的成员（成组语义），单选时返回它自己 */
  resolveMembers: (widgetId: string) => string[];

  /** 取当前布局快照（拖拽起点） */
  getLayout: (widgetId: string) => DatavNamespace.Layout | null;

  /** 松手时提交 */
  commit: (patches: Record<string, Partial<DatavNamespace.Layout>>) => void;
}) {
  const live = reactive<Record<string, DatavNamespace.Layout>>({});
  const manipulating = ref(false);
  const mode = ref<ManipMode | null>(null);
  const readout = ref<ManipulationReadout>({ visible: false, text: '' });

  /** 当前命中的对齐参考线，拖拽过程中实时变化 */
  const alignGuides = ref<AlignGuide[]>([]);

  let startPointer = { x: 0, y: 0 };
  let starts: Record<string, DatavNamespace.Layout> = {};
  let activeHandle: HandleKey = 'se';
  let activeIds: string[] = [];
  let anchor = { x: 0, y: 0 };
  let startAngle = 0;
  let startRotation = 0;
  let moved = false;

  function toDesignDelta(event: PointerEvent) {
    const scale = options.getScale() || 1;
    return {
      dx: (event.clientX - startPointer.x) / scale,
      dy: (event.clientY - startPointer.y) / scale
    };
  }

  function updateReadout() {
    if (!activeIds.length) return;
    const primary = live[activeIds[0]];
    if (!primary) return;
    if (mode.value === 'resize') readout.value = { visible: true, text: `${primary.w} × ${primary.h}` };
    else if (mode.value === 'rotate') readout.value = { visible: true, text: `${Math.round(primary.rotate)}°` };
    else readout.value = { visible: true, text: `X ${primary.x}  Y ${primary.y}` };
  }

  function applyMove(dx: number, dy: number) {
    const grid = options.getGrid();
    const canvas = options.getCanvas();
    const members = activeIds.map(id => starts[id]).filter((item): item is DatavNamespace.Layout => Boolean(item));

    let offX = dx;
    let offY = dy;
    let alignedX = false;
    let alignedY = false;
    alignGuides.value = [];
    if (grid.alignGuide && members.length && options.getAlignBoxes) {
      // 用整体外接盒去找参考线，再把同一个校正量施加给每个成员：
      // 逐元素各自吸附会让一组宽度不一的组件彼此错开，组内间距直接被拖坏
      const membersBox = boundingBox(members);
      const hit = computeAlignedMove(
        { ...membersBox, x: membersBox.x + dx, y: membersBox.y + dy },
        options.getAlignBoxes(activeIds),
        {
          width: canvas.width,
          height: canvas.height
        }
      );
      if (hit.dx !== 0) {
        offX += hit.dx;
        alignedX = true;
      }
      if (hit.dy !== 0) {
        offY += hit.dy;
        alignedY = true;
      }
      alignGuides.value = hit.guides;
    }

    activeIds.forEach(id => {
      const start = starts[id];
      if (!start) return;
      // 命中参考线的那个轴不再叠加网格吸附：网格会把组件从线上推开，线就白画了
      const rawX = start.x + offX;
      const rawY = start.y + offY;
      const nextX = alignedX ? rawX : snap(rawX, grid.size, grid.snap);
      const nextY = alignedY ? rawY : snap(rawY, grid.size, grid.snap);
      // 允许贴边拖出一点，但不允许整体离开可视区（否则组件会「再也点不到」）
      const x = Math.max(-start.w + 20, Math.min(canvas.width - 20, nextX));
      const y = Math.max(-start.h + 20, Math.min(canvas.height - 20, nextY));
      live[id] = { ...start, x: Math.round(x), y: Math.round(y) };
    });
  }

  function applyResize(dx: number, dy: number, keepRatio: boolean) {
    const id = activeIds[0];
    const start = starts[id];
    if (!start) return;
    const grid = options.getGrid();
    const box = computeResized(start, activeHandle, {
      dx,
      dy,
      gridSize: grid.size,
      snapEnabled: grid.snap,
      keepRatio
    });
    live[id] = { ...start, ...box };
  }

  function applyRotate(event: PointerEvent, snap15: boolean) {
    const id = activeIds[0];
    const start = starts[id];
    if (!start) return;
    const angle = pointerAngle({ x: event.clientX, y: event.clientY }, { x: anchor.x, y: anchor.y });
    live[id] = {
      ...start,
      rotate: computeRotated(startRotation, startAngle, { currentPointerAngle: angle, shiftKey: snap15 })
    };
  }

  function onPointerMove(event: PointerEvent) {
    if (!mode.value) return;
    const { dx, dy } = toDesignDelta(event);
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) moved = true;

    if (mode.value === 'move') applyMove(dx, dy);
    else if (mode.value === 'resize') applyResize(dx, dy, event.shiftKey);
    else applyRotate(event, event.shiftKey);

    updateReadout();
  }

  function onPointerUp() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);

    if (mode.value && moved) {
      const patches: Record<string, Partial<DatavNamespace.Layout>> = {};
      activeIds.forEach(id => {
        const next = live[id];
        const start = starts[id];
        if (!next || !start) return;
        patches[id] = { x: next.x, y: next.y, w: next.w, h: next.h, rotate: next.rotate };
      });
      options.commit(patches);
    }

    activeIds.forEach(id => Reflect.deleteProperty(live, id));
    mode.value = null;
    manipulating.value = false;
    readout.value = { visible: false, text: '' };
    starts = {};
    activeIds = [];
    alignGuides.value = [];
  }

  function begin(
    nextMode: ManipMode,
    event: PointerEvent,
    { id: widgetId, handle = 'se' }: { id: string; handle?: HandleKey }
  ) {
    const layout = options.getLayout(widgetId);
    if (!layout || layout.locked) return;

    mode.value = nextMode;
    manipulating.value = true;
    moved = false;
    activeHandle = handle;
    startPointer = { x: event.clientX, y: event.clientY };

    // 缩放与旋转只对单个组件生效：多选时改包围盒会牵连锁定的成员，语义不清
    activeIds = nextMode === 'move' ? options.resolveMembers(widgetId) : [widgetId];
    starts = {};
    activeIds.forEach(id => {
      const item = options.getLayout(id);
      if (item) starts[id] = { ...item };
    });
    if (nextMode === 'move') activeIds.forEach(id => (live[id] = { ...starts[id] }));
    else if (starts[widgetId]) live[widgetId] = { ...starts[widgetId] };

    if (nextMode === 'rotate') {
      const base = starts[widgetId];
      const scale = options.getScale() || 1;
      // 旋转绕组件中心：需要把组件中心的设计稿坐标换算成屏幕坐标
      const stage = (event.currentTarget as HTMLElement | null)?.closest('[data-stage]') as HTMLElement | null;
      const rect = stage?.getBoundingClientRect();
      if (base && rect) {
        anchor = {
          x: rect.left + (base.x + base.w / 2) * scale,
          y: rect.top + (base.y + base.h / 2) * scale
        };
        startAngle = (Math.atan2(event.clientY - anchor.y, event.clientX - anchor.x) * 180) / Math.PI;
        startRotation = base.rotate;
      }
    }

    updateReadout();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  /** 取消当前操纵（Escape 用） */
  function cancel() {
    if (!mode.value) return;
    activeIds.forEach(id => Reflect.deleteProperty(live, id));
    onPointerUp();
  }

  return { live, manipulating, mode, readout, alignGuides, begin, cancel };
}

/**
 * 框选矩形
 *
 * 与拖拽一样：过程中只画矩形，抬起时一次性算命中集合。
 */
export function useMarquee(options: {
  getScale: () => number;

  onSelect: (rect: { x: number; y: number; w: number; h: number }, additive: boolean) => void;
}) {
  const marquee = reactive({ active: false, x: 0, y: 0, w: 0, h: 0 });
  let origin = { x: 0, y: 0, designX: 0, designY: 0 };

  function onPointerMove(event: PointerEvent) {
    const scale = options.getScale() || 1;
    const rect = normalizeRect(
      { x: origin.designX, y: origin.designY },
      { x: origin.designX + (event.clientX - origin.x) / scale, y: origin.designY + (event.clientY - origin.y) / scale }
    );
    marquee.x = rect.x - origin.designX;
    marquee.y = rect.y - origin.designY;
    marquee.w = rect.w;
    marquee.h = rect.h;
  }

  function onPointerUp(event: PointerEvent) {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    const scale = options.getScale() || 1;
    const rect = normalizeRect(
      { x: origin.designX, y: origin.designY },
      { x: origin.designX + (event.clientX - origin.x) / scale, y: origin.designY + (event.clientY - origin.y) / scale }
    );
    // 3px 以内视为「点空白」而不是框选，否则单击会把选择误清空
    if (rect.w > 3 || rect.h > 3) options.onSelect(rect, event.shiftKey);
    marquee.active = false;
    marquee.x = 0;
    marquee.y = 0;
    marquee.w = 0;
    marquee.h = 0;
  }

  /**
   * @param originDesign 按下那一刻对应的设计稿坐标，由调用方按画布缩放反算
   */
  function begin(event: PointerEvent, originDesign: { x: number; y: number }) {
    origin = { x: event.clientX, y: event.clientY, designX: originDesign.x, designY: originDesign.y };
    marquee.active = true;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  return { marquee, begin };
}
