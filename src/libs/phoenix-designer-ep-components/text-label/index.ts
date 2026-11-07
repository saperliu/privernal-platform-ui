import type { ComponentConfigModel } from 'phoenix-designer';

/**
 * 文本标签组件配置（对齐 naiveUi 版 text-label/index.js）。
 */
const textLabelConfig: ComponentConfigModel = {
  component: () => import('./text-label.vue'),
  config: {
    attribute: [
      {
        description: '支持换行，用于表单内的描述说明',
        field: 'props.text',
        label: '文本内容',
        layout: 'vertical',
        type: 'textarea'
      },
      { field: 'props.hidden', label: '隐藏', type: 'switch' }
    ]
  },
  defaultSchema: {
    label: '文本标签',
    props: {
      text: '这里是说明文本，用于描述表单或字段的填写说明。'
    },
    type: 'text-label'
  },
  groupName: '布局',
  icon: 'icon--phoenix--insert-text-outline-rounded',
  sort: 1000
} as ComponentConfigModel;

export default textLabelConfig;
