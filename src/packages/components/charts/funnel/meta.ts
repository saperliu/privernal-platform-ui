import { defineWidget, lazyRuntime } from '../../protocol';

const SAMPLE_ROWS = [
  { dim0: '访问', value: 1000 },
  { dim0: '注册', value: 620 },
  { dim0: '选课', value: 340 },
  { dim0: '完成支付', value: 210 },
  { dim0: '复购', value: 96 }
];

export default defineWidget({
  type: 'charts.funnel',
  name: '漏斗图',
  category: '图表',
  icon: 'mdi:filter-outline',
  reportType: 'pie',
  defaultSize: { w: 420, h: 320 },
  defaultStyle: {
    order: 'desc',
    showLabel: true,
    legendShow: false,
    titleShow: false,
    titleText: '',
    titleSize: 14,
    titleAlign: 'center',
    legendPos: 'bottom',
    legendOrient: 'horizontal',
    legendSize: 12
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { axis: 'dim0', value: 'value' }
  },
  fields: [
    { key: 'data.mapping.axis', label: '类目列', control: 'text', group: '高级', tip: '留空即第一个维度(dim0)' },
    { key: 'data.mapping.value', label: '数值列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    {
      key: 'order',
      label: '排序',
      control: 'select',
      group: '样式',
      options: [
        { label: '从大到小', value: 'desc' },
        { label: '从小到大', value: 'asc' }
      ]
    },
    { key: 'showLabel', label: '显示数值', control: 'switch', group: '样式' },
    { key: 'legendShow', label: '显示图例', control: 'switch', group: '样式' },
    { key: 'titleShow', label: '显示标题', control: 'switch', group: '标题' },
    { key: 'titleText', label: '标题文本', control: 'text', group: '标题' },
    { key: 'titleSize', label: '标题字号', control: 'number', group: '标题', min: 10, max: 40, unit: 'px' },
    {
      key: 'titleAlign',
      label: '标题对齐',
      control: 'select',
      group: '标题',
      options: [
        { label: '居中', value: 'center' },
        { label: '左对齐', value: 'left' }
      ]
    },
    {
      key: 'legendPos',
      label: '图例位置',
      control: 'select',
      group: '图例',
      options: [
        { label: '顶部', value: 'top' },
        { label: '底部', value: 'bottom' },
        { label: '左侧', value: 'left' },
        { label: '右侧', value: 'right' }
      ]
    },
    {
      key: 'legendOrient',
      label: '图例方向',
      control: 'select',
      group: '图例',
      options: [
        { label: '横排', value: 'horizontal' },
        { label: '竖排', value: 'vertical' }
      ]
    },
    { key: 'legendSize', label: '图例字号', control: 'number', group: '图例', min: 8, max: 20, unit: 'px' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
