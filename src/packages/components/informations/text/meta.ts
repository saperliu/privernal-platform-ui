import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'informations.text',
  name: '文本',
  category: '信息',
  icon: 'mdi:format-text',
  defaultSize: { w: 320, h: 60 },
  defaultStyle: {
    content: '大屏标题',
    fontSize: 24,
    color: 'datav-text-primary',
    align: 'left',
    bold: true
  },
  fields: [
    { key: 'content', label: '内容', control: 'textarea', group: '内容', placeholder: '支持换行' },
    { key: 'fontSize', label: '字号', control: 'slider', group: '样式', min: 10, max: 120, unit: 'px' },
    {
      key: 'color',
      label: '颜色',
      control: 'color',
      group: '样式',
      tip: '填 token 名（如 datav-accent）才会跟随配色板'
    },
    {
      key: 'align',
      label: '对齐',
      control: 'radio',
      group: '样式',
      options: [
        { label: '左', value: 'left' },
        { label: '中', value: 'center' },
        { label: '右', value: 'right' }
      ]
    },
    { key: 'bold', label: '加粗', control: 'switch', group: '样式' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
