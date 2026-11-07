import { computed, ref } from 'vue';
import { useElementSize } from '@vueuse/core';

/**
 * 画布适配：设计稿尺寸 → 实际可用区域的统一缩放
 *
 * 一套设计稿要投到 1366×768 到 4K 的各种屏，正确做法是整体 `transform: scale()`，
 * 而不是让每个组件自己响应式——后者工作量随组件数线性增长且永远对不齐。
 */
export function useCanvasFit(getCanvas: () => DatavNamespace.Canvas) {
  const containerRef = ref<HTMLElement | null>(null);
  const { width: containerWidth, height: containerHeight } = useElementSize(containerRef);

  const canvas = computed(() => getCanvas());

  const scale = computed(() => {
    const { width, height, fit } = canvas.value;
    if (!containerWidth.value || !containerHeight.value || !width || !height) return 1;

    const scaleX = containerWidth.value / width;
    const scaleY = containerHeight.value / height;

    switch (fit) {
      case 'width':
        return scaleX;
      case 'height':
        return scaleY;
      case 'none':
        return 1;
      case 'scale':
      default:
        // 等比取小值：保证完整可见，宁可留边也不裁切内容
        return Math.min(scaleX, scaleY);
    }
  });

  /** 缩放后画布在容器里的实际占位尺寸 */
  const renderedSize = computed(() => ({
    width: `${canvas.value.width * scale.value}px`,
    height: `${canvas.value.height * scale.value}px`
  }));

  const transformStyle = computed(() => ({
    width: `${canvas.value.width}px`,
    height: `${canvas.value.height}px`,
    transform: `scale(${scale.value})`,
    transformOrigin: '0 0'
  }));

  return { containerRef, scale, renderedSize, transformStyle, canvas };
}
