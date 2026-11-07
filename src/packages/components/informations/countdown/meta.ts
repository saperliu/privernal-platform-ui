import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'informations.countdown',
  name: '倒计时',
  category: '信息',
  icon: 'mdi:timer-outline',
  defaultSize: { w: 420, h: 120 },
  defaultStyle: {
    target: '2030-01-01 00:00:00',
    label: '距目标',
    showDays: true,
    showSeconds: true
  },
  fields: [
    { key: 'label', label: '标题', control: 'text', group: '样式' },
    { key: 'target', label: '目标时间', control: 'text', group: '样式', placeholder: 'yyyy-MM-dd HH:mm:ss' },
    { key: 'showDays', label: '显示天数', control: 'switch', group: '样式' },
    { key: 'showSeconds', label: '显示秒数', control: 'switch', group: '样式' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
