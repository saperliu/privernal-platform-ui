import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'decorates.border-line',
  name: '细线边框',
  category: '装饰',
  icon: 'mdi:border-all-variant',
  defaultSize: { w: 420, h: 260 },
  defaultStyle: {
    lineWidth: 1,
    radius: 8,
    colorToken: 'datav-border'
  },
  fields: [
    { key: 'lineWidth', label: '线宽', control: 'number', group: '样式', min: 1, max: 6, unit: 'px' },
    { key: 'radius', label: '圆角', control: 'number', group: '样式', min: 0, max: 24, unit: 'px' },
    {
      key: 'colorToken',
      label: '颜色',
      control: 'select',
      group: '样式',
      options: [
        { label: '边框色', value: 'datav-border' },
        { label: '主色', value: 'datav-accent' },
        { label: '网格色', value: 'datav-grid' }
      ]
    }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
