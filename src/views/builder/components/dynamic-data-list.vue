<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { UploadFile } from 'element-plus';
import {
  ElImage,
  ElButton as __forwarded_ElButton,
  ElDialog as __forwarded_ElDialog,
  ElProgress as __forwarded_ElProgress,
  ElSelect as __forwarded_ElSelect,
  ElSpace as __forwarded_ElSpace,
  ElUpload as __forwarded_ElUpload
} from 'element-plus';
import {
  delDynamicFormData,
  findDynamicFormByCode,
  findDynamicFormColumnList,
  findDynamicFormDataList
} from '@/service';
import { startDynamicDataFlow } from '@/service/api/dynamic/dynamic-common';
import {
  exportIoData,
  fetchIoImportProgress,
  fetchIoImportReport,
  fetchIoTemplate,
  getIoConfig,
  uploadIoImport
} from '@/service/api/dynamic/advanced';
import type { PrintFilter } from '@/service/api/dynamic/doc-template';
import { fetchDocTemplates, fetchPrintData, fetchPrintPdf } from '@/service/api/dynamic/doc-template';
import { useAuth, useBoolean, useLoading } from '@/hooks';
import { calcTableActionWidth, dynamicOrderByColumn, getQueryString } from '@/utils';
import { printHtmlDoc } from '@/utils/doc-print/preview';
import { renderDocHtml } from '@/utils/doc-print/render';
import { renderSheetHtml } from '@/utils/doc-print/sheet';
import { buildCustomViewPageApi } from '@/utils/custom-view/page-api';
import SelectPerson from '@/components/business/select-person.vue';
import FlowRecordModal from '@/views/flow/components/flow-record-modal.vue';
import { collectFormComponents, createFieldTranslators, pickRelation } from '@/components/business/field-translate';
import { useRelationOptions } from '@/components/business/relation-options';
import type { ModalType } from './designer-modal.vue';
import DesignerFormModal from './designer-modal.vue';
import CustomViewHost from './custom-view-host.vue';
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDialog = __forwarded_ElDialog;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElProgress = __forwarded_ElProgress;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElUpload = __forwarded_ElUpload;

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
  /** 表单编码覆盖：默认取 URL（?code= 或 /builder/{tableCode} 路径段），AI 对话页弹层等跨页面场景必传 */
  queryCode?: string;
  /** 预置过滤条件（列编码→值）：并入初始查询且查询面板可继续叠加，AI「我的授课表」等场景 */
  presetFilters?: Record<string, any> | null;
}
defineOptions({ name: 'DynamicDataList' });
const props = withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: '',
  queryCode: '',
  presetFilters: null
});
interface Emits {
  (e: 'change', data: any[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { hasAuth } = useAuth();
const tableData = ref<any[]>([]);

/** 表单编码：优先取调用方覆盖（跨页面打开），其次 URL query，最后菜单路由路径段（/builder/{tableCode}） */
const route = useRoute();
const code =
  props.queryCode ||
  getQueryString(window.location.search, 'code') ||
  String(route.path.split('/').filter(Boolean).pop() || '');

const formData = ref<{
  id?: string;
  tableName: string;
  tableCode: string;
  /** 设计器物化的表单 JSON：字段组件清单来源（翻译器）与流程入口判据 */
  metaData?: DynamicFormNamespace.DynamicFormDetail['metaData'];
  /** 是否启用工作流 0 未启用 1 启用 */
  isWorkflow?: DynamicFormNamespace.DynamicFormDetail['isWorkflow'];
}>({ tableName: '', tableCode: '' });

/** 列配置项（dynamic_form_column 记录）：列表列与查询面板都由它驱动 */
interface FormColumnItem {
  id?: string;
  /** 字段编码：子表显示字段形如「子表字段.行内列名」 */
  filedCode: string;
  filedName?: string;
  filedType?: string;
  /** 是否列表显示 / 是否作为查询条件（后端回字符串，归一为 0/1） */
  showList?: number;
  showQuery?: number;
  /** 列配置的默认排序方向 ASC/DESC */
  orderDir?: string;
  /** 查询条件默认值 */
  queryDefaultValue?: unknown;
  [key: string]: unknown;
}

/** 查询面板筛选项：列配置 + 表单组件信息合并后的结构（filterKind / applyQueryDefault 消费） */
interface ListFilterItem {
  id?: string;
  filedCode: string;
  filedName?: string;
  filedType?: string;
  /** 表单组件类型：radio/select/switch/number/date-picker… 无组件信息时为空串 */
  componentType?: string;
  queryDefaultValue?: unknown;
  options?: Array<{ label?: string; value?: string | number }>;
  multiple?: boolean;
  label?: string;
  [key: string]: unknown;
}

const formColumns = ref<FormColumnItem[]>([]);
const listFilter = ref<ListFilterItem[]>([]);

const checkedRowKeys = ref<string[]>([]);
/** 表格重建 key：naive-ui 横向虚拟滚动对追加行存在列窗口计算错误，数据集变化时强制重建表格 */
const tableKey = ref('');
/** 动态列表查询参数：后端契约（分页 + 任意列编码条件），扩展列条件走索引签名 */
type DynamicDataQuery = DynamicFormNamespace.DynamicFormQuery & Record<string, any>;
type FormFilterModel = ApiCommon.RequestPage & { keyword: string } & Record<string, any>;
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
  tableCode: code,
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: [],
  orderBys: {}
});
// 报表下钻：/builder/{tableCode}?f_字段名=值 —— f_ 前缀查询参并入初始过滤（等值条件）
Object.keys(new URLSearchParams(window.location.search)).forEach(key => {
  if (key.startsWith('f_')) {
    const value = getQueryString(window.location.search, key);
    if (value !== null && value !== '') {
      formFilter[key.slice(2)] = value;
    }
  }
});
// 调用方预置过滤（AI「我的授课表」等场景）：与下钻同语义，并入初始查询
if (props.presetFilters) {
  Object.entries(props.presetFilters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formFilter[key] = value;
    }
  });
}
const pagination = reactive({
  page: defaultPageNum,
  pageSize: defaultPageSize,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30, 50, 100],
  itemCount: 0,
  prefix(info: DataTable.PaginationInfo) {
    return `总数: ${info.itemCount}条`;
  },
  onChange: (page: number) => {
    pagination.page = page;
    formFilter.pageNum = page;
    formFilter.pageSize = pagination.pageSize ? pagination.pageSize : defaultPageSize;
    getTableData(formFilter);
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = defaultPageNum;
    formFilter.pageNum = pagination.page;
    formFilter.pageSize = pageSize;
    getTableData(formFilter);
  }
});

function setTableData(data: any) {
  // 空结果时后端返回 list:null、total 是字符串（"0"），直接塞给表格/分页会
  // 保留旧数据渲染、总数显示不刷新，统一归一化
  const list = Array.isArray(data?.list) ? data.list : [];
  const total = Number(data?.total ?? 0);
  // 配置了子表字段显示时按子表行展开（主表字段以合并行呈现）
  tableData.value = expandSubTableRows(list);
  pagination.itemCount = total;
  tableKey.value = `${total}_${list.length}_${list[0]?.id ?? ''}`;
}

/** 列配置中的子表字段（filedCode=子表字段.行内列名）：存在时列表进入展开模式 */
const subTableColumns = computed(() =>
  (formColumns.value as any[]).filter(col => String(col.filedCode ?? '').includes('.'))
);

/** 行内字段取值：精确键 → 归一化键匹配（设计器 field 的分隔符混用连字符/下划线，
 * 如 user-select_7065；后端补记列名与快照键的分隔符可能不一致）→ 驼峰 逐级回退 */
function pickRowCase(obj: any, column: string) {
  if (obj[column] !== undefined) return obj[column];
  const target = normalizeFieldCode(column);
  for (const key of Object.keys(obj)) {
    if (normalizeFieldCode(key) === target) {
      return obj[key];
    }
  }
  const camel = column.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
  return obj[camel];
}

