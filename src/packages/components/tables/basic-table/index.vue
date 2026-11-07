<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { ListTable } from '@visactor/vue-vtable';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { useWidgetLinkage } from '@/hooks/datav/useDatavLinkage';

defineOptions({ name: 'DatavBasicTable' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const { linkage, clickRow, isSelected } = useWidgetLinkage();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const rows = computed(() => view.value?.rows ?? []);

const axisAlias = computed(() => mapping.value?.axis || view.value?.dimensionAliases?.[0] || 'dim0');

interface ColumnDef {
  field: string;
  title: string;
  width?: number;
}

const columns = computed<ColumnDef[]>(() => {
  const list: ColumnDef[] = [
    {
      field: axisAlias.value,
      title: view.value?.dimensionLabels?.[0] || '名称',
      width: 140
    }
  ];
  const aliases = view.value?.measureAliases?.length ? view.value.measureAliases : [mapping.value?.value || 'value'];
  aliases.forEach((alias, index) => {
    list.push({ field: alias, title: view.value?.measureLabels?.[index] || alias });
  });
  return list;
});

const records = computed(() => rows.value.slice(0, Math.max(1, Number(style.value.maxRows) || 50)));

const fontSize = computed(() => Math.max(10, Math.min(20, Number(style.value.fontSize) || 12)));

// VTable 是 canvas 渲染，不吃 CSS 变量；这里在渲染期读 .datav-scope 的 computed style 解析成字面色。
// 组件一定渲染在画布作用域内（widget-runtime 保证），token 读不到时空串交给 VChart 默认样式。
function resolveToken(token: string): string {
  const scope = document.querySelector('.datav-scope');
  if (!scope) return '';
  return getComputedStyle(scope).getPropertyValue(token).trim();
}

const options = computed(() => ({
  columns: columns.value.map(col => ({
    field: col.field,
    title: col.title,
    width: col.width ?? undefined
  })),
  defaultRowHeight: fontSize.value * 2.2,
  headerStyle: {
    fontSize: fontSize.value,
    color: resolveToken('--datav-text-primary'),
    bgColor: resolveToken('--datav-panel'),
    borderLineWidth: 1,
    borderColor: resolveToken('--datav-border')
  },
  styleConfig: {
    stripe: style.value.striped !== false
  },
  bodyStyle: {
    fontSize: fontSize.value,
    color: resolveToken('--datav-text-secondary'),
    bgColor: 'transparent',
    borderLineWidth: 1,
    borderColor: resolveToken('--datav-border'),
    hover: { cellBgColor: resolveToken('--datav-panel') }
  },
  autoWrapText: false,
  overflow: { interactive: false } as never
}));

const empty = computed(() => !loading.value && records.value.length === 0);

/* ---------- 联动（M6.2）：VTable 是 canvas 渲染，点击与选中都得走它自己的 API ---------- */

/** 本组件的列是平铺的，表头只有一层；VTable 的 row 从 0 起算且第 0 行是表头 */
const HEADER_ROWS = 1;

interface VTableLike {
  selectCells: (ranges: unknown[]) => void;
}

const tableRef = ref<{ vTableInstance?: VTableLike } | null>(null);

function onCellClick(args: { col?: number; row?: number }) {
  const index = Number(args?.row) - HEADER_ROWS;
  if (!Number.isInteger(index) || index < 0 || index >= records.value.length) return;
  clickRow(records.value[index]);
}

/**
 * 选中行用 VTable 的 selectCells 画，而不是往 options 里塞行背景：
 * options 一变 vue-vtable 会整表重建，投屏上每 30s 刷一次就闪一次。
 * 数据刷新会清掉选区，所以 records 与选中变化后都要重打一次。
 */
function applySelection() {
  const instance = tableRef.value?.vTableInstance;
  if (!instance) return;
  const index = records.value.findIndex(row => isSelected(row));
  if (index < 0) {
    instance.selectCells([]);
    return;
  }
  const row = index + HEADER_ROWS;
  instance.selectCells([{ start: { col: 0, row }, end: { col: Math.max(0, columns.value.length - 1), row } }]);
}

watch(
  [records, () => linkage?.selection?.code ?? ''],
  () => {
    nextTick(applySelection);
  },
  { flush: 'post' }
);
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <ListTable
      v-if="!empty && !error"
      ref="tableRef"
      :options="options"
      :records="records"
      height="100%"
      width="100%"
      @click-cell="onCellClick"
    />

    <div
      v-if="error || empty"
      class="absolute inset-0 flex items-center justify-center text-12px"
      :class="error ? 'text-[var(--datav-error)]' : 'text-[var(--datav-text-secondary)]'"
    >
      {{ error || '暂无数据' }}
    </div>
  </div>
</template>
