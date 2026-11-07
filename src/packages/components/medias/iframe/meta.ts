import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'medias.iframe',
  name: '网页嵌入',
  category: '媒体',
  icon: 'mdi:web-box',
  defaultSize: { w: 520, h: 360 },
  defaultStyle: {
    src: '',
    scrollbar: false
  },
  fields: [
    {
      key: 'src',
      label: '网页地址',
      control: 'text',
      group: '常规',
      placeholder: 'https://…（仅允许 http/https）',
      tip: '目标站点可用 X-Frame-Options/CSP 拒绝被嵌入，这与本平台无关'
    },
    { key: 'scrollbar', label: '允许滚动', control: 'switch', group: '常规' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
