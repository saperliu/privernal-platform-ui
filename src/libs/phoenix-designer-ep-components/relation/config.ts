import type { ComponentConfigModel } from 'phoenix-designer';

/** 公共属性项（attr 与 backfill 共用的前缀部分） */
const commonAttribute = [
  { field: 'field', label: '数据字段', type: 'EpField' },
  { field: 'label', label: '标题', type: 'input' },
  {
    field: 'props.placeholder',
    label: '占位内容',
    type: 'input'
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
];

/**
 * 关联属性组件配置（对齐 naiveUi 版 relation/index-attr.js）。
 * 「关联配置」项的编辑器为 ERelationConfig（mode: attr），
 * 需在 setup 时通过 pluginManager.component.add 注册。
 */
const relationAttrConfig: ComponentConfigModel = {
  component: () => import('./relation-attr.vue'),
  config: {
    attribute: [
      commonAttribute[0],
      commonAttribute[1],
      {
        description:
          '关联其它动态表单并配置显示字段（oneToOne，值存被关联记录 id，查询时可关联查出）；数据源接口可改绑数据字典等',
        field: 'props.relation',
        label: '关联配置',
        layout: 'vertical',
        props: {
          mode: 'attr'
        },
        type: 'ERelationConfig'
      },
      ...commonAttribute.slice(2)
    ],
    event: [{ description: '值修改', type: 'change' }]
  },
  defaultSchema: {
    field: 'relationAttr',
    input: true,
    label: '关联属性',
    props: {
      placeholder: '请选择'
    },
    type: 'relation-attr'
  },
  groupName: '系统',
  icon: 'icon--phoenix--form-new',
  sort: 991
} as ComponentConfigModel;

/**
 * 关联表单组件配置（对齐 naiveUi 版 relation/index-backfill.js）。
 * 「关联配置」项的编辑器为 ERelationConfig（mode: backfill），额外含
 * 数据范围（条件表达式）与数据填充规则（mappings）。
 */
const relationBackfillConfig: ComponentConfigModel = {
  component: () => import('./relation-backfill.vue'),
  config: {
    attribute: [
      commonAttribute[0],
      commonAttribute[1],
      {
        description: '选择被关联动态表单的记录后，按映射把多个字段内容回填到本表单；字段与目标同名时可不再修改',
        field: 'props.relation',
        label: '关联配置',
        layout: 'vertical',
        props: {
          mode: 'backfill'
        },
        type: 'ERelationConfig'
      },
      ...commonAttribute.slice(2)
    ],
    event: [
      { description: '值修改', type: 'change' },
      { description: '选择记录（回填完成后触发）', type: 'backfill' }
    ]
  },
  defaultSchema: {
    field: 'relationControl',
    input: true,
    label: '关联表单',
    props: {
      placeholder: '请选择'
    },
    type: 'relation-backfill'
  },
  groupName: '系统',
  icon: 'icon--phoenix--auto-awesome-mosaic-outline',
  sort: 992
} as ComponentConfigModel;

export { relationAttrConfig, relationBackfillConfig };
