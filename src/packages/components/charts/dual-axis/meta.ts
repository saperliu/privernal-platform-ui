import { defineWidget, lazyRuntime } from '../../protocol';

/**
 * 示例数据带两个度量（value 与 m1），静态预览才能画出双轴：
 * 真实取数时右轴列由后端别名 m1 给出，而静态行里没有别名清单，所以 mapping.value2 必须显式写。
 */
const SAMPLE_ROWS = [
  { dim0: '一月', value: 120, m1: 0.32 },
  { dim0: '二月', value: 180, m1: 0.41 },
  { dim0: '三月', value: 96, m1: 0.28 },
  { dim0: '四月', value: 240, m1: 0.55 },
  { dim0: '五月', value: 198, m1: 0.47 },
  { dim0: '六月', value: 156, m1: 0.39 }
];

export default defineWidget({
  type: 'charts.dual-axis',
  name: '双轴图',
  category: '图表',
  icon: 'mdi:chart-timeline-variant',
  reportType: 'bar',
  defaultSize: { w: 520, h: 320 },
  defaultStyle: {
    leftType: 'bar',
    smooth: true,
    barWidth: 0,
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
    mapping: { axis: 'dim0', value: 'value', value2: 'm1' }
  },
  fields: [
    { key: 'data.mapping.axis', label: '类目列', control: 'text', group: '高级', tip: '留空即第一个维度(dim0)' },
    { key: 'data.mapping.value', label: '左轴列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    {
      key: 'data.mapping.value2',
      label: '右轴列',
      control: 'text',
      group: '高级',
      tip: '填第二个度量别名(如 m1)；留空则退化为单轴图'
    },
    {
      key: 'leftType',
      label: '左轴形态',
      control: 'select',
      group: '样式',
      options: [
        { label: '柱状', value: 'bar' },
        { label: '折线', value: 'line' }
      ]
    },
    { key: 'smooth', label: '折线平滑', control: 'switch', group: '样式' },
    {
      key: 'barWidth',
      label: '柱宽',
      control: 'number',
      group: '样式',
      min: 0,
      max: 60,
      unit: 'px',
      tip: '0 表示按类目自动均分'
    },
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
