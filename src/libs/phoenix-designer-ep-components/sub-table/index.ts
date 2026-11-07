import type { ComponentConfigModel } from 'phoenix-designer';

/**
 * 子表组件配置（对齐 naiveUi 版 sub-table/index.js）。
 * isSubTable 标记使设计器按子表容器方式管理其 children。
 */
const subTableConfig: ComponentConfigModel = {
  component: () => import('./sub-table'),
  config: {
    attribute: [
      { field: 'field', label: '数据字段', type: 'EpField' },
      { field: 'label', label: '标题', type: 'input' },
      {
        description: '表单数据中保存为对象数组，每行为一条子表记录',
        field: 'props.addText',
        label: '添加按钮文本',
        type: 'input'
      },
      { field: 'props.showIndex', label: '显示序号列', type: 'switch' },
      { field: 'props.addable', label: '允许添加行', type: 'switch' },
      { field: 'props.removable', label: '允许删除行', type: 'switch' },
      { field: 'props.disabled', label: '禁用', type: 'switch' },
      { field: 'props.hidden', label: '隐藏', type: 'switch' }
    ],
    event: [{ description: '值修改', type: 'change' }]
  },
  defaultSchema: {
    children: [],
    field: 'subTable',
    input: true,
    label: '子表',
    props: {
      addable: true,
      addText: '添加一行',
      removable: true,
      showIndex: true
    },
    type: 'sub-table'
  },
  editConstraints: {
    // 子表内子组件由原型行管理，不需要整体锁定
  },
  groupName: '表单',
  icon: 'icon--phoenix--table-grid',
  isSubTable: true,
  sort: 990
} as ComponentConfigModel;

export default subTableConfig;
