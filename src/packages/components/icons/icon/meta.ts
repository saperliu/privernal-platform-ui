import { defineWidget, lazyRuntime } from '../../protocol';

/** 图标色可选的 token 清单：与配色板联动，切换画布配色板时图标色跟随变化 */
const COLOR_TOKENS = [
  { label: '强调色', value: 'datav-accent' },
  { label: '系列色 1', value: 'datav-series-1' },
  { label: '系列色 2', value: 'datav-series-2' },
  { label: '系列色 3', value: 'datav-series-3' },
  { label: '主文本', value: 'datav-text-primary' },
  { label: '成功', value: 'datav-success' },
  { label: '警告', value: 'datav-warning' },
  { label: '危险', value: 'datav-error' }
];

export { COLOR_TOKENS };

export default defineWidget({
  type: 'icons.icon',
  name: '图标',
  category: '图标',
  icon: 'mdi:shape-outline',
  defaultSize: { w: 120, h: 120 },
  defaultStyle: {
    icon: 'mdi:star-circle',
    size: 64,
    colorToken: 'datav-accent'
  },
  fields: [
    {
      key: 'icon',
      label: '图标名',
      control: 'text',
      group: '常规',
      placeholder: '如 mdi:chart-bar',
      tip: 'iconify 图标名，与平台图标体系同源'
    },
    { key: 'size', label: '尺寸', control: 'slider', group: '常规', min: 16, max: 200, unit: 'px' },
    { key: 'colorToken', label: '颜色', control: 'select', group: '常规', options: COLOR_TOKENS }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
