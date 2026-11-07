import { defineWidget, lazyRuntime } from '../../protocol';

const SAMPLE_ROWS = [{ value: 68 }];

export default defineWidget({
  type: 'charts.water-level',
  name: '水位图',
  category: '图表',
  icon: 'mdi:water',
  reportType: 'stat',
  defaultSize: { w: 280, h: 300 },
  defaultStyle: {
    max: 100,
    decimals: 0,
    showPercent: true,
    colorToken: 'datav-series-1'
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { value: 'value' }
  },
  fields: [
    { key: 'data.mapping.value', label: '数值列', control: 'text', group: '高级', tip: '留空即第一个度量(value)' },
    { key: 'max', label: '满值', control: 'number', group: '样式', min: 1, tip: '当前值占满值的比例即水位高度' },
    { key: 'decimals', label: '小数位', control: 'number', group: '样式', min: 0, max: 4 },
    { key: 'showPercent', label: '显示百分比', control: 'switch', group: '样式' },
    {
      key: 'colorToken',
      label: '水位色',
      control: 'select',
      group: '样式',
      options: [
        { label: '系列色 1', value: 'datav-series-1' },
        { label: '系列色 2', value: 'datav-series-2' },
        { label: '系列色 3', value: 'datav-series-3' },
        { label: '成功色', value: 'datav-success' },
        { label: '警示色', value: 'datav-warning' }
      ],
      tip: '色值来自画布配色板，切板时自动跟随'
    }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
