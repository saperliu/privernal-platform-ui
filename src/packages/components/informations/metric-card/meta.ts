import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'informations.metric-card',
  name: '指标卡',
  category: '信息',
  icon: 'mdi:numeric',
  reportType: 'stat',
  defaultSize: { w: 280, h: 140 },
  defaultStyle: {
    label: '指标',
    fontSize: 36,
    labelFontSize: 13,
    valueColor: 'datav-accent',
    labelColor: 'datav-text-secondary',
    align: 'center',
    decimals: 0,
    thousands: true
  },
  defaultData: {
    mode: 'static',
    staticRows: [{ value: 12345 }],
    mapping: { value: 'value' }
  },
  fields: [
    { key: 'label', label: '指标名称', control: 'text', group: '内容' },
    {
      key: 'data.mapping.value',
      label: '数值列',
      control: 'text',
      group: '高级',
      tip: '留空即第一个度量(value)'
    },
    { key: 'fontSize', label: '数值字号', control: 'slider', group: '样式', min: 16, max: 96, unit: 'px' },
    { key: 'labelFontSize', label: '标题字号', control: 'slider', group: '样式', min: 10, max: 32, unit: 'px' },
    { key: 'valueColor', label: '数值颜色', control: 'color', group: '样式' },
    { key: 'labelColor', label: '标题颜色', control: 'color', group: '样式' },
    {
      key: 'align',
      label: '对齐',
      control: 'radio',
      group: '样式',
      options: [
        { label: '左', value: 'left' },
        { label: '中', value: 'center' },
        { label: '右', value: 'right' }
      ]
    },
    { key: 'decimals', label: '小数位', control: 'number', group: '数值', min: 0, max: 4 },
    { key: 'thousands', label: '千分位', control: 'switch', group: '数值' },
    {
      key: 'data.format.percent',
      label: '按百分比',
      control: 'switch',
      group: '数值',
      tip: '值需是 0–1 的比例；本身已是 23.5 这类数再开会变成 2350%'
    },
    { key: 'data.format.negativeColor', label: '负数标红', control: 'switch', group: '数值' },
    { key: 'data.format.unit', label: '单位后缀', control: 'text', group: '数值', placeholder: '如 元 / 人' },
    { key: 'data.format.emptyText', label: '空值文本', control: 'text', group: '数值', placeholder: '默认 —' },
    { key: 'unit', label: '单位后缀', control: 'text', group: '数值', placeholder: '如 元 / % / 人' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
