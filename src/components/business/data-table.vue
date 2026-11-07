<script setup lang="tsx">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import type { VNodeChild } from 'vue';

/**
 * DataTable：基于 el-table + el-pagination 的配置式表格封装。
 *
 * 复刻 NDataTable 的核心用法（columns 配置数组 + render 函数 + pagination 对象 +
 * checked-row-keys 受控多选 + flex-height 撑满），业务页面由 NDataTable 平移而来，
 * 模板层只需把 <DataTable ...> 换成 <DataTable ...>。
 */
defineOptions({ name: 'DataTable', inheritAttrs: false });

interface Props {
  columns: DataTable.Column[];
  data?: any[];
  loading?: boolean;
  pagination?: DataTable.PaginationProps | false;
  /** 服务端分页（仅语义兼容，本组件始终直接渲染 data） */
  remote?: boolean;
  rowKey?: (row: any) => string;
  /**
   * naive 兼容：行级 props（onXxx 事件 / style / class）。el-table 无对应 API，落地方式：
   * 冒泡事件在表格根元素上做事件委托，按光标下 tr 在 tbody 里的序号回查行数据；
   * style/class 在行渲染后补写到 tr 的 DOM 上。不冒泡的事件（mouseenter 等）委托不到。
   */
  rowProps?: (row: any, index: number) => Record<string, any>;
  checkedRowKeys?: string[];
  /** 撑满父容器高度 */
  flexHeight?: boolean;
  /** 容器最小宽度（横向滚动基准） */
  scrollX?: number;
  striped?: boolean;
  bordered?: boolean;
  summary?: DataTable.SummaryFn;
  /** 语义兼容：naive 的单线边框即 el-table 默认样式 */
  singleLine?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
  pagination: false,
  remote: false,
  rowKey: undefined,
  rowProps: undefined,
  checkedRowKeys: () => [],
  flexHeight: false,
  scrollX: undefined,
  striped: false,
  bordered: false,
  summary: undefined,
  singleLine: true
});

const emit = defineEmits<{
  (e: 'update:checkedRowKeys', keys: string[], rows: any[], meta: CheckMeta): void;
  (e: 'update:checkedRowKeysInternal', keys: string[]): void;
  (e: 'update:sorter', sorter: DataTable.SortState): void;
  (e: 'expand-change', row: any, expandedRows: any[]): void;
}>();

/** 对齐 naive 的选择元信息：本次是勾选、取消、全选还是取消全选 */
interface CheckMeta {
  row: object | undefined;
  action: 'check' | 'uncheck' | 'checkAll' | 'uncheckAll';
}

const tableRef = ref();

function normalizeAlign(align?: string) {
  if (align === 'start') return 'left';
  if (align === 'end') return 'right';
  return align || 'left';
}

function ensureVNode(child: VNodeChild): VNodeChild {
  if (child === null || child === undefined || child === false) return '';
  return child;
}

function renderCell(column: Extract<DataTable.Column, { key: string }>, row: any, index: number): VNodeChild {
  const render = (column as DataTable.BaseColumn).render;
  if (render) {
    return ensureVNode(render(row, index));
  }
  const value = row[column.key];
  return value === null || value === undefined ? '' : value;
}

/** 递归渲染列（支持表头分组） */
function renderColumns(columns: DataTable.Column[]): VNodeChild {
  return columns.map(column => {
    if ('type' in column && column.type === 'selection') {
      return (
        <ElTableColumn
          type="selection"
          width={column.width ?? 55}
          align="center"
          reserveSelection={Boolean(props.rowKey)}
        />
      );
    }
    if ('type' in column && column.type === 'expand') {
      return (
        <ElTableColumn type="expand" width={column.width ?? 48} align="center">
          {{
            default: ({ row, $index }: { row: any; $index: number }) => ensureVNode(column.render?.(row, $index))
          }}
        </ElTableColumn>
      );
    }
    if ('children' in column && Array.isArray(column.children)) {
      return (
        <ElTableColumn label={column.title} align={normalizeAlign(column.align)}>
          {renderColumns(column.children)}
        </ElTableColumn>
      );
    }
    const col = column as DataTable.BaseColumn;
    const showEllipsis = Boolean(col.ellipsis);
    return (
      <ElTableColumn
        key={col.key}
        prop={col.key}
        label={col.title}
        width={col.width as number}
        min-width={col.minWidth as number}
        align={normalizeAlign(col.align)}
        header-align={normalizeAlign(col.align)}
        fixed={col.fixed === true ? 'left' : (col.fixed as 'left' | 'right' | undefined)}
        show-overflow-tooltip={showEllipsis}
        sortable={col.sorter ? 'custom' : false}
        class-name={col.className}
      >
        {{
          default: ({ row, $index }: { row: any; $index: number }) => renderCell(col, row, $index)
        }}
      </ElTableColumn>
    );
  });
}

