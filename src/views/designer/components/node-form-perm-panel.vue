<script setup lang="tsx">
/**
 * 节点属性扩展面板（挂在 warm-flow 设计器 node-form-extra 插槽）
 *  - 抄送节点（ext.nodeKind=cc）：仅「抄送人员」，其余分区隐藏
 *  - 审批节点：按设置内容分成顶部页签——办理人 / 规则（节点流转规则+超时+节点规则）/ 表单权限（字段 可见/编辑/必填）/ 流程按钮
 *    协作方式在设计器侧固定为票签（选择卡片已移除），票签策略/策略值/驳回目标在本面板「节点流转规则」区维护
 *  - 开始/结束/网关节点：不渲染本面板（属性抽屉只保留节点编码/名称）
 * 人员/超时/节点规则/流转规则直接写节点 permissionFlag/ext/nodeRatio/anyNodeSkip，随设计器保存链路落库；
 * 字段/按钮权限持久化到 flow_form_version 草稿按节点合并
 */
import { computed, ref, watch } from 'vue';
import type { PropType } from 'vue';
import {
  findDynamicFormByCode,
  findDynamicFormColumnList,
  findFlowFormVersionDetail,
  findFlowFormVersionList,
  findSystemDepartmentList,
  findSystemRoleList,
  findSystemUserGroupList,
  findSystemUserList,
  initFlowFormVersion,
  saveFlowFormVersion
} from '@/service';
import HandlerSelectModal from '@/views/flow/components/handler-select-modal.vue';
import { type HandlerNameMaps, describeFlags } from '@/views/flow/components/handler-flags';
import {
  BUILTIN_BTNS,
  type BtnScope,
  btnColorOf,
  canonicalBtnCode,
  clearBtnPermCache,
  defaultBtnVisible
} from '@/views/flow/components/btn-perm';

defineOptions({ name: 'NodeFormPermPanel' });

const props = defineProps({
  /** node-form-extra 插槽作用域：节点表单数据 */
  form: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  },
  /** 表单编码（定位字段全集） */
  tableCode: {
    type: String,
    default: ''
  },
  /** 流程编码（定位配置版本） */
  flowCode: {
    type: String,
    default: ''
  },
  /** 画布节点列表（插槽作用域透传，供「驳回到指定节点」下拉；已排除开始/网关/抄送/自身） */
  nodes: {
    type: Array as PropType<Record<string, any>[]>,
    default: () => []
  }
});
/** ===== 节点类别判定 ===== */
// 抄送节点也是 between 类型；开始/结束/网关不渲染面板内容
const isBetweenNode = computed(() => props.form?.nodeType === 'between');

/** 读写节点 ext：设计器保存时把 properties.ext 序列化为 [{code,value}] 字符串落库，回显兼容字符串/数组/对象 */
const EXT_NODE_KIND = 'nodeKind';
const EXT_NO_FOUND = 'wfsNoFoundUser';
const EXT_SEND_TYPE = 'wfsMessageSendType';
const EXT_TIMEOUT_HOURS = 'wfTimeoutHours';
const EXT_TIMEOUT_ACTION = 'wfTimeoutAction';

function parseExt(val: any): Record<string, any> {
  if (!val) return {};
  if (typeof val === 'string') {
    try {
      return parseExt(JSON.parse(val));
    } catch {
      return {};
    }
  }
  if (Array.isArray(val)) {
    const out: Record<string, any> = {};
    val.forEach((item: any) => {
      if (item && item.code !== undefined) out[item.code] = item.value;
    });
    return out;
  }
  return { ...val };
}

const isCcNode = computed(() => parseExt(props.form?.ext)[EXT_NODE_KIND] === 'cc');

/** ===== 人员设置（办理人/抄送人员，值带类型前缀，运行时由后端解析） ===== */
const approverFlags = ref<string[]>([]);
const handlerModalVisible = ref(false);
const handlerNamesLoaded = ref(false);
/** 任一来源加载失败时置真：面板顶部给出可见提示与重试入口，避免静默空列表 */
const handlerLoadFailed = ref(false);
/** 标识里的 id → 中文名，用于把已存标识渲染成可读标签 */
const nameUsers = ref<Record<string, string>>({});
const nameDepts = ref<Record<string, string>>({});
const nameRoles = ref<Record<string, string>>({});
const nameGroups = ref<Record<string, string>>({});
const nameFormFields = ref<Record<string, string>>({});

/** 兼容后端 TableResult 的 list / rows / records 三种列表字段 */
function pickPageRows(data: any): Array<any> {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const rows = data.list || data.rows || data.records || [];
  return rows as any[];
}

function toNameMap(rows: any[], idKey: string, nameKey: string): Record<string, string> {
  const out: Record<string, string> = {};
  rows.forEach(row => {
    if (row && row[idKey] !== undefined) out[String(row[idKey])] = row[nameKey] || String(row[idKey]);
  });
  return out;
}

const handlerNameMaps = computed<HandlerNameMaps>(() => ({
  users: nameUsers.value,
  depts: nameDepts.value,
  roles: nameRoles.value,
  groups: nameGroups.value,
  formFields: nameFormFields.value
}));

