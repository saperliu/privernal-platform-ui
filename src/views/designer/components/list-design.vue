<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, reactive, ref, watch } from 'vue';
import {
  ElDatePicker,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElSpace,
  ElSwitch,
  ElTag,
  ElButton as __forwarded_ElButton
} from 'element-plus';
import { ReorderTwo } from '@vicons/ionicons5';
import { findDynamicFormColumnList, saveDynamicFormColumnDetail, updateDynamicFormColumnDetail } from '@/service';
import { useLoading } from '@/hooks';
import SelectPerson from '@/components/business/select-person.vue';
import SelectDepartment from '@/components/business/select-department.vue';
import { useRelationOptions } from '@/components/business/relation-options';

export interface Props {
  /** 表单ID（保存后的动态表单主键） */
  formId: string;
  /** 表单设计器的页面配置，用于从表单生成字段 */
  metaData?: Record<string, any> | null;
}
defineOptions({ name: 'ListDesign' });

const props = withDefaults(defineProps<Props>(), {
  metaData: null
});
const { loading, startLoading, endLoading } = useLoading(false);

/** 系统级公共字段：定义与保存数据的默认值锁定，查询条件的默认值可配置（与后端 DynamicFormColumn.SYSTEM_FIELD_CODES 一致） */
const SYSTEM_FIELD_CODES = new Set([
  'id',
  'tenant_id',
  'revision',
  'created_by',
  'created_time',
  'updated_by',
  'updated_time',
  'deleted_flag',
  'deleted_by',
  'deleted_time',
  'department_id',
  'organization_id',
  'parent_id',
  'remark',
  'status',
  'title'
]);

const isSystemRow = (row: DynamicFormColumnNamespace.DynamicFormColumnForm) =>
  SYSTEM_FIELD_CODES.has(String(row.filedCode));

/** 子表行识别：点号 filedCode=子表行内字段列；无点号但命中 sub-table 组件 field=子表快照列（组头名载体）。
 *  组件清单从 metaData.schemas 深遍历（API 直存的 metaData 没有 inputComponents） */
const subTableComps = computed<any[]>(() => {
  const out: any[] = [];
  const visit = (nodes: any) => {
    if (!nodes || typeof nodes !== 'object') return;
    if (Array.isArray(nodes)) {
      nodes.forEach(visit);
      return;
    }
    if (String(nodes.type ?? '') === 'sub-table' && nodes.field) out.push(nodes);
    if (Array.isArray(nodes.children)) nodes.children.forEach(visit);
  };
  visit(props.metaData?.schemas);
  return out;
});

const isSubTableRow = (row: DynamicFormColumnNamespace.DynamicFormColumnForm) =>
  String(row.filedCode ?? '').includes('.');

const isSubTableHeadRow = (row: DynamicFormColumnNamespace.DynamicFormColumnForm) =>
  !String(row.filedCode ?? '').includes('.') &&
  subTableComps.value.some(comp => normalizeFieldCode(comp.field) === normalizeFieldCode(row.filedCode));

/** 子表组头的设计器跟随名（sub-table 组件 label）：清空 filedName 即恢复跟随 */
function subTableHeadLabel(filedCode: any) {
  const code = normalizeFieldCode(filedCode);
  const comp = subTableComps.value.find(c => normalizeFieldCode(c.field) === code);
  return String(comp?.label ?? '');
}

/** 查询排序选项（互斥：整表只允许一个字段作为查询排序） */
const orderDirOptions = [
  { label: '升序', value: 'ASC' },
  { label: '降序', value: 'DESC' }
];