/**
 * 按子表行展开主表行：每条主表数据生成 max(1, 子表行数) 个显示行，
 * 首行携带 spanStart/spanSize 供主表字段列 rowSpan 合并；子表列逐行填值。
 * 数据源为主表行的子表 JSON 快照列（与子表表数据同源同步）。
 */
function expandSubTableRows(list: any[]) {
  const subs = subTableColumns.value;
  if (!subs.length) return list;
  const out: any[] = [];
  list.forEach((row, groupIndex) => {
    let childRows: any[] = [];
    // filedCode 里的子表字段是设计器原名（可含连字符），主表数据列名已归一为下划线
    const snapshot = row[normalizeFieldCode(String(subs[0].filedCode).split('.')[0])];
    try {
      const parsed = typeof snapshot === 'string' ? JSON.parse(snapshot || 'null') : null;
      if (Array.isArray(parsed)) childRows = parsed;
    } catch {
      childRows = [];
    }
    const size = Math.max(1, childRows.length);
    for (let i = 0; i < size; i += 1) {
      const flat: any = {
        ...row,
        spanStart: i === 0,
        spanSize: size,
        groupNo: groupIndex + 1,
        expandedRowKey: `${row.id}_${i}`
      };
      subs.forEach(sub => {
        const [, column] = String(sub.filedCode).split('.');
        // 行内列名同样归一（设计器字段编码可含连字符），取不到值时回退驼峰
        flat[sub.filedCode] = i < childRows.length ? pickRowCase(childRows[i], normalizeFieldCode(column)) : null;
      });
      out.push(flat);
    }
  });
  return out;
}

function rowKey(rowData: any) {
  return rowData.expandedRowKey ?? rowData.id;
}

/** 数值类列（int/bigint/decimal）：后端动态查询按 [min, max] 范围解析，不接受标量。
    注意不含 TINYINT——开关列走精确匹配 */
const numericColumnCodes = computed(() => {
  const codes = new Set<string>();
  (formColumns.value as any[]).forEach(col => {
    if (/^(int|bigint|decimal)$/i.test(String(col?.filedType ?? ''))) {
      codes.add(col.filedCode);
    }
  });
  return codes;
});

/** 字段编码归一化：驼峰转下划线、连字符转下划线、统一小写（userName→user_name） */
function normalizeFieldCode(name: any) {
  return String(name ?? '')
    .replace(/-/g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * 上传字段列渲染：图片字段显示缩略图（点击预览），附件字段显示附件数量标识（点击下载）
 * 组件存储格式为逗号分隔的文件 URL 字符串
 */
function renderUploadCell(value: any, uploadType: string) {
  const urls = String(value ?? '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  if (!urls.length) {
    return <span style={{ color: '#c2c2c2' }}>-</span>;
  }
  if (uploadType === 'upload-image') {
    return (
      <ElSpace size={4} wrap={false} alignment="center">
        {urls.slice(0, 3).map(url => (
          <ElImage
            key={url}
            src={url}
            fit="cover"
            lazy
            style={{ width: '36px', height: '36px', borderRadius: '4px', flexShrink: 0 }}
          />
        ))}
        {urls.length > 3 ? <span style={{ color: '#999', fontSize: '12px' }}>+{urls.length - 3}</span> : null}
      </ElSpace>
    );
  }
  return (
    <ElButton text type="primary" onClick={() => window.open(urls[0], '_blank')}>
      附件 {urls.length} 个
    </ElButton>
  );
}

/** 筛选控件类型判定：跟随表单组件类型，无组件信息时按列类型兜底 */
function filterKind(item: any): 'select' | 'switch' | 'number' | 'date' | 'relation' | 'text' {
  const t = String(item.componentType ?? '');
  if (t === 'radio' || t === 'select' || t === 'checkbox') return 'select';
  if (t === 'switch') return 'switch';
  if (t === 'number' || t === 'input-number') return 'number';
  if (t === 'date-picker' || t === 'date' || t === 'datetime') return 'date';
  // 关联表单/关联属性：值存的是被关联记录 id，渲染成关联记录下拉（文本框对 id 做 LIKE 查不中）
  if (t === 'relation-attr' || t === 'relation-backfill') return 'relation';
  // 无组件信息时按列类型兜底：datetime 列必须范围查询，数值列范围查询
  const ft = String(item.filedType ?? '').toLowerCase();
  if (ft === 'datetime' || ft === 'time') return 'date';
  if (/^(int|bigint|decimal)$/i.test(ft)) return 'number';
  return 'text';
}

/** 过滤条件的关联记录下拉：按筛选字段上的 relation 配置懒加载被关联表记录（value=记录 id） */
const { loadRelationRows, relationOptionsFor } = useRelationOptions(() => code);

function relationFilterOptions(item: any) {
  const relation = pickRelation(item);
  return relation ? relationOptionsFor(relation) : [];
}

/** 查询条件的默认值：列配置的 queryDefaultValue 按筛选控件类型预填查询面板
 * （文本/下拉直接赋值，开关转 0/1，数字/日期填范围最小值位） */
function applyQueryDefault(item: any) {
  const def = item.queryDefaultValue;
  if (def === undefined || def === null || String(def) === '') return;
  const kind = filterKind(item);
  const fieldCode = item.filedCode;
  if (kind === 'switch') {
    formFilter[fieldCode] = String(def) === '1' || def === 1 ? 1 : 0;
  } else if (kind === 'number' || kind === 'date') {
    setRangeBound(fieldCode, 0, kind === 'number' ? Number(def) : (def as any));
  } else if (item.multiple === true) {
    // 多选筛选（复选框）的默认值按逗号拆成数组，NSelect 多选值必须是数组
    formFilter[fieldCode] = String(def)
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
  } else {
    formFilter[fieldCode] = def;
  }
}

/** 列配置的默认排序：取 order_dir 配置的字段（UI 上互斥，最多一个），转后端 orderBys 结构 */
function defaultOrderBys() {
  const sortedCol = (formColumns.value as any[]).find(
    col => String(col.orderDir ?? '').toUpperCase() === 'ASC' || String(col.orderDir ?? '').toUpperCase() === 'DESC'
  );
  return sortedCol ? { [sortedCol.filedCode]: String(sortedCol.orderDir).toLowerCase() } : {};
}

/** 数字范围第 idx 位（0 最小 / 1 最大） */
function rangeBound(fieldCode: string, idx: 0 | 1) {
  const v = formFilter[fieldCode];
  return Array.isArray(v) ? (v[idx] ?? null) : null;
}

function setRangeBound(fieldCode: string, idx: 0 | 1, v: number | null) {
  const cur = Array.isArray(formFilter[fieldCode]) ? [...formFilter[fieldCode]] : [null, null];
  cur[idx] = v;
  formFilter[fieldCode] = cur.every(x => x === null || x === undefined) ? null : cur;
}

/** 开关筛选：EP ElSwitch 回传 boolean | string | number，统一落成 0/1 再上送后端 */
function setSwitchFilter(fieldCode: string, value: string | number | boolean) {
  formFilter[fieldCode] = value ? 1 : 0;
}

/**
 * 组装查询参数：
 * 1. 剔除空值（''/null/undefined）——空字符串发给数值/范围列会触发
 *    String cannot be cast to List 的 500，未填写的条件不应上送；
 * 2. 数值列单值包装成等值范围 [v, v]；范围数组必须两端都有值（后端取 list.get(0/1)），
 *    只填一端的范围丢弃；多选数组（字符串列 IN 查询）原样上送
 */
function sanitizeQuery(dataQuery: Record<string, any>): DynamicDataQuery {
  const cleaned: Record<string, any> = {};
  Object.entries(dataQuery).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;
    if (!numericColumnCodes.value.has(key)) {
      cleaned[key] = value;
      return;
    }
    if (Array.isArray(value)) {
      if (value.length === 2 && value.every(v => v !== null && v !== undefined && v !== '')) {
        cleaned[key] = value.map(v => Number(v));
      }
      return;
    }
    const num = Number(value);
    if (Number.isFinite(num)) {
      cleaned[key] = [num, num];
    }
  });
  return cleaned as DynamicDataQuery;
}

