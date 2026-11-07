/**
 * 单据打印模板：metaData → 字段树（主表字段 + 子表及其字段）。
 * 纯逻辑零依赖，SHEET（Luckysheet）编辑器链路使用。
 */
export interface FieldNode {
  field: string;
  label: string;
  type: string;
}

export interface SubTableNode extends FieldNode {
  children: FieldNode[];
}

/** metaData → 字段树（主表字段 + 子表及其字段） */
export function extractFieldTree(metaData: Record<string, any> | null | undefined): {
  mainFields: FieldNode[];
  subTables: SubTableNode[];
} {
  const mainFields: FieldNode[] = [];
  const subTables: SubTableNode[] = [];
  const schemas = metaData?.schemas;
  const children = Array.isArray(schemas) && schemas.length ? (schemas[0]?.children ?? []) : [];
  for (const child of children) {
    if (child?.field) {
      if (child.type === 'sub-table') {
        subTables.push({
          field: child.field,
          label: child.label || child.field,
          type: child.type,
          children: (child.children ?? [])
            .filter((c: any) => c?.field)
            .map((c: any) => ({ field: c.field, label: c.label || c.field, type: c.type }))
        });
      } else if (child.input) {
        mainFields.push({ field: child.field, label: child.label || child.field, type: child.type });
      }
    }
  }
  return { mainFields, subTables };
}
