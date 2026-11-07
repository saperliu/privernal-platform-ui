/**
 * 自定义页面数据 API（pageApi）构造器
 *
 * pageApi 是自定义页面访问业务数据的唯一通道，全部转发到现有动态表 CRUD 接口
 * （src/service/api/dynamic/dynamic-common.ts）——后端既有链路自带参数绑定、标识符
 * 白名单、权限校验（DynamicTableAuthUtil）、backScript/流程/子表收敛逻辑，自定义页
 * 面不产生任何新的 SQL 面。
 *
 * 按钮/数据权限口径与默认列表页一致（dynamic:{tableCode}:*，见 useAuth().hasAuth），
 * 通过 perm 标志下发，自定义页据此显隐自己的按钮。
 */
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  delDynamicFormData,
  findDynamicFormData,
  findDynamicFormDataList,
  findDynamicRelationDataList,
  saveDynamicFormData,
  startDynamicDataFlow
} from '@/service/api/dynamic/dynamic-common';
import { useAuth } from '@/hooks';
import type { FieldTranslator } from '@/components/business/field-translate';
import { collectFormComponents, createFieldTranslators } from '@/components/business/field-translate';

/** 归一化字段元数据（自定义页面模板的主要输入） */
export interface CustomViewField {
  /** 字段编码=物理列名（保存链 normalizeFormFieldCodes 已归一，读写数据键一致） */
  code: string;
  label: string;
  /** 表单组件类型：input/select/date-picker/input-number/switch/sub-table… */
  type: string;
  required: boolean;
  /** 选项类组件的 options（label/value），其余类型为空数组 */
  options: Array<{ label?: string; value?: string | number }>;
}

/** 按钮/数据权限标志，口径同默认列表页的操作列 */
export interface CustomViewPerm {
  /** dynamic:{tableCode}:list */
  list: boolean;
  /** dynamic:{tableCode}:add */
  add: boolean;
  /** dynamic:{tableCode}:edit（编辑与发起/重启流程同口径） */
  edit: boolean;
  /** dynamic:{tableCode}:remove */
  remove: boolean;
  /** dynamic:{tableCode}:import */
  import: boolean;
  /** dynamic:{tableCode}:export */
  export: boolean;
}

/** 列配置行（dynamic_form_column 记录），列表页按 showList/showQuery 消费 */
export interface CustomViewColumn {
  id?: string;
  filedCode: string;
  filedName?: string;
  filedType?: string;
  showList?: number;
  showQuery?: number;
  orderDir?: string;
  queryDefaultValue?: unknown;
  [key: string]: unknown;
}

/** 查询返回的统一形状（rows/total 已从后端分页信封解包） */
export interface CustomViewListResult<T = Record<string, any>> {
  rows: T[];
  total: number;
}

export interface CustomViewPageApi {
  tableCode: string;
  formName: string;
  /** 归一化字段清单（来自表单设计器的字段定义，即"绑定的数据库表"的列元数据） */
  fields: CustomViewField[];
  perm: CustomViewPerm;
  /**
   * 分页查询：params = { pageNum, pageSize, ...列编码条件, orderBys?, keyword? }
   * 条件值全部经后端参数绑定执行（SafeConditionFragment），列编码不在表定义中的会被后端剔除
   */
  list(params: Record<string, any>): Promise<CustomViewListResult>;
  get(id: string): Promise<Record<string, any>>;
  /** 保存（带 id 即更新）；后端保存链（唯一性校验/backScript/子表拆写/自动发起流程）原样生效 */
  save(data: Record<string, any>): Promise<void>;
  /** 仅落数据不发起流程（startFlow=false），同默认弹窗的「保存草稿」 */
  saveDraft(data: Record<string, any>): Promise<void>;
  remove(id: string): Promise<void>;
  /** 草稿数据按表单绑定流程发起 */
  startFlow(id: string): Promise<void>;
  /** 关联表单显示数据（只读，fromTableCode 自动带上本表单） */
  relationList(params: Record<string, any>): Promise<CustomViewListResult>;
  /** 字段值翻译器（字典/人员/部门/关联/开关/状态），返回 string 或 VNode（渲染函数组件可直接 :is） */
  createTranslators(): Promise<Record<string, FieldTranslator>>;
  message: typeof ElMessage;
  confirm: (typeof ElMessageBox)['confirm'];
  /** 打开默认新增弹窗（自定义编辑页启用时弹窗内自动换自定义渲染） */
  openAdd(): void;
  openEdit(row: Record<string, any>): void;
  openView(row: Record<string, any>): void;
  /** 通知宿主页面刷新数据（默认列表模式下触发原列表查询） */
  refresh(): void;
}

/** 把 request 信封的 error 转成异常：自定义页用 try/catch 控制流 */
function unwrapError(error: unknown): Error {
  if (error === null || error === undefined) return new Error('请求失败');
  if (typeof error === 'string') return new Error(error);
  const msg = (error as any)?.message ?? (error as any)?.msg ?? (error as any)?.error;
  return new Error(String(msg ?? JSON.stringify(error)));
}

function pickPageRows(data: any): Record<string, any>[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Record<string, any>[];
  return ((data as any).list ?? (data as any).rows ?? (data as any).records ?? []) as Record<string, any>[];
}

function pickPageTotal(data: any): number {
  if (!data || Array.isArray(data)) return pickPageRows(data).length;
  return Number((data as any).total ?? (data as any).itemCount ?? pickPageRows(data).length);
}