/** 字段编码归一化：驼峰/连字符转下划线小写（与运行时列表的匹配规则一致） */
function normalizeFieldCode(name: any) {
  return String(name ?? '')
    .replace(/-/g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

interface FieldCompInfo {
  /** 表单设计器组件类型（date-picker/user-select/relation-attr 等） */
  type: string;
  /** 组件属性（options 等） */
  props: Record<string, any>;
  /** 关联表单配置（relation-attr/relation-backfill） */
  relation: { formCode: string; displayField?: string } | null;
}

/** 表单组件信息表：查询默认值编辑器按表单组件类型适配，与运行时筛选控件同源 */
const fieldCompMap = computed<Map<string, FieldCompInfo>>(() => {
  const map = new Map<string, FieldCompInfo>();
  (props.metaData?.inputComponents ?? []).forEach((comp: any) => {
    if (!comp?.field) return;
    const compProps = comp.props ?? comp.componentProps ?? {};
    const relation = comp.relation ?? compProps.relation ?? null;
    map.set(normalizeFieldCode(comp.field), {
      type: String(comp.type ?? ''),
      props: compProps,
      relation: relation?.formCode ? relation : null
    });
  });
  return map;
});

type DefaultEditorKind =
  | 'select'
  | 'multiSelect'
  | 'switch'
  | 'number'
  | 'date'
  | 'user'
  | 'dept'
  | 'relation'
  | 'text';

/** 表单组件类型 → 查询默认值编辑器类型（与运行时筛选控件判定同源） */
const COMP_EDITOR_KIND: Record<string, DefaultEditorKind> = {
  radio: 'select',
  select: 'select',
  checkbox: 'multiSelect',
  switch: 'switch',
  'user-select': 'user',
  'user-multi-select': 'user',
  'dept-select': 'dept',
  'dept-multi-select': 'dept',
  'relation-attr': 'relation',
  'relation-backfill': 'relation',
  'date-picker': 'date',
  datetime: 'date',
  number: 'number',
  'input-number': 'number'
};

/** 数据库字段类型 → 编辑器类型兜底（表单里找不到对应组件时使用） */
const FIELD_TYPE_EDITOR_KIND: Record<string, DefaultEditorKind> = {
  datetime: 'date',
  time: 'date',
  int: 'number',
  bigint: 'number',
  decimal: 'number'
};

/** 查询默认值编辑器类型：跟随表单组件类型，无组件信息时按列类型兜底（与运行时筛选判定一致） */
function queryDefaultEditor(row: DynamicFormColumnNamespace.DynamicFormColumnForm): {
  kind: DefaultEditorKind;
  options?: any[];
  relation?: { formCode: string; displayField?: string } | null;
} {
  const comp = fieldCompMap.value.get(normalizeFieldCode(row.filedCode));
  const kind = COMP_EDITOR_KIND[String(comp?.type ?? '')];
  if (kind === 'select' || kind === 'multiSelect') {
    return { kind, options: comp?.props?.options ?? [] };
  }
  if (kind === 'relation') return { kind, relation: comp?.relation };
  if (kind) return { kind };
  return { kind: FIELD_TYPE_EDITOR_KIND[String(row.filedType ?? '').toLowerCase()] ?? 'text' };
}

/** 当前表单编码，作为关联显示数据接口的 fromTableCode（决定授权与收敛列） */
const fromTableCode = computed(() => props.metaData?.schemas?.[0]?.props?.code ?? '');

/** 关联表单记录行缓存与选项构建：与列表运行时过滤条件共用（公共 composable） */
const { loadRelationRows, relationOptionsFor } = useRelationOptions(() => fromTableCode.value);

const tableData = ref<DynamicFormColumnNamespace.DynamicFormColumnForm[]>([]);
/** 记录被编辑过的行id，保存时只提交这些行 */
const dirtyRowIds = ref<Set<string>>(new Set());

const formQuery = reactive<DynamicFormColumnNamespace.DynamicFormColumnQuery>({
  pageNum: 1,
  pageSize: 200,
  keyword: '',
  keywords: []
});

async function getTableData() {
  if (!props.formId) {
    tableData.value = [];
    return;
  }
  startLoading();
  const { data, error } = await findDynamicFormColumnList({ ...formQuery, formId: props.formId });
  if (error === null && data) {
    // 后端把数字统一序列化成字符串（"1"/"0"/"4"），不归一化开关比较 === 1 恒假、不回显
    tableData.value = (data.list ?? []).map(item => ({
      ...item,
      sort: Number(item.sort ?? 0),
      showList: Number(item.showList ?? 0),
      showQuery: Number(item.showQuery ?? 0)
    }));
    await normalizeSorts();
    dirtyRowIds.value = new Set();
  }
  endLoading();
}

/**
 * 序号补齐兜底：自动建列/历史数据 sort 为空（前端只能显示 0），拖动一列才触发重编号。
 * 打开即补齐——无序号的行接在最大序号之后按当前顺序编号并静默保存，保证进入页面就是 1..N。
 */
async function normalizeSorts() {
  const unsortedRows = tableData.value.filter(item => !item.sort);
  if (!unsortedRows.length) return;
  let next = tableData.value.reduce((max, item) => Math.max(max, Number(item.sort ?? 0)), 0);
  // 无序号行在查询结果里天然排在前面（sort asc），按展示顺序依次接号；补号后排到已编号行之后，视图同步挪动
  unsortedRows.forEach(item => {
    item.sort = next += 1;
  });
  const unsortedSet = new Set(unsortedRows);
  tableData.value = [...tableData.value.filter(item => !unsortedSet.has(item)), ...unsortedRows];
  const saveResults = await Promise.all(unsortedRows.map(row => updateDynamicFormColumnDetail(row as any)));
  const failed = saveResults.filter(item => item.error !== null).length;
  if (failed) {
    unsortedRows.forEach(row => markDirty(row.id));
    window.$message?.warning(`列排序自动补齐失败 ${failed} 条，请手动保存`);
  }
}

function markDirty(id: string) {
  dirtyRowIds.value.add(id);
}

function handleFieldChange(row: DynamicFormColumnNamespace.DynamicFormColumnForm, value: any, key: 'filedName') {
  row[key] = value;
  markDirty(row.id);
}

/** 拖拽排序：抓手起拖，悬停行实时换位，结束时按展示顺序重算为连续序号（1..N） */
const draggingId = ref('');

function handleDragStart(e: DragEvent, row: DynamicFormColumnNamespace.DynamicFormColumnForm) {
  draggingId.value = row.id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', row.id);
  }
}

function handleRowDragOver(e: DragEvent, row: DynamicFormColumnNamespace.DynamicFormColumnForm) {
  if (!draggingId.value || draggingId.value === row.id) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  const from = tableData.value.findIndex(item => item.id === draggingId.value);
  const to = tableData.value.findIndex(item => item.id === row.id);
  if (from < 0 || to < 0 || from === to) return;
  const [moved] = tableData.value.splice(from, 1);
  tableData.value.splice(to, 0, moved);
}

function handleDragEnd() {
  if (!draggingId.value) return;
  draggingId.value = '';
  // 后端列查询按 sort 升序返回（值小在前=越靠左），顶部行取最小序号，刷新后才能保持拖拽后的顺序
  tableData.value.forEach((item, index) => {
    const next = index + 1;
    if (item.sort !== next) {
      item.sort = next;
      markDirty(item.id);
    }
  });
}

function rowDragProps(row: DynamicFormColumnNamespace.DynamicFormColumnForm) {
  return {
    onDragover: (e: DragEvent) => handleRowDragOver(e, row)
  };
}

function handleSwitchChange(
  row: DynamicFormColumnNamespace.DynamicFormColumnForm,
  value: string | number | boolean,
  key: 'showList' | 'showQuery'
) {
  row[key] = value ? 1 : 0;
  markDirty(row.id);
}

/** 敏感字段开关（Y/N 字符串）：导出/打印/外链三链路按 io_config.sensitive_policy 脱敏或隐藏 */
function handleSensitiveChange(
  row: DynamicFormColumnNamespace.DynamicFormColumnForm,
  value: string | number | boolean
) {
  row.sensitive = value ? 'Y' : 'N';
  markDirty(row.id);
}

function handleTextChange(
  row: DynamicFormColumnNamespace.DynamicFormColumnForm,
  value: string,
  key: 'queryDefaultValue'
) {
  row[key] = value;
  markDirty(row.id);
}

/** 查询排序互斥：某字段设为升/降序时清掉其它字段的查询排序 */
function handleOrderDirChange(row: DynamicFormColumnNamespace.DynamicFormColumnForm, value: string | null) {
  const dir = value ?? '';
  if (dir) {
    tableData.value.forEach(other => {
      if (other !== row && other.orderDir) {
        other.orderDir = '';
        markDirty(other.id);
      }
    });
  }
  row.orderDir = dir;
  markDirty(row.id);
}

/** 开关型字段的查询默认值选项 */
const SWITCH_DEFAULT_OPTIONS = [
  { label: '是', value: '1' },
  { label: '否', value: '0' }
];

type QueryDefaultRelation = { formCode: string; displayField?: string } | null | undefined;

/** 日期：运行时日期筛选是范围控件，默认值填进范围起始位，存 yyyy-MM-dd 字符串 */
function renderDateDefaultEditor(row: DynamicFormColumnNamespace.DynamicFormColumnForm, dv: string) {
  return (
    <ElDatePicker
      modelValue={dv}
      valueFormat="yyyy-MM-dd"
      type="date"
      size="small"
      clearable
      placeholder="范围起始日"
      style={{ width: '100%' }}
      onUpdate:modelValue={(v: string | null) => handleTextChange(row, v ?? '', 'queryDefaultValue')}
    />
  );
}

function renderNumberDefaultEditor(row: DynamicFormColumnNamespace.DynamicFormColumnForm, dv: string) {
  return (
    <ElInputNumber
      modelValue={dv === '' ? null : Number(dv)}
      size="small"
      placeholder="范围最小值"
      onUpdate:modelValue={(v: number | undefined) =>
        handleTextChange(row, typeof v === 'number' ? String(v) : '', 'queryDefaultValue')
      }
    />
  );
}

/** 单选下拉：值存字符串，空值用 null 让 clearable 生效 */
function renderSelectDefaultEditor(row: DynamicFormColumnNamespace.DynamicFormColumnForm, dv: string, options: any[]) {
  return (
    <ElSelect
      modelValue={dv || null}
      size="small"
      clearable
      placeholder="请选择"
      options={options}
      onUpdate:modelValue={(v: any) => handleTextChange(row, v ?? '', 'queryDefaultValue')}
    />
  );
}

/** 开关型字段的查询默认值：是/否二选一，可不填 */
function renderSwitchDefaultEditor(row: DynamicFormColumnNamespace.DynamicFormColumnForm, dv: string) {
  return (
    <ElSelect
      modelValue={dv || null}
      size="small"
      clearable
      placeholder="无默认"
      options={SWITCH_DEFAULT_OPTIONS}
      onUpdate:modelValue={(v: any) => handleTextChange(row, v ?? '', 'queryDefaultValue')}
    />
  );
}

function renderMultiSelectDefaultEditor(
  row: DynamicFormColumnNamespace.DynamicFormColumnForm,
  dv: string,
  options: any[]
) {
  return (
    <ElSelect
      modelValue={dv
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)}
      size="small"
      multiple
      placeholder="请选择"
      options={options}
      onUpdate:modelValue={(arr: any) => handleTextChange(row, (arr ?? []).join(','), 'queryDefaultValue')}
    />
  );
}

