/**
 * 画布上下文的注入面。
 *
 * 组件只拿到 `widget` 一个 prop，但图表的文字颜色、配色板和实际显示倍率都属于画布而不是组件，
 * 所以由舞台 provide、组件 inject，而不是把 canvas 一路透传成三四个 prop。
 */
import type { ComputedRef, InjectionKey } from 'vue';
import { inject } from 'vue';

export interface DatavStageContext {
  canvas: ComputedRef<DatavNamespace.Canvas>;

  /** 设计稿 → 屏幕的缩放比：canvas 类组件要按它换算 devicePixelRatio，否则放大投放会糊 */
  scale: ComputedRef<number>;
}

export const DATAV_STAGE_KEY: InjectionKey<DatavStageContext> = Symbol('DatavStage');

/** 舞台之外的地方（如列表页缩略图）拿不到上下文，返回 null 由调用方用默认值 */
export function useDatavStage(): DatavStageContext | null {
  return inject(DATAV_STAGE_KEY, null);
}