/* ---------------- 受控多选（checked-row-keys） ---------------- */

const rowKeyFn = computed(() => props.rowKey);

/** 跨页勾选需要按 key 取回完整行：翻页后当前页 data 里没有别的页选过的行 */
const rowRegistry = new Map<string, any>();

watch(
  () => props.data,
  rows => {
    const getKey = rowKeyFn.value;
    if (!getKey) return;
    (rows || []).forEach(row => {
      const key = getKey(row);
      if (key !== undefined && key !== null) rowRegistry.set(String(key), row);
    });
  },
  { immediate: true }
);

function selectedKeysOf(rows: any[]): string[] {
  const getKey = rowKeyFn.value;
  if (!getKey) return [];
  return rows.map(row => getKey(row)).filter(key => key !== undefined && key !== null);
}

function resolveCheckMeta(prev: string[], next: string[]): CheckMeta {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  const added = next.filter(key => !prevSet.has(key));
  const removed = prev.filter(key => !nextSet.has(key));
  if (added.length > 1) return { row: undefined, action: 'checkAll' };
  if (added.length === 1) return { row: rowRegistry.get(added[0]), action: 'check' };
  if (removed.length > 1) return { row: undefined, action: 'uncheckAll' };
  return { row: removed.length === 1 ? rowRegistry.get(removed[0]) : undefined, action: 'uncheck' };
}

function handleSelectionChange(rows: any[]) {
  // 回放外部 keys 期间程序性 clear/toggle 也会触发 selection-change，
  // 那是中间态，回写父组件会把只剩一半的集合灌回去，最终勾选被清空
  if (syncingSelection.value) return;
  const keys = selectedKeysOf(rows);
  if (JSON.stringify(keys) !== JSON.stringify(props.checkedRowKeys)) {
    const checked = (props.checkedRowKeys || []).map(String);
    emit(
      'update:checkedRowKeys',
      keys,
      keys.map(key => rowRegistry.get(key)).filter(r => r !== undefined),
      resolveCheckMeta(checked, keys)
    );
  }
}

function toSortOrder(order: 'ascending' | 'descending' | null): 'ascend' | 'descend' | false {
  if (order === 'ascending') return 'ascend';
  if (order === 'descending') return 'descend';
  return false;
}

function handleSortChange(state: {
  column?: { property?: string };
  prop?: string;
  order: 'ascending' | 'descending' | null;
}) {
  emit('update:sorter', { columnKey: state.prop || state.column?.property || '', order: toSortOrder(state.order) });
}

/** 外部 keys → 表格勾选的回放；同步守卫挡住回放期间的 selection-change 回写 */
const syncingSelection = ref(false);

function applyCheckedKeysToTable() {
  const table = tableRef.value;
  const getKey = rowKeyFn.value;
  if (!table || !getKey) return;
  const keys = (props.checkedRowKeys || []).map(String);
  const currentRows = table.getSelectionRows?.() || [];
  const currentKeys = selectedKeysOf(currentRows);
  const same = keys.length === currentKeys.length && keys.every(k => currentKeys.includes(k));
  if (same) return;
  syncingSelection.value = true;
  table.clearSelection();
  if (keys.length) {
    (props.data || []).forEach(row => {
      if (keys.includes(String(getKey(row)))) {
        table.toggleRowSelection(row, true);
      }
    });
  }
  nextTick(() => {
    syncingSelection.value = false;
  });
}

/** 外部清空/赋值时同步表格勾选状态 */
watch(() => props.checkedRowKeys, applyCheckedKeysToTable, { deep: true });

// 回显请求与列表请求是竞态：data 后到时按当前 keys 重放一次勾选，否则表格里始终没有选中态
watch(
  () => props.data,
  () => nextTick(applyCheckedKeysToTable)
);

/* ---------------- 行级 props（naive row-props 兼容） ---------------- */

