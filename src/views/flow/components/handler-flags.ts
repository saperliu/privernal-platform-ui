/**
 * 办理人标识（flow_node.permission_flag）编解码。
 *
 * 落库格式与后端同源：`类型:值`，多个用 `@@` 分隔
 * （FlowPermissionTypeEnum / FlowScriptRuleEnum，分隔符见 FlowConstant）。
 * 设计器侧只负责产出标识数组，拆解成具体人由引擎在创建任务时回调 convertPermissions 完成。
 */

export const PERMISSION_SEPARATOR = '@@';

export type HandlerKind = 'user' | 'dept' | 'deptLeader' | 'orgLeader' | 'role' | 'userGroup' | 'script' | 'raw';

/** 标识里出现的 id → 展示名，由调用方按已加载的组织数据提供，缺失时回退显示原始 id */
export interface HandlerNameMaps {
  users?: Record<string, string>;
  depts?: Record<string, string>;
  roles?: Record<string, string>;
  groups?: Record<string, string>;
  orgs?: Record<string, string>;
  /** 表单字段编码 → 组件标签 */
  formFields?: Record<string, string>;
}

/** 「人员部门控件」固定三项：运行时结合流程上下文取值，设计期没有具体 id */
export const CONTEXT_RULES: Array<{ code: string; label: string; desc: string; flag: string }> = [
  { code: 'INITIATOR', label: '发起人', desc: '流程发起人本人', flag: 'script:INITIATOR' },
  { code: 'INITIATOR_DEPT', label: '所属部门', desc: '发起人所属部门的全部成员', flag: 'script:INITIATOR_DEPT' },
  { code: 'DATA_OWNER', label: '拥有者', desc: '这条数据的创建人', flag: 'script:DATA_OWNER' }
];

/** 相对发起人/数据定位的常用规则：语义是经理或负责人，而不是本人或部门 */
export const COMMON_RULES: Array<{ label: string; desc: string; flag: string }> = [
  { label: '发起人的经理', desc: '发起人所属部门的经理', flag: 'script:INITIATOR_DEPT_LEADER' },
  { label: '发起人的组织负责人', desc: '发起人所属组织的负责人', flag: 'script:INITIATOR_ORG_LEADER' },
  { label: '数据所属部门的经理', desc: '按数据上的部门取经理', flag: 'script:DATA_DEPT_LEADER' }
];

/** 「业务逻辑查找」的两类函数（经理函数已按产品决策移除，不再产出 script:MANAGER） */
export const BUSINESS_FUNCTIONS = {
  LEVEL_MANAGER: 'LEVEL_MANAGER',
  DEPT_ROLE: 'DEPT_ROLE'
} as const;

/** 逐层经理查找可选层级（取第 N 级那一个部门的经理，不是逐级累加） */
export const LEVEL_OPTIONS = [1, 2, 3, 4, 5].map(level => ({ label: `向上第 ${level} 级`, value: level }));

/** 函数锚点类型：发起人 / 指定部门 / 指定人员 */
export type AnchorType = 'initiator' | 'user' | 'dept';

export function splitFlags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }
  if (!value) return [];
  return String(value)
    .split(PERMISSION_SEPARATOR)
    .map(item => item.trim())
    .filter(Boolean);
}

export function joinFlags(flags: string[]): string {
  return flags.filter(Boolean).join(PERMISSION_SEPARATOR);
}

/** 锚点的标识片段：initiator | user:{id} | dept:{id} */
function anchorPart(anchorType: AnchorType, anchorId?: string): string {
  if (anchorType === 'dept' && anchorId) {
    return `dept:${anchorId}`;
  }
  if (anchorType === 'user' && anchorId) {
    return `user:${anchorId}`;
  }
  return 'initiator';
}

/** 逐层经理查找：从锚点部门向上数 N 级，取那一个部门的经理（A→1级=B、2级=C） */
export function buildLevelManagerFlag(anchorType: AnchorType, anchorId: string | undefined, level: number): string {
  return `script:LEVEL_MANAGER:${anchorPart(anchorType, anchorId)}:${level}`;
}

/** 部门角色查找：锚点部门内持有指定角色的成员 */
export function buildDeptRoleFlag(anchorType: AnchorType, anchorId: string | undefined, roleId: string): string {
  return `script:DEPT_ROLE:${anchorPart(anchorType, anchorId)}:${roleId}`;
}

