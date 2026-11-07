import { defineWidget, lazyRuntime } from '../../protocol';

const SAMPLE_ROWS = [
  { dim0: '订单 A1024', dim1: '已支付', value: 328 },
  { dim0: '订单 A1025', dim1: '待发货', value: 156 },
  { dim0: '订单 A1026', dim1: '已完成', value: 512 },
  { dim0: '订单 A1027', dim1: '已支付', value: 208 },
  { dim0: '订单 A1028', dim1: '已关闭', value: 96 },
  { dim0: '订单 A1029', dim1: '待支付', value: 440 },
  { dim0: '订单 A1030', dim1: '已完成', value: 377 },
  { dim0: '订单 A1031', dim1: '已发货', value: 265 }
];

/**
 * 明细翻牌表：行数多于可视页时整页轮播（大屏「滚动明细」的翻页变体——
 * 翻页比连续滚动更易读，观众能在一页停留期内扫完一轮）。
 */
export default defineWidget({
  type: 'tables.flip-table',
  name: '明细翻牌表',
  category: '表格',
  icon: 'mdi:table-refresh',
  reportType: 'table',
  defaultSize: { w: 560, h: 320 },
  defaultStyle: {
    pageSize: 6,
    intervalSec: 6,
    fontSize: 13,
    striped: true
  },
  defaultData: {
    mode: 'static',
    staticRows: SAMPLE_ROWS,
    mapping: { axis: 'dim0', value: 'value' }
  },
  fields: [
    { key: 'pageSize', label: '每页行数', control: 'slider', group: '样式', min: 3, max: 20 },
    { key: 'intervalSec', label: '翻页间隔', control: 'slider', group: '样式', min: 2, max: 60, unit: 's' },
    { key: 'fontSize', label: '字号', control: 'slider', group: '样式', min: 11, max: 20, unit: 'px' },
    { key: 'striped', label: '斑马纹', control: 'switch', group: '样式' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: true
});
