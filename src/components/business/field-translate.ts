/**
 * 动态表单字段翻译层（公共）
 *
 * 所有展示表单存储值的列表统一走这里：把 id / 选项 value / 状态码翻译为展示文案：
 *  - select / radio / checkbox / cascader：组件 options（label/value）映射，纯内存零请求
 *  - switch：ON/OFF 布尔值 → 是/否
 *  - user-select / user-multi-select：用户 id → 昵称（全量字典，模块级缓存）
 *  - dept-select / dept-multi-select：部门 id → 名称（全量字典，模块级缓存）
 *  - relation-attr / relation-backfill：关联表单记录 id → 配置的显示字段值（displayField，
 *    未配置时回退数据标题 title），按关联表单一次拉取构建映射
 *  - status（工作流数据状态，非表单字段）：dataStatusLabels → 彩色标签
 *
 * 组件 schema 来源统一走 collectFormComponents：设计器物化的 metaData.inputComponents
 * 优先，缺失（如 API 直存的 metaData 只有 schemas）时深度遍历 metaData.schemas 兜底，
 * 保证任何渠道保存的表单都能被翻译。
 *
 * 效率约束：人员/部门字典整个应用只拉取一次（Promise 缓存，失败允许重试），
 * 关联表单数据按 formCode 每次构建翻译器时拉取一次（同页共享），
 * 单元格渲染为 O(1) Map 查找，多值（逗号分隔 / JSON 数组）逐段翻译后拼接。
 */
import { h } from 'vue';
import { ElTag } from 'element-plus';
import { dataStatusBgColors, dataStatusColors, dataStatusLabels } from '@/constants';
import { findSystemDepartmentList, findSystemUserList } from '@/service';
import { findDynamicRelationDataList } from '@/service/api/dynamic/dynamic-common';

type DictMap = Map<string, string>;

/**
 * 从表单 metaData 收集字段组件清单（公共入口）。
 *
 * 优先读 metaData.inputComponents（历史设计器物化形态）；缺失或为空时深度遍历
 * metaData.schemas，收集所有带 field 的组件（含 sub-table 行内字段）。归一化输出
 * type/field/props/componentProps，屏蔽两种存储形态的差异。
 */
export function collectFormComponents(metaData: any): any[] {
  const materialized = metaData?.inputComponents;
  if (Array.isArray(materialized) && materialized.length > 0) {
    return materialized;
  }
  const out: any[] = [];
  const seen = new Set<string>();
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const field = typeof node.field === 'string' ? node.field : '';
    const type = typeof node.type === 'string' ? node.type : '';
    if (field && type && !seen.has(field)) {
      seen.add(field);
      out.push({
        type,
        field,
        props: node.props ?? {},
        componentProps: node.componentProps ?? node.props ?? {}
      });
    }
    if (Array.isArray(node.children)) node.children.forEach(visit);
  };
  visit(metaData?.schemas);
  return out;
}

/** 兼容后端 TableResult 的 list / rows / records 三种列表字段 */
function pickPageRows(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return (data.list || data.rows || data.records || []) as any[];
}

let userDictPromise: Promise<DictMap> | null = null;

/** 用户字典（id → 昵称/登录名），全应用共享一份 */
export function loadUserDict(): Promise<DictMap> {
  if (!userDictPromise) {
    userDictPromise = findSystemUserList({ pageNum: 1, pageSize: 9999, keywords: [] } as any)
      .then(res => {
        const map: DictMap = new Map();
        pickPageRows(res.data).forEach((u: any) => map.set(String(u.id), String(u.nickName || u.loginName || u.id)));
        return map;
      })
      .catch(() => {
        // 失败清缓存，下次构建翻译器时重试
        userDictPromise = null;
        return new Map();
      });
  }
  return userDictPromise;
}

let deptDictPromise: Promise<DictMap> | null = null;

/** 部门字典（id → 名称），全应用共享一份 */
export function loadDeptDict(): Promise<DictMap> {
  if (!deptDictPromise) {
    deptDictPromise = findSystemDepartmentList({ pageNum: 1, pageSize: 9999 } as any)
      .then(res => {
        const map: DictMap = new Map();
        pickPageRows(res.data).forEach((d: any) => map.set(String(d.id), String(d.deptName || d.id)));
        return map;
      })
      .catch(() => {
        deptDictPromise = null;
        return new Map();
      });
  }
  return deptDictPromise;
}

/** 关联表单组件 schema 里的 relation 配置（props/componentProps 两种键都兜）；无 formCode 视为未配置 */
export function pickRelation(comp: any): { formCode: string; displayField?: string } | null {
  const relation = comp?.relation ?? comp?.props?.relation ?? comp?.componentProps?.relation;
  if (!relation?.formCode) return null;
  return relation;
}