/** 人员/部门多选的值统一落成逗号串 */
function saveSelectionDefault(row: DynamicFormColumnNamespace.DynamicFormColumnForm, v: any) {
  handleTextChange(row, Array.isArray(v) ? v.join(',') : (v ?? ''), 'queryDefaultValue');
}

function renderPersonDefaultEditor(row: DynamicFormColumnNamespace.DynamicFormColumnForm, dv: string) {
  return (
    <SelectPerson
      value={dv}
      size="small"
      {...({ 'onUpdate:value': (v: any) => saveSelectionDefault(row, v) } as any)}
    />
  );
}

function renderDeptDefaultEditor(row: DynamicFormColumnNamespace.DynamicFormColumnForm, dv: string) {
  return (
    <SelectDepartment
      value={dv}
      size="small"
      {...({ 'onUpdate:value': (v: any) => saveSelectionDefault(row, v) } as any)}
    />
  );
}

/** 关联表单：下拉展开时按 formCode 懒加载关联记录作为选项 */
function renderRelationDefaultEditor(
  row: DynamicFormColumnNamespace.DynamicFormColumnForm,
  dv: string,
  relation: QueryDefaultRelation
) {
  return (
    <ElSelect
      modelValue={dv || null}
      size="small"
      clearable
      filterable
      placeholder={relation ? '选择关联记录' : '未配置关联表单'}
      options={relation ? relationOptionsFor(relation) : []}
      onVisible-change={(v: boolean) => {
        if (v && relation) loadRelationRows(relation.formCode);
      }}
      onUpdate:modelValue={(v: any) => handleTextChange(row, v ?? '', 'queryDefaultValue')}
    />
  );
}

