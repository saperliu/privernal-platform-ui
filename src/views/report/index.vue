<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import * as XLSX from 'xlsx';
import { exportReportPdf, findReportDashboardDetail, queryReportData } from '@/service';
import { useLoading } from '@/hooks';
import { getQueryString } from '@/utils';

defineOptions({ name: 'ReportDashboard' });
const router = useRouter();
const { loading, startLoading, endLoading } = useLoading(false);

/** 仪表盘编码：菜单路径段 /report/{code} 或查询串 ?code= */
const dashboardCode = computed(() => {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  if (segments.length >= 2 && segments[0] === 'report') {
    return segments[1];
  }
  return getQueryString(window.location.search, 'code') || '';
});

interface ChartCardModel {
  item: ReportDashboardNamespace.DashboardItem;

  report: ReportChartNamespace.Report | null;

  rows: ReportChartNamespace.AggRow[];

  dimensionAliases: string[];

  measureAliases: string[];

  /** 中文字段名：优先后端按列快照回传的值，拿不到才回退字段编码 */
  dimensionLabels: string[];

  measureLabels: string[];

  /** 取数失败原因，卡片里直接可读显示，不留空白图 */
  error: string;

  loaded: boolean;
}

const cards = ref<ChartCardModel[]>([]);
const dashboardName = ref('');
const loadError = ref('');

/** 看板级全局筛选（R2-12）：多条件行，字段候选来自各卡维度∪度量的并集 */
interface GlobalFilterRow {
  field: string;

  op: ReportDatasetNamespace.ReportFilter['op'];

  value: string;
}

const FILTER_OP_OPTIONS: Array<{ label: string; value: ReportDatasetNamespace.ReportFilter['op'] }> = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'ne' },
  { label: '包含', value: 'like' },
  { label: '大于', value: 'gt' },
  { label: '大于等于', value: 'ge' },
  { label: '小于', value: 'lt' },
  { label: '小于等于', value: 'le' }
];

const filterRows = ref<GlobalFilterRow[]>([]);

function addFilterRow() {
  filterRows.value.push({ field: '', op: 'eq', value: '' });
}

const globalFieldOptions = computed(() => {
  const labels = new Map<string, string>();
  cards.value.forEach(card => {
    (card.report?.config?.dimensions ?? []).forEach((dim, index) => {
      if (dim.field) {
        labels.set(dim.field, card.dimensionLabels[index] || dim.field);
      }
    });
    (card.report?.config?.measures ?? []).forEach((measure, index) => {
      if (measure.field) {
        labels.set(measure.field, card.measureLabels[index] || measure.field);
      }
    });
  });
  // 过滤按字段编码下发，选项里同时给出中文名，避免只看到一列英文编码
  return [...labels].map(([value, label]) => ({ label: label === value ? value : `${label}（${value}）`, value }));
});

/** 卡片可下发的字段集合：维度∪度量。该卡没有的字段不下发，避免后端按不存在的列过滤直接报错 */
function cardFields(card: ChartCardModel) {
  const fields = new Set<string>();
  (card.report?.config?.dimensions ?? []).forEach(dim => {
    if (dim.field) fields.add(dim.field);
  });
  (card.report?.config?.measures ?? []).forEach(measure => {
    if (measure.field) fields.add(measure.field);
  });
  return fields;
}

/** 后端未回传度量别名时按度量个数兜底：首个度量固定叫 value，其余 m1、m2… */
function defaultMeasureAliases(count: number) {
  if (count === 0) {
    return ['value'];
  }
  return Array.from({ length: count }, (_, i) => (i === 0 ? 'value' : `m${i}`));
}

function aliasesOf(card: ChartCardModel, data?: ReportChartNamespace.AggResult | null) {
  const dimensions = card.report?.config?.dimensions ?? [];
  const measures = card.report?.config?.measures ?? [];
  return {
    dimensionAliases: data?.dimensionAliases?.length ? data.dimensionAliases : dimensions.map((_, i) => `dim${i}`),
    measureAliases: data?.measureAliases?.length ? data.measureAliases : defaultMeasureAliases(measures.length),
    dimensionLabels: data?.dimensionLabels?.length ? data.dimensionLabels : dimensions.map(dim => dim.field),
    measureLabels: data?.measureLabels?.length ? data.measureLabels : measures.map(measure => measure.field || '计数')
  };
}

