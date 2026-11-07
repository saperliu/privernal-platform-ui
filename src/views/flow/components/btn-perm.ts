import { ref } from 'vue';
import { findFlowFormVersionDetail, findFlowFormVersionList } from '@/service';

/**
 * 流程表单按钮配置（flow_form_btn_perm，随 flow_form_version 版本维护）消费工具：
 * 待办操作列 / 表单创建弹窗按配置渲染按钮（btnCode/btnName/isShow/showDialog），
 * 未配置时调用方回退到内置按钮集合。
 */

export interface BtnPermItem {
  btnCode: string;
  btnName?: string;
  aliasName?: string;
  /** 是否显示 0否 1是 */
  isShow?: number;
  /** 是否显示确认弹窗（填审批意见） 0否 1是 */
  showDialog?: number;
  color?: string;
  nodeCode: string;
  sort?: number;
}

/** flowCode → 当前生效版本的按钮配置缓存 */
const btnPermCache = new Map<string, BtnPermItem[]>();

const inflight = new Map<string, Promise<BtnPermItem[]>>();

/**
 * 加载流程按钮配置（当前生效版本：currentFlag=Y 优先，其次已发布，否则第一条），
 * 结果按 flowCode 缓存；失败返回空数组（调用方回退内置按钮）
 */
export async function loadBtnPermConfig(flowCode: string): Promise<BtnPermItem[]> {
  if (!flowCode) return [];
  const cached = btnPermCache.get(flowCode);
  if (cached) return cached;
  const pending = inflight.get(flowCode);
  if (pending) return pending;
  const task = (async () => {
    try {
      const { data, error } = await findFlowFormVersionList({ flowCode });
      const versions = error === null ? (data ?? []) : [];
      if (!versions.length) {
        btnPermCache.set(flowCode, []);
        return [] as BtnPermItem[];
      }
      const current =
        versions.find(item => item.currentFlag === 'Y') ??
        versions.find(item => item.publishStatus === 1) ??
        versions[0];
      const detail = await findFlowFormVersionDetail(current.id);
      const list = (detail.data?.btnPermList ?? []) as BtnPermItem[];
      btnPermCache.set(flowCode, list);
      return list;
    } catch {
      return [] as BtnPermItem[];
    } finally {
      inflight.delete(flowCode);
    }
  })();
  inflight.set(flowCode, task);
  return task;
}

/** 清除配置缓存（配置保存后刷新用） */
export function clearBtnPermCache(flowCode?: string) {
  if (flowCode) btnPermCache.delete(flowCode);
  else btnPermCache.clear();
}

/**
 * 内置按钮全集：编码为唯一真源，与后端 FlowFormBtnEnum 一一对应。
 * 设计器节点属性「流程按钮」、待办操作列、表单创建按钮、运行时按钮权限都以此为准，
 * 历史数据里的 APPROVE / SIGN / TURNOVER 等写法通过 btnCodeAliases 归一后命中。
 */
export type BtnScope = 'form' | 'task' | 'instance';

export interface BtnDef {
  /** 规范编码（小驼峰） */
  code: string;
  /** 默认中文名 */
  name: string;
  /** 生效位置：form 表单弹窗 / task 待办操作列 / instance 实例（我发起的） */
  scope: BtnScope;
  /** 该按钮是否支持「意见弹窗」配置 */
  dialog?: boolean;
}

export const BUILTIN_BTNS: BtnDef[] = [
  { code: 'save', name: '保存', scope: 'form' },
  { code: 'viewForm', name: '申请单', scope: 'task' },
  { code: 'approve', name: '通过', scope: 'task', dialog: true },
  { code: 'reject', name: '驳回', scope: 'task', dialog: true },
  { code: 'transfer', name: '转办', scope: 'task', dialog: true },
  { code: 'delegate', name: '委派', scope: 'task', dialog: true },
  { code: 'addSign', name: '加签', scope: 'task', dialog: true },
  { code: 'reduceSign', name: '减签', scope: 'task', dialog: true },
  { code: 'jump', name: '跳转', scope: 'task', dialog: true },
  { code: 'terminate', name: '终止', scope: 'instance' },
  { code: 'revoke', name: '撤销', scope: 'instance' }
];

/** 未显式配置时的默认可见按钮：表单保存 + 全部任务级操作（与后端 DEFAULT_SHOW_BTNS 对齐） */
export function defaultBtnVisible(code: string): boolean {
  const def = btnDef(code);
  return def !== undefined && (def.scope === 'task' || def.code === 'save');
}

const builtinByNormalized = new Map<string, string>(BUILTIN_BTNS.map(def => [normalizeBtnCode(def.code), def.code]));

/** 内置按钮定义，未知编码返回 undefined */
export function btnDef(code: string): BtnDef | undefined {
  return BUILTIN_BTNS.find(def => def.code === canonicalBtnCode(code));
}

/**
 * 按钮编码 → 中文名。配置里 btnName/aliasName 可能直接存了英文编码
 * （后端内置按钮枚举的 aliasName 就是编码本身），这里兜一层保证操作列不出现英文。
 */
const btnCodeLabels: Record<string, string> = Object.fromEntries(
  BUILTIN_BTNS.map(def => [normalizeBtnCode(def.code), def.name])
);

/** 编码归一：小写并去掉下划线/中划线/空格，approve / APPROVE / add_sign / ADD-SIGN 都能对上 */
export function normalizeBtnCode(btnCode: string): string {
  return String(btnCode || '')
    .toLowerCase()
    .replace(/[_\s-]/g, '');
}