/** 已选标识 → 可读标签；未知前缀原样显示，不静默丢掉历史配置 */
const selectedHandlers = computed(() => describeFlags(approverFlags.value, handlerNameMaps.value));

function syncPersonFromForm() {
  const pf = props.form?.permissionFlag;
  if (Array.isArray(pf)) {
    approverFlags.value = pf.filter(Boolean);
    return;
  }
  approverFlags.value = pf ? String(pf).split('@@').filter(Boolean) : [];
}

function persistPerson() {
  const form = props.form;
  if (!form) return;
  // 数组形式写入，PropertySetting 的 deep watcher 会 join('@@') 同步到画布节点属性并随流程保存
  form.permissionFlag = [...approverFlags.value];
}

function removeHandlerFlag(flag: string) {
  approverFlags.value = approverFlags.value.filter(item => item !== flag);
  persistPerson();
}

function onHandlerConfirm(flags: string[]) {
  approverFlags.value = flags;
  persistPerson();
}

/** 表单上的人员/部门组件字段（运行时按表单数据值解析审批人），用于把标识里的字段编码渲染成组件标签 */
async function loadFormFieldLabels(): Promise<Array<{ field: string; label: string }>> {
  if (!props.tableCode) return [];
  try {
    const res = await findDynamicFormByCode(props.tableCode);
    const inputComponents = ((res.data as any)?.metaData?.inputComponents ?? []) as Array<any>;
    return inputComponents
      .filter((c: any) => ['user-select', 'user-multi-select', 'dept-select', 'dept-multi-select'].includes(c.type))
      .map((c: any) => ({ field: c.field, label: c.componentProps?.label || c.field }));
  } catch {
    return [];
  }
}

async function loadHandlerNames() {
  if (handlerNamesLoaded.value && !handlerLoadFailed.value) return;
  handlerNamesLoaded.value = true;
  const [userRows, deptRows, roleRows, groupRows, formFields] = await Promise.all([
    findSystemUserList({ pageNum: 1, pageSize: 2000, keywords: [] } as any)
      .then(res => pickPageRows(res.data as any))
      .catch(() => [] as any[]),
    findSystemDepartmentList({ pageNum: 1, pageSize: 1000 } as any)
      .then(res => pickPageRows(res.data))
      .catch(() => [] as any[]),
    findSystemRoleList({ pageNum: 1, pageSize: 500 } as any)
      .then(res => pickPageRows(res.data))
      .catch(() => [] as any[]),
    findSystemUserGroupList({ pageNum: 1, pageSize: 500 } as any)
      .then(res => pickPageRows(res.data))
      .catch(() => [] as any[]),
    loadFormFieldLabels().catch(() => [] as Array<{ field: string; label: string }>)
  ]);
  nameUsers.value = Object.fromEntries(
    userRows.map((u: any) => [String(u.id), `${u.nickName || u.loginName || u.id}`])
  );
  nameDepts.value = toNameMap(deptRows, 'id', 'deptName');
  nameRoles.value = toNameMap(roleRows, 'id', 'roleName');
  nameGroups.value = toNameMap(groupRows, 'id', 'groupName');
  nameFormFields.value = Object.fromEntries(formFields.map(item => [item.field, item.label]));
  // 人员/部门/角色全空视为加载失败（用户组与表单字段可能本来就没有数据）
  handlerLoadFailed.value = ![userRows.length, deptRows.length, roleRows.length].some(Boolean);
  if (handlerLoadFailed.value) {
    window.$message?.warning({ message: '人员/部门/角色名称加载失败，办理人将以原始标识显示', duration: 5000 });
  }
}

async function retryLoadHandlerNames() {
  handlerNamesLoaded.value = false;
  handlerLoadFailed.value = false;
  await loadHandlerNames();
}

/** ===== 节点流转规则（票签策略/策略值/驳回到指定节点） =====
 * 协作方式固定为票签（设计器已隐藏选择），策略读写节点 nodeRatio/nodeRatioType/nodeRatioValue，
 * 由设计器内部 watcher 自动同步画布并随流程保存；固定人数策略保存时转入节点 ext（voteType 等）。
 */
interface RatioStrategy {
  label: string;
  value: string;
  unit: string;
  desc: string;
  /** 数字型策略用数字输入框防呆，表达式型用文本框 */
  numeric?: boolean;
  min?: number;
  max?: number;
  precision?: number;
}

const RATIO_STRATEGIES: RatioStrategy[] = [
  {
    label: '通过率（同意票占比）',
    value: 'passRatio',
    unit: '%',
    desc: '同意票占比达到该百分比即通过（0.001-100，最多三位小数）',
    numeric: true,
    min: 0.001,
    max: 100,
    precision: 3
  },
  {
    label: '固定通过人数（N 人同意即通过）',
    value: 'passCount',
    unit: '人',
    desc: '同意人数达到 N 即通过（正整数）',
    numeric: true,
    min: 1,
    max: 9999,
    precision: 0
  },
  {
    label: '固定驳回人数（N 人驳回即驳回）',
    value: 'rejectCount',
    unit: '人',
    desc: '驳回人数达到 N 即驳回（正整数），必须选择驳回目标节点',
    numeric: true,
    min: 1,
    max: 9999,
    precision: 0
  }
  // 「默认表达式 / spel 表达式」两类按需求下线：存量数据仍能保存/回显（voteStrategy 查不到时策略值行不渲染），
  // 但不再提供新建入口
];

