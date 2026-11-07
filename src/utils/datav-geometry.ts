/**
 * 画布几何：移动、缩放、旋转、对齐与命中的纯函数
 *
 * 单列成文件的原因：这些是拖拽手感的正确性来源，必须能脱离浏览器验证；
 * 留在 composable 里就只能靠人肉拖一下看看，回归成本极高。
 * 坐标一律是设计稿像素，调用方负责先把屏幕位移除以画布缩放比。
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type HandleKey = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const MIN_SIZE = 10;

/**
 * 取整并消掉 -0：snap 对小负位移会算出 -0，它一路写进 schema_json 就是 `"x":-0`，
 * 存库、比对和版本 diff 都会多出无意义的抖动。
 */
function round(value: number): number {
  const next = Math.round(value);
  return next === 0 ? 0 : next;
}

export function clampSize(value: number, min = MIN_SIZE) {
  return Math.max(min, value);
}

/** 角度归一到 (-180, 180]，与属性面板取值域一致 */
export function normalizeAngle(deg: number): number {
  let value = deg % 360;
  if (value > 180) value -= 360;
  if (value <= -180) value += 360;
  return value;
}

/** 网格吸附；size<=0 或关闭时原样返回 */
export function snap(value: number, gridSize: number, enabled: boolean): number {
  if (!enabled || gridSize <= 0) return value;
  return round(value / gridSize) * gridSize;
}

/**
 * 移动：整组按同一位移平移，各自独立吸附到网格
 *
 * 逐元素吸附而不是整体吸附，否则一组宽度不一的组件会被拖成两两错开半格。
 */
export function computeMoved(
  start: Box,
  { dx, dy }: { dx: number; dy: number },
  { gridSize = 0, enabled = false }: { gridSize?: number; enabled?: boolean } = {}
): Box {
  return {
    ...start,
    x: round(snap(start.x + dx, gridSize, enabled)),
    y: round(snap(start.y + dy, gridSize, enabled))
  };
}

/**
 * 缩放：被拖的边跟随鼠标，对边为锚点不动
 *
 * 拖左边时宽度必须由右边界反推，否则右边界会跟着跑，出现「拖一边两边动」。
 */
export function computeResized(
  start: Box,
  handle: HandleKey,
  {
    dx,
    dy,
    gridSize = 0,
    snapEnabled = false,
    keepRatio = false
  }: { dx: number; dy: number; gridSize?: number; snapEnabled?: boolean; keepRatio?: boolean }
): Box {
  const right = start.x + start.w;
  const bottom = start.y + start.h;

  let x = start.x;
  let y = start.y;
  let w = start.w;
  let h = start.h;

  if (handle.includes('w')) x = snap(start.x + dx, gridSize, snapEnabled);
  if (handle.includes('e')) w = snap(start.w + dx, gridSize, snapEnabled);
  if (handle.includes('n')) y = snap(start.y + dy, gridSize, snapEnabled);
  if (handle.includes('s')) h = snap(start.h + dy, gridSize, snapEnabled);

  if (handle.includes('w')) w = right - x;
  if (handle.includes('n')) h = bottom - y;

  if (w < MIN_SIZE) {
    if (handle.includes('w')) x = right - MIN_SIZE;
    w = MIN_SIZE;
  }
  if (h < MIN_SIZE) {
    if (handle.includes('n')) y = bottom - MIN_SIZE;
    h = MIN_SIZE;
  }

  if (keepRatio && ['nw', 'ne', 'se', 'sw'].includes(handle) && start.h > 0) {
    const ratio = start.w / start.h;
    if (w / h > ratio) w = h * ratio;
    else h = w / ratio;
    if (handle.includes('w')) x = right - w;
    if (handle.includes('n')) y = bottom - h;
  }

  return { x: round(x), y: round(y), w: round(w), h: round(h) };
}

/** 旋转角：以指针相对中心的角度差推算，shiftKey 时吸附 15° */
export function computeRotated(
  startRotate: number,
  startPointerAngle: number,
  { currentPointerAngle, shiftKey = false }: { currentPointerAngle: number; shiftKey?: boolean }
): number {
  let next = normalizeAngle(startRotate + (currentPointerAngle - startPointerAngle));
  if (shiftKey) next = round(next / 15) * 15;
  return Number(next.toFixed(1));
}

