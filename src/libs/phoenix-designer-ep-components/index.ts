import type { ComponentConfigModel } from 'phoenix-designer';
import { pluginManager } from 'phoenix-designer';
import userSelectConfig from './user-select';
import userMultiSelectConfig from './user-multi-select';
import deptSelectConfig from './dept-select';
import deptMultiSelectConfig from './dept-multi-select';
import serialNumberConfig from './serial-number';
import textLabelConfig from './text-label';
import inputNumberConfig from './input-number';
import { relationAttrConfig, relationBackfillConfig } from './relation/config';
import subTableConfig from './sub-table';

/**
 * phoenix-designer Element Plus 适配缺失的业务扩展组件注册。
 *
 * phoenix-designer 1.3.14 的 setupElementPlus 只内置基础组件，
 * naiveUi 版独有的 9 个业务扩展组件（人员/部门选择、流水号、文本标签、
 * 关联表单、子表等）在 EP 画布中渲染会报「组件xxx未注册」且节点不渲染。
 * 这里按 naiveUi 版的实现与元数据（defaultSchema/attribute/icon/sort）
 * 用 Element Plus 重写并注册，另补 relation 组件属性面板依赖的
 * ERelationConfig 与全组件共用的 EHideConditionEditor 编辑器。
 */
const componentConfigs: ComponentConfigModel[] = [
  // 覆盖内置数字输入框：EP 默认宽 150px 占不满表单项（文本框默认 100%），统一为 100%
  inputNumberConfig,
  userSelectConfig,
  userMultiSelectConfig,
  deptSelectConfig,
  deptMultiSelectConfig,
  serialNumberConfig,
  relationAttrConfig,
  relationBackfillConfig,
  subTableConfig,
  textLabelConfig
];

export function setupPhoenixDesignerEpComponents() {
  // 业务扩展组件：register 进组件库并在画布物料面板分组展示
  componentConfigs.forEach(config => {
    pluginManager.component.register(config);
    pluginManager.component.addBaseComponentType(config.defaultSchema.type);
  });

  // 属性面板编辑器：relation 组件的「关联配置」、各组件的「隐藏条件」、
  // 表单根节点的「数据标题」字段选择（naiveUi 版的 ETitleFieldsEditor，EP 包缺失）
  pluginManager.component.add('ERelationConfig', async () => (await import('./relation/relation-config.vue')).default);
  pluginManager.component.add(
    'EHideConditionEditor',
    async () => (await import('./hidden-condition/hidden-condition.vue')).default
  );
  pluginManager.component.add(
    'ETitleFieldsEditor',
    async () => (await import('./title-fields/title-fields.vue')).default
  );

  // EP 版 form 组件的 attribute 列表缺「数据标题」条目（naiveUi 版有：
  // props.titleFields → ETitleFieldsEditor，选择可输入字段拼接列表页数据标题）。
  // getConfigByType 返回 { component, config, defaultSchema, ... } 包装，真配置在 .config；
  // attribute 是数组引用，在属性面板渲染前原位插入即可
  const formWrapper = pluginManager.component.getConfigByType?.('form') as
    | { config?: { attribute?: Array<{ field: string; [key: string]: any }> } }
    | undefined;
  const formAttribute = formWrapper?.config?.attribute;
  if (Array.isArray(formAttribute) && !formAttribute.some(item => item.field === 'props.titleFields')) {
    const codeIndex = formAttribute.findIndex(item => item.field === 'props.code');
    formAttribute.splice(codeIndex >= 0 ? codeIndex + 1 : formAttribute.length, 0, {
      field: 'props.titleFields',
      label: '数据标题',
      layout: 'vertical',
      type: 'ETitleFieldsEditor'
    });
  }
}
