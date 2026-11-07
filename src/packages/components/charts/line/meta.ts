import { defineWidget, lazyRuntime } from '../../protocol';

const SAMPLE_ROWS = [
  { dim0: '00:00', value: 42 },
  { dim0: '04:00', value: 28 },
  { dim0: '08:00', value: 96 },
  { dim0: '12:00', value: 154 },
  { dim0: '16:00', value: 132 },
  { dim0: '20:00', value: 88 }
];

export default defineWidget({
  type: 'charts.line',
  name: '折线图',
  category: '图表',
  icon: 'mdi:chart-line',
  reportType: 'line',
  defaultSize: { w: 480, h: 300 },
  defaultStyle: {
    smooth: true,
    area: true,
    stack: false,
    showLabel: false,
    showLegend: true,
    maxCategoryChars: 6,
    titleShow: false,
    titleText: '',
    titleSize: 14,
    titleAlign: 'center',
    legendPos: 'top',
    legendOrient: 'horizontal',
    legendSize: 12,
    xAxisName: '',
    yAxisName: '',
    xLabelShow: true,
    yLabelShow: true,
    inverseX: false,
    splitShow: true
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { axis: 'dim0', value: 'value' }
  },
  fields: [
    { key: 'data.mapping.axis', label: '类目列', control: 'text', group: '高级', tip: '时间维度常用 dim0' },
    { key: 'data.mapping.value', label: '数值列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    {
      key: 'data.mapping.split',
      label: '分组列',
      control: 'text',
      group: '高级',
      tip: '填第二个维度别名(如 dim1)即按它拆多条线'
    },
    { key: 'smooth', label: '平滑', control: 'switch', group: '样式' },
    { key: 'area', label: '面积填充', control: 'switch', group: '样式' },
    { key: 'stack', label: '堆叠', control: 'switch', group: '样式' },
    { key: 'showLabel', label: '显示数值', control: 'switch', group: '样式' },
    { key: 'showLegend', label: '显示图例', control: 'switch', group: '样式' },
    { key: 'maxCategoryChars', label: '类名截断字数', control: 'number', group: '样式', min: 2, max: 20 },
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
    { key: 'legendSize', label: '图例字号', control: 'number', group: '图例', min: 8, max: 20, unit: 'px' },
    { key: 'xAxisName', label: 'X 轴名称', control: 'text', group: '坐标轴' },
    { key: 'yAxisName', label: 'Y 轴名称', control: 'text', group: '坐标轴' },
    { key: 'xLabelShow', label: 'X 轴标签', control: 'switch', group: '坐标轴' },
    { key: 'yLabelShow', label: 'Y 轴标签', control: 'switch', group: '坐标轴' },
    { key: 'inverseX', label: 'X 轴反转', control: 'switch', group: '坐标轴' },
    { key: 'splitShow', label: '网格分割线', control: 'switch', group: '坐标轴' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
