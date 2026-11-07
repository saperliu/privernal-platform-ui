import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'decorates.border-glow',
  name: '发光边框',
  category: '装饰',
  icon: 'mdi:brightness-5',
  defaultSize: { w: 420, h: 260 },
  defaultStyle: {
    radius: 10,
    glowSpread: 6,
    colorToken: 'datav-accent',
    fillPanel: true
  },
  fields: [
    { key: 'radius', label: '圆角', control: 'number', group: '样式', min: 0, max: 24, unit: 'px' },
    { key: 'glowSpread', label: '光晕范围', control: 'number', group: '样式', min: 2, max: 20, unit: 'px' },
    {
      key: 'colorToken',
      label: '光色',
      control: 'select',
      group: '样式',
      options: [
        { label: '主色', value: 'datav-accent' },
        { label: '发光色', value: 'datav-glow' },
        { label: '信息色', value: 'datav-info' }
      ]
    },
    { key: 'fillPanel', label: '半透明底', control: 'switch', group: '样式' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
