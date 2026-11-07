import type { ComponentConfigModel } from 'phoenix-designer';

/**
 * 人员选择组件配置（对齐 naiveUi 版 user-select/index.js，
 * 属性面板项与 EP 适配保持一致：EpField/input/switch/number/ERuleEditor）。
 */
const userSelectConfig: ComponentConfigModel = {
  component: () => import('./user-select.vue'),
  config: {
    attribute: [
      { field: 'field', label: '数据字段', type: 'EpField' },
      { field: 'label', label: '标题', type: 'input' },
      { field: 'props.placeholder', label: '占位内容', type: 'input' },
      {
        description: '选项显示的字段名，默认 nickName',
        field: 'props.labelField',
        label: '标签字段',
        type: 'input'
      },
      {
        description: '选项取值的字段名，默认 id',
        field: 'props.valueField',
        label: '取值字段',
        type: 'input'
      },
      { field: 'props.multiple', label: '多选', type: 'switch' },
      {
        field: 'props.maxTagCount',
        label: '最大tag数',
        show: ({ values }: any) => Boolean(values.props?.multiple),
        type: 'number'
      },
      { field: 'props.clearable', label: '可清空', type: 'switch' },
      { field: 'props.disabled', label: '禁用', type: 'switch' },
      { field: 'props.hidden', label: '隐藏', type: 'switch' },
      {
        description: '校验规则需要配合表单使用',
        field: 'rules',
        label: '表单校验',
        layout: 'vertical',
        type: 'ERuleEditor'
      }
    ],
    event: [{ description: '值修改', type: 'change' }]
  },
  defaultSchema: {
    field: 'user',
    input: true,
    label: '人员',
    props: {
      placeholder: '请选择人员'
    },
    type: 'user-select'
  },
  groupName: '系统',
  icon: 'icon--phoenix--person',
  sort: 950
} as ComponentConfigModel;

export default userSelectConfig;