function renderTextDefaultEditor(row: DynamicFormColumnNamespace.DynamicFormColumnForm, dv: string) {
  return (
    <ElInput
      modelValue={dv}
      size="small"
      placeholder="查询面板预填"
      onUpdate:modelValue={(v: string) => handleTextChange(row, v, 'queryDefaultValue')}
    />
  );
}

/** 查询默认值编辑器：按字段类型渲染对应控件，保证配置出运行时查询能识别的默认值 */
function renderQueryDefaultEditor(row: DynamicFormColumnNamespace.DynamicFormColumnForm) {
  const editor = queryDefaultEditor(row);
  const dv = row.queryDefaultValue || '';
  const options = editor.options ?? [];
  switch (editor.kind) {
    case 'date':
      return renderDateDefaultEditor(row, dv);
    case 'number':
      return renderNumberDefaultEditor(row, dv);
    case 'switch':
      return renderSwitchDefaultEditor(row, dv);
    case 'select':
      return renderSelectDefaultEditor(row, dv, options);
    case 'multiSelect':
      return renderMultiSelectDefaultEditor(row, dv, options);
    case 'user':
      return renderPersonDefaultEditor(row, dv);
    case 'dept':
      return renderDeptDefaultEditor(row, dv);
    case 'relation':
      return renderRelationDefaultEditor(row, dv, editor.relation);
    default:
      return renderTextDefaultEditor(row, dv);
  }
}