const ratioStrategyOptions = RATIO_STRATEGIES.map(s => ({ label: s.label, value: s.value }));
const voteStrategy = computed(() => RATIO_STRATEGIES.find(s => s.value === (props.form as any)?.nodeRatioType));

const ratioNumericValue = computed<number | null>(() => {
  const raw = (props.form as any)?.nodeRatioValue;
  if (raw === undefined || raw === null || raw === '') return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
});

function onRatioStrategyChange(value: string | null) {
  const form = props.form as any;
  if (!form) return;
  form.nodeRatioType = value || '';
  if (!value) {
    form.nodeRatioValue = '';
    form.nodeRatio = '';
  }
}

function onRatioValueInput(value: number | undefined) {
  const form = props.form as any;
  if (!form) return;
  form.nodeRatioValue = value === undefined ? '' : String(value);
}

/** 驳回目标节点选项：插槽透传的画布节点（开始/网关/抄送/自身已被设计器排除） */
const rejectNodeOptions = computed<CommonType.Option<string>[]>(() =>
  ((props.nodes as any[]) || []).map((n: any) => ({ label: String((n.text && n.text.value) || n.id), value: n.id }))
);

/** ===== 超时设置（审批节点，随节点 ext 落库，运行时超时扫描按此处理） ===== */
const timeoutActionOptions = [
  { label: '超时自动通过（跳转下一节点）', value: 'AUTO_PASS' },
  { label: '超时自动驳回', value: 'AUTO_REJECT' },
  { label: '仅提醒办理人', value: 'NOTIFY' }
];
const nodeTimeout = ref<{ hours: number | null; action: string }>({ hours: null, action: 'AUTO_PASS' });

function syncTimeoutFromForm() {
  const ext = parseExt(props.form?.ext);
  const hours = Number(ext[EXT_TIMEOUT_HOURS]);
  nodeTimeout.value = {
    hours: Number.isFinite(hours) && hours > 0 ? hours : null,
    action: ext[EXT_TIMEOUT_ACTION] || 'AUTO_PASS'
  };
}

function persistTimeout() {
  const form = props.form;
  if (!form) return;
  const ext = parseExt(form.ext);
  if (nodeTimeout.value.hours && nodeTimeout.value.hours > 0) {
    ext[EXT_TIMEOUT_HOURS] = String(nodeTimeout.value.hours);
    ext[EXT_TIMEOUT_ACTION] = nodeTimeout.value.action;
  } else {
    Reflect.deleteProperty(ext, EXT_TIMEOUT_HOURS);
    Reflect.deleteProperty(ext, EXT_TIMEOUT_ACTION);
  }
  form.ext = ext;
}

/** ===== 节点规则（找不到审批人时/消息发送） ===== */
// 两种策略互斥，后端 FlowNoHandlerTaskHandler 按此分流；未配置按 MANAGE（交给组织管理员）处理
const noFoundUserOptions = [
  { label: '交给组织管理员（管理员成为本节点办理人）', value: 'MANAGE' },
  { label: '自动进入下一节点（该节点不留办理人）', value: 'NEXT' }
];
const sendTypeOptions = [
  { label: '实时发送', value: 'R' },
  { label: '延时发送', value: 'D' },
  { label: '不发送', value: 'N' }
];
const nodeRule = ref<{ noFound: string; sendType: string }>({ noFound: 'MANAGE', sendType: 'R' });

function syncRuleFromForm() {
  const ext = parseExt(props.form?.ext);
  nodeRule.value = {
    noFound: ext[EXT_NO_FOUND] || 'MANAGE',
    sendType: ext[EXT_SEND_TYPE] || 'R'
  };
}

function persistRule() {
  const form = props.form;
  if (!form) return;
  // 直接改表单数据对象（与设计器内部同一引用），PropertySetting 的 deep watch 会同步到画布节点属性
  const ext = parseExt(form.ext);
  ext[EXT_NO_FOUND] = nodeRule.value.noFound;
  ext[EXT_SEND_TYPE] = nodeRule.value.sendType;
  form.ext = ext;
}

/** ===== 字段/按钮权限（flow_form_version 草稿，按节点合并） ===== */
interface FieldPermRow {
  fieldCode: string;
  fieldName: string;
  isShow: number;
  isEdit: number;
  isRequired: number;
}

