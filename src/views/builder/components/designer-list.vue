<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElButton, ElImage, ElSpace as __forwarded_ElSpace } from 'element-plus';
import {
  delDynamicFormData,
  findDynamicFormByCode,
  findDynamicFormColumnList,
  findDynamicFormDataList
} from '@/service';
import { startDynamicDataFlow } from '@/service/api/dynamic/dynamic-common';
import { useAuth, useBoolean, useLoading } from '@/hooks';
import { getQueryString, orderByColumn } from '@/utils';
import SelectPerson from '@/components/business/select-person.vue';
import FlowRecordModal from '@/views/flow/components/flow-record-modal.vue';
import { collectFormComponents, createFieldTranslators } from '@/components/business/field-translate';
import type { ModalType } from './designer-modal.vue';
import DesignerFormModal from './designer-modal.vue';
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'DynamicFormList' });
withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: any[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { hasAuth } = useAuth();
const tableData = ref<any[]>([]);

/** 表单编码：优先取 URL query，其次取菜单路由路径段（/builder/{tableCode}） */
const route = useRoute();
const code =
  getQueryString(window.location.search, 'code') || String(route.path.split('/').filter(Boolean).pop() || '');

/** 列表页消费的表单定义字段（其余字段由详情接口返回，不在此声明） */
interface FormDefinition {
  id: string;
  tableName: string;
  tableCode: string;
  /** 设计器保存的表单 JSON */
  metaData?: Record<string, any>;
  /** 是否启用工作流 0 未启用 1 启用 */
  isWorkflow?: number;
}

const formData = ref<FormDefinition>({ id: '', tableName: '', tableCode: '' });

/** 筛选面板项：字段列信息 + 表设计器组件 schema 透传字段 */
interface ListFilterItem {
  /** 字段编码（查询参数键、列键），模板按它索引 formFilter，必须存在 */
  filedCode: string;
  id?: string;
  filedName?: string;
  filedType?: string;
  /** 表单组件类型（无组件信息时为空，按列类型兜底判定） */
  componentType?: string;
  /** 无字段列信息（纯组件配置）时的展示名 */
  label?: string;
  options?: { label: string; value: string | number }[];
  multiple?: boolean;
  [key: string]: any;
}

const formColumns = ref<DynamicFormColumnNamespace.DynamicFormColumnForm[]>([]);
const listFilter = ref<ListFilterItem[]>([]);

const checkedRowKeys = ref<string[]>([]);
/** 表格重建 key：naive-ui 横向虚拟滚动对追加行存在列窗口计算错误，数据集变化时强制重建表格 */
const tableKey = ref('');
/**
 * 查询模型：动态表按字段编码（filedCode）动态挂查询条件，故在分页参数上放开索引签名；
 * tableCode 定位动态表，keyword 是 ListFilter 的必填双向绑定字段
 */
type FormFilterModel = ApiCommon.RequestPage & { tableCode: string; keyword: string; [key: string]: any };
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
  tableCode: code,
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: []
});
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
const subTableColumns = computed(() => formColumns.value.filter(col => String(col.filedCode ?? '').includes('.')));

/** 行内字段取值：下划线列名 → 驼峰 逐级回退 */
function pickRowCase(obj: any, column: string) {
  if (obj[column] !== undefined) return obj[column];
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
        flatRowKey: `${row.id}_${i}`
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
  return rowData.flatRowKey ?? rowData.id;
}

/** 数值类列（int/bigint/decimal）：后端动态查询按 [min, max] 范围解析，不接受标量。
    注意不含 TINYINT——开关列走精确匹配 */
