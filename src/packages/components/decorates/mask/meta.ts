import { defineWidget, lazyRuntime } from '../../protocol';

/**
 * 遮罩：四角渐晕（vignette）。放在整屏最顶层压暗四角，让中心图表在投屏上更聚焦；
 * 颜色跟随画布深色背景 token，不给「遮罩用浅色」的选项——那等于把画面四角刷成亮块。
 */
export default defineWidget({
  type: 'decorates.mask',
  name: '四角遮罩',
  category: '装饰',
  icon: 'mdi:corners-rounded',
  defaultSize: { w: 1920, h: 1080 },
  defaultStyle: {
    strength: 40,
    spread: 60
  },
  fields: [
    {
      key: 'strength',
      label: '遮罩强度',
      control: 'slider',
      group: '常规',
      min: 0,
      max: 100,
      tip: '四角压暗程度，0 等于不显示'
    },
    {
      key: 'spread',
      label: '扩散范围',
      control: 'slider',
      group: '常规',
      min: 10,
      max: 100,
      tip: '数值越大渐晕半径越大'
    }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
