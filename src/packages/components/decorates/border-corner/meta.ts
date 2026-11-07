import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'decorates.border-corner',
  name: '四角边框',
  category: '装饰',
  icon: 'mdi:crop-free',
  defaultSize: { w: 420, h: 260 },
  defaultStyle: {
    cornerSize: 18,
    lineWidth: 2,
    colorToken: 'datav-accent'
  },
  fields: [
    { key: 'cornerSize', label: '角长度', control: 'number', group: '样式', min: 8, max: 60, unit: 'px' },
    { key: 'lineWidth', label: '线宽', control: 'number', group: '样式', min: 1, max: 6, unit: 'px' },
    {
      key: 'colorToken',
      label: '颜色',
      control: 'select',
      group: '样式',
      options: [
        { label: '主色', value: 'datav-accent' },
        { label: '系列色 1', value: 'datav-series-1' },
        { label: '信息色', value: 'datav-info' },
        { label: '成功色', value: 'datav-success' }
      ]
    }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