/** 指针角：atan2 结果转成度 */
export function pointerAngle(point: { x: number; y: number }, center: { x: number; y: number }): number {
  return (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
}

/** 框选命中：两矩形相交即选中（0 面积的选择框不算命中） */
export function hitTest(box: Box, rect: Box): boolean {
  if (rect.w <= 0 || rect.h <= 0) return false;
  return box.x < rect.x + rect.w && box.x + box.w > rect.x && box.y < rect.y + rect.h && box.y + box.h > rect.y;
}

export function boundingBox(boxes: Box[]): Box {
  if (!boxes.length) return { x: 0, y: 0, w: 0, h: 0 };
  const minX = Math.min(...boxes.map(b => b.x));
  const minY = Math.min(...boxes.map(b => b.y));
  const maxX = Math.max(...boxes.map(b => b.x + b.w));
  const maxY = Math.max(...boxes.map(b => b.y + b.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export type AlignEdge = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';

/** 相对包围盒对齐，锁定项由调用方先剔除 */
export function computeAligned(box: Box, edge: AlignEdge, outer: Box): Pick<Box, 'x' | 'y'> {
  switch (edge) {
    case 'left':
      return { x: round(outer.x), y: box.y };
    case 'right':
      return { x: round(outer.x + outer.w - box.w), y: box.y };
    case 'hcenter':
      return { x: round(outer.x + outer.w / 2 - box.w / 2), y: box.y };
    case 'top':
      return { x: box.x, y: round(outer.y) };
    case 'bottom':
      return { x: box.x, y: round(outer.y + outer.h - box.h) };
    case 'vcenter':
    default:
      return { x: box.x, y: round(outer.y + outer.h / 2 - box.h / 2) };
  }
}

/**
 * 等距分布：首尾固定，中间元素按空隙均分
 *
 * 返回按轴排序后的中间项新坐标；不足 3 个无意义，返回空数组。
 */
export function computeDistributed(boxes: Box[], axis: 'x' | 'y'): Array<{ index: number; pos: number }> {
  if (boxes.length < 3) return [];
  const indexed = boxes.map((box, index) => ({ box, index }));
  indexed.sort((a, b) => a.box[axis] - b.box[axis]);

  const first = indexed[0].box;
  const last = indexed[indexed.length - 1].box;
  const spanStart = first[axis] + (axis === 'x' ? first.w : first.h);
  const spanEnd = last[axis];
  const middles = indexed.slice(1, -1);
  const totalSize = middles.reduce((sum, item) => sum + (axis === 'x' ? item.box.w : item.box.h), 0);
  const gaps = middles.length + 1;
  const gap = (spanEnd - spanStart - totalSize) / gaps;

  const result: Array<{ index: number; pos: number }> = [];
  let cursor = spanStart;
  middles.forEach(item => {
    cursor += gap;
    result.push({ index: item.index, pos: round(cursor) });
    cursor += axis === 'x' ? item.box.w : item.box.h;
  });
  return result;
}

/** 把选择框的两个端点规范化成左上角 + 宽高 */
export function normalizeRect(a: { x: number; y: number }, b: { x: number; y: number }): Box {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y)
  };
}

/** 一条对齐参考线：axis 为 'x' 时是在 at 处的一条竖线（约束左右位置） */
export interface AlignGuide {
  axis: 'x' | 'y';
  at: number;
}

export interface AlignHit {
  /** 需要追加的位移；0 表示这一轴没命中 */
  dx: number;
  dy: number;
  guides: AlignGuide[];
}

/** 吸附阈值（设计稿像素）：再小就必须在指针上屏住呼吸才能命中，再大会一靠近就吸过去 */
export const ALIGN_THRESHOLD = 6;

/** 左 / 中 / 右（或上 / 中 / 下）三个参与比对的位置 */
function edgePositions(box: Box, axis: 'x' | 'y'): number[] {
  const start = axis === 'x' ? box.x : box.y;
  const size = axis === 'x' ? box.w : box.h;
  return [start, start + size / 2, start + size];
}

function bestOnAxis(moving: number[], candidates: number[], threshold: number): { delta: number; at: number } | null {
  let best: { delta: number; at: number } | null = null;
  for (const candidate of candidates) {
    for (const edge of moving) {
      const delta = candidate - edge;
      if (Math.abs(delta) <= threshold) {
        // 恰好相等时保留先命中的：0 位移意味着「已经对齐了」，不该被一个 1px 的匹配盖掉
        if (best === null || (delta !== 0 && Math.abs(delta) < Math.abs(best.delta))) {
          best = { delta, at: candidate };
        }
      }
    }
  }
  return best;
}

/**
 * 智能对齐：把移动盒的边/中心与其余组件（以及画布边与画布中心）比对，阈值内吸附并给出参考线
 *
 * 传入的 box 应当是**已经按指针位移移动之后**的外接盒，返回值是还需要补的校正量——
 * 多选时调用方必须用外接盒算、再把同一个校正量施加给每个成员，逐元素各自吸附会把一组
 * 宽度不一的组件拖成两两错开，组内间距就毁了。
 *
 * 画布当作一个虚拟候选盒参与：贴边与居中是最高频的两条对齐，没有它们的话
 * 「拖到正中间」只能靠手稳。
 */
export function computeAlignedMove(
  box: Box,
  others: Box[],
  { width, height, threshold = ALIGN_THRESHOLD }: { width: number; height: number; threshold?: number }
): AlignHit {
  const candidates: Box[] = [...others, { x: 0, y: 0, w: width, h: height }];
  const guides: AlignGuide[] = [];
  let dx = 0;
  let dy = 0;

  (['x', 'y'] as const).forEach(axis => {
    const hit = bestOnAxis(
      edgePositions(box, axis),
      candidates.flatMap(candidate => edgePositions(candidate, axis)),
      threshold
    );
    if (!hit) return;
    if (axis === 'x') dx = round(hit.delta);
    else dy = round(hit.delta);
    guides.push({ axis, at: hit.at });
  });

  return { dx, dy, guides };
}

/**
 * 标尺刻度：返回落在 [from, to) 区间内的刻度位置（设计稿坐标）
 *
 * 步长要随缩放挑：1920 宽的画布缩到 30% 还按 10px 一刻，刻度就糊成一条实线了。
 * 取「屏幕上至少 60px 一刻」的最小 1/2/5×10^n 步长，这是标尺类的通用做法，
 * 数字也正好是人能读的整档。
 */
export function rulerStep(scale: number, minScreenPx = 60): number {
  const candidates = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
  const needed = minScreenPx / Math.max(scale, 0.01);
  return candidates.find(step => step >= needed) ?? 5000;
}

export function rulerTicks(from: number, to: number, step: number): number[] {
  if (!(step > 0) || to <= from) return [];
  const first = Math.ceil(from / step) * step;
  const ticks: number[] = [];
  for (let value = first; value < to; value += step) {
    // 浮点步长（如 0.5）累加会漂，逐次算再归整
    ticks.push(Number(value.toFixed(6)));
    if (ticks.length > 2000) break;
  }
  return ticks;
}
