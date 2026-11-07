import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'medias.carousel',
  name: '图片轮播',
  category: '媒体',
  icon: 'mdi:view-carousel-outline',
  defaultSize: { w: 520, h: 300 },
  defaultStyle: {
    images: [] as string[],
    autoplay: true,
    intervalSec: 5,
    fit: 'cover',
    showDots: true,
    radius: 4
  },
  fields: [
    {
      key: 'images',
      label: '图片列表',
      control: 'json',
      group: '常规',
      tip: '字符串数组，如 ["https://a.png","/statics/b.png"]，按顺序轮播'
    },
    { key: 'autoplay', label: '自动播放', control: 'switch', group: '常规' },
    { key: 'intervalSec', label: '切换间隔', control: 'slider', group: '常规', min: 2, max: 60, unit: 's' },
    {
      key: 'fit',
      label: '填充方式',
      control: 'select',
      group: '常规',
      options: [
        { label: 'cover 铺满裁切', value: 'cover' },
        { label: 'contain 完整显示', value: 'contain' }
      ]
    },
    { key: 'showDots', label: '显示指示点', control: 'switch', group: '常规' },
    { key: 'radius', label: '圆角', control: 'number', group: '常规', min: 0, max: 48, unit: 'px' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