const fieldRows = ref<FieldPermRow[]>([]);
/** 节点按钮行：编码为规范小驼峰，与待办操作列/后端内置按钮枚举一一对应 */
interface BtnPermRow {
  code: string;
  btnName: string;
  aliasName: string;
  isShow: number;
  showDialog: number;
  color: string | null;
  /** 该按钮是否支持「意见弹窗」配置 */
  dialog: boolean;
}
const btnRows = ref<BtnPermRow[]>([]);
/** 节点属性面板可配置的按钮位置：待办操作列（任务级），表单/实例级按钮由全局配置维护 */
const NODE_BTN_SCOPES: BtnScope[] = ['task'];
const permLoading = ref(false);
const permSaving = ref(false);
const currentVersionId = ref('');
const currentVersionRef = ref<any>(null);

/** 当前节点编码（插槽 form 为节点表单数据，含 nodeCode） */
const currentNodeCode = computed(() => String(props.form?.nodeCode ?? ''));
/** 明细落库的节点作用域：无节点编码时按全局处理 */
const permNodeCode = computed(() => currentNodeCode.value || 'global');

const allSee = computed({
  get: () => fieldRows.value.length > 0 && fieldRows.value.every(r => r.isShow === 1),
  set: (v: boolean) => fieldRows.value.forEach(r => (r.isShow = v ? 1 : 0))
});
const allEdit = computed({
  get: () => fieldRows.value.length > 0 && fieldRows.value.every(r => r.isEdit === 1),
  set: (v: boolean) => fieldRows.value.forEach(r => (r.isEdit = v ? 1 : 0))
});
const allMust = computed({
  get: () => fieldRows.value.length > 0 && fieldRows.value.every(r => r.isRequired === 1),
  set: (v: boolean) => fieldRows.value.forEach(r => (r.isRequired = v ? 1 : 0))
});

/** 文案含中文才算运营者自定义名字（后端内置枚举的 aliasName 回填的是英文编码） */
function isChineseText(text: any): text is string {
  return Boolean(text) && /[\u4E00-\u9FA5]/.test(String(text));
}

/**
 * 明细行合并：global 行兜底、当前节点行覆盖（后端语义：命中节点明细则忽略 global）。
 * key 相同的行只保留一条，历史大写/别名编码由 key 提取器归一。
 */
function mergePermRows<T extends Record<string, any>>(list: T[] | undefined, key: (item: T) => string): T[] {
  const node = currentNodeCode.value;
  const isGlobalRow = (item: T) => {
    const code = String(item.nodeCode ?? '');
    return !code || code === 'global';
  };
  const relevant = (list ?? []).filter(item => isGlobalRow(item) || item.nodeCode === node);
  const rank = (item: T) => (isGlobalRow(item) ? 0 : 1);
  const ordered = [...relevant].sort((a, b) => rank(a) - rank(b));
  const merged = new Map<string, T>();
  ordered.forEach(item => {
    const k = key(item);
    if (k) merged.set(k, item);
  });
  return [...merged.values()];
}

/** 按钮行 = 内置任务级全集，配置（节点 > global）覆盖显隐/弹窗/重命名/颜色 */
function applyBtnPerm(list: any[] | undefined) {
  const configured = new Map<string, any>();
  mergePermRows(list, item => canonicalBtnCode(item.btnCode)).forEach(item =>
    configured.set(canonicalBtnCode(item.btnCode), item)
  );
  btnRows.value = BUILTIN_BTNS.filter(def => NODE_BTN_SCOPES.includes(def.scope)).map(def => {
    const hit = configured.get(def.code);
    return {
      code: def.code,
      // 运营者改过的中文名保留，否则用内置名（历史行可能回填英文编码）
      btnName: isChineseText(hit?.btnName) ? hit.btnName : def.name,
      aliasName: isChineseText(hit?.aliasName) ? hit.aliasName : '',
      isShow: hit?.isShow ?? (defaultBtnVisible(def.code) ? 1 : 0),
      // 与后端初始化草稿的默认值一致：通过/驳回默认填写审批意见
      showDialog: hit?.showDialog ?? (def.code === 'approve' || def.code === 'reject' ? 1 : 0),
      color: btnColorOf(def.code, hit?.color) ?? null,
      dialog: Boolean(def.dialog)
    };
  });
}

