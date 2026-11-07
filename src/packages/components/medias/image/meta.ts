import { defineWidget, lazyRuntime } from '../../protocol';

export default defineWidget({
  type: 'medias.image',
  name: '单图',
  category: '媒体',
  icon: 'mdi:image-outline',
  defaultSize: { w: 360, h: 240 },
  defaultStyle: {
    src: '',
    fit: 'contain',
    radius: 4,
    fallbackText: '未配置图片'
  },
  fields: [
    {
      key: 'src',
      label: '图片地址',
      control: 'text',
      group: '常规',
      placeholder: '素材 URL 或 https://…',
      tip: '推荐从素材库选择背景/图片后复制地址'
    },
    {
      key: 'fit',
      label: '填充方式',
      control: 'select',
      group: '常规',
      options: [
        { label: 'contain 完整显示', value: 'contain' },
        { label: 'cover 铺满裁切', value: 'cover' },
        { label: 'fill 拉伸', value: 'fill' },
        { label: 'none 原始尺寸', value: 'none' }
      ]
    },
    { key: 'radius', label: '圆角', control: 'number', group: '常规', min: 0, max: 48, unit: 'px' },
    { key: 'fallbackText', label: '空态文案', control: 'text', group: '常规' }
  ],
  runtime: lazyRuntime(() => import('./index.vue')),
  supportData: false
});