/** 请求序号：列配置晚于数据就绪时会触发重查，旧请求的晚到响应直接丢弃，防止覆盖展开结果 */
let querySeq = 0;

async function getTableData(dataQuery: FormFilterModel) {
  querySeq += 1;
  const seq = querySeq;
  startLoading();
  try {
    const { data } = await findDynamicFormDataList(sanitizeQuery(dataQuery));
    if (seq !== querySeq) {
      return;
    }
    let result: { list: any[]; total: number } = { list: [], total: 0 };
    if (data) {
      result = data;
    }
    setTableData(result);
  } finally {
    // 请求异常时也必须复位 loading，否则列表永久转圈
    endLoading();
  }
}

/**
 * 列表列配置类型：公共 DataTable.Column 未声明子表展开合并所需的 rowSpan（EP 版 data-table.vue
 * 目前也没有 span-method 消费点），这里用本地交叉类型补齐，不改公共 typings。
 */
type ListColumn = DataTable.Column<any> & {
  rowSpan?: (row: any, index: number) => number;
  type?: 'selection' | 'expand';
};

/**
 * 动态列表的排序由服务端完成（上送 orderBys）：列上 sorter: true 只负责渲染表头排序入口，
 * 点击后组件 emit update:sorter，由 handleUpdateSorter → dynamicOrderByColumn 写 orderBys 重新查询，
 * 前端不再对已按服务端顺序返回的行（尤其是子表展开的合并行）二次排序
 */
const columns: Ref<ListColumn[]> = ref([
  {
    type: 'selection',
    width: 60,
    align: 'center'
  },
  {
    key: 'index',
    title: '序号',
    align: 'left',
    width: 60,
    // 展开模式序号列合并（组首行跨 spanSize 行）；普通模式行无展开标记，返回 1 不合并。
    // 初始列定义在列配置加载前构建，不能用 expandActive 固化开关，须在回调里按行判断
    rowSpan: (row: any) => {
      if (row?.spanSize === undefined) return 1;
      return row.spanStart ? row.spanSize : 0;
    },
    render(row: any, index: number) {
      // 展开模式显示主表数据组号（合并行共享一个序号），普通模式为行号
      return row?.groupNo ?? index + 1;
    }
  }
]) as Ref<ListColumn[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<any | null>(null);

function setEditData(data: any | null) {
  editData.value = data;
}

/** 新增 */
function handleAddTable() {
  openModal();
  setModalType('add');
}

/** 编辑 */
function handleEditTable(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    setEditData(findItem);
  }
  setModalType('edit');
  openModal();
}

/** 单行删除（删除动态表数据，非表单定义） */
function handleDeleteTable(rowId: string) {
  window.$dialog?.warning({
    title: '删除确认',
    content: '确定要删除该条数据吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      delDynamicFormData(rowId, formData.value.tableCode).then(res => {
        if (res.error === null) {
          window.$message?.success('删除成功');
          search();
        }
      });
    }
  });
}

/** ===== 行数据流程记录弹窗（复用流程模块组件） ===== */
const flowModalVisible = ref(false);
const flowModalBusinessId = ref('');
const flowModalRowSummary = ref('');

/** 查看该行数据的流程流转记录（按业务 id 解析实例） */
function handleShowFlow(row: any) {
  flowModalBusinessId.value = String(row.id);
  // 行摘要取第一个业务字段的值（跳过审计列），便于在弹窗标题里认出这条数据
  const summaryField = Object.keys(row).find(
    key =>
      ![
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
        'remark',
        'flowStatus'
      ].includes(key) &&
      row[key] !== null &&
      row[key] !== ''
  );
  flowModalRowSummary.value = summaryField ? String(row[summaryField]) : '';
  flowModalVisible.value = true;
}
/** 业务数据 status（后端 WorkflowDataStatus）：0草稿 1已完成 2流程中 3已取消 */
const DATA_STATUS_DRAFT = 0;
const DATA_STATUS_RUNNING = 2;

