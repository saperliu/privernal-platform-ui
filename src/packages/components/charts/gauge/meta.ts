import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'charts.gauge',
  name: '仪表盘',
  category: '图表',
  icon: 'mdi:gauge',
  reportType: 'gauge',
  defaultSize: { w: 260, h: 220 },
  defaultStyle: {
    max: 0,
    unit: '',
    showTicks: true
  },
  defaultData: {
    mode: 'static',
    staticRows: [{ value: 68 }],
    mapping: { value: 'value' }
  },
  fields: [
    { key: 'data.mapping.value', label: '数值列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    {
      key: 'max',
      label: '量程上限',
      control: 'number',
      group: '数值',
      min: 0,
      max: 1000000,
      tip: '0 表示按当前值上浮 25% 自动取档'
    },
    { key: 'unit', label: '单位后缀', control: 'text', group: '数值', placeholder: '如 % / 台' },
    { key: 'showTicks', label: '显示刻度', control: 'switch', group: '样式' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
