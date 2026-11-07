import { defineWidget, lazyRuntime } from '../../protocol';

const SAMPLE_ROWS = [{ value: 128654 }];

export default defineWidget({
  type: 'informations.flip-counter',
  name: '数字翻牌',
  category: '信息',
  icon: 'mdi:numeric',
  reportType: 'stat',
  defaultSize: { w: 340, h: 110 },
  defaultStyle: {
    decimals: 0,
    thousands: true,
    prefix: '',
    suffix: '',
    digitStyle: 'card'
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { value: 'value' }
  },
  fields: [
    { key: 'data.mapping.value', label: '数值列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    { key: 'prefix', label: '前缀', control: 'text', group: '样式', placeholder: '如 累计' },
    { key: 'suffix', label: '后缀', control: 'text', group: '样式', placeholder: '如 人次' },
    { key: 'decimals', label: '小数位', control: 'number', group: '样式', min: 0, max: 4 },
    { key: 'thousands', label: '千分位', control: 'switch', group: '样式' },
    {
      key: 'digitStyle',
      label: '数字样式',
      control: 'radio',
      group: '样式',
      options: [
        { label: '翻牌卡', value: 'card' },
        { label: '纯数字', value: 'plain' }
      ]
    }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