async function loadPerm() {
  if (!props.tableCode || !props.flowCode) return;
  permLoading.value = true;
  try {
    const versionList = await findFlowFormVersionList({ flowCode: props.flowCode });
    const versions = (versionList.data as any) || [];
    let version: any = versions.find((v: any) => v.publishStatus === 0);
    if (!version && versions.length) version = versions[versions.length - 1];
    if (version) {
      const detail = await findFlowFormVersionDetail(version.id);
      const v = detail.data as any;
      currentVersionId.value = v?.id ?? '';
      currentVersionRef.value = v;
      fieldRows.value = mergePermRows(v?.fieldPermList, (f: any) => String(f.fieldCode ?? '')).map((f: any) => ({
        fieldCode: f.fieldCode,
        fieldName: isChineseText(f.fieldName) ? f.fieldName : f.fieldCode,
        isShow: f.isShow ?? 1,
        isEdit: f.isEdit ?? 1,
        isRequired: f.isRequired ?? 0
      }));
      applyBtnPerm(v?.btnPermList);
      if (fieldRows.value.length) return;
    } else {
      fieldRows.value = [];
      applyBtnPerm(undefined);
    }
    // 字段全集兜底：动态表单列（按钮行已按内置全集渲染，不再依赖这里）
    const formRes = await findDynamicFormByCode(props.tableCode);
    const formId = (formRes.data as any)?.id;
    if (!formId) return;
    const colRes = await findDynamicFormColumnList({ pageNum: 1, pageSize: 500, keywords: [], formId } as any);
    const columns = ((colRes.data as any)?.list || []).filter(
      (c: any) =>
        ![
          'id',
          'tenant_id',
          'revision',
          'deleted_flag',
          'deleted_by',
          'deleted_time',
          'organization_id',
          'department_id'
        ].includes(c.filedCode)
    );
    fieldRows.value = columns.map((c: any) => ({
      fieldCode: c.filedCode,
      fieldName: c.filedName || c.filedCode,
      isShow: 1,
      isEdit: 1,
      isRequired: 0
    }));
  } finally {
    permLoading.value = false;
  }
}

async function persistPerm() {
  if (!props.flowCode || !props.tableCode || permSaving.value) return;
  permSaving.value = true;
  try {
    let draft = currentVersionRef.value && currentVersionRef.value.publishStatus === 0 ? currentVersionRef.value : null;
    if (!draft) {
      await initFlowFormVersion(props.flowCode, props.tableCode);
      const list = await findFlowFormVersionList({ flowCode: props.flowCode });
      const versions = (list.data as any) || [];
      draft = versions.find((v: any) => v.publishStatus === 0);
      if (!draft) {
        window.$message?.error('未找到可保存的表单配置草稿');
        return;
      }
      const detail = await findFlowFormVersionDetail(draft.id);
      currentVersionRef.value = detail.data;
      currentVersionId.value = detail.data?.id ?? '';
      draft = detail.data;
    }
    const node = permNodeCode.value;
    const detail = await findFlowFormVersionDetail(draft.id);
    const v = draft.id === (detail.data as any)?.id ? (detail.data as any) : draft;
    const fields: any[] = v.fieldPermList || [];
    fieldRows.value.forEach(row => {
      const hit = fields.find((f: any) => f.nodeCode === node && f.fieldCode === row.fieldCode);
      if (hit) {
        hit.isShow = row.isShow;
        hit.isEdit = row.isEdit;
        hit.isRequired = row.isRequired;
      } else {
        fields.push({
          nodeCode: node,
          fieldCode: row.fieldCode,
          fieldName: row.fieldName,
          isShow: row.isShow,
          isEdit: row.isEdit,
          isRequired: row.isRequired,
          sort: fields.length + 1
        });
      }
    });
    v.fieldPermList = fields;
    // 按钮明细：本节点行按规范编码整组重建（历史大写码/重复行随之清掉），其它节点与 global 行原样保留
    const source = v.btnPermList || [];
    const nodeRowKey = (b: any) => String(b.nodeCode ?? '');
    const editedCodes = new Set(btnRows.value.map(row => row.code));
    const nodeBtnRows = btnRows.value.map((row, index) => ({
      nodeCode: node,
      btnCode: row.code,
      btnName: row.btnName,
      aliasName: row.aliasName || '',
      isShow: row.isShow,
      showDialog: row.dialog ? row.showDialog : 0,
      color: row.color,
      sort: index + 1
    }));
    // 后端「命中节点明细则忽略 global」，所以表单/实例级按钮（保存/终止/撤销）要按全局配置复制到本节点，避免运行时丢入口
    const inherited = source
      .filter((b: any) => {
        const code = nodeRowKey(b);
        return (!code || code === 'global') && !editedCodes.has(canonicalBtnCode(b.btnCode));
      })
      .map((b: any, index: number) => ({ ...b, id: undefined, nodeCode: node, sort: nodeBtnRows.length + index + 1 }));
    v.btnPermList = [
      // 空 nodeCode 的历史行后端永远匹配不到（既不是节点也不是 global），随本次整组重建丢弃
      ...source.filter((b: any) => nodeRowKey(b) !== node && Boolean(nodeRowKey(b))),
      ...nodeBtnRows,
      ...inherited
    ];
    const res = await saveFlowFormVersion(v);
    if (res.error === null) {
      clearBtnPermCache(props.flowCode);
      await loadPerm();
      window.$message?.success('节点配置已保存');
    }
  } finally {
    permSaving.value = false;
  }
}

/** ===== 节点切换联动 ===== */
/** 扩展面板分组页签 */
const activePermTab = ref('person');

watch(
  () => [props.form, props.tableCode, props.flowCode],
  () => {
    // form 引用随选中节点切换而重建：切换节点时同步人员/超时/规则并重载该节点的权限明细
    activePermTab.value = 'person';
    syncPersonFromForm();
    syncTimeoutFromForm();
    syncRuleFromForm();
    loadPerm();
  },
  { immediate: true }
);

