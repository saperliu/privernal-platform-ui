import { defineWidget, lazyRuntime } from '../../protocol';

const SAMPLE_ROWS = [
  { dim0: '数学', value: 120 },
  { dim0: '计算机', value: 98 },
  { dim0: '英语', value: 86 },
  { dim0: '物理', value: 70 },
  { dim0: '化学', value: 62 },
  { dim0: '生物', value: 55 },
  { dim0: '历史', value: 40 },
  { dim0: '地理', value: 33 }
];

export default defineWidget({
  type: 'charts.wordcloud',
  name: '词云',
  category: '图表',
  icon: 'mdi:cloud-outline',
  reportType: 'pie',
  defaultSize: { w: 440, h: 300 },
  defaultStyle: {
    fontSizeRange: [14, 44]
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { axis: 'dim0', value: 'value' }
  },
  fields: [
    { key: 'data.mapping.axis', label: '词列', control: 'text', group: '高级', tip: '留空即第一个维度(dim0)' },
    { key: 'data.mapping.value', label: '权重列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    {
      key: 'fontSizeRange',
      label: '字号区间',
      control: 'json',
      group: '样式',
      tip: 'JSON 数组 [最小字号, 最大字号]，如 [14, 44]'
    }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