/** 字段名取记录值的三级回退：原值 → 驼峰转下划线 → 下划线转驼峰（metaData 字段与数据列名不一致） */
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
 * 拉取关联表单的记录行（按 formCode 去重，每次构建拉一次）。
 * 各列的显示字段（displayField）可能不同，所以缓存原始行、由翻译器各自建 id→文案 映射。
 * 走关联显示数据接口：有本表单（fromTableCode）权限即可读被关联表的显示字段，
 * 后端按关联配置收敛返回列，不再需要被关联表的 list 按钮权限。
 */
async function loadRelationRows(
  formCodes: string[],
  fromTableCode?: string
): Promise<Map<string, Record<string, any>[]>> {
  const unique = [...new Set(formCodes.filter(Boolean))];
  const maps = new Map<string, Record<string, any>[]>();
  await Promise.all(
    unique.map(async formCode => {
      try {
        const res = await findDynamicRelationDataList({
          tableCode: formCode,
          fromTableCode,
          pageNum: 1,
          pageSize: 9999
        });
        maps.set(formCode, pickPageRows(res.data));
      } catch {
        maps.set(formCode, []);
      }
    })
  );
  return maps;
}

/** 由关联表单记录行构建 id → 显示文案 映射（displayField 兼容驼峰/下划线，回退数据标题） */
function buildRelationTitleMap(rows: Record<string, any>[], displayField?: string): DictMap {
  const map: DictMap = new Map();
  rows.forEach(row => {
    let label = displayField ? pickRecordValue(row, displayField) : undefined;
    if (label === undefined || label === null || label === '') {
      label = pickRecordValue(row, 'title');
    }
    map.set(String(row.id), String(label ?? row.id));
  });
  return map;
}

/** 单元格翻译结果：纯文本或已渲染好的 VNode（状态标签） */
export type FieldCell = string | ReturnType<typeof h>;

/** 列翻译器：输入单元格存储值，输出展示内容 */
export type FieldTranslator = (value: any) => FieldCell;

/** 组件类型 → 字典加载器（需要远程字典的组件族） */
const REMOTE_DICT_COMPONENTS: Record<string, () => Promise<DictMap>> = {
  'user-select': loadUserDict,
  'user-multi-select': loadUserDict,
  'dept-select': loadDeptDict,
  'dept-multi-select': loadDeptDict
};

/** 关联表单组件族：值=记录 id，需要按关联表单拉数据建标题映射 */
const RELATION_COMPONENTS = new Set(['relation-attr', 'relation-backfill']);

/** 选项类组件：options 来自表单设计器配置，label/value 结构 */
const OPTION_COMPONENTS = new Set(['select', 'radio', 'checkbox', 'cascader']);

/**
 * 多值拆分：兼容四种入库格式
 * 1. 统一信封 `{"v":["NBTB"],"src":{...}}`（后端开启 dynamic.json-value-protocol 后的新写入形态）
 * 2. 裸 JSON 数组 `["a","b"]`（历史多选/附件写法）
 * 3. 逗号分隔 `a,b`
 * 4. 裸值 `abc`
 * 读取端必须无条件兼容全部形态，写入端才能安全地按开关切换协议。
 */
function splitMultiValue(value: any): string[] {
  if (value === null || value === undefined || value === '') return [];
  if (Array.isArray(value)) return value.map(v => String(v));
  const raw = typeof value === 'string' ? value.trim() : String(value);

  if (raw.startsWith('{')) {
    try {
      const obj = JSON.parse(raw);
      if (obj && Array.isArray(obj.v)) return obj.v.map((v: unknown) => String(v));
    } catch {
      /* 非信封的对象快照按整体展示，不当多值拆 */
      return [raw];
    }
  }

  if (/^\[.*\]$/.test(raw)) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.map(v => String(v));
    } catch {
      /* 非法 JSON 按普通字符串处理 */
    }
  }
  // 分隔符集合与后端 JsonValueCodec 一致（英文逗号/分号 + 中文逗号/分号），
  // 少认一种会让同一份数据在列表与导入导出里显示不一致
  return raw
    .split(/[,;，；]/)
    .map(s => s.trim())
    .filter(Boolean);
}

/** options 键归一：value 可能是数字/字符串，统一字符串键 */
function buildOptionMap(options: any[] | undefined): DictMap {
  const map: DictMap = new Map();
  (options ?? []).forEach(opt => {
    if (!opt || opt.value === undefined || opt.value === null) return;
    map.set(String(opt.value), String(opt.label ?? opt.value));
  });
  return map;
}

/** 单值翻译；映射缺失时显示原值（历史裸值兜底） */
function mapSingle(map: DictMap, value: any): string {
  const key = String(value);
  return map.get(key) ?? key;
}

/** 开关列：ON/OFF 值是布尔/0-1 时翻译成 是/否；自定义文案值（如"启用"）本身可读则原样返回 */
function translateSwitch(value: any, checkedValue: any, uncheckedValue: any): string {
  if (value === null || value === undefined || value === '') return '';
  if (isBoolLike(checkedValue) || isBoolLike(uncheckedValue) || isBoolLike(value)) {
    const on = checkedValue !== undefined && checkedValue !== null ? checkedValue : 1;
    const off = uncheckedValue !== undefined && uncheckedValue !== null ? uncheckedValue : 0;
    if (String(value) === String(on)) return '是';
    if (String(value) === String(off)) return '否';
  }
  return String(value);
}