const columns: Ref<DataTable.Column<DynamicFormColumnNamespace.DynamicFormColumnForm>[]> = ref([
  {
    key: 'sort',
    title: '排序',
    width: 90,
    align: 'center',
    render: row => (
      <ElSpace size={4} alignment="center" class="justify-center">
        <span
          class="dlz-grip"
          title="拖拽调整顺序"
          draggable
          onDragstart={(e: DragEvent) => handleDragStart(e, row)}
          onDragend={handleDragEnd}
        >
          <ElIcon size={14}>
            <ReorderTwo />
          </ElIcon>
        </span>
        <span class="dlz-sort-num">{row.sort}</span>
      </ElSpace>
    )
  },
  {
    key: 'filedCode',
    title: '字段编码',
    width: 170,
    ellipsis: { tooltip: true },
    render: row => (
      <ElSpace size={4} alignment="center">
        {isSystemRow(row) && (
          <ElTag size="small" type="warning">
            系统
          </ElTag>
        )}
        {isSubTableHeadRow(row) && (
          <ElTag size="small" type="info">
            子表组头
          </ElTag>
        )}
        {isSubTableRow(row) && (
          <ElTag size="small" type="info">
            子表字段
          </ElTag>
        )}
        <span class="dlz-code">{row.filedCode}</span>
      </ElSpace>
    )
  },
  {
    key: 'filedName',
    title: '字段名称',
    minWidth: 140,
    render: row =>
      isSystemRow(row) ? (
        <span>{row.filedName || '-'}</span>
      ) : (
        <ElInput
          modelValue={row.filedName}
          size="small"
          placeholder={
            isSubTableHeadRow(row) && subTableHeadLabel(row.filedCode)
              ? `留空跟随：${subTableHeadLabel(row.filedCode)}`
              : '列表显示名'
          }
          onUpdate:modelValue={(v: string) => handleFieldChange(row, v, 'filedName')}
        />
      )
  },
  {
    key: 'filedType',
    title: '字段类型',
    width: 100,
    render: row => (
      <ElTag size="small" type="info">
        {row.filedType || '-'}
      </ElTag>
    )
  },
  {
    key: 'showList',
    title: '列表显示',
    width: 90,
    align: 'center',
    render: row => (
      <ElSwitch
        modelValue={row.showList === 1}
        size="small"
        disabled={isSubTableHeadRow(row)}
        onUpdate:modelValue={(v: string | number | boolean) => handleSwitchChange(row, v, 'showList')}
      />
    )
  },
  {
    key: 'showQuery',
    title: '查询显示',
    width: 90,
    align: 'center',
    render: row => (
      <ElSwitch
        modelValue={row.showQuery === 1}
        size="small"
        disabled={isSubTableHeadRow(row)}
        onUpdate:modelValue={(v: string | number | boolean) => handleSwitchChange(row, v, 'showQuery')}
      />
    )
  },
  {
    key: 'orderDir',
    title: '查询排序',
    width: 110,
    render: row => (
      <ElSelect
        modelValue={row.orderDir || null}
        size="small"
        clearable
        placeholder="不排序"
        options={orderDirOptions}
        onUpdate:modelValue={(v: any) => handleOrderDirChange(row, v ?? null)}
      />
    )
  },
  {
    key: 'sensitive',
    title: '敏感字段',
    width: 90,
    align: 'center',
    render: row => (
      <ElSwitch
        modelValue={row.sensitive === 'Y'}
        size="small"
        onUpdate:modelValue={(v: string | number | boolean) => handleSensitiveChange(row, v)}
      />
    )
  },
  {
    key: 'uniqueFlag',
    title: '不允许重复',
    width: 100,
    align: 'center',
    render: row =>
      row.uniqueFlag === 'Y' ? (
        <ElTag size="small" type="success">
          唯一
        </ElTag>
      ) : (
        <span style="color: #bbb">-</span>
      )
  },
  {
    key: 'queryDefaultValue',
    title: '查询默认值',
    minWidth: 150,
    render: row => renderQueryDefaultEditor(row)
  }
]);

