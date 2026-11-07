import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'informations.clock',
  name: '时间',
  category: '信息',
  icon: 'mdi:clock-outline',
  defaultSize: { w: 320, h: 56 },
  defaultStyle: {
    showDate: true,
    showWeek: true,
    showSeconds: true,
    fontSize: 26,
    color: 'datav-text-primary'
  },
  fields: [
    { key: 'showDate', label: '显示日期', control: 'switch', group: '内容' },
    { key: 'showWeek', label: '显示星期', control: 'switch', group: '内容' },
    { key: 'showSeconds', label: '显示秒', control: 'switch', group: '内容' },
    { key: 'fontSize', label: '字号', control: 'slider', group: '样式', min: 12, max: 80, unit: 'px' },
    {
      key: 'color',
      label: '颜色',
      control: 'color',
      group: '样式',
      tip: '填 token 名（如 datav-accent）才会跟随配色板'
    }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
