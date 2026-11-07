import { defineWidget, lazyRuntime } from '../../protocol';

const SAMPLE_ROWS = [
  { dim0: '数学', value: 128 },
  { dim0: '计算机', value: 96 },
  { dim0: '英语', value: 73 },
  { dim0: '物理', value: 51 },
  { dim0: '化学', value: 44 },
  { dim0: '生物', value: 38 },
  { dim0: '历史', value: 27 },
  { dim0: '地理', value: 19 }
];

export default defineWidget({
  type: 'tables.ranking',
  name: '滚动排行榜',
  category: '表格',
  icon: 'mdi:format-list-numbered',
  reportType: 'ranking',
  defaultSize: { w: 400, h: 380 },
  defaultStyle: {
    topN: 3,
    scrollSec: 6,
    fontSize: 13,
    barShow: true
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { axis: 'dim0', value: 'value' }
  },
  fields: [
    { key: 'data.mapping.axis', label: '名称列', control: 'text', group: '高级', tip: '留空即第一个维度(dim0)' },
    { key: 'data.mapping.value', label: '数值列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    { key: 'topN', label: '高亮前 N 名', control: 'number', group: '样式', min: 0, max: 10 },
    {
      key: 'scrollSec',
      label: '滚动一轮',
      control: 'number',
      group: '样式',
      min: 2,
      max: 60,
      unit: '秒',
      tip: '数据滚完一遍的时长；行数少于一屏时自动停滚'
    },
    { key: 'barShow', label: '数值条', control: 'switch', group: '样式' },
    { key: 'fontSize', label: '字号', control: 'number', group: '样式', min: 11, max: 20, unit: 'px' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