/** 组件类型 → 数据库字段类型映射 */
function resolveFieldType(component: string): { type: string; length: number; scale: number } {
  if (/input-number|number/.test(component)) return { type: 'DECIMAL', length: 18, scale: 2 };
  if (/date|time/.test(component)) return { type: 'DATETIME', length: 0, scale: 0 };
  if (/switch|checkbox|radio/.test(component)) return { type: 'TINYINT', length: 1, scale: 0 };
  if (/textarea|editor|rich/.test(component)) return { type: 'TEXT', length: 0, scale: 0 };
  return { type: 'VARCHAR', length: 255, scale: 0 };
}

/** 单个设计器节点 → 字段描述（非输入型节点或编码重复时返回 null） */
function toFieldNode(node: any, result: any[]) {
  const isInput = node.input === true || (Boolean(node.field) && node.type !== 'table');
  const rawCode = node.componentProps?.code ?? node.field;
  if (!isInput || !rawCode) return null;
  const code = normalizeFieldCode(rawCode);
  if (result.some(item => item.code === code)) return null;
  return {
    code,
    label: String(node.componentProps?.label ?? node.label ?? code),
    component: String(node.type ?? node.component ?? 'input')
  };
}

/** 递归收集表单设计器中的输入型字段节点。
 *  编码统一归一为物理列名（下划线）：建表列名是归一后的名字（insertDynamicForm.normalizeFormFieldCodes），
 *  用原始编码（如 upload-image_xxx 含连字符）生成会与后端记录的列配置重复且读不到数据。
 *  子表（sub-table）节点整棵跳过：快照列是 JSON 内部存储、行内字段由后端以
 *  「子表字段.行内列名」的点号列记录，平铺生成会点亮 JSON 快照列并造出重复字段。 */
function collectFieldNodes(nodes: any[], result: any[] = []) {
  if (!Array.isArray(nodes)) return result;
  for (const node of nodes) {
    if (node && typeof node === 'object') {
      if (node.type === 'sub-table') continue;
      const field = toFieldNode(node, result);
      if (field) result.push(field);
      if (node.children?.length) collectFieldNodes(node.children, result);
      if (node.slots) {
        Object.values(node.slots).forEach(slotList => collectFieldNodes(slotList as any[], result));
      }
    }
  }
  return result;
}

const generating = ref(false);

/** 从表单配置生成列表字段，已有编码不重复生成 */
async function handleGenerateFromForm() {
  if (!props.formId) {
    window.$message?.warning('请先在「表单设计」中保存表单');
    return;
  }
  const fields = collectFieldNodes(props.metaData?.schemas ?? []);
  if (!fields.length) {
    window.$message?.warning('未从表单中解析到字段，请先完善表单设计');
    return;
  }
  const existCodes = new Set(tableData.value.map(item => normalizeFieldCode(item.filedCode)));
  const newFields = fields.filter(field => !existCodes.has(field.code));
  if (!newFields.length) {
    window.$message?.info('表单字段均已生成过列配置');
    return;
  }
  generating.value = true;
  // 后端按 sort 升序展示（值小在前=越靠左），新字段序号接在现有最大值之后，追加到列表末尾
  const maxExisting = tableData.value.length ? Math.max(...tableData.value.map(item => Number(item.sort ?? 0))) : 0;
  const saveResults = await Promise.all(
    newFields.map((field, i) => {
      const { type, length, scale } = resolveFieldType(field.component);
      return saveDynamicFormColumnDetail({
        formId: props.formId,
        filedCode: field.code,
        filedName: field.label,
        filedType: type,
        length,
        scale,
        sort: maxExisting + 1 + i,
        defaultValue: '',
        showList: 1,
        showQuery: 1
      } as any);
    })
  );
  const successCount = saveResults.filter(item => item.error === null).length;
  generating.value = false;
  window.$message?.success(`成功生成 ${successCount} 个列表字段`);
  await getTableData();
}