/** 已委托到表格根元素的行级事件：Vue 事件键（onDragover）→ 根元素上的监听器 */
const delegatedRowEvents = new Map<string, EventListener>();

function tableRootEl(): HTMLElement | undefined {
  return (tableRef.value?.$el as HTMLElement | undefined) ?? undefined;
}

function rowPropsAt(index: number): Record<string, any> | null {
  if (!props.rowProps) return null;
  const row = (props.data ?? [])[index];
  if (row === undefined || row === null) return null;
  return props.rowProps(row, index) ?? null;
}

/** Vue 事件键 → DOM 事件名：onDragover → dragover */
function domEventOf(key: string) {
  return key.slice(2, 3).toLowerCase() + key.slice(3);
}

/** 委托分发：光标下 tr 在 tbody 里的序号即行号（表头是 thead，不算行） */
function dispatchDelegatedRowEvent(key: string, e: Event) {
  const target = e.target as HTMLElement | null;
  const tr = target?.closest?.('tr');
  if (!tr || tr.parentElement?.tagName !== 'TBODY') return;
  const index = Array.prototype.indexOf.call(tr.parentElement.children, tr);
  const handler = rowPropsAt(index)?.[key];
  if (typeof handler === 'function') handler(e);
}

/** 事件监听只依赖事件键集合，按数据里出现过的 onXxx 增删，行重排不重挂 */
function syncRowPropsListeners() {
  const root = tableRootEl();
  if (!root) return;
  const needed = new Set<string>();
  if (props.rowProps) {
    (props.data ?? []).forEach((_row, index) => {
      Object.keys(rowPropsAt(index) ?? {}).forEach(key => {
        if (/^on[A-Z]/.test(key)) needed.add(key);
      });
    });
  }
  delegatedRowEvents.forEach((listener, key) => {
    if (!needed.has(key)) {
      root.removeEventListener(domEventOf(key), listener);
      delegatedRowEvents.delete(key);
    }
  });
  needed.forEach(key => {
    if (!delegatedRowEvents.has(key)) {
      const listener = dispatchDelegatedRowEvent.bind(null, key);
      root.addEventListener(domEventOf(key), listener);
      delegatedRowEvents.set(key, listener);
    }
  });
  applyRowPropsAttrs();
}

