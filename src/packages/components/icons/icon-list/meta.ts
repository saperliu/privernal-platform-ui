import { defineWidget, lazyRuntime } from '../../protocol';
import { COLOR_TOKENS } from '../icon/meta';

export default defineWidget({
  type: 'icons.icon-list',
  name: '图标列表',
  category: '图标',
  icon: 'mdi:format-list-bulleted',
  defaultSize: { w: 320, h: 240 },
  defaultStyle: {
    direction: 'vertical',
    iconSize: 28,
    fontSize: 14,
    colorToken: 'datav-accent',
    showValue: true
  },
  defaultData: {
    mode: 'static',
    staticRows: [
      { icon: 'mdi:account-group-outline', label: '在线用户', value: '1,286' },
      { icon: 'mdi:server', label: '节点数', value: '12' },
      { icon: 'mdi:alert-circle-outline', label: '待处理告警', value: '3' }
    ]
  },
  fields: [
    {
      key: 'data.staticRows',
      label: '列表项',
      control: 'json',
      group: '数据',
      tip: '数组，每项 { "icon": "mdi:xxx", "label": "名称", "value": "值" }'
    },
    {
      key: 'direction',
      label: '排列方向',
      control: 'radio',
      group: '样式',
      options: [
        { label: '纵向', value: 'vertical' },
        { label: '横向', value: 'horizontal' }
      ]
    },
    { key: 'iconSize', label: '图标尺寸', control: 'slider', group: '样式', min: 16, max: 64, unit: 'px' },
    { key: 'fontSize', label: '文字字号', control: 'slider', group: '样式', min: 11, max: 24, unit: 'px' },
    { key: 'colorToken', label: '图标颜色', control: 'select', group: '样式', options: COLOR_TOKENS },
    { key: 'showValue', label: '显示值', control: 'switch', group: '样式' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