const saving = ref(false);

/** 保存被编辑过的行 */
async function handleSaveColumns() {
  const dirtyRows = tableData.value.filter(row => dirtyRowIds.value.has(row.id));
  if (!dirtyRows.length) {
    window.$message?.info('没有需要保存的修改');
    return;
  }
  saving.value = true;
  const saveResults = await Promise.all(dirtyRows.map(row => updateDynamicFormColumnDetail(row as any)));
  const successCount = saveResults.filter(item => item.error === null).length;
  saving.value = false;
  if (successCount === dirtyRows.length) {
    window.$message?.success('列配置保存成功');
  } else {
    window.$message?.warning(`保存完成：成功 ${successCount} 条，失败 ${dirtyRows.length - successCount} 条`);
  }
  await getTableData();
}

watch(
  () => props.formId,
  () => {
    getTableData();
  },
  { immediate: true }
);

function rowKey(row: DynamicFormColumnNamespace.DynamicFormColumnForm) {
  return row.id;
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
</script>

<template>
  <div class="list-panel">
    <div class="list-card">
      <div class="list-bar">
        <span class="bar-title">列表字段</span>
        <span class="bar-count">{{ tableData.length }} 个字段</span>
        <span v-if="dirtyRowIds.size > 0" class="bar-dirty">{{ dirtyRowIds.size }} 行未保存</span>
        <span class="bar-spacer"></span>
        <ElButton size="small" secondary :loading="generating" :disabled="!formId" @click="handleGenerateFromForm">
          从表单生成字段
        </ElButton>
        <ElButton size="small" type="primary" :loading="saving" :disabled="!formId" @click="handleSaveColumns">
          保存列配置
        </ElButton>
      </div>

      <DataTable
        class="list-table flex-1-hidden"
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :row-key="rowKey"
        :row-props="rowDragProps"
        :bottom-bordered="false"
        :empty-text="formId ? '暂无列配置，点击「从表单生成字段」开始配置' : '请先在「表单设计」中保存表单'"
        size="small"
        :bordered="false"
        flex-height
      />

      <div class="list-note">
        「列表显示」控制在数据列表页出现的列，「查询显示」控制顶部筛选条件；拖住「排序」列的把手上下拖动即可调整展示顺序，
        越靠上在数据列表中越靠左，保存后按当前顺序重算连续序号。「查询默认值」按字段类型给出对应控件（日期/开关/数字/人员/部门/关联表单/选项），在查询面板自动预填；
        「查询排序」为列表查询的初始排序（互斥）。带「系统」标签的公共字段（id/tenant_id/department_id
        等）定义锁定，排序与查询默认值可配置。
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.list-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 12px;
  box-shadow: var(--ds-shadow-xs);
}

.list-bar {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  height: 44px;
  padding: 0 12px;
  border-bottom: 1px solid var(--ds-border);
}

.bar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text);
}

.bar-count,
.bar-dirty {
  padding: 2px 8px;
  font-size: 12px;
  color: var(--ds-text-weak);
  background: var(--ds-canvas);
  border: 1px solid var(--ds-border);
  border-radius: 10px;
}

.bar-dirty {
  color: #dd6b20;
  background: rgb(221 107 32 / 8%);
  border-color: rgb(221 107 32 / 24%);
}

.bar-spacer {
  flex: 1;
}

.list-note {
  flex-shrink: 0;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--ds-text-weak);
  border-top: 1px solid var(--ds-border);
}

.list-table :deep(.n-data-table-th) {
  font-size: 12px;
  color: var(--ds-text-sub);
  background: var(--ds-canvas);
}

.list-table :deep(.n-data-table-td) {
  font-size: 13px;
}
</style>

<style>
/* 单元格内容由 NDataTable 的渲染函数产出，不带本组件的 scopeId，因此放在非 scoped 块中 */
.dlz-code {
  padding: 1px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--ds-text-sub);
  background: var(--ds-canvas);
  border-radius: 4px;
}
.dlz-grip {
  display: inline-flex;
  padding: 2px 4px;
  color: var(--ds-text-weak);
  cursor: grab;
  border-radius: 4px;
}
.dlz-grip:hover {
  color: var(--ds-text);
  background: var(--ds-canvas);
}
.dlz-grip:active {
  cursor: grabbing;
}
.dlz-sort-num {
  min-width: 20px;
  font-size: 12px;
  color: var(--ds-text-sub);
}
</style>
