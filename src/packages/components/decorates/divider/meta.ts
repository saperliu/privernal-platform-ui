import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'decorates.divider',
  name: '分割线',
  category: '装饰',
  icon: 'mdi:minus',
  defaultSize: { w: 360, h: 24 },
  defaultStyle: {
    lineWidth: 1,
    dashed: false,
    withCenter: true,
    colorToken: 'datav-border'
  },
  fields: [
    { key: 'lineWidth', label: '线宽', control: 'number', group: '样式', min: 1, max: 6, unit: 'px' },
    { key: 'dashed', label: '虚线', control: 'switch', group: '样式' },
    { key: 'withCenter', label: '中点装饰', control: 'switch', group: '样式' },
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
