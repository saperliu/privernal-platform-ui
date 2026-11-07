import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'informations.progress',
  name: '进度条',
  category: '信息',
  icon: 'mdi:progress-download',
  reportType: 'stat',
  defaultSize: { w: 320, h: 64 },
  defaultStyle: {
    label: '完成度',
    max: 100,
    unit: '%',
    height: 10,
    showValue: true,
    decimals: 0
  },
  defaultData: {
    mode: 'static',
    staticRows: [{ value: 62 }],
    mapping: { value: 'value' }
  },
  fields: [
    { key: 'label', label: '标题', control: 'text', group: '内容' },
    { key: 'data.mapping.value', label: '数值列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    { key: 'max', label: '满值', control: 'number', group: '数值', min: 1, tip: '当前值除以满值得到进度' },
    { key: 'unit', label: '单位后缀', control: 'text', group: '数值' },
    { key: 'decimals', label: '小数位', control: 'number', group: '数值', min: 0, max: 4 },
    { key: 'height', label: '条高度', control: 'slider', group: '样式', min: 4, max: 40, unit: 'px' },
    { key: 'showValue', label: '显示数值', control: 'switch', group: '样式' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
