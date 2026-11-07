import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'decorates.border-tech',
  name: '科技切角边框',
  category: '装饰',
  icon: 'mdi:vector-square',
  defaultSize: { w: 420, h: 260 },
  defaultStyle: {
    cutSize: 16,
    lineWidth: 1,
    colorToken: 'datav-accent',
    fillPanel: true
  },
  fields: [
    { key: 'cutSize', label: '切角大小', control: 'number', group: '样式', min: 4, max: 40, unit: 'px' },
    { key: 'lineWidth', label: '线宽', control: 'number', group: '样式', min: 1, max: 4, unit: 'px' },
    {
      key: 'colorToken',
      label: '颜色',
      control: 'select',
      group: '样式',
      options: [
        { label: '主色', value: 'datav-accent' },
        { label: '信息色', value: 'datav-info' },
        { label: '系列色 2', value: 'datav-series-2' }
      ]
    },
    { key: 'fillPanel', label: '半透明底', control: 'switch', group: '样式' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
