import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'decorates.panel-title',
  name: '标题栏',
  category: '装饰',
  defaultSize: { w: 420, h: 48 },
  defaultStyle: {
    text: '数据总览',
    subText: '',
    fontSize: 20,
    align: 'left',
    accent: 'datav-accent',
    textColor: 'datav-text-primary',
    showBar: true,
    showDivider: true
  },
  fields: [
    { key: 'text', label: '主标题', control: 'text', group: '内容' },
    { key: 'subText', label: '副标题', control: 'text', group: '内容', placeholder: '可留空' },
    { key: 'fontSize', label: '字号', control: 'slider', group: '文字', min: 12, max: 48, unit: 'px' },
    { key: 'textColor', label: '文字色', control: 'color', group: '文字', tip: '建议填 token 名' },
    {
      key: 'align',
      label: '对齐',
      control: 'radio',
      group: '文字',
      options: [
        { label: '左', value: 'left' },
        { label: '中', value: 'center' },
        { label: '右', value: 'right' }
      ]
    },
    { key: 'accent', label: '强调色', control: 'color', group: '装饰', tip: '竖条颜色' },
    { key: 'showBar', label: '显示竖条', control: 'switch', group: '装饰' },
    { key: 'showDivider', label: '显示底部分割线', control: 'switch', group: '装饰' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
