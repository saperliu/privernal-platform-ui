import type { ComponentConfigModel } from 'phoenix-designer';

/**
 * 流水号组件配置（对齐 naiveUi 版 serial-number/index.js）。
 */
const serialNumberConfig: ComponentConfigModel = {
  component: () => import('./serial-number.vue'),
  config: {
    attribute: [
      { field: 'field', label: '数据字段', type: 'EpField' },
      { field: 'label', label: '标题', type: 'input' },
      {
        description: '流水号前缀，如 SN、DD（订单单号）',
        field: 'props.prefix',
        label: '前缀',
        type: 'input'
      },
      {
        description: '日期部分格式（Java 风格），如 yyyyMMdd、yyyyMMddHHmm',
        field: 'props.pattern',
        label: '日期格式',
        type: 'input'
      },
      {
        description: '序列位数，不足左补 0（如 4 位 → 0001）',
        field: 'props.digits',
        label: '序列位数',
        type: 'number'
      },
      {
        field: 'props.cycle',
        label: '重置周期',
        props: {
          options: [
            { label: '每日重置', value: 'day' },
            { label: '每月重置', value: 'month' },
            { label: '永不重置', value: 'never' }
          ]
        },
        type: 'select'
      },
      { field: 'props.placeholder', label: '占位内容', type: 'input' },
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
    event: [{ description: '流水号生成完成', type: 'change' }]
  },
  defaultSchema: {
    field: 'serialNumber',
    input: true,
    label: '流水号',
    props: {
      cycle: 'day',
      digits: 4,
      pattern: 'yyyyMMdd',
      placeholder: '打开表单时自动生成流水号',
      prefix: 'SN'
    },
    type: 'serial-number'
  },
  groupName: '系统',
  icon: 'icon--phoenix--list-alt-outline-rounded',
  sort: 930
} as ComponentConfigModel;

export default serialNumberConfig;
