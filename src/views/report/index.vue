<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import * as XLSX from 'xlsx';
import { findReportDashboardDetail, queryReportData } from '@/service';
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

/** 看板级过滤：选一个各卡片共用的维度字段做包含过滤，没有该字段的卡不受影响 */
const filterField = ref<string | null>(null);
const filterKeyword = ref('');

function dimensionFields(card: ChartCardModel) {
  return (card.report?.config?.dimensions ?? []).map(dim => dim.field).filter(Boolean);
}

const filterFieldOptions = computed(() => {
  const labels = new Map<string, string>();
  cards.value.forEach(card => {
    (card.report?.config?.dimensions ?? []).forEach((dim, index) => {
      if (dim.field) {
        labels.set(dim.field, card.dimensionLabels[index] || dim.field);
      }
    });
  });
  // 过滤按字段编码下发，选项里同时给出中文名，避免只看到一列英文编码
  return [...labels].map(([value, label]) => ({ label: label === value ? value : `${label}（${value}）`, value }));
});

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

/** 下钻：携带维度值跳到底层表列表页（dynamic-data-list 支持查询参初始过滤） */
function handleDrillDown(card: ChartCardModel, row: ReportChartNamespace.AggRow) {
  const report = card.report;
  if (!report?.datasetCode) return;
  const dim = report.config?.dimensions?.[0];
  if (!dim?.field) return;
  const dimValue = row.dim0Code ?? row.dim0;
  if (dimValue === undefined || dimValue === null || dimValue === '') return;
  // 配了 lookup 的维度，下钻目标是关联表本身
  const targetTable = dim.lookup?.targetTableCode || report.datasetCode;
  router.push({ path: `/builder/${targetTable}`, query: { [`f_${dim.field}`]: String(dimValue) } });
}

function runtimeFilters(card: ChartCardModel): ReportDatasetNamespace.ReportFilter[] | undefined {
  const field = filterField.value;
  const value = filterKeyword.value.trim();
  if (!field || !value) {
    return undefined;
  }
  // 只对该字段属于本卡维度的卡片下发，避免后端按不存在的列过滤直接报错
  if (!dimensionFields(card).includes(field)) {
    return undefined;
  }
  return [{ field, op: 'like', value }];
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
  filterField.value = null;
  filterKeyword.value = '';
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
          <div class="flex flex-1 items-center justify-end gap-8px">
            <ElSelect
              v-model="filterField"
              size="small"
              class="w-180px"
              clearable
              filterable
              tag
              placeholder="按维度字段过滤"
            >
              <ElOption v-for="opt in filterFieldOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
            <ElInput
              v-model="filterKeyword"
              size="small"
              class="w-200px"
              clearable
              placeholder="维度值包含"
              @keyup.enter="applyFilter"
            />
            <ElButton size="small" type="primary" secondary :disabled="!filterKeyword.trim()" @click="applyFilter">
              应用
            </ElButton>
            <ElButton size="small" :disabled="!filterKeyword && !filterField" @click="clearFilter">清除</ElButton>
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
                  <ElButton quaternary size="small" @click="exportCard(card)">导出</ElButton>
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