/** 发起/重启流程：草稿数据按表单绑定发起；已结束（完成/取消）的数据重新发起一条新实例 */
function handleStartFlow(row: any, restart: boolean) {
  window.$dialog?.info({
    title: restart ? '重启流程' : '发起流程',
    content: restart
      ? `该数据的流程已结束，确定重新发起一条新的${formData.value.tableName || '数据'}审批吗？原流程记录保留可查。`
      : `确定按表单绑定的流程发起这条${formData.value.tableName || '数据'}的审批吗？已在流转中的数据不会重复发起。`,
    positiveText: restart ? '重启' : '发起',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await startDynamicDataFlow(code, String(row.id));
      if (error === null) {
        window.$message?.success(restart ? '已重新发起流程' : '已发起流程');
        search();
      }
    }
  });
}
/** 多行删除 */
function handleDeleteRows() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error('请选择要删除的数据！');
    return;
  }
  window.$dialog?.warning({
    title: '删除确认',
    content: `确定要删除选中的 ${checkedRowKeys.value.length} 条数据吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      // 后端 /dbs/open/dynamic/{tableName}/{id} 仅支持单条删除，批量时逐条删除
      Promise.all(checkedRowKeys.value.map(id => delDynamicFormData(id, formData.value.tableCode))).then(results => {
        checkedRowKeys.value = [];
        if (results.some(res => res.error !== null)) {
          window.$message?.error('部分数据删除失败，请重试');
        } else {
          window.$message?.success('删除成功');
        }
        search();
      });
    }
  });
}

/**
 * 某列的排序处理：动态列表按 orderBys（列编码 → asc/desc）上送，
 * 子表列（编码含点）由后端转成子表极值子查询排序
 *
 * @param sorter
 */
function handleUpdateSorter(sorter: DataTable.SortState | DataTable.SortState[] | null) {
  formFilter.orderBys = dynamicOrderByColumn(columns.value as any[], sorter);
  getTableData(formFilter);
}
/**
 * 单独某列的点击的处理
 *
 * @param row
 */
function tableColumnClick(row: DynamicFormNamespace.DynamicFormForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}

/** 重置搜索 */
function resetForm() {
  clearSearch();
}

/** 清空模糊搜索 */
function clearSearch() {
  Object.keys(formFilter).forEach(field => {
    if (field === 'pageNum') {
      formFilter[field] = defaultPageNum;
      return;
    }
    // pageSize 与 tableCode（定位动态表的必要参数）重置不清掉
    if (field === 'pageSize' || field === 'tableCode') {
      return;
    }
    if (field === 'orderBys') {
      formFilter[field] = {};
      return;
    }
    formFilter[field] = null;
  });
  // 重置 = 回到列配置的初始态：查询条件的默认值重新预填，默认排序恢复
  listFilter.value.forEach(item => applyQueryDefault(item));
  formFilter.orderBys = defaultOrderBys() as any;
  // 排序表头是受控状态，重置查询要一并恢复默认排序标记
  columns.value.forEach(column => {
    if ((column as any).sorter === undefined) return;
    const dir = (defaultOrderBys() as any)[String((column as any).key)];
    let sortOrder: DataTable.SortState['order'] = false;
    if (dir === 'asc') {
      sortOrder = 'ascend';
    } else if (dir === 'desc') {
      sortOrder = 'descend';
    }
    (column as any).sortOrder = sortOrder;
  });

  getTableData(formFilter);
}

/** 模糊搜索 */
function keywordSearch() {
  if (formFilter.keyword !== null && formFilter.keyword !== '' && formFilter.keyword !== undefined) {
    formFilter.keywords = formFilter.keyword.split(' ');
  }
  getTableData(formFilter);
}

/**
 * 显示详情关闭的回调函数
 *
 * @param value 弹窗内是否发生过保存，保存过才需要重查列表
 */
function handleClose(value: boolean) {
  if (value) {
    getTableData(formFilter);
  }
}

/**
 * 回调推送选择的数据
 *
 * @param keys
 * @param rows
 * @param meta
 */
function handleChangeChecked(
  _keys: Array<string | number>,
  rows: DynamicFormNamespace.DynamicFormForm[],
  _meta: { row: object | undefined; action: 'check' | 'uncheck' | 'checkAll' | 'uncheckAll' }
) {
  emit('change', rows);
}

function search() {
  getTableData(formFilter);
}

/** ===== 自定义列表页（metaData.customView.list 启用时整页替换默认渲染） ===== */

const customListView = ref<{ source: string } | null>(null);
const customPageApi = ref<ReturnType<typeof buildCustomViewPageApi> | null>(null);

/** 传给自定义列表页的上下文（pageApi 由 findForm 按当前表单构建） */
const customListContext = computed(() => ({
  tableCode: code,
  formName: formData.value.tableName,
  fields: customPageApi.value?.fields ?? [],
  columns: formColumns.value,
  perm: customPageApi.value?.perm,
  pageApi: customPageApi.value
}));

/**
 * 查询表单
 *
 * @param codeForm 表单编码
 */
function findForm(codeForm: string) {
  findDynamicFormByCode(codeForm).then(res => {
    if (res.error === null) {
      formData.value = res.data;
      // 自定义列表页配置：启用即替换默认渲染，数据/弹窗仍走本页原有链路（openAdd/openEdit/refresh 回调）
      const customView = (res.data.metaData as any)?.customView;
      if (customView?.list?.enabled && customView.list.source) {
        customListView.value = { source: String(customView.list.source) };
        customPageApi.value = buildCustomViewPageApi({
          tableCode: codeForm,
          formName: res.data.tableName,
          metaData: res.data.metaData,
          actions: {
            openAdd: () => handleAddTable(),
            openEdit: row => handleEditTable(String(row?.id)),
            openView: row => tableColumnClick(row as DynamicFormNamespace.DynamicFormForm),
            refresh: () => search()
          }
        });
      } else {
        customListView.value = null;
        customPageApi.value = null;
      }
      // 表单 id 缺失说明该编码没有对应表单配置，列/打印/导入导出配置都无需加载
      const formId = formData.value.id;
      if (formId) {
        findFormColumn(formId);
        loadPrintTemplateFlag(formId);
        loadIoConfig(formId);
      }
    }
  });
}

// ---------------- 导入导出（高级设置 → 导入/导出 配置驱动，§4.2 T1）----------------

const ioConfig = ref<AdvancedNamespace.IoConfig | null>(null);

/** 列表工具栏「导入」按钮：高级设置开启 importEnabled 才显示 */
const ioImportEnabled = computed(() => String(ioConfig.value?.importEnabled ?? 'N') === 'Y');
/** 列表工具栏「导出」按钮：高级设置开启 exportEnabled 才显示 */
const ioExportEnabled = computed(() => String(ioConfig.value?.exportEnabled ?? 'N') === 'Y');

function loadIoConfig(formId: string) {
  getIoConfig(formId).then(res => {
    if (res.error === null) {
      ioConfig.value = res.data ?? null;
    }
  });
}

/** 浏览器下载 Blob 的统一入口（Excel/PDF 同款） */
function downloadBlob(blob: Blob, fileName: string) {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

/** 导出：body 与列表查询同口径（sanitizeQuery 归一），去掉分页=全量导出 */
async function handleExportData() {
  if (!formData.value.id) return;
  try {
    // 全量导出：分页参数置 undefined，sanitizeQuery 会一并剔除（等价于不带上送）
    const query = sanitizeQuery({ ...formFilter, pageNum: undefined, pageSize: undefined });
    const { data, error } = await exportIoData(String(formData.value.id), query);
    if (error || !data) {
      window.$message?.error('导出失败，请重试');
      return;
    }
    downloadBlob(data, `${formData.value.tableName ?? code}-导出-${Date.now()}.xlsx`);
    window.$message?.success('导出成功，已开始下载');
  } catch {
    window.$message?.error('导出失败，请重试');
  }
}

const importVisible = ref(false);
const importSubmitting = ref(false);
const importFile = ref<File | null>(null);
/** 导入任务进度：null=未开始/已重置 */
const importTask = ref<{
  taskId: string;
  total: number;
  processed: number;
  success: number;
  skipped: number;
  failed: number;
  finished: boolean;
} | null>(null);
let importTimer: ReturnType<typeof setInterval> | null = null;

/** ElProgress 状态：进行中用默认色（EP 空串），完成后按失败行数给 warning/success */
const importProgressStatus = computed<'' | 'success' | 'exception' | 'warning'>(() => {
  if (!importTask.value?.finished) return '';
  return importTask.value.failed > 0 ? 'warning' : 'success';
});

function openImportModal() {
  importFile.value = null;
  importTask.value = null;
  importVisible.value = true;
}

function closeImportModal() {
  if (importTimer) {
    clearInterval(importTimer);
    importTimer = null;
  }
  importVisible.value = false;
}

/** ElUpload 的 change 回调：单文件导入，直接取本次变更文件的原生 File */
function onImportFileChange(uploadFile: UploadFile) {
  importFile.value = uploadFile.raw ?? null;
}

/** 下载导入模板（两 Sheet：数据+说明） */
async function handleTemplateDownload() {
  if (!formData.value.id) return;
  const { data, error } = await fetchIoTemplate(String(formData.value.id));
  if (error || !data) {
    window.$message?.error('模板下载失败，请重试');
    return;
  }
  downloadBlob(data, `import-template-${formData.value.tableName ?? code}.xlsx`);
}

/** 上传并轮询进度；结束后刷新列表，失败行可下载报告 */
function submitImport() {
  if (!formData.value.id || !importFile.value) {
    window.$message?.warning('请先选择 .xlsx 文件');
    return;
  }
  importSubmitting.value = true;
  uploadIoImport(String(formData.value.id), importFile.value)
    .then(({ data, error }) => {
      if (error || !data?.taskId) {
        window.$message?.error(error?.message ?? '导入发起失败');
        return;
      }
      importTask.value = {
        taskId: data.taskId,
        total: data.total ?? 0,
        processed: 0,
        success: 0,
        skipped: 0,
        failed: 0,
        finished: false
      };
      window.$message?.success(`导入任务已提交，共 ${data.total ?? 0} 行`);
      if (importTimer) clearInterval(importTimer);
      importTimer = setInterval(() => pollImportProgress(), 1000);
    })
    .finally(() => {
      importSubmitting.value = false;
    });
}

function pollImportProgress() {
  if (!importTask.value) return;
  fetchIoImportProgress(importTask.value.taskId)
    .then(({ data, error }) => {
      if (error || !data) return;
      importTask.value = { ...importTask.value, ...data };
      if (data.finished) {
        if (importTimer) {
          clearInterval(importTimer);
          importTimer = null;
        }
        window.$message?.success(`导入完成：成功 ${data.success}，跳过 ${data.skipped}，失败 ${data.failed}`);
        getTableData(formFilter);
      }
    })
    .catch(() => {
      if (importTimer) {
        clearInterval(importTimer);
        importTimer = null;
      }
    });
}

/** 下载失败行报告（可修改后重新导入） */
async function handleImportReportDownload() {
  if (!importTask.value?.taskId) return;
  const { data, error } = await fetchIoImportReport(importTask.value.taskId);
  if (error || !data) {
    window.$message?.error('报告下载失败，请重试');
    return;
  }
  downloadBlob(data, `import-report-${importTask.value.taskId}.xlsx`);
}

async function findFormColumn(formId: string) {
  const res = await findDynamicFormColumnList({ formId, pageNum: 1, pageSize: 10000 });
  if (res.error !== null) return;
  const rawColumns = (res.data.list ?? []) as any[];
  // 后端把数字序列化成字符串（"0"/"1"），truthy 判断会让"不显示"的配置失效，先归一化
  formColumns.value = rawColumns.map(item => ({
    ...item,
    showList: Number(item.showList ?? 0),
    showQuery: Number(item.showQuery ?? 0)
  }));

  // 列配置的默认排序：查询请求带上，同时给对应列头亮排序箭头
  const orderBys = defaultOrderBys();
  const orderDirMap = Object.fromEntries(
    Object.entries(orderBys).map(([fieldCode, dir]) => [fieldCode, dir === 'asc' ? 'ascend' : 'descend'])
  );
  if (Object.keys(orderBys).length > 0) {
    formFilter.orderBys = orderBys as any;
  }

  // 组件清单统一走公共收集器：设计器物化的 inputComponents 优先，
  // API 直存的 metaData（只有 schemas）深度遍历兜底——否则这类表单的列表全部裸显存储值
  const inputList = collectFormComponents(formData.value?.metaData);
  // 表单字段编码可能是驼峰（userName），列编码是下划线（user_name），归一化后匹配
  const compOf = (filedCode: string) =>
    (inputList as any[]).find(c => normalizeFieldCode(c.field) === normalizeFieldCode(filedCode));

  // 一次性构建全部列的翻译器（选项/开关/人员/部门/工作流状态/颜色），需要的远程字典在此并发预热。
  // 子表行内字段（列配置 filedCode=子表字段.行内列名）也按其组件类型建翻译器，供子表列展开值翻译
  const subTableRowFields = rawColumns
    .filter(item => String(item.filedCode ?? '').includes('.'))
    .map(item => {
      const rowField = String(item.filedCode).split('.')[1];
      return { filedCode: rowField, comp: compOf(rowField) ?? null };
    });
  const translators = await createFieldTranslators(
    rawColumns
      .map(item => ({ filedCode: item.filedCode, comp: compOf(item.filedCode) ?? null }))
      .concat(subTableRowFields),
    code
  );

  // 展开模式（配置了子表显示字段）：主表字段/序号/操作列按子表行组合并单元格
  const expandActive = subTableColumns.value.length > 0;
  if (expandActive) {
    columns.value = columns.value.filter(col => col.type !== 'selection');
  }
  const mainRowSpan = expandActive ? (row: any) => (row.spanStart ? row.spanSize : 0) : undefined;

  // 子表 JSON 快照列（主表 TEXT 列存行数组）是存储兼容列：值是整段 JSON，
  // 展示走「子表字段.行内列名」的点号列，这里不渲染也不进筛选面板
  const subTableSnapshotCodes = new Set(
    (inputList as any[]).filter(c => c.type === 'sub-table').map(c => normalizeFieldCode(c.field))
  );

  rawColumns.forEach(item => {
    if (subTableSnapshotCodes.has(normalizeFieldCode(String(item.filedCode ?? '')))) {
      return;
    }
    // 列表添加列
    if (Number(item.showList) === 1) {
      // 子表字段（filedCode=子表字段.行内列名）：按展开行逐行显示，值按行内组件类型翻译（人员→姓名、颜色→色块）
      if (String(item.filedCode ?? '').includes('.')) {
        const rowField = String(item.filedCode).split('.')[1];
        const translateRowField = translators[rowField];
        columns.value.push({
          key: item.filedCode,
          title: item.filedName,
          align: 'left',
          sorter: true,
          ellipsis: true,
          render: (row: any) => {
            const value = row[item.filedCode];
            if (value === null || value === undefined || value === '') return '-';
            return translateRowField ? translateRowField(value) : String(value);
          }
        });
      } else if (item.filedCode === 'title') {
        columns.value.push({
          key: item.filedCode,
          title: item.filedName,
          align: 'left',
          rowSpan: mainRowSpan,
          sorter: true,
          sortOrder: (orderDirMap as any)[item.filedCode],
          ellipsis: true,
          render: row => {
            return (
              <TableColumnLink
                value={row}
                name={row[item.filedCode]}
                onClick={() => tableColumnClick(row)}
              ></TableColumnLink>
            );
          }
        });
      } else {
        let filedKey = item.filedCode;
        if (item.filedCode === 'created_by') {
          filedKey = 'created_name';
        } else if (item.filedCode === 'department_id') {
          filedKey = 'department_name';
        } else {
          // 列配置可能存的是设计器原始编码（如 upload-image_xxx 含连字符），
          // 物理数据列是规范化后的下划线名，读值前归一，否则恒取空
          filedKey = normalizeFieldCode(item.filedCode);
        }
        // 上传字段（图片/附件）：渲染缩略图/附件标识，替代纯文本 URL
        const comp = compOf(item.filedCode);
        if (comp && ['upload-image', 'upload-file'].includes(comp.type)) {
          const uploadType = comp.type;
          columns.value.push({
            key: filedKey,
            title: item.filedName,
            align: 'left',
            width: 160,
            rowSpan: mainRowSpan,
            render: (row: any) => renderUploadCell(row[filedKey], uploadType)
          });
        } else {
          // 选项/开关/人员/部门/状态列：按翻译层把编码翻译成展示名称
          const translate = translators[item.filedCode];
          // created_by/department_id 列显示的是翻译名（created_name/department_name），
          // 不是数据库列，按它排序会报未知列；归一后与列编码一致的才给排序入口
          const isRealColumn = filedKey === normalizeFieldCode(item.filedCode);
          columns.value.push({
            key: filedKey,
            title: item.filedName,
            align: 'left',
            rowSpan: mainRowSpan,
            sorter: isRealColumn ? true : undefined,
            sortOrder: isRealColumn ? (orderDirMap as any)[item.filedCode] : undefined,
            ellipsis: true,
            render: translate ? (row: any) => translate(row[filedKey]) : undefined
          });
        }
      }
    }

    // 添加配置的过滤条件
    if (Number(item.showQuery) === 1) {
      const comp = compOf(item.filedCode);
      if (comp) {
        listFilter.value.push({
          ...comp,
          filedCode: item.filedCode,
          filedName: item.filedName ?? comp.componentProps?.label,
          filedType: item.filedType,
          queryDefaultValue: item.queryDefaultValue,
          // 筛选控件类型跟随表单组件：单选/下拉→单选下拉、复选→多选下拉、开关→开关、数字→范围
          componentType: comp.type,
          options: comp.componentProps?.options,
          multiple: comp.type === 'checkbox' || comp.componentProps?.multiple === true
        });
      } else {
        listFilter.value.push({ ...item, componentType: '' });
      }
      // 查询条件的默认值：查询面板自动预填配置值（数字/日期范围填最小值位）
      applyQueryDefault(item);
    }
  });

  appendActionColumn();
  // 数据标题列默认排在业务列第一（选择/序号列之后，其它字段之前）；
  // 标题是行标识列，无论列表配置是否勾选都显示
  const hasTitleCol = columns.value.some(col => (col as any).key === 'title');
  if (!hasTitleCol) {
    // 与勾选了标题列的配置分支同款渲染：标题可点击弹出详情（对所有表单统一生效）
    columns.value.splice(columns.value.some(col => (col as any).type === 'selection') ? 2 : 1, 0, {
      key: 'title',
      title: '数据标题',
      align: 'left',
      rowSpan: mainRowSpan,
      sorter: true,
      ellipsis: true,
      render: row => (
        <TableColumnLink value={row} name={row.title} onClick={() => tableColumnClick(row)}></TableColumnLink>
      )
    });
  }
  const titleIndex = columns.value.findIndex(col => (col as any).key === 'title');
  if (titleIndex > 0) {
    const titleCol = columns.value[titleIndex];
    columns.value.splice(titleIndex, 1);
    const businessFirst = columns.value.some(col => (col as any).type === 'selection') ? 2 : 1;
    columns.value.splice(businessFirst, 0, titleCol);
  }
  groupSubTableColumns();
  // 首次加载时列配置晚于数据到达：子表展开依赖列配置，列就绪后重查一次展开；
  // 配置了默认排序时首次查询没有带 orderBys（列配置晚到），同样补查一次让默认排序生效
  if (expandActive || Object.keys(defaultOrderBys()).length > 0) {
    getTableData(formFilter);
  }
}

/**
 * 子表列多级表头：点号列（filedCode=子表字段.行内列名）从平铺列抽出，按子表字段分组为
 * 「子表名跨列 + 行内字段名子列」的两级表头；1 对多的行由 expandSubTableRows 展开、
 * 主表字段列 rowSpan 合并。行内子列标题优先取组件 label（filedName 是「子表名-字段名」拼好的）。
 */
function groupSubTableColumns() {
  const isDotted = (col: any) => String(col?.key ?? '').includes('.');
  const dottedCols = columns.value.filter(isDotted) as ListColumn[];
  if (!dottedCols.length) return;
  const inputList = collectFormComponents(formData.value?.metaData) as any[];
  const subOf = (prefix: string) =>
    inputList.find(c => c.type === 'sub-table' && normalizeFieldCode(c.field) === normalizeFieldCode(prefix));
  const rowFieldOf = (prefix: string, column: string) =>
    inputList.find(c => c.type !== 'sub-table' && normalizeFieldCode(c.field) === normalizeFieldCode(column));
  // 子表快照列记录（filedCode=子表字段，无点号）承载列表设计里改的组头名
  const subRowOf = (prefix: string) =>
    (formColumns.value as any[]).find(
      col =>
        !String(col.filedCode ?? '').includes('.') && normalizeFieldCode(col.filedCode) === normalizeFieldCode(prefix)
    );

  // 按首次出现顺序分组成 Map（子表前缀 → 该子表的点号列），再生成组列
  const groups = new Map<string, ListColumn[]>();
  dottedCols.forEach(col => {
    const prefix = String(col.key).split('.')[0];
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix)!.push(col);
  });
  const groupColumns: any[] = [...groups.entries()].map(([prefix, cols]) => {
    const subComp = subOf(prefix);
    const subLabel = subComp?.label ?? prefix;
    // 组头名：列表设计里改过的快照列 filedName（≠设计器 label）优先，否则跟随子表组件 label；
    // 组件信息缺失时 filedName 是唯一可读名源，直接用它
    const subFiledName = String(subRowOf(prefix)?.filedName ?? '').trim();
    const groupTitle = subFiledName && (!subComp || subFiledName !== subComp.label) ? subFiledName : subLabel;
    return {
      key: `__subtable_${prefix}`,
      title: groupTitle,
      align: 'center',
      children: cols.map(col => {
        const anyCol = col as any;
        const column = String(anyCol.key).split('.')[1] ?? '';
        const rowComp = rowFieldOf(prefix, column);
        if (!rowComp) {
          // 行内组件信息缺失（metaData 只有列配置）：filedName 是「子表label-字段label」拼好的，剥前缀兜底
          const fallback = String(anyCol.title ?? '').startsWith(`${subLabel}-`)
            ? String(anyCol.title).slice(subLabel.length + 1)
            : anyCol.title;
          return { ...anyCol, title: fallback };
        }
        // 列表设计里改过的 filedName（≠后端自动默认「子表label-行内label」）优先显示，
        // 未改过则跟随设计器 label；清空 filedName 即恢复跟随
        const filedName = String(anyCol.title ?? '').trim();
        const expected = `${subComp?.label ?? prefix}-${rowComp.label}`;
        return { ...anyCol, title: filedName && filedName !== expected ? filedName : rowComp.label };
      })
    };
  });
  // 组列插到第一个点号列原本的位置，其余点号列移除
  const firstDottedIndex = columns.value.findIndex(isDotted);
  columns.value = columns.value.filter(col => !isDotted(col));
  columns.value.splice(Math.min(firstDottedIndex, columns.value.length), 0, ...(groupColumns as any));
}

/**
 * 单据打印运行时入口（plan-sheet-print §3.3/§5 M5）：
 * 模板下拉（默认模板优先）→ /back/print/data 全量勾选 id 取数（行级范围服务端收口）→
 * 前端 renderDocHtml 渲染 → preview.ts 隐藏 iframe 打印；PDF 走 /back/print/pdf。
 */
const printModalVisible = ref(false);
const printRowIds = ref<string[]>([]);
const printTemplates = ref<AdvancedNamespace.DocTemplate[]>([]);
const printTemplateCode = ref<string | null>(null);
const printLoading = ref(false);

/**
 * 运行态临时参数（plan-sheet-print §8-③）：模板 params_json 定义 [{field,op,label,default}]，
 * 在打印弹窗里可改并据此重新取数，不改模板本身。
 */
interface PrintParamField {
  field: string;
  op: string;
  label: string;
  value: string;
}
const printParams = ref<PrintParamField[]>([]);

function parsePrintParams(template?: AdvancedNamespace.DocTemplate | null): PrintParamField[] {
  if (!template?.paramsJson) return [];
  try {
    const list = JSON.parse(template.paramsJson) as Array<{
      field?: string;
      op?: string;
      label?: string;
      default?: unknown;
    }>;
    if (!Array.isArray(list)) return [];
    return list
      .filter(item => item && item.field)
      .map(item => ({
        field: item.field as string,
        op: item.op || 'eq',
        label: item.label || (item.field as string),
        value: item.default === null || item.default === undefined ? '' : String(item.default)
      }));
  } catch {
    return [];
  }
}

/** 参数项全被清空时传空数组＝显式不过滤，与「模板没有参数定义所以不传」是两种语义 */
function currentPrintFilters(): PrintFilter[] | undefined {
  if (!printParams.value.length) return undefined;
  return printParams.value
    .filter(item => String(item.value ?? '').trim() !== '')
    .map(item => ({ field: item.field, op: item.op, value: item.value }));
}

function handlePrintTemplateChange() {
  printParams.value = parsePrintParams(
    printTemplates.value.find(item => item.templateCode === printTemplateCode.value)
  );
}

const printTemplateOptions = computed(() =>
  printTemplates.value
    .filter(item => (item.status ?? '1') === '1')
    .map(item => ({
      label: item.name + (item.templateType === 'SHEET' ? '（表格）' : '') + (item.isDefault === 'Y' ? '（默认）' : ''),
      value: item.templateCode!
    }))
);

/** 该表单是否已配置单据打印模板：决定「打印/批量打印」入口可见性 */
const hasPrintTemplate = ref(false);

async function loadPrintTemplateFlag(formId: string) {
  const { data } = await fetchDocTemplates(formId);
  hasPrintTemplate.value = Boolean(data && data.length);
}

async function openPrint(rowIds: string[]) {
  if (!rowIds.length) {
    window.$message?.warning('请先勾选要打印的数据');
    return;
  }
  if (!formData.value.id) return;
  const { data, error } = await fetchDocTemplates(formData.value.id);
  if (error || !data || !data.length) {
    window.$message?.warning('该表单还没有单据打印模板，请在表单设计器「高级设置 → 单据模板」新建');
    return;
  }
  printTemplates.value = data;
  const preferred = data.find(item => item.isDefault === 'Y' && (item.status ?? '1') === '1') ?? data[0];
  printTemplateCode.value = preferred.templateCode ?? null;
  printRowIds.value = rowIds;
  printParams.value = parsePrintParams(preferred);
  printModalVisible.value = true;
}

/** 取数 + 渲染；返回渲染结果与份数/明细行数，供 PDF 留痕带上计数。DOC/SHEET 两种模板在此分流 */
async function buildPrintDoc(): Promise<{ html: string; docs: number; detailRows: number } | null> {
  const template = printTemplates.value.find(item => item.templateCode === printTemplateCode.value);
  if (!template) {
    window.$message?.warning('请选择打印模板');
    return null;
  }
  const { data, error } = await fetchPrintData(template.templateCode!, printRowIds.value, currentPrintFilters());
  if (error || !data) return null;
  if (data.warnings?.length) {
    window.$message?.warning(
      `打印提示：${data.warnings[0]}${data.warnings.length > 1 ? `（共 ${data.warnings.length} 条）` : ''}`
    );
  }
  let printConfig: any = null;
  try {
    printConfig = template.printConfig ? JSON.parse(template.printConfig) : null;
  } catch {
    printConfig = null;
  }
  const docs = data.docs.map(doc => ({ main: doc.main, details: doc.details }));
  const out =
    template.templateType === 'SHEET'
      ? renderSheetPrint(template, docs, printConfig)
      : renderDocHtml({
          contentHtml: template.contentHtml,
          docs,
          printConfig,
          formName: formData.value.tableName || data.templateName
        });
  if (out.warnings.length) {
    window.$message?.warning(
      `渲染提示：${out.warnings[0]}${out.warnings.length > 1 ? `（共 ${out.warnings.length} 条）` : ''}`
    );
  }
  return {
    html: out.html,
    docs: data.docs.length,
    detailRows: Number(data.summary?.detailRows ?? 0)
  };
}

/** SHEET 模板渲染（utils/doc-print/sheet.ts，坏模板按错误提示回落不打印） */
function renderSheetPrint(
  template: AdvancedNamespace.DocTemplate,
  docs: Array<{ main: Record<string, any>; details: Record<string, any> }>,
  printConfig: any
): { html: string; warnings: string[] } {
  try {
    const sheet = template.contentSheet ? JSON.parse(template.contentSheet) : null;
    if (!sheet || !Array.isArray(sheet.celldata)) {
      return { html: '', warnings: ['表格模板数据损坏（contentSheet 缺少 celldata），请联系管理员重新保存模板'] };
    }
    return renderSheetHtml({ sheet, docs, printConfig, formName: formData.value.tableName || template.name });
  } catch {
    return { html: '', warnings: ['表格模板数据不是合法 JSON，请联系管理员重新保存模板'] };
  }
}

async function handlePrintOk() {
  printLoading.value = true;
  try {
    const rendered = await buildPrintDoc();
    if (rendered?.html) {
      printModalVisible.value = false;
      printHtmlDoc({ html: rendered.html });
    }
  } finally {
    printLoading.value = false;
  }
}

async function handlePrintPdf() {
  printLoading.value = true;
  try {
    const template = printTemplates.value.find(item => item.templateCode === printTemplateCode.value);
    const rendered = await buildPrintDoc();
    if (!rendered?.html || !template) return;
    const { data, error } = await fetchPrintPdf(rendered.html, template.templateCode ?? '', {
      docs: rendered.docs,
      detailRows: rendered.detailRows
    });
    if (error || !data) return;
    const blobUrl = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `doc-print-${template.templateCode ?? 'doc'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    window.$message?.success('PDF 已生成并开始下载');
    printModalVisible.value = false;
  } finally {
    printLoading.value = false;
  }
}

function handlePrintTable(rowId: string) {
  openPrint([rowId]);
}

/** 行内操作列：编辑 / 发起 / 流程 / 删除（受自动生成的 dynamic:{tableCode}:* 权限控制） */
/** 按可见按钮估算操作列宽（列宽写死时按钮一多最后一个必被裁切，「删除」只显示一半的根因） */
function estimateActionsWidth() {
  const actionLabels: string[] = [];
  if (hasAuth(`dynamic:${code}:edit`)) actionLabels.push('编辑');
  if (formData.value?.metaData && Number(formData.value.isWorkflow) === 1) {
    // 同一行「发起/重启」与「流程」最多同时出现 2 个
    actionLabels.push('重启', '流程');
  }
  if (hasAuth('dynamic:data:print') && formData.value.id && hasPrintTemplate.value) actionLabels.push('打印');
  if (hasAuth(`dynamic:${code}:remove`)) actionLabels.push('删除');
  return calcTableActionWidth(actionLabels);
}

function appendActionColumn() {
  const exists = columns.value.some(col => (col as any).key === 'actions');
  if (exists) return;
  const expandActive = subTableColumns.value.length > 0;
  columns.value.push({
    key: 'actions',
    title: '操作',
    align: 'center',
    width: estimateActionsWidth(),
    fixed: 'right',
    rowSpan: expandActive ? (row: any) => (row.spanStart ? row.spanSize : 0) : undefined,
    render: row => {
      const buttons: any[] = [];
      if (hasAuth(`dynamic:${code}:edit`)) {
        buttons.push(
          <ElButton text type="primary" onClick={() => handleEditTable(row.id)}>
            编辑
          </ElButton>
        );
      }
      // 表单开启流程后展示「流程」入口：查看该行数据的流程状态与流转记录
      if (formData.value?.metaData && Number(formData.value.isWorkflow) === 1) {
        // status=0 草稿给「发起」，已结束（1完成/3取消）给「重启」（新建一条流程实例），流程中不提供入口
        const dataStatus = Number(row.status);
        if (hasAuth(`dynamic:${code}:edit`) && dataStatus !== DATA_STATUS_RUNNING) {
          const restart = dataStatus !== DATA_STATUS_DRAFT;
          buttons.push(
            <ElButton text type="primary" onClick={() => handleStartFlow(row, restart)}>
              {restart ? '重启' : '发起'}
            </ElButton>
          );
        }
        buttons.push(
          <ElButton text type="info" onClick={() => handleShowFlow(row)}>
            流程
          </ElButton>
        );
      }
      if (hasAuth('dynamic:data:print') && formData.value.id && hasPrintTemplate.value) {
        buttons.push(
          <ElButton text type="primary" onClick={() => handlePrintTable(row.id)}>
            打印
          </ElButton>
        );
      }
      if (hasAuth(`dynamic:${code}:remove`)) {
        buttons.push(
          <ElButton text type="danger" onClick={() => handleDeleteTable(row.id)}>
            删除
          </ElButton>
        );
      }
      return buttons.length ? <ElSpace size={8}>{buttons}</ElSpace> : null;
    }
  });
}

// 打印模板标志晚于列构建到达时，操作列宽度要跟着补上「打印」按钮的宽度
watch(hasPrintTemplate, () => {
  const actionsCol = columns.value.find(col => (col as any).key === 'actions') as any;
  if (actionsCol) {
    actionsCol.width = estimateActionsWidth();
  }
});

onMounted(() => {
  // 初始化
  search();
  findForm(code);
});
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <!-- 自定义列表页：metaData.customView.list 启用时整页替换默认渲染（弹窗仍复用下方 DesignerFormModal） -->
        <CustomViewHost
          v-if="customListView && customPageApi"
          class="flex-1-hidden"
          :source="customListView.source"
          :context="customListContext"
        />
        <template v-else>
          <ListFilter
            v-model:keyword="formFilter.keyword"
            :permission-add="'dynamic:' + code + ':add'"
            :permission-remove="'dynamic:' + code + ':remove'"
            :permission-import="'dynamic:' + code + ':import'"
            :permission-export="'dynamic:' + code + ':export'"
            :operation-title="formData.tableName"
            :show-operation="showOperation"
            :show-export="ioExportEnabled"
            :show-import="ioImportEnabled"
            @add="handleAddTable"
            @delete="handleDeleteRows"
            @import="openImportModal"
            @export="handleExportData"
            @keyword-search="keywordSearch"
            @keyword-clear="clearSearch"
            @search="search"
            @reset="resetForm"
          >
            <template #filter>
              <div class="grid grid-cols-40 gap-x-12px gap-y-8px">
                <template v-for="item in listFilter" :key="item.id ?? item.filedCode">
                  <template v-if="item.filedCode === 'created_by'">
                    <div class="col-span-3 ml-10px flex flex-row items-center justify-end">
                      {{ item.filedName }}
                    </div>
                    <div class="col-span-7">
                      <SelectPerson
                        v-model:value="formFilter[item.filedCode]"
                        placeholder="请选择接单人"
                        size="small"
                      />
                    </div>
                  </template>
                  <template v-else-if="item.filedCode === 'department_id'">
                    <div class="col-span-3 ml-10px flex flex-row items-center justify-end">
                      {{ item.filedName }}
                    </div>
                    <div class="col-span-7">
                      <SelectDepartment v-model:value="formFilter[item.filedCode]" size="small"></SelectDepartment>
                    </div>
                  </template>
                  <!--
 筛选控件类型跟随表单组件：单选/下拉→单选下拉、复选→多选下拉、
                     开关→开关、数字→最小/最大范围、字符→输入框(like)、日期→范围
-->
                  <template v-else-if="filterKind(item) === 'select'">
                    <div class="col-span-3 ml-10px flex flex-row items-center justify-end">
                      {{ item.filedName === undefined ? item.label : item.filedName }}
                    </div>
                    <div class="col-span-7">
                      <ElSelect
                        v-model="formFilter[item.filedCode]"
                        :multiple="item.multiple === true"
                        clearable
                        placeholder="请选择"
                        size="small"
                      >
                        <ElOption
                          v-for="opt in item.options ?? []"
                          :key="opt.value"
                          :label="opt.label"
                          :value="opt.value!"
                        />
                      </ElSelect>
                    </div>
                  </template>
                  <template v-else-if="filterKind(item) === 'switch'">
                    <div class="col-span-3 ml-10px flex flex-row items-center justify-end">
                      {{ item.filedName === undefined ? item.label : item.filedName }}
                    </div>
                    <div class="col-span-7 flex flex-row items-center">
                      <ElSwitch
                        :model-value="formFilter[item.filedCode] === 1"
                        size="small"
                        @update:model-value="setSwitchFilter(item.filedCode, $event)"
                      />
                    </div>
                  </template>
                  <template v-else-if="filterKind(item) === 'number'">
                    <div class="col-span-3 ml-10px flex flex-row items-center justify-end">
                      {{ item.filedName === undefined ? item.label : item.filedName }}
                    </div>
                    <div class="col-span-7">
                      <ElSpace :size="4" :wrap="false" class="w-full">
                        <ElInputNumber
                          :model-value="rangeBound(item.filedCode, 0)"
                          placeholder="最小值"
                          size="small"
                          :show-button="false"
                          class="w-full"
                          @update:model-value="setRangeBound(item.filedCode, 0, $event ?? null)"
                        />
                        <span class="text-gray-400">~</span>
                        <ElInputNumber
                          :model-value="rangeBound(item.filedCode, 1)"
                          placeholder="最大值"
                          size="small"
                          :show-button="false"
                          class="w-full"
                          @update:model-value="setRangeBound(item.filedCode, 1, $event ?? null)"
                        />
                      </ElSpace>
                    </div>
                  </template>
                  <template v-else-if="filterKind(item) === 'date'">
                    <div class="col-span-3 ml-10px flex flex-row items-center justify-end">
                      {{ item.filedName === undefined ? item.label : item.filedName }}
                    </div>
                    <div class="col-span-7">
                      <PrivernalDatepicker
                        v-model:value="formFilter[item.filedCode]"
                        clearable
                        type="daterange"
                        value-format="yyyy-MM-dd"
                        placeholder="请选择时间"
                        size="small"
                      ></PrivernalDatepicker>
                    </div>
                  </template>
                  <template v-else-if="filterKind(item) === 'relation'">
                    <div class="col-span-3 ml-10px flex flex-row items-center justify-end">
                      {{ item.filedName === undefined ? item.label : item.filedName }}
                    </div>
                    <div class="col-span-7">
                      <!-- 关联表单/关联属性：下拉直接选被关联表记录，值=记录 id（与存储形态一致） -->
                      <ElSelect
                        v-model="formFilter[item.filedCode]"
                        filterable
                        clearable
                        placeholder="选择关联记录"
                        size="small"
                        :options="relationFilterOptions(item)"
                        @visible-change="
                        (visible: boolean) => {
                          if (visible) {
                            const relation = pickRelation(item);
                            if (relation) loadRelationRows(relation.formCode);
                          }
                        }
                      "
                      />
                    </div>
                  </template>
                  <template v-else>
                    <div class="col-span-3 ml-10px flex flex-row items-center justify-end">
                      {{ item.filedName === undefined ? item.label : item.filedName }}
                    </div>
                    <div class="col-span-7">
                      <ElInput v-model="formFilter[item.filedCode]" placeholder="请输入" size="small" clearable />
                    </div>
                  </template>
                </template>
              </div>
            </template>
            <template #button>
              <ElButton
                v-if="hasAuth('dynamic:data:print') && hasPrintTemplate"
                text
                size="small"
                @click="openPrint(checkedRowKeys as string[])"
              >
                批量打印
              </ElButton>
            </template>
            <template #toolbar-extra>
              <ListAdditional v-model:columns="columns" @reload="search"></ListAdditional>
            </template>
          </ListFilter>

          <DataTable
            :key="tableKey"
            v-model:checked-row-keys="checkedRowKeys"
            remote
            :columns="columns"
            :data="tableData"
            :loading="loading"
            :pagination="pagination"
            :row-key="rowKey"
            flex-height
            class="flex-1-hidden"
            size="small"
            :bordered="false"
            :bottom-bordered="true"
            striped
            @update:checked-row-keys="handleChangeChecked"
            @update:sorter="handleUpdateSorter"
          />
        </template>

        <DesignerFormModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />
        <ElDialog
          v-model="printModalVisible"
          preset="dialog"
          title="单据打印"
          confirm-button-text="打印"
          cancel-button-text="取消"
          :loading="printLoading"
          :show-icon="false"
          @confirm="handlePrintOk"
        >
          <div class="flex flex-col gap-12px py-8px">
            <div>已选择 {{ printRowIds.length }} 条数据</div>
            <ElSelect v-model="printTemplateCode" placeholder="选择打印模板" @change="handlePrintTemplateChange">
              <ElOption v-for="opt in printTemplateOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
            <div v-if="printParams.length" class="flex flex-col gap-6px">
              <div class="text-12px opacity-70">
                打印参数（改动后点「打印 / 下载 PDF」即按新参数重新取数，不改模板）
              </div>
              <div v-for="param in printParams" :key="param.field" class="flex items-center gap-8px">
                <span class="w-110px shrink-0">{{ param.label }}</span>
                <ElInput
                  v-model="param.value"
                  size="small"
                  clearable
                  :placeholder="param.op === 'like' ? '模糊匹配' : '精确匹配'"
                />
              </div>
            </div>
            <ElButton size="small" text type="primary" :loading="printLoading" @click="handlePrintPdf">
              下载 PDF（真页码）
            </ElButton>
          </div>
        </ElDialog>
        <FlowRecordModal
          v-model:show="flowModalVisible"
          :business-id="flowModalBusinessId"
          :business-title="flowModalRowSummary"
        />
        <!-- 数据导入弹窗：模板下载 → 上传 xlsx → 异步进度 → 成功/跳过/失败统计 → 失败报告 -->
        <ElDialog v-model="importVisible" title="导入数据" width="560px" @closed="closeImportModal">
          <ElSpace :size="14">
            <ElButton text size="small" @click="handleTemplateDownload">
              <icon-mdi-tray-arrow-down class="mr-4px text-18px" />
              下载导入模板
            </ElButton>
            <ElUpload
              :limit="1"
              accept=".xlsx"
              :auto-upload="false"
              :file-list="importFile ? [{ name: importFile.name, status: 'success', percentage: 100 } as any] : []"
              @change="onImportFileChange"
            >
              <ElButton text size="small">选择 Excel 文件（≤10MB）</ElButton>
            </ElUpload>
            <div v-if="importTask" class="flex flex-col gap-8px">
              <ElProgress
                type="line"
                :percentage="importTask.total > 0 ? Math.round((importTask.processed / importTask.total) * 100) : 0"
                :status="importProgressStatus"
                :show-indicator="!importTask.finished"
              />
              <span class="text-13px">
                已处理 {{ importTask.processed }} / {{ importTask.total }} 行
                <template v-if="importTask.finished">
                  ：成功 {{ importTask.success }}，跳过 {{ importTask.skipped }}，失败 {{ importTask.failed }}
                </template>
              </span>
              <ElButton
                v-if="importTask.finished && importTask.failed > 0"
                text
                size="small"
                @click="handleImportReportDownload"
              >
                下载失败行报告（可修改后重新导入）
              </ElButton>
            </div>
            <ElSpace justify="end">
              <ElButton size="small" @click="closeImportModal">关闭</ElButton>
              <ElButton
                type="primary"
                size="small"
                :loading="importSubmitting"
                :disabled="!importFile"
                @click="submitImport"
              >
                开始导入
              </ElButton>
            </ElSpace>
          </ElSpace>
        </ElDialog>
      </div>
    </ElCard>
  </div>
</template>

<style lang="scss" scoped>
.main-space {
  // 解决数据table底边在最下面的问题
}
</style>
