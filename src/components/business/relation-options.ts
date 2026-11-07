/**
 * 关联表单记录选项（公共 composable）
 *
 * 列表设计「查询默认值」与列表运行时「过滤条件」共用的关联记录下拉数据源：
 * 按 formCode 懒加载 + 只缓存成功结果（失败允许重试），label 取 displayField（回退数据标题 title），
 * value=记录 id（关联字段列存的就是 id，后端按 id 匹配）。
 * 走关联显示数据接口 /dbs/open/dynamic/data/relationList：有本表单（fromTableCode）权限即可读
 * 被关联表的显示字段，后端按关联配置收敛返回列。
 */
import { reactive } from 'vue';
import { findDynamicRelationDataList } from '@/service/api/dynamic/dynamic-common';

export interface RelationConfig {
  formCode: string;
  displayField?: string;
}

/** 字段名取记录值的三级回退：原值 → 下划线 → 驼峰（与翻译层一致） */
function pickRecordValue(record: Record<string, any>, field?: string): any {
  if (!record || !field) return undefined;
  if (field in record) return record[field];
  const snake = field.replace(/([A-Z])/g, '_$1').toLowerCase();
  if (snake in record) return record[snake];
  const camel = field.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
  if (camel in record) return record[camel];
  return undefined;
}

/**
 * @param getFromTableCode 当前表单编码（决定关联显示数据的授权与收敛列），懒加载时实时取
 */
export function useRelationOptions(getFromTableCode: () => string) {
  /** 关联表单记录行缓存：下拉展开时按 formCode 懒加载，只缓存成功结果以便下次重试 */
  const relationRows = reactive<Record<string, any[]>>({});
  const relationLoading = new Set<string>();

  function loadRelationRows(formCode: string) {
    if (!formCode || relationLoading.has(formCode)) return;
    const cached = relationRows[formCode];
    if (cached && cached.length > 0) return;
    relationLoading.add(formCode);
    findDynamicRelationDataList({ tableCode: formCode, fromTableCode: getFromTableCode(), pageNum: 1, pageSize: 9999 })
      .then(({ data, error }) => {
        const rows = error === null ? ((data as any)?.list ?? []) : [];
        if (rows.length > 0) relationRows[formCode] = rows;
      })
      .catch(() => {})
      .finally(() => {
        relationLoading.delete(formCode);
      });
  }

  function relationOptionsFor(relation: RelationConfig) {
    loadRelationRows(relation.formCode);
    return (relationRows[relation.formCode] ?? []).map(row => {
      let label = relation.displayField ? pickRecordValue(row, relation.displayField) : undefined;
      if (label === undefined || label === null || label === '') label = pickRecordValue(row, 'title');
      return { label: String(label ?? row.id), value: String(row.id) };
    });
  }

  return { relationRows, loadRelationRows, relationOptionsFor };
}
