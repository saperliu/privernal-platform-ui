import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'decorates.underline',
  name: '标题下划线',
  category: '装饰',
  icon: 'mdi:format-underline',
  defaultSize: { w: 360, h: 56 },
  defaultStyle: {
    text: '标题文字',
    fontSize: 22,
    colorToken: 'datav-text-primary',
    lineToken: 'datav-accent',
    align: 'left'
  },
  fields: [
    { key: 'text', label: '标题文字', control: 'text', group: '常规' },
    { key: 'fontSize', label: '字号', control: 'slider', group: '常规', min: 12, max: 48, unit: 'px' },
    {
      key: 'colorToken',
      label: '文字颜色',
      control: 'select',
      group: '常规',
      options: [
        { label: '主文本', value: 'datav-text-primary' },
        { label: '次文本', value: 'datav-text-secondary' },
        { label: '强调色', value: 'datav-accent' }
      ]
    },
    {
      key: 'lineToken',
      label: '下划线颜色',
      control: 'select',
      group: '常规',
      options: [
        { label: '强调色', value: 'datav-accent' },
        { label: '系列色 1', value: 'datav-series-1' },
        { label: '系列色 2', value: 'datav-series-2' },
        { label: '成功', value: 'datav-success' },
        { label: '警告', value: 'datav-warning' }
      ]
    },
    {
      key: 'align',
      label: '对齐',
      control: 'radio',
      group: '常规',
      options: [
        { label: '左', value: 'left' },
        { label: '中', value: 'center' },
        { label: '右', value: 'right' }
      ]
    }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
