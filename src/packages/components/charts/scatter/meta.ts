import { defineWidget, lazyRuntime } from '../../protocol';

// 默认 mapping 不填尺寸列，所以出厂形态是普通散点；m1 是留给「尺寸列」演示用的第二度量，
// 用户在高级里填 size=m1 就变成气泡图
const SAMPLE_ROWS = [
  { dim0: 12, value: 88, m1: 4 },
  { dim0: 18, value: 120, m1: 12 },
  { dim0: 24, value: 96, m1: 2 },
  { dim0: 31, value: 168, m1: 30 },
  { dim0: 42, value: 132, m1: 8 },
  { dim0: 55, value: 205, m1: 46 },
  { dim0: 63, value: 178, m1: 16 }
];

export default defineWidget({
  type: 'charts.scatter',
  name: '散点 / 气泡图',
  category: '图表',
  icon: 'mdi:chart-scatter-plot',
  reportType: 'bar',
  defaultSize: { w: 420, h: 300 },
  defaultStyle: {
    symbolSize: 12,
    sizeMin: 6,
    sizeMax: 42,
    xName: '',
    yName: '',
    sizeName: ''
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { axis: 'dim0', value: 'value' }
  },
  fields: [
    {
      key: 'data.mapping.axis',
      label: 'X 轴列',
      control: 'text',
      group: '高级',
      tip: '必须是数值列，文本维度会让散点画不出点'
    },
    { key: 'data.mapping.value', label: 'Y 轴列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    {
      key: 'data.mapping.size',
      label: '尺寸列',
      control: 'text',
      group: '高级',
      tip: '填第二个度量别名(如 m1)即成为气泡图，点面积正比于该列值；留空仍是普通散点'
    },
    {
      key: 'symbolSize',
      label: '点直径',
      control: 'slider',
      group: '样式',
      min: 4,
      max: 40,
      unit: 'px',
      tip: '未配尺寸列时生效'
    },
    {
      key: 'sizeMin',
      label: '气泡最小直径',
      control: 'slider',
      group: '样式',
      min: 2,
      max: 30,
      unit: 'px',
      tip: '仅配了尺寸列时生效'
    },
    { key: 'sizeMax', label: '气泡最大直径', control: 'slider', group: '样式', min: 6, max: 80, unit: 'px' },
    { key: 'xName', label: 'X 轴标题', control: 'text', group: '样式', placeholder: '留空用列名' },
    { key: 'yName', label: 'Y 轴标题', control: 'text', group: '样式', placeholder: '留空用列名' },
    { key: 'sizeName', label: '尺寸标题', control: 'text', group: '样式', placeholder: '留空用列名，显示在 tooltip' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