// 进入审批/抄送节点时懒加载办理人名称（已选标识要渲染成中文标签）
watch(
  isBetweenNode,
  val => {
    if (val) loadHandlerNames();
  },
  { immediate: true }
);

/** 初始化配置草稿（后端生成字段/按钮全集），供首次配置时一键生成 */
async function initDraft() {
  if (!props.flowCode || !props.tableCode) return;
  const res = await initFlowFormVersion(props.flowCode, props.tableCode);
  if (res.error === null) {
    clearBtnPermCache(props.flowCode);
    await loadPerm();
    window.$message?.success('已生成节点表单配置草稿');
  }
}
</script>

<template>
  <!-- 开始/结束/网关节点不渲染扩展面板，属性抽屉只保留节点编码/名称 -->
  <div v-if="isBetweenNode" class="node-perm-panel">
    <!-- 抄送节点：仅抄送人员（节点编码/名称在设计器基础信息区） -->
    <template v-if="isCcNode">
      <ElDivider title-placement="left">抄送设置</ElDivider>
      <ElForm :label-width="110" size="small" :show-feedback="false" label-position="left">
        <ElFormItem label="抄送人员">
          <div class="w-full">
            <ElButton size="small" type="primary" dashed :disabled="disabled" @click="handlerModalVisible = true">
              + 添加抄送对象
            </ElButton>
            <div v-if="selectedHandlers.length" class="mt-6px flex flex-wrap gap-6px">
              <ElTag
                v-for="item in selectedHandlers"
                :key="item.flag"
                closable
                size="small"
                :type="item.kind === 'raw' ? 'warning' : 'info'"
                :disabled="disabled"
                @close="removeHandlerFlag(item.flag)"
              >
                {{ item.label }}
              </ElTag>
            </div>
            <div v-else class="mt-6px text-12px text-gray-400">未配置抄送对象</div>
          </div>
        </ElFormItem>
        <ElFormItem label="抄送说明">
          <span class="perm-tip">流程到达本节点后向抄送人员发送通知，并自动流转到下一节点</span>
        </ElFormItem>
      </ElForm>
    </template>

    <!-- 审批节点完整配置：按设置内容分组到顶部页签，避免一屏长滚动 -->
    <ElTabs v-else v-model="activePermTab" size="small" class="perm-tabs" :tabs-padding="6">
      <template #suffix>
        <ElButton
          v-if="activePermTab === 'field' || activePermTab === 'btn'"
          text
          type="primary"
          size="small"
          :loading="permSaving"
          @click="persistPerm"
        >
          保存
        </ElButton>
      </template>

      <!-- 办理人：部门/人员/角色/人员部门控件/通过函数查找 五类来源的组合 -->
      <ElTabPane name="person" label="办理人" display-directive="show:lazy">
        <ElAlert v-if="handlerLoadFailed" type="warning" :bordered="false" class="mb-8px">
          组织数据加载失败，办理人标签可能只显示原始标识
          <ElButton text type="primary" size="small" class="ml-4px" @click="retryLoadHandlerNames">重试</ElButton>
        </ElAlert>
        <ElForm :label-width="110" size="small" :show-feedback="false" label-position="left">
          <ElFormItem label="办理人">
            <div class="w-full">
              <ElButton size="small" type="primary" dashed :disabled="disabled" @click="handlerModalVisible = true">
                + 设置办理人
              </ElButton>
              <div v-if="selectedHandlers.length" class="mt-6px flex flex-wrap gap-6px">
                <ElTag
                  v-for="item in selectedHandlers"
                  :key="item.flag"
                  closable
                  size="small"
                  :type="item.kind === 'raw' ? 'warning' : 'info'"
                  :disabled="disabled"
                  @close="removeHandlerFlag(item.flag)"
                >
                  {{ item.label }}
                </ElTag>
              </div>
              <div v-else class="mt-6px text-12px text-gray-400">
                未配置办理人，流程到达本节点时只会兜底给组织负责人
              </div>
            </div>
          </ElFormItem>
        </ElForm>
        <div class="perm-tip">办理人随流程画布节点保存，无需单独点击保存</div>
      </ElTabPane>

      <!-- 规则：节点流转规则（票签策略/策略值/驳回目标）+ 超时处理 + 找不到审批人/消息发送 -->
      <ElTabPane name="rule" label="规则" display-directive="show:lazy">
        <ElDivider title-placement="left">节点流转规则</ElDivider>
        <ElForm :label-width="110" size="small" :show-feedback="false" label-position="left">
          <ElFormItem label="票签策略">
            <ElSelect
              :model-value="(form as any).nodeRatioType || null"
              placeholder="请选择策略类型"
              :disabled="disabled"
              @change="onRatioStrategyChange"
            >
              <ElOption v-for="opt in ratioStrategyOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem v-if="voteStrategy" label="策略值">
            <div class="ratio-value-wrap">
              <div v-if="voteStrategy.numeric" class="ratio-value-row">
                <ElInputNumber
                  :model-value="ratioNumericValue"
                  :min="voteStrategy.min"
                  :max="voteStrategy.max"
                  :precision="voteStrategy.precision"
                  clearable
                  placeholder="请输入策略值"
                  :disabled="disabled"
                  @change="onRatioValueInput"
                />
                <span class="ratio-unit">{{ voteStrategy.unit }}</span>
              </div>
              <ElInput
                v-else
                :model-value="(form as any).nodeRatioValue || ''"
                placeholder="请输入表达式"
                :disabled="disabled"
                @update:model-value="(v: string) => ((form as any).nodeRatioValue = v)"
              />
              <div class="ratio-desc">{{ voteStrategy.desc }}</div>
            </div>
          </ElFormItem>
          <ElFormItem label="驳回到指定节点">
            <div class="ratio-value-wrap">
              <ElSelect
                :model-value="(form as any).anyNodeSkip || null"
                clearable
                placeholder="选择驳回目标节点"
                :disabled="disabled"
                @change="(v: string | null) => ((form as any).anyNodeSkip = v || '')"
              >
                <ElOption v-for="opt in rejectNodeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </ElSelect>
              <div v-if="voteStrategy?.value === 'rejectCount' && !(form as any).anyNodeSkip" class="ratio-warning">
                固定驳回人数策略必须选择驳回目标节点，否则保存时会被拦截
              </div>
            </div>
          </ElFormItem>
        </ElForm>

        <ElDivider title-placement="left">超时设置</ElDivider>
        <ElForm :label-width="110" size="small" :show-feedback="false" label-position="left">
          <ElFormItem label="超时时间(小时)">
            <ElInputNumber
              v-model="nodeTimeout.hours"
              :min="1"
              :precision="0"
              clearable
              placeholder="留空不启用超时处理"
              style="width: 100%"
              :disabled="disabled"
              @change="persistTimeout"
            />
          </ElFormItem>
          <ElFormItem label="超时处理">
            <ElSelect v-model="nodeTimeout.action" :disabled="disabled" @change="persistTimeout">
              <ElOption v-for="opt in timeoutActionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>
        </ElForm>

        <ElDivider title-placement="left">节点规则</ElDivider>
        <ElForm :label-width="110" size="small" :show-feedback="false" label-position="left">
          <ElFormItem label="找不到审批人时">
            <ElSelect v-model="nodeRule.noFound" :disabled="disabled" @change="persistRule">
              <ElOption v-for="opt in noFoundUserOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="消息发送">
            <ElSelect v-model="nodeRule.sendType" :disabled="disabled" @change="persistRule">
              <ElOption v-for="opt in sendTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>
        </ElForm>
        <div class="perm-tip">
          找不到办理人时：「交给组织管理员」（含未配置，默认）会把组织负责人写成本节点办理人、任务停在本节点等审批；「自动进入下一节点」则直接跳过该节点且不留办理人。两者互斥。
          票签策略与驳回目标写入节点流转属性，超时/消息规则写入节点扩展属性，均随流程画布保存落库
        </div>
      </ElTabPane>

      <!-- 表单权限：字段 可见/编辑/必填 -->
      <ElTabPane name="field" label="表单权限" display-directive="show:lazy">
        <div v-if="!fieldRows.length" class="perm-empty">
          <ElButton size="small" type="primary" secondary :loading="permLoading" @click="initDraft">
            生成字段配置
          </ElButton>
        </div>
        <template v-else>
          <div class="perm-head">
            <div class="perm-col-name">字段</div>
            <div class="perm-col-check">可见</div>
            <div class="perm-col-check">编辑</div>
            <div class="perm-col-check">必填</div>
          </div>
          <div class="perm-row perm-head-row">
            <div class="perm-col-name">全选</div>
            <div class="perm-col-check"><ElCheckbox v-model:checked="allSee" size="small" /></div>
            <div class="perm-col-check"><ElCheckbox v-model:checked="allEdit" size="small" /></div>
            <div class="perm-col-check"><ElCheckbox v-model:checked="allMust" size="small" /></div>
          </div>
          <div class="perm-body">
            <div v-for="row in fieldRows" :key="row.fieldCode" class="perm-row">
              <div class="perm-col-name" :title="row.fieldCode">{{ row.fieldName }}</div>
              <div class="perm-col-check">
                <ElSwitch
                  v-model="row.isShow"
                  size="small"
                  :active-value="1"
                  :inactive-value="0"
                  :disabled="disabled"
                />
              </div>
              <div class="perm-col-check">
                <ElSwitch
                  v-model="row.isEdit"
                  size="small"
                  :active-value="1"
                  :inactive-value="0"
                  :disabled="disabled"
                />
              </div>
              <div class="perm-col-check">
                <ElSwitch
                  v-model="row.isRequired"
                  size="small"
                  :active-value="1"
                  :inactive-value="0"
                  :disabled="disabled"
                />
              </div>
            </div>
          </div>
        </template>
      </ElTabPane>

      <!-- 流程按钮：显示/弹窗/重命名/颜色 -->
      <ElTabPane name="btn" label="流程按钮" display-directive="show:lazy">
        <div class="perm-head">
          <div class="btn-col-name">按钮</div>
          <div class="btn-col-check">显示</div>
          <div class="btn-col-check">弹窗</div>
          <div class="btn-col-alias">重命名</div>
          <div class="btn-col-color">颜色</div>
        </div>
        <div class="perm-body">
          <div v-for="row in btnRows" :key="row.code" class="perm-row">
            <div class="btn-col-name" :title="row.code">{{ row.btnName }}</div>
            <div class="btn-col-check">
              <ElSwitch v-model="row.isShow" size="small" :active-value="1" :inactive-value="0" :disabled="disabled" />
            </div>
            <div class="btn-col-check">
              <ElSwitch
                v-if="row.dialog"
                v-model="row.showDialog"
                size="small"
                :active-value="1"
                :inactive-value="0"
                :disabled="disabled"
              />
              <span v-else class="perm-tip">—</span>
            </div>
            <div class="btn-col-alias">
              <ElInput v-model="row.aliasName" size="small" placeholder="重命名" :disabled="disabled" />
            </div>
            <div class="btn-col-color" :title="row.color ? `颜色 ${row.color}` : '未配置颜色，点击右侧色块选择'">
              <ElColorPicker
                v-model="row.color"
                size="small"
                :modes="['hex']"
                :show-alpha="false"
                :actions="['clear']"
                :disabled="disabled"
              />
            </div>
          </div>
        </div>
        <div class="perm-tip mt-6px">
          「弹窗」= 点击后先填写审批意见；表单保存、实例终止/撤销等按钮不属于节点范围，由流程全局配置维护
        </div>
      </ElTabPane>
    </ElTabs>

    <!-- 办理人/抄送人共用同一个选择弹窗（抄送节点没有 NTabs，也在本 div 内） -->
    <HandlerSelectModal
      v-model:show="handlerModalVisible"
      :model-value="approverFlags"
      :table-code="tableCode"
      :disabled="disabled"
      @update:model-value="onHandlerConfirm"
    />
  </div>