/**
 * 画布 schemas 节点的 label 在顶层（node.label="工号"），props 只承载 maxlength/options 等
 * 组件属性——collectFormComponents 不保留顶层 label，这里按 field 深度补收一份。
 */
/** 供设计面板字段下拉复用的顶层 label 收集 */
export function collectFieldLabels(metaData: unknown): Map<string, string> {
  const map = new Map<string, string>();
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const record = node as Record<string, unknown>;
    if (typeof record.field === 'string' && typeof record.label === 'string' && record.label.trim()) {
      map.set(record.field, record.label.trim());
    }
    Object.values(record).forEach(visit);
  };
  visit((metaData as any)?.schemas);
  return map;
}

/**
 * 从 metaData 归一化字段清单：字段编码/名称/类型/必填/选项（子表行内字段平铺给出，值整体是 JSON 列）。
 * 刻意只传 schemas 给 collectFormComponents：metaData.inputComponents 是精简物化形态
 * （props 只剩 type/options 等建列所需键，label 缺失），完整 label 在画布 schemas 里。
 */
export function normalizeCustomViewFields(metaData: unknown): CustomViewField[] {
  const comps = collectFormComponents({ schemas: (metaData as any)?.schemas });
  const labelMap = collectFieldLabels(metaData);
  return comps.map(comp => {
    const props = (comp as any).props ?? {};
    const componentProps = (comp as any).componentProps ?? props;
    return {
      code: String((comp as any).field ?? ''),
      label: String(
        labelMap.get(String((comp as any).field ?? '')) ??
          props.label ??
          props.title ??
          componentProps.label ??
          (comp as any).field ??
          ''
      ),
      type: String((comp as any).type ?? ''),
      required: props.required === true || props.required === 'true',
      options: Array.isArray(componentProps.options) ? componentProps.options : []
    };
  });
}

export interface BuildCustomViewPageApiOptions {
  tableCode: string;
  formName?: string;
  metaData?: unknown;
  actions?: {
    openAdd?: () => void;
    openEdit?: (row: Record<string, any>) => void;
    openView?: (row: Record<string, any>) => void;
    refresh?: () => void;
  };
}

export function buildCustomViewPageApi(options: BuildCustomViewPageApiOptions): CustomViewPageApi {
  const { tableCode, metaData, actions = {} } = options;
  const { hasAuth } = useAuth();
  const perm: CustomViewPerm = {
    list: hasAuth(`dynamic:${tableCode}:list`),
    add: hasAuth(`dynamic:${tableCode}:add`),
    edit: hasAuth(`dynamic:${tableCode}:edit`),
    remove: hasAuth(`dynamic:${tableCode}:remove`),
    import: hasAuth(`dynamic:${tableCode}:import`),
    export: hasAuth(`dynamic:${tableCode}:export`)
  };
  const fields = normalizeCustomViewFields(metaData);
  const noAction = () => undefined;
  // 翻译器按需构建一次（内部已含字典/关联数据的请求缓存）
  let translatorsPromise: Promise<Record<string, FieldTranslator>> | null = null;

  return {
    tableCode,
    formName: options.formName ?? '',
    fields,
    perm,
    async list(params: Record<string, any>) {
      const res = await findDynamicFormDataList({ tableCode, ...params } as any);
      if (res.error !== null) throw unwrapError(res.error);
      return { rows: pickPageRows(res.data), total: pickPageTotal(res.data) };
    },
    async get(id: string) {
      const res = await findDynamicFormData(id, tableCode);
      if (res.error !== null) throw unwrapError(res.error);
      return (res.data ?? {}) as Record<string, any>;
    },
    async save(data: Record<string, any>) {
      const res = await saveDynamicFormData({ tableCode, ...data });
      if (res.error !== null) throw unwrapError(res.error);
    },
    async saveDraft(data: Record<string, any>) {
      const res = await saveDynamicFormData({ tableCode, startFlow: false, ...data });
      if (res.error !== null) throw unwrapError(res.error);
    },
    async remove(id: string) {
      const res = await delDynamicFormData(id, tableCode);
      if (res.error !== null) throw unwrapError(res.error);
    },
    async startFlow(id: string) {
      const res = await startDynamicDataFlow(tableCode, id);
      if (res.error !== null) throw unwrapError(res.error);
    },
    async relationList(params: Record<string, any>) {
      const res = await findDynamicRelationDataList({ fromTableCode: tableCode, ...params });
      if (res.error !== null) throw unwrapError(res.error);
      return { rows: pickPageRows(res.data), total: pickPageTotal(res.data) };
    },
    createTranslators() {
      if (!translatorsPromise) {
        // 与 normalizeCustomViewFields 同口径走 schemas 全量 props（options/relation 完整）
        const comps = collectFormComponents({ schemas: (metaData as any)?.schemas });
        translatorsPromise = createFieldTranslators(
          comps.map(comp => ({ filedCode: String((comp as any).field ?? ''), comp })),
          tableCode
        );
      }
      return translatorsPromise;
    },
    message: ElMessage,
    confirm: ElMessageBox.confirm as unknown as (typeof ElMessageBox)['confirm'],
    openAdd: actions.openAdd ?? noAction,
    openEdit: actions.openEdit ?? noAction,
    openView: actions.openView ?? noAction,
    refresh: actions.refresh ?? noAction
  };
}