const numericColumnCodes = computed(() => {
  const codes = new Set<string>();
  formColumns.value.forEach(col => {
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
      <ElSpace size={4} alignment="center">
        {urls.slice(0, 3).map(url => (
          <ElImage
            key={url}
            src={url}
            fit="cover"
            lazy
            style={{ borderRadius: '4px', flexShrink: 0, width: '36px', height: '36px' }}
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
function filterKind(item: any): 'select' | 'switch' | 'number' | 'date' | 'text' {
  const t = String(item.componentType ?? '');
  if (t === 'radio' || t === 'select' || t === 'checkbox') return 'select';
  if (t === 'switch') return 'switch';
  if (t === 'number' || t === 'input-number') return 'number';
  if (t === 'date-picker' || t === 'date' || t === 'datetime') return 'date';
  // 无组件信息时按列类型兜底：datetime 列必须范围查询，数值列范围查询
  const ft = String(item.filedType ?? '').toLowerCase();
  if (ft === 'datetime' || ft === 'time') return 'date';
  if (/^(int|bigint|decimal)$/i.test(ft)) return 'number';
  return 'text';
}

/** 数字范围第 idx 位（0 最小 / 1 最大） */
function rangeBound(columnCode: string, idx: 0 | 1) {
  const v = formFilter[columnCode];
  return Array.isArray(v) ? (v[idx] ?? null) : null;
}

function setRangeBound(columnCode: string, idx: 0 | 1, v: number | null) {
  const cur = Array.isArray(formFilter[columnCode]) ? [...formFilter[columnCode]] : [null, null];
  cur[idx] = v;
  formFilter[columnCode] = cur.every(x => x === null || x === undefined) ? null : cur;
}

/**
 * 组装查询参数：
 * 1. 剔除空值（''/null/undefined）——空字符串发给数值/范围列会触发
 *    String cannot be cast to List 的 500，未填写的条件不应上送；
 * 2. 数值列单值包装成等值范围 [v, v]；范围数组必须两端都有值（后端取 list.get(0/1)），
 *    只填一端的范围丢弃；多选数组（字符串列 IN 查询）原样上送
 */
function sanitizeQuery(dataQuery: FormFilterModel): FormFilterModel {
  const cleaned: FormFilterModel = { ...dataQuery };
  Object.keys(dataQuery).forEach(key => {
    const value = dataQuery[key];
    if (value === '' || value === null || value === undefined) {
      Reflect.deleteProperty(cleaned, key);
      return;
    }
    if (!numericColumnCodes.value.has(key)) return;
    if (Array.isArray(value)) {
      if (value.length === 2 && value.every(v => v !== null && v !== undefined && v !== '')) {
        cleaned[key] = value.map(v => Number(v));
      } else {
        Reflect.deleteProperty(cleaned, key);
      }
      return;
    }
    const num = Number(value);
    if (Number.isFinite(num)) {
      cleaned[key] = [num, num];
    } else {
      Reflect.deleteProperty(cleaned, key);
    }
  });
  return cleaned;
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
    const result: DynamicFormNamespace.DynamicFormPage = data ?? { list: [], total: 0 };
    setTableData(result);
  } finally {
    // 请求异常时也必须复位 loading，否则列表永久转圈
    endLoading();
  }
}

/**
 * 列声明（带子表展开模式的合并单元格配置）
 *
 * rowSpan 是 naive-ui 迁移遗留配置：全局 DataTable.Column 类型体系与 data-table.vue 目前都未收录/
 * 消费它（合并能力尚未在 Element Plus 表格上接通），这里用本地交叉类型保留列声明的合并意图，
 * 待公共表格组件补 span-method 后应收敛回全局类型。
 */
type WithRowSpan<T> = T & { rowSpan?: (row: any) => number };
type ListColumn =
  | WithRowSpan<DataTable.BaseColumn<any>>
  | WithRowSpan<DataTable.SelectionColumn>
  | WithRowSpan<DataTable.ExpandColumn<any>>
  | WithRowSpan<DataTable.ColumnGroup<any>>;

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
 * 某列的排序处理
 *
 * @param sorter
 */
function handleUpdateSorter(sorter: DataTable.SortState) {
  orderByColumn(sorter, formFilter, columns);
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
    } else if (field !== 'pageSize' && field !== 'tableCode') {
      // tableCode 是定位动态表的必要参数，重置不能清掉；pageSize 保留当前每页条数
      formFilter[field] = null;
    }
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
 * @param value
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

/**
 * 查询表单
 *
 * @param codeForm 表单编码
 */
function findForm(codeForm: string) {
  findDynamicFormByCode(codeForm).then(res => {
    if (res.error === null) {
      formData.value = res.data;
      findFormColumn(formData.value.id);
    }
  });
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

  const inputList = collectFormComponents(formData.value.metaData);
  // 表单字段编码可能是驼峰（userName），列编码是下划线（user_name），归一化后匹配
  const compOf = (filedCode: string) =>
    (inputList as any[]).find(c => normalizeFieldCode(c.field) === normalizeFieldCode(filedCode));

  // 一次性构建全部列的翻译器（选项/开关/人员/部门/工作流状态），需要的远程字典在此并发预热
  const translators = await createFieldTranslators(
    rawColumns.map(item => ({ filedCode: item.filedCode, comp: compOf(item.filedCode) ?? null })),
    code
  );

  // 展开模式（配置了子表显示字段）：主表字段/序号/操作列按子表行组合并单元格
  const expandActive = subTableColumns.value.length > 0;
  if (expandActive) {
    columns.value = columns.value.filter(col => !('type' in col && col.type === 'selection'));
  }
  const mainRowSpan = expandActive ? (row: any) => (row.spanStart ? row.spanSize : 0) : undefined;

  rawColumns.forEach(item => {
    // 列表添加列
    if (Number(item.showList) === 1) {
      // 子表字段（filedCode=子表字段.行内列名）：按展开行逐行显示，不做主表合并
      if (String(item.filedCode ?? '').includes('.')) {
        columns.value.push({
          key: item.filedCode,
          title: item.filedName,
          align: 'left',
          ellipsis: true,
          render: (row: any) =>
            row[item.filedCode] === null || row[item.filedCode] === undefined ? '-' : String(row[item.filedCode])
        });
      } else if (item.filedCode === 'title') {
        columns.value.push({
          key: item.filedCode,
          title: item.filedName,
          align: 'left',
          rowSpan: mainRowSpan,
          ellipsis: true,
          render: (row: any) => {
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
          columns.value.push({
            key: filedKey,
            title: item.filedName,
            align: 'left',
            rowSpan: mainRowSpan,
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
          // 筛选控件类型跟随表单组件：单选/下拉→单选下拉、复选→多选下拉、开关→开关、数字→范围
          componentType: comp.type,
          options: comp.componentProps?.options,
          multiple: comp.type === 'checkbox' || comp.componentProps?.multiple === true
        });
      } else {
        listFilter.value.push({ ...item, componentType: '' });
      }
    }
  });

  appendActionColumn();
  // 首次加载时列配置晚于数据到达：子表展开依赖列配置，列就绪后重查一次展开
  if (expandActive) {
    getTableData(formFilter);
  }
}

/** 行内操作列：编辑 / 发起 / 流程 / 删除（受自动生成的 dynamic:{tableCode}:* 权限控制） */
function appendActionColumn() {
  const exists = columns.value.some(col => col.key === 'actions');
  if (exists) return;
  const expandActive = subTableColumns.value.length > 0;
  columns.value.push({
    key: 'actions',
    title: '操作',
    align: 'center',
    width: 210,
    fixed: 'right',
    rowSpan: expandActive ? (row: any) => (row.spanStart ? row.spanSize : 0) : undefined,
    render: (row: any) => {
      const buttons: any[] = [];
      if (hasAuth(`dynamic:${code}:edit`)) {
        buttons.push(
          <ElButton text type="primary" onClick={() => handleEditTable(row.id)}>
            编辑
          </ElButton>
        );
      }
      // 表单开启流程后展示「流程」入口：查看该行数据的流程状态与流转记录
      if (formData.value.metaData && Number(formData.value.isWorkflow) === 1) {
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
        <ListFilter
          v-model:keyword="formFilter.keyword"
          :permission-add="'dynamic:' + code + ':add'"
          :permission-remove="'dynamic:' + code + ':remove'"
          :permission-import="'dynamic:' + code + ':import'"
          :permission-export="'dynamic:' + code + ':export'"
          :operation-title="formData.tableName"
          :show-operation="showOperation"
          :show-export="false"
          :show-import="false"
          @add="handleAddTable"
          @delete="handleDeleteRows"
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
                    <SelectPerson v-model:value="formFilter[item.filedCode]" placeholder="请选择接单人" size="small" />
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
                        :value="opt.value"
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
                      :value="formFilter[item.filedCode] === 1"
                      size="small"
                      @update:value="(v: boolean) => (formFilter[item.filedCode] = v ? 1 : 0)"
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
                        :value="rangeBound(item.filedCode, 0)"
                        placeholder="最小值"
                        size="small"
                        :show-button="false"
                        class="w-full"
                        @update:value="(v: number | null) => setRangeBound(item.filedCode, 0, v)"
                      />
                      <span class="text-gray-400">~</span>
                      <ElInputNumber
                        :value="rangeBound(item.filedCode, 1)"
                        placeholder="最大值"
                        size="small"
                        :show-button="false"
                        class="w-full"
                        @update:value="(v: number | null) => setRangeBound(item.filedCode, 1, v)"
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

        <DesignerFormModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />
        <FlowRecordModal
          v-model:show="flowModalVisible"
          :business-id="flowModalBusinessId"
          :business-title="flowModalRowSummary"
        />
      </div>
    </ElCard>
  </div>
</template>

<style lang="scss" scoped>
.main-space {
  // 解决数据table底边在最下面的问题
  //:deep(.n-scrollbar) {
  //  overflow: inherit;
  //}
}
</style>
