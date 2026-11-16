import type { ComponentConfigModel } from 'phoenix-designer';

/**
 * 公式字段组件配置（R2-11）。
 * 只读展示字段：服务端权威求值（保存/流程发起链路），渲染端实时预览回写。
 * props.textType 开启文本公式（TEXT 列、拼接语义）；数值公式默认 DECIMAL 列。
 * 注意：列类型在建表时按 textType 定死，已发布表单切换 textType 需重建表单。
 */
const formulaConfig: ComponentConfigModel = {
  component: () => import('./formula.vue'),
  config: {
    attribute: [
      { field: 'field', label: '数据字段', type: 'EpField' },
      { field: 'label', label: '标题', type: 'input' },
      {
        description: '计算表达式，{数据字段} 引用本行字段值，如 {price} * {qty} * 0.9',
        field: 'props.expression',
        label: '计算公式',
        layout: 'vertical',
        type: 'EFormulaEditor'
      },
      {
        description: '开启后按文本公式落 TEXT 列（拼接语义）；默认数值公式落 DECIMAL。列类型建表时定死',
        field: 'props.textType',
        label: '文本公式',
        type: 'switch'
      },
      {
        description: '依赖字段未填写时的占位提示',
        field: 'props.placeholder',
        label: '占位提示',
        type: 'input'
      },
      { field: 'props.disabled', label: '禁用', type: 'switch' },
      { field: 'props.hidden', label: '隐藏', type: 'switch' }
    ]
  },
  defaultSchema: {
    field: 'formula1',
    input: true,
    label: '公式',
    props: {
      expression: '',
      placeholder: '依赖字段填写后自动计算',
      textType: false
    },
    type: 'formula'
  },
  groupName: '系统',
  icon: 'icon--phoenix--calculator-outline-rounded',
  sort: 940
} as ComponentConfigModel;

export default formulaConfig;
