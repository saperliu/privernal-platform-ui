import { defineWidget, lazyRuntime } from '../../protocol';

const SAMPLE_ROWS = [
  { dim0: '教务处', dim1: '张老师', value: 5 },
  { dim0: '教务处', dim1: '李老师', value: 3 },
  { dim0: '学生处', dim1: '王老师', value: 4 },
  { dim0: '学生处', dim1: '赵老师', value: 2 },
  { dim0: '张老师', dim1: '数学课', value: 3 },
  { dim0: '李老师', dim1: '英语课', value: 2 },
  { dim0: '王老师', dim1: '体育课', value: 2 }
];

export default defineWidget({
  type: 'charts.relation',
  name: '关系图',
  category: '图表',
  icon: 'mdi:graph-outline',
  reportType: 'bar',
  defaultSize: { w: 480, h: 340 },
  defaultStyle: {
    nodeSize: 22,
    showLabel: true,
    repulsion: 220
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { axis: 'dim0', value: 'value', split: 'dim1' }
  },
  fields: [
    { key: 'data.mapping.axis', label: '源节点列', control: 'text', group: '高级', tip: '留空即第一个维度(dim0)' },
    {
      key: 'data.mapping.split',
      label: '目标节点列',
      control: 'text',
      group: '高级',
      tip: '第二个维度别名(如 dim1)；不填时相邻类目串成链'
    },
    { key: 'data.mapping.value', label: '权重列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    { key: 'nodeSize', label: '节点大小', control: 'number', group: '样式', min: 8, max: 60, unit: 'px' },
    { key: 'showLabel', label: '显示节点名', control: 'switch', group: '样式' },
    {
      key: 'repulsion',
      label: '节点斥力',
      control: 'number',
      group: '样式',
      min: 40,
      max: 600,
      tip: '越大节点分得越开'
    }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
