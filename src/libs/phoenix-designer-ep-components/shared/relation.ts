import { findSchemas, pluginManager } from 'phoenix-designer';
import { getJson, postJson, unwrapPageList } from './http';

/**
 * 关联表单（relation-attr / relation-backfill / ERelationConfig）共用的数据辅助。
 * 行为对齐 phoenix-designer naiveUi 适配的 relation.js。
 */

/** 兼容驼峰/下划线字段名取值（关联记录字段可能来自不同命名风格的后端） */
export function pickFieldValue(model: Record<string, any> | undefined, field: string) {
  if (!model || !field) return undefined;
  if (field in model) return model[field];
  const snake = field.replace(/([A-Z])/g, '_$1').toLowerCase();
  if (snake in model) return model[snake];
  const camel = field.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
  if (camel in model) return model[camel];
  return undefined;
}

/** 解析关联记录的取数地址：自定义 dataUrl 优先，其次按被关联表编码走开放接口 */
export function resolveRecordsUrl(relation: any) {
  if (relation?.dataUrl) return relation.dataUrl;
  if (relation?.formCode) {
    return pluginManager.global.dynamicFormDataUrl ?? '/dbs/open/dynamic/data/list';
  }
  return null;
}

/** 拉取被关联表单的记录列表（最多 999 条） */
export async function loadRelationRecords(relation: any) {
  const url = resolveRecordsUrl(relation);
  if (!url) return [];
  const res = await postJson(url, {
    pageNum: 1,
    pageSize: 999,
    // 自定义 dataUrl（applyRelationScope 注入的完整 URL，含 businessId 场景）时
    // 组件自己不知道目标表编码——交回退链路由 query 参数或后端解析，绝不能把 URL 塞进 tableCode
    tableCode: relation?.dataUrl ? undefined : relation?.formCode
  });
  return unwrapPageList(res);
}

const formFieldsCache = new Map<string, Array<{ label: string; value: string }>>();

/** 按表单编码拉取其可输入字段（GET 表单定义，解析 metaData.schemas），带内存缓存 */
export async function loadFormFields(formCode: string) {
  if (formFieldsCache.has(formCode)) {
    return formFieldsCache.get(formCode)!;
  }
  const prefix = pluginManager.global.dynamicFormDetailUrl ?? '/back/dynamic/form/code/';
  const res = await getJson(`${prefix}${formCode}`);
  const metaData = res?.data?.metaData ?? res?.metaData;
  const parsed = typeof metaData === 'string' ? JSON.parse(metaData) : metaData;
  const schemas = parsed?.schemas ?? [];
  // 字段不在 schemas 顶层（表单根节点的 children/slots 里），必须递归收集，
  // 平铺 filter 恒为空 → 显示字段/数据填充规则退化为手填输入框（对齐 naive 版 findSchemas 行为）
  const matched = findSchemas(schemas as any[], (schema: any) => Boolean(schema?.input && schema?.field)) as any[];
  const fields: Array<{ label: string; value: string }> = [];
  const seen = new Set<string>();
  matched.forEach(schema => {
    const value = String(schema.field);
    if (seen.has(value)) return;
    seen.add(value);
    fields.push({ label: String(schema.label ?? schema.field), value });
  });
  // 空结果不缓存：表单可能尚未保存，避免把空数组钉死在内存里导致本会话内永远是输入框
  if (fields.length) {
    formFieldsCache.set(formCode, fields);
  }
  return fields;
}

/** 拉取动态表单下拉选项（设计时选择被关联表单） */
export async function loadRelationFormOptions() {
  const url = pluginManager.global.dynamicFormListUrl ?? '/back/dynamic/form/list';
  const res = await postJson(url, { pageNum: 1, pageSize: 999 });
  return (unwrapPageList(res) as any[]).map(item => ({
    label: String(item.tableName || item.title || item.tableCode),
    value: String(item.tableCode)
  }));
}
