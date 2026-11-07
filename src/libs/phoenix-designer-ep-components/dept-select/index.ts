import type { ComponentConfigModel } from 'phoenix-designer';

/**
 * 部门选择组件配置（对齐 naiveUi 版 dept-select/index.js）。
 * checkStrategy 对应 EP 的 check-strictly 与值过滤逻辑。
 */
const deptSelectConfig: ComponentConfigModel = {
  component: () => import('./dept-select.vue'),
  config: {
    attribute: [
      { field: 'field', label: '数据字段', type: 'EpField' },
      { field: 'label', label: '标题', type: 'input' },
      { field: 'props.placeholder', label: '占位内容', type: 'input' },
      {
        description: '选项显示的字段名，默认 deptName',
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
      {
        description: '子节点列表的字段名，默认 children',
        field: 'props.childrenField',
        label: '子节点字段',
        type: 'input'
      },
      { field: 'props.multiple', label: '多选', type: 'switch' },
      {
        field: 'props.maxTagCount',
        label: '最大tag数',
        show: ({ values }: any) => Boolean(values.props?.multiple),
        type: 'number'
      },
      {
        field: 'props.checkStrategy',
        label: '可选节点',
        props: {
          options: [
            { label: '全部节点', value: 'all' },
            { label: '仅父节点', value: 'parent' },
            { label: '仅子节点', value: 'child' }
          ]
        },
        type: 'select'
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
    field: 'department',
    input: true,
    label: '部门',
    props: {
      placeholder: '请选择部门'
    },
    type: 'dept-select'
  },
  groupName: '系统',
  icon: 'icon--phoenix--account-tree-outline-rounded',
  sort: 970
} as ComponentConfigModel;

export default deptSelectConfig;