</template>

<style lang="scss" scoped>
.node-perm-panel {
  padding: 8px 4px 16px;
}

/* 分组页签：细条导航，与抽屉自带的「基础设置」标题区分层 */
.perm-tabs {
  :deep(.n-tabs-tab) {
    font-size: 13px;
  }

  /* 页签内容与页签栏拉开距离（此前办理人行贴得太近） */
  :deep(.n-tab-pane) {
    padding-top: 14px;
  }

  /* 表单项关闭了 feedback 后行距过密：统一加大上下间距 */
  :deep(.n-form-item) {
    margin-bottom: 14px;
  }

  :deep(.n-divider:not(.n-divider--vertical)) {
    margin: 4px 0 16px;
  }
}

/* 策略值/驳回目标：输入框 + 单位/提示的纵向排布 */
.ratio-value-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ratio-value-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ratio-value-row .n-input-number {
  flex: 1;
}

.ratio-unit {
  font-size: 13px;
  color: var(--n-text-color-3, #999);
  white-space: nowrap;
}

.ratio-desc {
  font-size: 12px;
  color: var(--n-text-color-3, #999);
  line-height: 1.4;
}

.ratio-warning {
  font-size: 12px;
  color: #d03050;
  line-height: 1.4;
}

.perm-tip {
  font-size: 12px;
  color: var(--n-text-color-3, #999);
}

.perm-empty {
  padding: 8px 0 12px;
}

.perm-head,
.perm-row {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.perm-head {
  font-size: 12px;
  color: var(--ds-text-weak);
  border-bottom: 1px solid var(--ds-border);
}

.perm-head-row {
  font-size: 12px;
}

/* 字段/按钮列表：随视口高度自适应，内容放得下就不出现滚动条，超出可用空间才滚动 */
.perm-body {
  max-height: clamp(240px, calc(100vh - 430px), 720px);
  overflow-y: auto;
}

.perm-row {
  border-bottom: 1px solid var(--ds-border);
}

.perm-row:last-child {
  border-bottom: 0;
}

.perm-row:hover {
  background: var(--ds-hover);
}

.perm-col-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.perm-col-check {
  width: 44px;
  text-align: center;
}

.btn-col-name {
  flex: 1;
  font-size: 13px;
}

.btn-col-check {
  width: 40px;
  text-align: center;
}

.btn-col-alias {
  width: 84px;
  padding: 0 4px;
}

.btn-col-color {
  width: 64px;
  padding: 0 4px;
}

/* 颜色选择器：与同行「重命名」输入框近似同高对齐；未配置色时由 btnColorOf 默认语义色兜底，
   避免色块透明只剩棋盘格、看起来像显示异常（size 用合法值 small，tiny 会回退异常尺寸） */
.btn-col-color :deep(.n-color-picker) {
  width: 100%;
  height: 24px;
}

/* 窄列放不下 hex 文本（会溢出到格子外）：只保留纯色块，色值见悬停 title */
.btn-col-color :deep(.n-color-picker__value) {
  display: none;
}
</style>
