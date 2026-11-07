import { defineWidget, lazyRuntime } from '../../protocol';

const SAMPLE_ROWS = [
  { dim0: '华东', value: 320 },
  { dim0: '华南', value: 240 },
  { dim0: '华北', value: 186 },
  { dim0: '西南', value: 120 },
  { dim0: '其他', value: 68 }
];

export default defineWidget({
  type: 'charts.pie',
  name: '饼图 / 环图',
  category: '图表',
  icon: 'mdi:chart-donut',
  reportType: 'pie',
  defaultSize: { w: 420, h: 300 },
  defaultStyle: {
    innerRadius: 55,
    showLabel: false,
    rose: false,
    titleShow: false,
    titleText: '',
    titleSize: 14,
    titleAlign: 'center',
    legendPos: 'right',
    legendOrient: 'horizontal',
    legendSize: 12
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { axis: 'dim0', value: 'value' }
  },
  fields: [
    { key: 'data.mapping.axis', label: '分类列', control: 'text', group: '高级', tip: '留空即第一个维度(dim0)' },
    { key: 'data.mapping.value', label: '数值列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    {
      key: 'innerRadius',
      label: '内径',
      control: 'slider',
      group: '样式',
      min: 0,
      max: 85,
      unit: '%',
      tip: '0 是实心饼，55 以上是环形'
    },
    { key: 'showLabel', label: '扇区标签', control: 'switch', group: '样式' },
    { key: 'rose', label: '玫瑰图', control: 'switch', group: '样式' },
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