function isBoolLike(v: any): boolean {
  return typeof v === 'boolean' || v === 0 || v === 1 || v === '0' || v === '1' || v === 'true' || v === 'false';
}

/** 工作流数据状态 → 彩色标签（与系统其他列表的状态标签同款配色） */
function translateDataStatus(value: any): FieldCell {
  const key = String(value ?? '');
  if (key === '') return '';
  const label = (dataStatusLabels as any)[key] ?? (dataStatusLabels as any)[Number(key)] ?? key;
  const color = (dataStatusColors as any)[key] ?? '#4E5969';
  const bg = (dataStatusBgColors as any)[key] ?? '#F2F3F5';
  return h(ElTag, { size: 'small', bordered: false, style: { color, backgroundColor: bg } }, { default: () => label });
}

/**
 * 为一个列表构建字段翻译器集合。
 * @param entries 列清单：filedCode + 对应表单组件（可空，系统列如 status 无组件）
 * @param fromTableCode 当前列表所属的表单编码，关联字段翻译按它取得被关联表的显示数据权限
 */
export async function createFieldTranslators(
  entries: Array<{ filedCode: string; comp: any | null }>,
  fromTableCode?: string
): Promise<Record<string, FieldTranslator>> {
  // 需要的远程字典先去重并发拉取（缓存命中时为空转）
  const dictLoaders = new Set<() => Promise<DictMap>>();
  const relationCodes: string[] = [];
  const relationFields = new Map<string, { formCode: string; displayField?: string }>();
  entries.forEach(({ filedCode, comp }) => {
    const loader = comp && REMOTE_DICT_COMPONENTS[String(comp.type)];
    if (loader) dictLoaders.add(loader);
    if (comp && RELATION_COMPONENTS.has(String(comp.type))) {
      const relation = pickRelation(comp);
      if (relation?.formCode) {
        relationCodes.push(relation.formCode);
        relationFields.set(filedCode, relation);
      }
    }
  });
  // 字典缓存已在上面预热，这里并发取回结果，构建翻译器时不再在循环里 await
  const dictMaps = new Map<() => Promise<DictMap>, DictMap>();
  await Promise.all(
    [...dictLoaders].map(async loader => {
      dictMaps.set(loader, await loader());
    })
  );
  const relationRows = await loadRelationRows(relationCodes, fromTableCode);

  /** 单列翻译器：命中不了任何翻译规则时返回 null（该列按原值展示） */
  const buildTranslator = (filedCode: string, comp: any | null): FieldTranslator | null => {
    const type = String(comp?.type ?? '');
    if (filedCode === 'status') {
      return translateDataStatus;
    }
    const relation = relationFields.get(filedCode);
    if (relation && RELATION_COMPONENTS.has(type)) {
      const map = buildRelationTitleMap(relationRows.get(relation.formCode) ?? [], relation.displayField);
      return value => {
        if (value === null || value === undefined || value === '') return '';
        return splitMultiValue(value)
          .map(v => mapSingle(map, v))
          .join('、');
      };
    }
    const dictLoader = REMOTE_DICT_COMPONENTS[type];
    if (dictLoader) {
      // 缓存命中立即 resolve，闭包持有字典 Map，单元格渲染零异步
      const dict = dictMaps.get(dictLoader) ?? new Map<string, string>();
      return value => {
        if (value === null || value === undefined || value === '') return '';
        return splitMultiValue(value)
          .map(v => mapSingle(dict, v))
          .join('、');
      };
    }
    if (type === 'color-picker') {
      // 颜色字段：渲染成小色块（悬停显示原值），存储值为 #RRGGBB(AA) 可直接用作背景色
      return value => {
        const color = typeof value === 'string' ? value.trim() : '';
        if (!/^#[0-9a-f]{3,8}$/i.test(color)) {
          return color || '';
        }
        return h('span', {
          style: {
            background: color,
            border: '1px solid #e5e7eb',
            borderRadius: '3px',
            display: 'inline-block',
            height: '14px',
            verticalAlign: 'middle',
            width: '22px'
          },
          title: color
        });
      };
    }
    if (OPTION_COMPONENTS.has(type)) {
      const map = buildOptionMap(comp?.componentProps?.options);
      return value => {
        if (value === null || value === undefined || value === '') return '';
        return splitMultiValue(value)
          .map(v => mapSingle(map, v))
          .join('、');
      };
    }
    if (type === 'switch') {
      const checkedValue = comp?.componentProps?.checkedValue;
      const uncheckedValue = comp?.componentProps?.uncheckedValue;
      return value => translateSwitch(value, checkedValue, uncheckedValue);
    }
    return null;
  };

  const translators: Record<string, FieldTranslator> = {};
  entries.forEach(({ filedCode, comp }) => {
    const translator = buildTranslator(filedCode, comp);
    if (translator) translators[filedCode] = translator;
  });
  return translators;
}
