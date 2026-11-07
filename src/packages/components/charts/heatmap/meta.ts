import { defineWidget, lazyRuntime } from '../../protocol';

const SAMPLE_ROWS = [
  { dim0: '周一', dim1: '数学', value: 12 },
  { dim0: '周一', dim1: '英语', value: 8 },
  { dim0: '周二', dim1: '数学', value: 15 },
  { dim0: '周二', dim1: '英语', value: 6 },
  { dim0: '周三', dim1: '数学', value: 9 },
  { dim0: '周三', dim1: '英语', value: 11 },
  { dim0: '周四', dim1: '数学', value: 14 },
  { dim0: '周四', dim1: '英语', value: 7 },
  { dim0: '周五', dim1: '数学', value: 10 },
  { dim0: '周五', dim1: '英语', value: 13 }
];

export default defineWidget({
  type: 'charts.heatmap',
  name: '热力图',
  category: '图表',
  icon: 'mdi:blur',
  reportType: 'bar',
  defaultSize: { w: 480, h: 320 },
  defaultStyle: {
    showLabel: true
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { axis: 'dim0', value: 'value', split: 'dim1' }
  },
  fields: [
    { key: 'data.mapping.axis', label: 'X 轴列', control: 'text', group: '高级', tip: '留空即第一个维度(dim0)' },
    { key: 'data.mapping.split', label: 'Y 轴列', control: 'text', group: '高级', tip: '第二个维度别名(如 dim1)' },
    { key: 'data.mapping.value', label: '数值列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    { key: 'showLabel', label: '显示数值', control: 'switch', group: '样式' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
