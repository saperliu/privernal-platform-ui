import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'medias.video',
  name: '视频',
  category: '媒体',
  icon: 'mdi:video-outline',
  defaultSize: { w: 480, h: 270 },
  defaultStyle: {
    src: '',
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
    fit: 'cover'
  },
  fields: [
    { key: 'src', label: '视频地址', control: 'text', group: '常规', placeholder: 'mp4/webm 地址' },
    {
      key: 'autoplay',
      label: '自动播放',
      control: 'switch',
      group: '常规',
      tip: '浏览器要求自动播放必须静音，两个开关已联动保证这一点'
    },
    { key: 'loop', label: '循环播放', control: 'switch', group: '常规' },
    { key: 'muted', label: '静音', control: 'switch', group: '常规' },
    { key: 'controls', label: '显示控制条', control: 'switch', group: '常规' },
    {
      key: 'fit',
      label: '填充方式',
      control: 'select',
      group: '常规',
      options: [
        { label: 'cover 铺满裁切', value: 'cover' },
        { label: 'contain 完整显示', value: 'contain' }
      ]
    }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
