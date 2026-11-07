import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'tables.metric-matrix',
  name: '指标矩阵',
  category: '表格',
  icon: 'mdi:view-grid-outline',
  reportType: 'stat',
  defaultSize: { w: 480, h: 220 },
  defaultStyle: {
    cols: 3,
    valueSize: 26,
    labelSize: 12,
    decimals: 0,
    thousands: true
  },
  defaultData: {
    mode: 'static',
    staticRows: [
      { label: '今日工单', value: 328 },
      { label: '已完结', value: 291 },
      { label: '超时率(%)', value: 2.4 },
      { label: '满意度', value: 96.5 },
      { label: '新增用户', value: 45 },
      { label: '值班人数', value: 8 }
    ]
  },
  fields: [
    {
      key: 'data.staticRows',
      label: '指标项',
      control: 'json',
      group: '数据',
      tip: '数组，每项 { "label": "名称", "value": 数值 }；绑定数据集时自动改用全部度量的第一行'
    },
    { key: 'cols', label: '列数', control: 'slider', group: '样式', min: 2, max: 4 },
    { key: 'valueSize', label: '数值字号', control: 'slider', group: '样式', min: 16, max: 48, unit: 'px' },
    { key: 'labelSize', label: '名称字号', control: 'slider', group: '样式', min: 10, max: 18, unit: 'px' },
    { key: 'decimals', label: '小数位', control: 'number', group: '样式', min: 0, max: 4 },
    { key: 'thousands', label: '千分位', control: 'switch', group: '样式' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