/** 卡片数据导出：按实际维度与度量全列导出，不再只导第一列 */
function exportCard(card: ChartCardModel) {
  if (!card.rows?.length) {
    window.$message?.error('没有可导出的数据');
    return;
  }
  const { dimensionAliases, measureAliases, dimensionLabels, measureLabels } = card;
  const columns = [
    ...dimensionAliases.map((alias, index) => ({ alias, title: dimensionLabels[index] || alias })),
    ...measureAliases.map((alias, index) => ({ alias, title: measureLabels[index] || alias }))
  ];
  const sheetRows = card.rows.map(row => {
    const record: Record<string, any> = {};
    columns.forEach(column => {
      record[column.title] = row[column.alias] ?? '';
    });
    return record;
  });
  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '报表数据');
  XLSX.writeFile(workbook, `${card.item.title || card.report?.reportName || '报表数据'}.xlsx`);
}

/** 服务端 PDF 导出（R2-12）：与页面同一份数据链路（后端按 /query 同口径取数），带当前全局筛选 */
async function exportCardPdf(card: ChartCardModel) {
  const res = await exportReportPdf(dashboardCode.value, card.report?.reportCode ?? '', runtimeFilters(card));
  if (res.error !== null || !res.data) {
    window.$message?.error(res.error?.message || 'PDF 导出失败');
    return;
  }
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${card.item.title || card.report?.reportName || '报表数据'}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

/** 下钻（R2-12 配置化）：携带维度值跳到底层表列表页（dynamic-data-list 支持查询参初始过滤）。
 * config 无 drill 键的存量图按旧行为处理（可下钻、第一维度、目标=lookup||数据集主表）；
 * 配了 drill 以 enabled 为准——关闭即禁用。 */
function handleDrillDown(card: ChartCardModel, row: ReportChartNamespace.AggRow) {
  const report = card.report;
  if (!report?.datasetCode) return;
  const drill = report.config?.drill;
  if (drill && !drill.enabled) return;
  const dimensions = report.config?.dimensions ?? [];
  const index = Math.min(Math.max(drill?.dimensionIndex ?? 0, 0), Math.max(dimensions.length - 1, 0));
  const dim = dimensions[index];
  if (!dim?.field) return;
  const dimValue = row[`dim${index}Code`] ?? row[`dim${index}`];
  if (dimValue === undefined || dimValue === null || dimValue === '') return;
  // 配了 lookup 的维度，下钻目标默认是关联表本身；显式配置的目标表优先
  const targetTable = drill?.targetTableCode || dim.lookup?.targetTableCode || report.datasetCode;
  router.push({ path: `/builder/${targetTable}`, query: { [`f_${dim.field}`]: String(dimValue) } });
}

function runtimeFilters(card: ChartCardModel): ReportDatasetNamespace.ReportFilter[] | undefined {
  const rows = filterRows.value.filter(
    row => row.field && row.value !== '' && row.value !== null && cardFields(card).has(row.field)
  );
  if (rows.length === 0) {
    return undefined;
  }
  return rows.map(row => ({ field: row.field, op: row.op, value: row.value }));
}

async function loadCardData(index: number) {
  const card = cards.value[index];
  if (!card.report) {
    card.loaded = true;
    return;
  }
  const { data, error } = await queryReportData(dashboardCode.value, card.report.reportCode, runtimeFilters(card));
  if (error === null && data) {
    card.rows = data.rows ?? [];
    card.error = '';
    const aliases = aliasesOf(card, data);
    card.dimensionAliases = aliases.dimensionAliases;
    card.measureAliases = aliases.measureAliases;
    card.dimensionLabels = aliases.dimensionLabels;
    card.measureLabels = aliases.measureLabels;
  } else {
    card.rows = [];
    card.error = error?.message || '取数失败';
  }
  card.loaded = true;
}

async function load() {
  if (!dashboardCode.value) {
    loadError.value = '缺少仪表盘编码';
    window.$message?.error('缺少仪表盘编码');
    return;
  }
  loadError.value = '';
  startLoading();
  try {
    const { data, error } = await findReportDashboardDetail(dashboardCode.value);
    if (error !== null || !data) {
      loadError.value = error?.message || '仪表盘加载失败';
      cards.value = [];
      return;
    }
    dashboardName.value = data.dashboard.dashboardName ?? '';
    cards.value = data.items.map(item => {
      const report = data.reports.find(one => one.reportCode === item.reportCode) ?? null;
      return {
        item,
        report,
        rows: [],
        ...aliasesOf({ report } as ChartCardModel),
        error: '',
        loaded: false
      };
    });
    await Promise.all(cards.value.map((_card, index) => loadCardData(index)));
  } finally {
    endLoading();
  }
}

function reloadCards() {
  cards.value.forEach(card => {
    card.loaded = false;
    card.error = '';
  });
  cards.value.forEach((_card, index) => loadCardData(index));
}

function applyFilter() {
  reloadCards();
}

function clearFilter() {
  filterRows.value = [];
  reloadCards();
}

onMounted(() => {
  load();
});
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col overflow-hidden">
        <div class="mb-12px flex flex-wrap items-center gap-12px">
          <div class="text-18px font-600">{{ dashboardName }}</div>
          <div class="flex flex-1 flex-wrap items-center justify-end gap-8px">
            <template v-for="(row, index) in filterRows" :key="index">
              <ElSelect v-model="row.field" size="small" class="w-170px" clearable filterable placeholder="字段">
                <ElOption v-for="opt in globalFieldOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </ElSelect>
              <ElSelect v-model="row.op" size="small" class="w-90px">
                <ElOption v-for="opt in FILTER_OP_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
              </ElSelect>
              <ElInput
                v-model="row.value"
                size="small"
                class="w-150px"
                clearable
                placeholder="值"
                @keyup.enter="applyFilter"
              />
              <ElButton size="small" quaternary @click="filterRows.splice(index, 1)">删</ElButton>
            </template>
            <ElButton size="small" tertiary @click="addFilterRow">+ 条件</ElButton>
            <ElButton
              size="small"
              type="primary"
              secondary
              :disabled="!filterRows.some(row => row.field && row.value !== '')"
              @click="applyFilter"
            >
              应用
            </ElButton>
            <ElButton size="small" :disabled="filterRows.length === 0" @click="clearFilter">清除</ElButton>
            <ElButton size="small" tertiary @click="load">刷新</ElButton>
          </div>
        </div>

        <ElAlert v-if="loadError" type="error" class="mb-12px">{{ loadError }}</ElAlert>

        <div v-loading="loading" class="flex-1 overflow-auto">
          <div class="grid grid-cols-12 gap-x-12px gap-y-12px">
            <div v-for="card in cards" :key="card.item.reportCode" class="col-span-cardSpan(card)">
              <ElCard
                :title="card.item.title || card.report?.reportName || ''"
                size="small"
                :bordered="true"
                class="h-320px rounded-8px"
              >
                <template #header-extra>
                  <ElSpace :size="4">
                    <ElButton quaternary size="small" @click="exportCardPdf(card)">PDF</ElButton>
                    <ElButton quaternary size="small" @click="exportCard(card)">导出</ElButton>
                  </ElSpace>
                </template>
                <ChartCard
                  v-if="card.loaded && card.report"
                  :report-type="card.report.reportType"
                  :report-name="card.report.reportName"
                  :rows="card.rows"
                  :dimension-aliases="card.dimensionAliases"
                  :measure-aliases="card.measureAliases"
                  :dimension-labels="card.dimensionLabels"
                  :measure-labels="card.measureLabels"
                  :error="card.error"
                  :ranking-limit="card.report.config?.rankingLimit ?? 10"
                  :gauge-max="card.report.config?.gaugeMax"
                  :format="card.report.config?.format ?? null"
                  :on-dim-click="row => handleDrillDown(card, row)"
                />
                <div v-else-if="!card.loaded" class="h-full flex items-center justify-center text-gray-400">
                  加载中…
                </div>
                <div v-else class="h-full flex items-center justify-center text-gray-400">图表配置缺失</div>
              </ElCard>
            </div>
          </div>
          <ElEmpty v-if="cards.length === 0 && !loading" description="仪表盘暂无图表卡片" class="mt-80px" />
        </div>
      </div>
    </ElCard>
  </div>
</template>