/** 已知编码的中文名，未知返回空串 */
export function btnCodeLabel(btnCode: string): string {
  return btnCodeLabels[normalizeBtnCode(btnCode)] ?? btnCodeLabels[canonicalBtnCode(btnCode)] ?? '';
}

/** 历史/其他模块的写法 → 规范编码（旧 wfs 大写码、设计器面板旧集合、warm-flow 语义同义词） */
const btnCodeAliases: Record<string, string> = {
  pass: 'approve',
  agree: 'approve',
  audit: 'approve',
  detail: 'viewForm',
  view: 'viewForm',
  applyform: 'viewForm',
  disapprove: 'reject',
  back: 'reject',
  rollback: 'reject',
  turnover: 'transfer',
  assign: 'transfer',
  delegation: 'delegate',
  sign: 'addSign',
  add: 'addSign',
  unsign: 'reduceSign',
  cancel: 'revoke',
  undo: 'revoke',
  staging: 'save',
  draft: 'save',
  submit: 'save'
};

/** 编码归一为规范写法：未知编码保留归一化结果，便于自定义按钮按原值匹配 */
export function canonicalBtnCode(btnCode: string): string {
  const normalized = normalizeBtnCode(btnCode);
  return builtinByNormalized.get(normalized) ?? btnCodeAliases[normalized] ?? normalized;
}

/** 是否命中给定按钮（大小写/下划线/历史别名都算命中） */
export function matchBtn(btnCode: string, ...codes: string[]): boolean {
  const canonical = canonicalBtnCode(btnCode);
  return codes.some(code => canonicalBtnCode(code) === canonical);
}

/**
 * 取节点的可见按钮：global 全局按钮 + 节点自己的按钮，isShow=1，按 sort 排序。
 * nodeCode 传空（如表单创建场景）时只返回 global。
 * 同一按钮（历史大写码/别名归一后算同一个）节点配置覆盖全局配置，只保留一条。
 */
export function visibleBtnPerms(list: BtnPermItem[], nodeCode?: string): BtnPermItem[] {
  const isGlobalRow = (item: BtnPermItem) => !item.nodeCode || item.nodeCode === 'global';
  const byCode = new Map<string, BtnPermItem>();
  list
    .filter(item => item.isShow === 1)
    .forEach(item => {
      const isGlobal = isGlobalRow(item);
      if (!isGlobal && !(nodeCode && item.nodeCode === nodeCode)) return;
      const key = canonicalBtnCode(item.btnCode);
      const prev = byCode.get(key);
      if (prev && !isGlobalRow(prev) && isGlobal) return;
      byCode.set(key, item);
    });
  return [...byCode.values()].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

/** 文案含中文才算运营者自定义的名字，否则视为回填的英文编码 */
function isLabel(text?: string): text is string {
  return text !== undefined && text !== '' && /[\u4E00-\u9FA5]/.test(text);
}

/**
 * 按钮颜色：只认 CSS 颜色（配置面板存的是 hex）。
 * 后端内置枚举回填的是 primary/danger/warning 这类语义字，直接当颜色用会渲染出透明按钮。
 */
export function hexBtnColor(color?: string | null): string | undefined {
  return color && /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i.test(color) ? color : undefined;
}

/**
 * 未配置颜色时的默认按钮色（与按钮语义一致）：配置面板色块、待办操作列、表单创建按钮共用，
 * 保证「未配置/清除颜色」三处回退一致，不会出现透明色块。
 */
export const BTN_DEFAULT_COLORS: Record<string, string> = {
  approve: '#18a058',
  reject: '#d03050',
  transfer: '#2080f0',
  delegate: '#2080f0',
  addSign: '#f0a020',
  reduceSign: '#f0a020',
  jump: '#2080f0'
};

/** 按钮最终颜色：显式配置的合法颜色 > 按钮语义默认色 > undefined（调用方回退主题色） */
export function btnColorOf(btnCode: string, color?: string | null): string | undefined {
  return hexBtnColor(color) ?? BTN_DEFAULT_COLORS[canonicalBtnCode(btnCode)];
}

/** 按钮显示文案：中文别名 > 中文名称 > 编码内置中文名 > 原始编码 */
export function btnPermLabel(item: BtnPermItem): string {
  if (isLabel(item.aliasName)) return item.aliasName;
  if (isLabel(item.btnName)) return item.btnName;
  return btnCodeLabel(item.btnCode) || item.btnCode;
}

/**
 * 按钮是否可见：未配置（老流程/未初始化草稿）时按内置默认可见处理，
 * 已有配置则严格取 global + 当前节点的可见行（isShow=1）。
 */
export function isBtnVisible(config: BtnPermItem[] | undefined, nodeCode: string | undefined, code: string): boolean {
  if (!config?.length) return true;
  return visibleBtnPerms(config, nodeCode).some(item => canonicalBtnCode(item.btnCode) === code);
}

/**
 * 流程列表按页加载按钮配置的响应式缓存（待办/已办/我发起的共用）：
 * 列表刷新后按行内出现过的 flowCode 批量拉取，并触发操作列重新求值。
 */
export function useFlowBtnPerms() {
  const byFlow = ref<Map<string, BtnPermItem[]>>(new Map());

  async function reload(rows: Array<{ flowCode?: string }>) {
    const flowCodes = [...new Set(rows.map(row => row.flowCode).filter(Boolean))] as string[];
    await Promise.all(
      flowCodes.map(async code => {
        byFlow.value.set(code, await loadBtnPermConfig(code));
      })
    );
    // Map 内容变更不触发响应，换引用让操作列重新求值
    byFlow.value = new Map(byFlow.value);
  }

  return { byFlow, reload };
}
