import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'decorates.flow-line-v',
  name: '流光线(竖)',
  category: '装饰',
  icon: 'mdi:ray-end-arrow',
  defaultSize: { w: 6, h: 360 },
  defaultStyle: {
    colorToken: 'datav-accent',
    thickness: 2,
    speedSec: 3
  },
  fields: [
    {
      key: 'colorToken',
      label: '颜色',
      control: 'select',
      group: '常规',
      options: [
        { label: '强调色', value: 'datav-accent' },
        { label: '系列色 1', value: 'datav-series-1' },
        { label: '系列色 2', value: 'datav-series-2' },
        { label: '系列色 3', value: 'datav-series-3' },
        { label: '成功', value: 'datav-success' },
        { label: '警告', value: 'datav-warning' }
      ]
    },
    { key: 'thickness', label: '线宽', control: 'slider', group: '常规', min: 1, max: 8, unit: 'px' },
    {
      key: 'speedSec',
      label: '扫光周期',
      control: 'slider',
      group: '常规',
      min: 1,
      max: 12,
      unit: 's',
      tip: '0 表示静止（只留底线）'
    }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
