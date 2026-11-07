/**
 * 大屏 VChart 组件的生命周期。
 *
 * 与 useDatavChart 同一套口径：明暗跟随画布 canvas.theme 而不是后台暗色模式；
 * DPR 按缩放比抬高；颜色一律由 spec 里引用 CSS 变量串（var(--datav-*)），
 * VChart 支持在 fill/stroke 里直接消费 CSS 变量，切配色板无需重建实例。
 */
import { onMounted, onScopeDispose, ref, shallowRef, watch } from 'vue';
import { useElementSize } from '@vueuse/core';
import VChart from '@visactor/vchart';
import type { ISpec } from '@visactor/vchart';
import type { ChartPalette } from '@/packages/components/charts/chart-option';
import { useDatavStage } from './useDatavStage';

const SERIES_TOKEN_COUNT = 8;

export interface DatavVChartHandle {
  domRef: import('vue').Ref<HTMLElement | null>;
}

function readToken(styles: CSSStyleDeclaration, token: string): string {
  return styles.getPropertyValue(token).trim();
}

/**
 * VChart 画在 canvas 里，canvas 的 fill 不解析 CSS 变量——
 * 与 useDatavChart 不同，这里的色值必须在 spec 构建期从 DOM 上解析成字面色。
 *
 * @param buildSpec 与 useDatavChart 的 build 同口径：getter 建立时会同步执行一次做依赖收集。
 */
export function useDatavVChart(
  buildSpec: (palette: ChartPalette, mode: 'dark' | 'light') => ISpec | null
): DatavVChartHandle {
  const domRef = ref<HTMLElement | null>(null);
  const chart = shallowRef<VChart | null>(null);
  const stage = useDatavStage();

  const { width, height } = useElementSize(domRef, { width: 0, height: 0 });

  function mode(): 'dark' | 'light' {
    return stage?.canvas.value.theme === 'light' ? 'light' : 'dark';
  }

  function palette(): ChartPalette {
    const styles = domRef.value ? getComputedStyle(domRef.value) : null;
    const series: string[] = [];
    if (styles) {
      for (let i = 1; i <= SERIES_TOKEN_COUNT; i += 1) {
        const color = readToken(styles, `--datav-series-${i}`);
        if (color) series.push(color);
      }
    }
    return {
      text: styles ? readToken(styles, '--datav-text-primary') : '',
      textSecondary: styles ? readToken(styles, '--datav-text-secondary') : '',
      splitLine: styles ? readToken(styles, '--datav-grid') : '',
      series
    };
  }

  function pixelRatio() {
    const base = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    return base * Math.max(0.5, Math.min(4, stage?.scale.value || 1));
  }

  function dispose() {
    chart.value?.release();
    chart.value = null;
  }

  function apply(spec: ISpec | null) {
    if (!spec) {
      dispose();
      return;
    }
    const el = domRef.value;
    if (!el || width.value <= 0 || height.value <= 0) return;
    if (!chart.value) {
      // 注意：VChart 构造器的 mode 是运行环境（desktop-browser 等）而不是明暗主题，
      // 明暗由 spec 里的颜色自己控制（palette 从 CSS 变量解析），不能在这里传 'dark'/'light'
      chart.value = new VChart(spec, {
        dom: el as unknown as HTMLElement,
        options: { pixelRatio: pixelRatio() }
      } as never);
      chart.value.renderAsync();
      return;
    }
    chart.value.updateSpec(spec, true);
  }

  watch([width, height], () => {
    if (chart.value) chart.value.resize(width.value, height.value);
    else apply(buildSpec(palette(), mode()));
  });

  onMounted(() => {
    apply(buildSpec(palette(), mode()));
  });

  // 主题/缩放比变了重建（VChart 的 mode 不能运行期改），数据/样式变化走 spec 更新
  watch(
    () => ({ mode: mode(), ratioStep: Math.round((stage?.scale.value || 1) * 10) / 10 }),
    () => {
      dispose();
      apply(buildSpec(palette(), mode()));
    }
  );

  onScopeDispose(dispose);

  return { domRef };
}