/** style/class 补写到渲染后的 tr 上：EP 不透通行级属性，靠 dataset 记录已写入内容防止追加式重写 */
function applyRowPropsAttrs() {
  if (!props.rowProps) return;
  const root = tableRootEl();
  if (!root) return;
  Array.from(root.querySelectorAll('.el-table__body tbody tr')).forEach((trNode, index) => {
    const tr = trNode as HTMLTableRowElement;
    const rowProps = rowPropsAt(index) ?? {};
    const style = rowProps.style;
    const styleKey = typeof style === 'string' ? style : style ? JSON.stringify(style) : '';
    if (tr.dataset.rowPropsStyle !== styleKey) {
      tr.dataset.rowPropsStyle = styleKey;
      if (typeof style === 'string') tr.setAttribute('style', style);
      else if (style && typeof style === 'object') {
        tr.removeAttribute('style');
        Object.assign(tr.style, style);
      } else {
        tr.removeAttribute('style');
      }
    }
    const klass = rowProps.class;
    const classKey = Array.isArray(klass) ? klass.join(' ') : String(klass ?? '');
    if (tr.dataset.rowPropsClass !== classKey) {
      (tr.dataset.rowPropsClass ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .forEach(c => tr.classList.remove(c));
      classKey
        .split(/\s+/)
        .filter(Boolean)
        .forEach(c => tr.classList.add(c));
      tr.dataset.rowPropsClass = classKey;
    }
  });
}

watch(
  () => [props.rowProps, props.data],
  () => {
    nextTick(syncRowPropsListeners);
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  syncRowPropsListeners();
});

onBeforeUnmount(() => {
  const root = tableRootEl();
  delegatedRowEvents.forEach((listener, key) => root?.removeEventListener?.(domEventOf(key), listener));
  delegatedRowEvents.clear();
});

/* ---------------- 分页 ---------------- */

const paginationProps = computed(() => (props.pagination === false ? null : props.pagination));

const pagerState = reactive({ page: 1, pageSize: 10 });

watch(
  () => paginationProps.value,
  p => {
    if (!p) return;
    pagerState.page = p.page ?? 1;
    pagerState.pageSize = p.pageSize ?? 10;
  },
  { immediate: true, deep: true }
);

const pagerLayout = computed(() =>
  paginationProps.value?.showQuickJumper ? 'total, sizes, prev, pager, next, jumper' : 'total, sizes, prev, pager, next'
);

function handlePageChange(page: number) {
  const p = paginationProps.value;
  if (!p) return;
  p.onChange?.(page);
  p.onUpdatePage?.(page);
  p['onUpdate:page']?.(page);
}

function handleSizeChange(size: number) {
  const p = paginationProps.value;
  if (!p) return;
  p.onUpdatePageSize?.(size);
  p['onUpdate:pageSize']?.(size);
}

function renderPrefix() {
  const p = paginationProps.value;
  if (!p?.prefix) return null;
  return p.prefix({
    page: pagerState.page,
    pageSize: pagerState.pageSize,
    itemCount: p.itemCount
  });
}

/* ---------------- 汇总行 ---------------- */

const summaryMethod = computed(() => {
  if (!props.summary) return undefined;
  return ({ columns, data }: { columns: any[]; data: any[] }) => {
    const sums = props.summary!(data);
    return columns.map((column: any) => {
      const key = column.property;
      if (key && sums[key] !== undefined && sums[key] !== null) {
        return String(sums[key]);
      }
      return '';
    });
  };
});

/* ---------------- 合并单元格（naive rowSpan 语义 → el-table span-method） ---------------- */

/** 扁平化列树（分组列 children 展开）：span-method 只拿得到 prop，需按 key 反查列定义 */
const flatColumns = computed(() => {
  const out: DataTable.BaseColumn[] = [];
  const walk = (cols: DataTable.Column[]) => {
    cols.forEach(col => {
      if ('children' in col && Array.isArray((col as any).children)) {
        walk((col as any).children);
        return;
      }
      if ('key' in col && col.key) out.push(col as DataTable.BaseColumn);
    });
  };
  walk(props.columns);
  return out;
});

/**
 * naive 的列级 rowSpan(row, index) 回调：返回合并行数，0 表示该格并入上方（返回 0 的列需同时
 * 置 colspan=0 才会真正隐藏，与 naive 的 rowSpan 渲染语义一致）
 */
function spanMethod({ row, column, rowIndex }: { row: any; column: { property?: string }; rowIndex: number }) {
  if (!column?.property) return undefined;
  const def: any = flatColumns.value.find(col => col.key === column.property);
  if (typeof def?.rowSpan !== 'function') return undefined;
  const span = def.rowSpan(row, rowIndex);
  return { rowspan: span, colspan: span === 0 ? 0 : 1 };
}

const containerStyle = computed(() => (props.scrollX ? { minWidth: `${props.scrollX}px` } : undefined));

/** 列 vnode 缓存：函数组件每次渲染返回同一份 vnode，避免 ElTable 内部观察列导致的无限更新 */
const columnVNodes = computed(() => {
  const cols = props.columns;
  return () => renderColumns(cols);
});
</script>

<template>
  <!--
 inheritAttrs:false 用于丢弃 max-height 等未声明的 attrs，但必须显式接住 class：
       页面普遍靠 class="flex-1-hidden/min-h-0 flex-1" 控制布局，丢了 class 会表现为表格不随容器伸缩 
-->
  <div class="h-full flex-col-stretch" :class="$attrs.class" :style="containerStyle">
    <ElTable
      ref="tableRef"
      v-loading="loading"
      :data="data"
      :border="bordered"
      :stripe="striped"
      :row-key="rowKey"
      :show-summary="!!summary"
      :summary-method="summaryMethod"
      :span-method="spanMethod"
      :class="flexHeight ? 'flex-1' : ''"
      :height="flexHeight ? '100%' : undefined"
      class="w-full"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @expand-change="(row: any, expandedRows: any[]) => emit('expand-change', row, expandedRows)"
    >
      <component :is="columnVNodes" />
    </ElTable>
    <div v-if="paginationProps" class="mt-12px flex justify-end">
      <ElPagination
        v-model:current-page="pagerState.page"
        v-model:page-size="pagerState.pageSize"
        :total="Number(paginationProps.itemCount) || 0"
        :page-sizes="paginationProps.pageSizes"
        :layout="pagerLayout"
        :small="false"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <component :is="renderPrefix" />
      </ElPagination>
    </div>
  </div>
</template>

<style scoped></style>