/** 表单人员组件选出的人 */
export function buildFormFieldUserFlag(field: string): string {
  return `script:FORM_FIELD_USER:${field}`;
}

/** 表单部门组件选出的部门下的全员 */
export function buildFormFieldDeptFlag(field: string): string {
  return `script:FORM_FIELD_DEPT:${field}`;
}

function pick(map: Record<string, string> | undefined, key: string, fallbackPrefix: string): string {
  return (map && map[key]) || `${fallbackPrefix}#${key}`;
}

/**
 * 单个标识 → 可读文案。未知前缀（历史裸值/表达式产物）原样显示，
 * 让配置者看得见而不是静默丢掉一条已存在的办理人。
 */
export function describeFlag(flag: string, names: HandlerNameMaps = {}): { label: string; kind: HandlerKind } {
  const sep = flag.indexOf(':');
  const type = sep < 0 ? '' : flag.slice(0, sep);
  const value = sep < 0 ? flag : flag.slice(sep + 1);
  switch (type) {
    case 'user':
      return { label: pick(names.users, value, '人员'), kind: 'user' };
    case 'dept':
      return { label: `${pick(names.depts, value, '部门')}（部门全员）`, kind: 'dept' };
    case 'deptLeader':
      return { label: `${pick(names.depts, value, '部门')} 的经理`, kind: 'deptLeader' };
    case 'orgLeader':
      return { label: `${pick(names.orgs, value, '组织')} 的负责人`, kind: 'orgLeader' };
    case 'role':
      return { label: `${pick(names.roles, value, '角色')}（角色成员）`, kind: 'role' };
    case 'userGroup':
      return { label: `${pick(names.groups, value, '用户组')}（用户组）`, kind: 'userGroup' };
    case 'script':
      return { label: describeScript(value, names), kind: 'script' };
    default:
      return { label: flag, kind: 'raw' };
  }
}

function describeScript(value: string, names: HandlerNameMaps): string {
  const sep = value.indexOf(':');
  const code = sep < 0 ? value : value.slice(0, sep);
  const arg = sep < 0 ? '' : value.slice(sep + 1);
  const context = CONTEXT_RULES.find(item => item.code === code);
  if (context) {
    return context.label;
  }
  const common = COMMON_RULES.find(item => item.flag === value);
  if (common) {
    return common.label;
  }
  switch (code) {
    case 'LEVEL_MANAGER': {
      const last = arg.lastIndexOf(':');
      const level = last < 0 ? '' : arg.slice(last + 1);
      return `逐层经理查找·${describeAnchor(last < 0 ? arg : arg.slice(0, last), names)}${level ? ` 向上第 ${level} 级` : ''}`;
    }
    case 'DEPT_ROLE': {
      const last = arg.lastIndexOf(':');
      const roleId = last < 0 ? '' : arg.slice(last + 1);
      const anchorLabel = describeAnchor(last < 0 ? arg : arg.slice(0, last), names);
      return `${anchorLabel}的${pick(names.roles, roleId, '角色')}`;
    }
    case 'FORM_FIELD_USER':
      return `${fieldLabel(names, arg)}（表单人员）`;
    case 'FORM_FIELD_DEPT':
      return `${fieldLabel(names, arg)}（表单部门）`;
    case 'FORM_FIELD_ROLE':
      return `${fieldLabel(names, arg)}（表单角色）`;
    default:
      return `未知规则 ${value}`;
  }
}

function fieldLabel(names: HandlerNameMaps, field: string): string {
  return names.formFields?.[field] || field;
}

function describeAnchor(arg: string, names: HandlerNameMaps): string {
  if (!arg || arg === 'initiator') {
    return '发起人';
  }
  const sep = arg.indexOf(':');
  const type = sep < 0 ? arg : arg.slice(0, sep);
  const id = sep < 0 ? '' : arg.slice(sep + 1);
  if (type === 'dept') {
    return pick(names.depts, id, '部门');
  }
  if (type === 'user') {
    return pick(names.users, id, '人员');
  }
  return arg;
}

export function describeFlags(
  flags: string[],
  names: HandlerNameMaps = {}
): Array<{ flag: string; label: string; kind: HandlerKind }> {
  return splitFlags(flags).map(flag => ({ flag, ...describeFlag(flag, names) }));
}
