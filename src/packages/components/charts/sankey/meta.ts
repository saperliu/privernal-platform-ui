import { defineWidget, lazyRuntime } from '../../protocol';

const SAMPLE_ROWS = [
  { dim0: '访问', dim1: '注册', value: 620 },
  { dim0: '注册', dim1: '选课', value: 340 },
  { dim0: '选课', dim1: '支付', value: 210 },
  { dim0: '访问', dim1: '流失', value: 380 },
  { dim0: '注册', dim1: '流失', value: 280 }
];

export default defineWidget({
  type: 'charts.sankey',
  name: '桑基图',
  category: '图表',
  icon: 'mdi:transit-connection-variant',
  reportType: 'bar',
  defaultSize: { w: 520, h: 340 },
  defaultStyle: {
    nodeWidth: 14,
    showLabel: true
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { axis: 'dim0', value: 'value', split: 'dim1' }
  },
  fields: [
    { key: 'data.mapping.axis', label: '来源列', control: 'text', group: '高级', tip: '留空即第一个维度(dim0)' },
    {
      key: 'data.mapping.split',
      label: '去向列',
      control: 'text',
      group: '高级',
      tip: '第二个维度别名(如 dim1)；不填时相邻类目串成链，只具演示意义'
    },
    { key: 'data.mapping.value', label: '权重列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    { key: 'nodeWidth', label: '节点宽', control: 'number', group: '样式', min: 6, max: 40, unit: 'px' },
    { key: 'showLabel', label: '显示节点名', control: 'switch', group: '样式' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
