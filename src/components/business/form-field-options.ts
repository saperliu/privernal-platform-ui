/**
 * 动态表单字段下拉选项构建（公共）
 *
 * 从表单 metaData.schemas 的顶层子节点收集输入字段，供联动规则的条件/目标字段、
 * 打印参数等设计态配置下拉共用同一口径：保留 input 且有 field 的组件，
 * 排除 sub-table（子表数据在独立物理表，主表口径不含它），label 附带字段编码便于区分同名。
 */
export interface FormFieldOption {
  label: string;
  value: string;
  type: string;
  required?: boolean;
}

export function collectFormFieldOptions(metaData: Record<string, any> | null | undefined): FormFieldOption[] {
  const options: FormFieldOption[] = [];
  const schemas = metaData?.schemas;
  const children = Array.isArray(schemas) && schemas.length ? (schemas[0]?.children ?? []) : [];
  for (const child of children) {
    if (child?.input && child?.field && child.type !== 'sub-table') {
      options.push({ label: `${child.label || child.field}(${child.field})`, value: child.field, type: child.type });
    }
  }
  return options;
}
