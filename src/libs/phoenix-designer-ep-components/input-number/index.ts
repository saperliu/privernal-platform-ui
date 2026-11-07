import type { ComponentConfigModel } from 'phoenix-designer';

/**
 * 数字输入框覆盖注册（对齐内置 input-number 的元数据，仅替换渲染组件）。
 *
 * 内置 EP 适配直接渲染裸 ElInputNumber，其默认宽度固定 150px，
 * 在表单里无法像文本框一样占满整行（列表设计/填报页均受影响，如「课时」字段）。
 * 此处覆盖为宽度 100% 的包装组件，attribute/defaultSchema 等元数据保持内置原样。
 */
const inputNumberConfig = {
  component: () => import('./input-number.vue'),
  config: {
    attribute: [
      {
        field: 'field',
        label: '数据字段',
        type: 'EpField'
      },
      {
        field: 'label',
        label: '标题',
        type: 'input'
      },
      {
        field: 'props.defaultValue',
        label: '默认值',
        type: 'number'
      },
      {
        field: 'props.placeholder',
        label: '占位内容',
        type: 'input'
      },
      {
        field: 'props.size',
        label: '尺寸',
        props: {
          clearable: true,
          options: [
            { label: '大号', value: 'large' },
            { label: '中等', value: 'default' },
            { label: '小型', value: 'small' }
          ]
        },
        type: 'select'
      },
      {
        field: 'props.max',
        label: '最大值',
        type: 'number'
      },
      {
        field: 'props.min',
        label: '最小值',
        type: 'number'
      },
      {
        field: 'props.step',
        label: '步长',
        type: 'number'
      },
      {
        defaultValue: '',
        field: 'props.controlsPosition',
        label: '控制按钮位置',
        props: {
          clearable: true,
          options: [
            { label: 'default', value: '' },
            { label: 'right', value: 'right' }
          ]
        },
        type: 'select'
      },
      {
        field: 'props.precision',
        label: '精度',
        type: 'number'
      },
      {
        field: 'props.stepStrictly',
        label: '输入控制为步长的倍数',
        type: 'switch'
      },
      {
        field: 'props.disabled',
        label: '禁用',
        type: 'switch'
      },
      {
        field: 'props.hidden',
        label: '隐藏',
        type: 'switch'
      },
      {
        description: '校验规则需要配合表单使用',
        field: 'rules',
        label: '表单校验',
        layout: 'vertical',
        props: {
          ruleType: 'number'
        },
        type: 'ERuleEditor'
      }
    ],
    event: [
      {
        description: '值变化时',
        type: 'change'
      }
    ]
  },
  defaultSchema: {
    field: 'number',
    input: true,
    label: '数字输入框',
    type: 'number'
  },
  groupName: '表单',
  icon: 'icon--phoenix--123-rounded',
  sort: 710
} as ComponentConfigModel;

export default inputNumberConfig;
