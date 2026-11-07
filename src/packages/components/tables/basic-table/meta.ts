import { defineWidget, lazyRuntime } from '../../protocol';

const SAMPLE_ROWS = [
  { dim0: '数学', value: 128 },
  { dim0: '计算机', value: 96 },
  { dim0: '英语', value: 73 },
  { dim0: '物理', value: 51 },
  { dim0: '化学', value: 44 }
];

export default defineWidget({
  type: 'tables.basic',
  name: '基础表格',
  category: '表格',
  icon: 'mdi:table-large',
  reportType: 'table',
  defaultSize: { w: 520, h: 300 },
  defaultStyle: {
    maxRows: 50,
    striped: true,
    fontSize: 12
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { axis: 'dim0', value: 'value' }
  },
  fields: [
    { key: 'data.mapping.axis', label: '首列', control: 'text', group: '高级', tip: '留空即第一个维度(dim0)' },
    { key: 'data.mapping.value', label: '数值列', control: 'text', group: '高级', tip: '留空即全部度量依次成列' },
    {
      key: 'maxRows',
      label: '最多行数',
      control: 'number',
      group: '样式',
      min: 1,
      max: 200,
      tip: '虚拟滚动下也建议收敛，避免整屏全是表格'
    },
    { key: 'striped', label: '斑马纹', control: 'switch', group: '样式' },
    { key: 'fontSize', label: '字号', control: 'number', group: '样式', min: 10, max: 20, unit: 'px' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
