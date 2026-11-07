<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { findDatavScreenList, findReportDatasetList, previewReportData } from '@/service';
import { useDatavStore } from '@/store';
import { useAuth } from '@/hooks';
import { openScreenTarget, withoutJump } from '@/utils/datav-linkage';
import { getWidgetMeta } from '@/packages/components/registry';
import DatavFilterTree from '@/components/datav/filter-tree/index.vue';

defineOptions({ name: 'DatavDatasetBinding' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const store = useDatavStore();
const { hasAuth } = useAuth();

/** 以下四组取值必须与后端 DynamicReportQueryService 的白名单一一对应，改一边就要改另一边 */
// 与后端 ComputeSpecs 同集合；MEDIAN/PERCENTILE 刻意缺席（SQL 侧只能凑近似值，两条路径会给出不一致的数）
const AGG_FUNCS: ReportChartNamespace.Measure['agg'][] = ['SUM', 'COUNT', 'COUNTD', 'AVG', 'MAX', 'MIN'];

const GRANULARITIES: NonNullable<ReportChartNamespace.Dimension['granularity']>[] = [
  'MINUTE',
  'HOUR',
  'DAY',
  'WEEK',
  'MONTH',
  'YEAR'
];

/** stat/gauge 无维度也能出数，其余类型后端强制至少一个维度 */
const SINGLE_VALUE_TYPES: ReportChartNamespace.ReportType[] = ['stat', 'gauge'];

const MAX_MEASURES = 5;

const PREVIEW_ROWS = 10;

const datasets = ref<ReportDatasetNamespace.Dataset[]>([]);
/** 列表未加载完之前不做失效判定，否则会闪一条「已不存在」的误报 */
const datasetsLoaded = ref(false);

const loadError = ref('');

const previewing = ref(false);

const previewError = ref('');

const preview = ref<ReportChartNamespace.AggResult | null>(null);

const data = computed(() => props.widget.data);

const meta = computed(() => getWidgetMeta(props.widget.type));

/** 聚合形态由组件自己声明（WidgetMeta.reportType），不在这里按类型名写 if-else */
const reportType = computed<ReportChartNamespace.ReportType>(() => meta.value.reportType ?? 'bar');

const isSingleValue = computed(() => SINGLE_VALUE_TYPES.includes(reportType.value));

const config = computed(() => data.value.reportConfig);

const dimensions = computed(() => config.value?.dimensions ?? []);

const measures = computed(() => config.value?.measures ?? []);

const currentDataset = computed(() => datasets.value.find(item => item.datasetCode === data.value.datasetCode) ?? null);

const columns = computed(() => currentDataset.value?.columnSnapshot?.columns ?? []);

const datasetOptions = computed(() =>
  datasets.value.map(item => ({ label: item.datasetName, value: item.datasetCode }))
);

const dimensionOptions = computed(() =>
  columns.value.map(column => ({ label: `${column.fieldName}（${column.fieldCode}）`, value: column.fieldCode }))
);

/** 度量只能取数值列——把文本列选成 SUM 会一路查到后端报「不是数值列」，那是一次很远的失败 */
const measureOptions = computed(() =>
  columns.value
    .filter(column => column.dataType === 'number')
    .map(column => ({ label: `${column.fieldName}（${column.fieldCode}）`, value: column.fieldCode }))
);

const previewColumns = computed<Array<{ key: string; label: string }>>(() => {
  const result = preview.value;
  if (!result) return [];
  const dims = (result.dimensionAliases ?? []).map((alias, index) => ({
    key: alias,
    label: result.dimensionLabels?.[index] || alias
  }));
  const measuresCols = (result.measureAliases ?? []).map((alias, index) => ({
    key: alias,
    label: result.measureLabels?.[index] || alias
  }));
  const merged = [...dims, ...measuresCols];
  if (merged.length) return merged;
  // 后端没回别名清单时按第一行的键兜底，至少不至于一片空白
  const first = result.rows?.[0];
  return first ? Object.keys(first).map(key => ({ key, label: key })) : [];
});

const previewRows = computed(() => (preview.value?.rows ?? []).slice(0, PREVIEW_ROWS));

function columnType(field?: string): ReportDatasetNamespace.DatasetColumn['dataType'] {
  return columns.value.find(column => column.fieldCode === field)?.dataType ?? 'text';
}

/** 粒度只允许白名单内的值，其余（含「不分组」的空串）一律归一成 '' */
function normalizeGranularity(value: unknown): ReportChartNamespace.Dimension['granularity'] {
  const text = String(value ?? '');
  return (GRANULARITIES as readonly string[]).includes(text)
    ? (text as ReportChartNamespace.Dimension['granularity'])
    : '';
}

function emptyConfig(): ReportChartNamespace.ReportConfig {
  return { dimensions: [], measures: [], filters: [] };
}

/**
 * 过滤树与 TopN 的补丁入口。
 *
 * 树为空时写 null 而不是 {op:'and',when:[]}：后端把空条件组判成错误（空 and 恒真会让
 * 一个配坏了的条件悄悄放宽结果集），所以前端不能留下空壳配置。
 */
const filterTree = computed(() => config.value?.filterTree ?? null);
const havingTree = computed(() => config.value?.having ?? null);
const topNConfig = computed(() => config.value?.topN ?? null);

function patchFilterTree(node: ReportChartNamespace.FilterNode | null) {
  // 空组（when 为空）在 patchFilterTree 里会被判回 null（后端不接受空 and），
  // 所以建组时必须连一个默认条件行，否则点了按钮没有任何反应
  patchConfig({ filterTree: node ?? undefined });
}

function patchHaving(node: ReportChartNamespace.FilterNode | null) {
  // 与 patchFilterTree 同口径：建组时带默认条件行，空组判回 null 的守卫已无必要
  patchConfig({ having: node ?? undefined });
}

function patchTopN(next: Partial<ReportChartNamespace.TopNConfig>) {
  const merged = { ...(topNConfig.value ?? { n: 0 }), ...next };
  patchConfig({ topN: merged.n > 0 ? merged : null });
}

/** HAVING 的字段是聚合别名而不是列编码，所以给树的字段下拉换一份候选 */
const aliasColumns = computed(() => {
  const dims = config.value?.dimensions ?? [];
  const measureList = config.value?.measures ?? [];
  return [
    ...dims.map((_, index) => ({ fieldCode: `dim${index}`, fieldName: `维度 ${index + 1}`, dataType: 'text' })),
    ...(measureList.length
      ? measureList.map((measure, index) => ({
          fieldCode: index === 0 ? 'value' : `m${index}`,
          fieldName: `${measure.field || '度量'}（${measure.agg || 'SUM'}）`,
          dataType: 'number'
        }))
      : [])
  ];
});

/** 与后端 DynamicDatavDataService.FILTER_OPS 同一份白名单 */
const FILTER_OPS: NonNullable<DatavNamespace.ParamBinding['op']>[] = ['eq', 'ne', 'like', 'gt', 'ge', 'lt', 'le'];

/** 画布级参数（schema.params），绑定行的参数下拉从这里取 */
const canvasParams = computed(() => store.schema.params ?? []);

const paramBindings = computed(() => data.value.paramBindings ?? []);

function addBinding() {
  store.updateWidgetData(props.widget.id, {
    paramBindings: [
      ...paramBindings.value,
      { param: canvasParams.value[0]?.code ?? '', field: '', op: 'eq', required: true }
    ]
  });
}

function patchBinding(index: number, next: Partial<DatavNamespace.ParamBinding>) {
  store.updateWidgetData(props.widget.id, {
    paramBindings: paramBindings.value.map((item, i) => (i === index ? { ...item, ...next } : item))
  });
}

function removeBinding(index: number) {
  store.updateWidgetData(props.widget.id, {
    paramBindings: paramBindings.value.filter((_, i) => i !== index)
  });
}

function patchConfig(next: Partial<ReportChartNamespace.ReportConfig>) {
  store.updateWidgetData(props.widget.id, { reportConfig: { ...(config.value ?? emptyConfig()), ...next } });
}

/* ---------- 刷新策略（M6.4） ---------- */

const REFRESH_STRATEGIES = [
  { value: 'none', label: '不刷新' },
  { value: 'interval', label: '定时轮询' },
  { value: 'manual', label: '仅联动/参数触发' },
  { value: 'realtime', label: '实时（WS 节拍）' }
] as const;

const refresh = computed(() => data.value.refresh ?? { strategy: 'none' as const });

function patchRefresh(next: Partial<DatavNamespace.DataRefresh>) {
  store.updateWidgetData(props.widget.id, { refresh: { ...refresh.value, ...next } });
}

/* ---------- 联动与下钻（M6.2） ---------- */

const interactions = computed(() => props.widget.interactions ?? []);

const drillFields = computed(() => data.value.drillFields ?? []);

/** 带原数组下标，编辑时才能改对条目而不是按值找（两条完全相同的配置是合法的） */
const paramLinks = computed(() =>
  interactions.value.map((item, index) => ({ item, index })).filter(entry => entry.item.action === 'set_param')
);

/** 别名候选只到实际配了几个维度，不让设计者点出一个不存在的 dim2 */
const aliasOptions = computed(() => {
  const count = Math.max(1, dimensions.value.length);
  return Array.from({ length: count }, (_, i) => `dim${i}`);
});

function patchInteractions(next: DatavNamespace.WidgetInteraction[]) {
  store.updateWidget(props.widget.id, { interactions: next.length ? next : undefined });
}

function patchInteraction(index: number, next: Partial<DatavNamespace.WidgetInteraction>) {
  patchInteractions(interactions.value.map((item, i) => (i === index ? { ...item, ...next } : item)));
}

function removeInteraction(index: number) {
  patchInteractions(interactions.value.filter((_, i) => i !== index));
}

function addParamLink() {
  patchInteractions([
    ...interactions.value,
    {
      trigger: 'click',
      action: 'set_param',
      field: 'dim0',
      param: canvasParams.value[0]?.code ?? '',
      target: '*'
    }
  ]);
}

function toggleDrill(on: boolean) {
  const rest = interactions.value.filter(item => item.action !== 'drill');
  patchInteractions(on ? [...rest, { trigger: 'click', action: 'drill' }] : rest);
}

function patchDrillFields(next: string[]) {
  store.updateWidgetData(props.widget.id, { drillFields: next.length ? next : undefined });
}

/* ---------- 点击跳屏（M6.2 的第三种动作） ---------- */

/**
 * 跳转目标候选。
 *
 * 刻意不过滤成「只有已发布的」：一块典型的应用往往只有一两块屏发布过，把其余的藏起来会让面板
 * 看起来像坏了。列出来但置灰、并标「未发布」，设计者才看得见为什么不能选，而不是以为功能没生效。
 */
const jumpScreens = ref<DatavNamespace.ScreenSummary[]>([]);

/** 投放页读的是发布快照，指向草稿屏等于跳进一块打不开的屏 */
function jumpable(screen: DatavNamespace.ScreenSummary) {
  return screen.status === 1;
}

function jumpLabel(screen: DatavNamespace.ScreenSummary) {
  return jumpable(screen) ? screen.screenName : `${screen.screenName}（未发布）`;
}

const jumpOn = computed(() => interactions.value.some(item => item.action === 'open_screen'));

const jumpTarget = computed(() => openScreenTarget(props.widget) ?? '');

/**
 * 跳屏与「传播参数 / 下钻」互斥：勾一个就把另一个清掉。
 * 两套并存会做出自相矛盾的语义——点了既改本屏参数又跳走，观众后退回来是一层陌生的下钻。
 */
function toggleJump(on: boolean) {
  patchInteractions(
    on ? [{ trigger: 'click', action: 'open_screen', target: jumpTarget.value }] : withoutJump(interactions.value)
  );
}

function patchJumpTarget(code: string) {
  patchInteractions([{ trigger: 'click', action: 'open_screen', target: code }]);
}

async function loadJumpScreens() {
  const res = await findDatavScreenList(store.appId || undefined);
  jumpScreens.value = res.error === null && res.data ? res.data : [];
}

/** 预览走报表的设计态接口，权限与数据集列表是两条：只给 list 不给 query 的账号点必 403 */
const canPreview = computed(() => hasAuth('report:dataset:query'));

async function loadDatasets() {
  if (!hasAuth('report:dataset:list')) {
    loadError.value = '当前账号没有「数据集查询」权限，只能使用静态数据';
    return;
  }
  if (!store.appId) {
    loadError.value = '该大屏未归属应用，列不出数据集';
    return;
  }
  const res = await findReportDatasetList(store.appId);
  if (res.error === null && res.data) {
    datasets.value = res.data;
    loadError.value = '';
    datasetsLoaded.value = true;
    return;
  }
  datasets.value = [];
  datasetsLoaded.value = true;
  loadError.value = res.error?.message || '数据集列表加载失败';
}

function onModeChange(value: unknown) {
  store.updateWidgetData(props.widget.id, { mode: value === 'dataset' ? 'dataset' : 'static' });
}

function onDatasetChange(datasetCode: string) {
  const code = datasetCode.trim();
  if (code === '') {
    store.updateWidgetData(props.widget.id, { mode: 'static', datasetCode: undefined });
    return;
  }
  // 换数据集时旧槽位多半失效，直接清空而不是留着让后端报「不在列快照中」
  store.updateWidgetData(props.widget.id, { mode: 'dataset', datasetCode: code, reportConfig: emptyConfig() });
}

function addDimension() {
  patchConfig({ dimensions: [...dimensions.value, { field: '', granularity: '' }] });
}

function patchDimension(index: number, next: Partial<ReportChartNamespace.Dimension>) {
  patchConfig({
    dimensions: dimensions.value.map((item, i) => (i === index ? { ...item, ...next } : item))
  });
}

function removeDimension(index: number) {
  patchConfig({ dimensions: dimensions.value.filter((_, i) => i !== index) });
}

function addMeasure() {
  if (measures.value.length >= MAX_MEASURES) {
    window.$message?.error(`单个组件最多 ${MAX_MEASURES} 个度量`);
    return;
  }
  patchConfig({ measures: [...measures.value, { field: '', agg: 'SUM' }] });
}

function patchMeasure(index: number, next: Partial<ReportChartNamespace.Measure>) {
  patchConfig({ measures: measures.value.map((item, i) => (i === index ? { ...item, ...next } : item)) });
}

function removeMeasure(index: number) {
  patchConfig({ measures: measures.value.filter((_, i) => i !== index) });
}

/**
 * 只把填完整的槽位发出去：编辑中的空行是常态，
 * 而内核会对空字段名报「非法标识符」，那是一次毫无意义的往返。
 */
function usableConfig(): ReportChartNamespace.ReportConfig {
  const base = config.value ?? emptyConfig();
  return {
    ...base,
    reportType: reportType.value,
    dimensions: base.dimensions
      .filter(item => item?.field)
      .map(item => ({
        field: item.field,
        granularity: columnType(item.field) === 'date' ? item.granularity || '' : ''
      })),
    // COUNT 不指定字段就是对行计数，后端也认这一条，不能在这里把它当空槽丢掉
    measures: base.measures
      .filter(item => item?.field || item?.agg === 'COUNT')
      .map(item => ({
        field: item.field || '',
        agg: item.agg || 'SUM'
      }))
  };
}

function validate(): string {
  if (!data.value.datasetCode) return '请先选择数据集';
  const base = config.value ?? emptyConfig();
  if (!isSingleValue.value && !base.dimensions.some(item => item?.field)) {
    return `${meta.value.name}至少需要一个维度`;
  }
  if (!base.measures.some(item => item?.field || item?.agg === 'COUNT')) {
    return '至少需要一个度量（或一个「计数」）';
  }
  return '';
}

async function handlePreview() {
  const message = validate();
  if (message) {
    previewError.value = message;
    return;
  }
  previewing.value = true;
  previewError.value = '';
  try {
    const res = await previewReportData(data.value.datasetCode as string, usableConfig());
    if (res.error === null && res.data) {
      preview.value = res.data;
      // 写进设计态缓存，画布上这个组件立刻按真实数据渲染；这一步不碰 schema
      store.setDesignPreview(props.widget.id, res.data);
      return;
    }
    preview.value = null;
    store.setDesignPreview(props.widget.id, null);
    previewError.value = res.error?.message || '预览取数失败';
  } finally {
    previewing.value = false;
  }
}

function clearPreview() {
  preview.value = null;
  previewError.value = '';
  store.setDesignPreview(props.widget.id, null);
}

watch(
  () => JSON.stringify([data.value.datasetCode, data.value.reportConfig]),
  () => {
    // 配置一改就作废上一次的取数结果：否则用户会拿旧数据判断新配置对不对
    clearPreview();
  }
);

onMounted(() => {
  loadDatasets();
  loadJumpScreens();
});
</script>

<template>
  <div class="datav-binding flex flex-col gap-10px">
    <div class="flex flex-wrap gap-8px">
      <ElRadioGroup :model-value="data.mode" size="small" @update:model-value="onModeChange">
        <ElRadioButton value="static">静态</ElRadioButton>
        <ElRadioButton value="dataset">数据集</ElRadioButton>
      </ElRadioGroup>
      <span class="self-center text-11px opacity-50" title="发给后端的聚合形态">聚合 {{ reportType }}</span>
    </div>

    <div v-if="loadError" class="text-12px text-[var(--datav-warning)]">{{ loadError }}</div>

    <template v-if="data.mode === 'dataset'">
      <ElSelect
        :model-value="data.datasetCode || ''"
        filterable
        clearable
        placeholder="选择数据集"
        class="w-full"
        :no-data-text="datasets.length ? '无匹配' : '当前应用暂无数据集'"
        @update:model-value="v => onDatasetChange(String(v ?? ''))"
      >
        <ElOption v-for="item in datasetOptions" :key="item.value" :label="item.label" :value="item.value" />
      </ElSelect>

      <!--
 失效告警：绑定的数据集已不在可选列表（被删/无权限/换了应用），运行态该组件会一直报错；
           下拉显示不出原编码，所以这里把编码原样写出来，方便对照排查 
-->
      <div
        v-if="datasetsLoaded && data.datasetCode && !currentDataset"
        class="datav-binding__stale text-12px text-[var(--datav-error)]"
        role="alert"
      >
        数据集 {{ data.datasetCode }} 已不存在或无权限访问，请重新选择或改为静态数据
      </div>

      <div v-if="!currentDataset" class="text-12px opacity-60">选择数据集后这里会列出可用于维度与度量的字段</div>

      <template v-else>
        <div class="flex items-center justify-between">
          <span class="text-12px font-600">维度</span>
          <ElButton size="small" text @click="addDimension">+ 维度</ElButton>
        </div>
        <div
          v-for="(item, index) in dimensions"
          :key="`dim-${index}`"
          class="datav-binding__row flex flex-wrap gap-6px"
        >
          <ElSelect
            :model-value="item.field"
            filterable
            size="small"
            placeholder="字段"
            class="min-w-120px flex-1"
            @update:model-value="v => patchDimension(index, { field: String(v ?? '') })"
          >
            <ElOption v-for="col in dimensionOptions" :key="col.value" :label="col.label" :value="col.value" />
          </ElSelect>
          <ElSelect
            v-if="columnType(item.field) === 'date'"
            :model-value="item.granularity || ''"
            size="small"
            class="w-88px"
            @update:model-value="v => patchDimension(index, { granularity: normalizeGranularity(v) })"
          >
            <ElOption label="不分组" value="" />
            <ElOption v-for="g in GRANULARITIES" :key="g" :label="g" :value="g" />
          </ElSelect>
          <ElButton size="small" text @click="removeDimension(index)">删</ElButton>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-12px font-600">度量</span>
          <ElButton size="small" text @click="addMeasure">+ 度量</ElButton>
        </div>
        <div v-for="(item, index) in measures" :key="`msr-${index}`" class="datav-binding__row flex flex-wrap gap-6px">
          <ElSelect
            :model-value="item.agg"
            size="small"
            class="w-88px"
            @update:model-value="v => patchMeasure(index, { agg: v as ReportChartNamespace.Measure['agg'] })"
          >
            <ElOption v-for="agg in AGG_FUNCS" :key="agg" :label="agg" :value="agg" />
          </ElSelect>
          <ElSelect
            :model-value="item.field"
            filterable
            clearable
            size="small"
            placeholder="数值字段"
            class="min-w-120px flex-1"
            @update:model-value="v => patchMeasure(index, { field: String(v ?? '') })"
          >
            <ElOption v-for="col in measureOptions" :key="col.value" :label="col.label" :value="col.value" />
          </ElSelect>
          <ElButton size="small" text @click="removeMeasure(index)">删</ElButton>
        </div>
        <div v-if="!measureOptions.length" class="text-12px opacity-60">该数据集没有数值列，只能做「计数」</div>

        <div class="flex items-center gap-8px">
          <span class="text-12px opacity-70">分组上限</span>
          <ElInputNumber
            :model-value="config?.limit"
            size="small"
            :min="1"
            :max="1000"
            controls-position="right"
            class="w-104px"
            @update:model-value="v => patchConfig({ limit: typeof v === 'number' ? v : undefined })"
          />
        </div>

        <!-- 图表级过滤：与数据集默认过滤是「并且」关系，支持 AND/OR 嵌套 -->
        <div class="mt-10px">
          <div class="flex items-center justify-between">
            <span class="text-12px font-600" title="图表级过滤条件，与数据集默认过滤取并且">过滤条件</span>
            <ElButton
              v-if="!filterTree"
              size="small"
              text
              :disabled="!columns.length"
              @click="
                patchFilterTree({ op: 'and', when: [{ field: columns[0]?.fieldCode || '', op: 'eq', value: '' }] })
              "
            >
              + 条件组
            </ElButton>
          </div>
          <div v-if="!filterTree" class="text-12px opacity-60">未设置过滤条件</div>
          <DatavFilterTree
            v-else
            :node="filterTree"
            :columns="columns"
            @update:node="patchFilterTree"
            @remove="patchFilterTree(null)"
          />
        </div>

        <!-- HAVING：作用于聚合结果，字段是别名而不是列编码 -->
        <div class="mt-10px">
          <div class="flex items-center justify-between">
            <span class="text-12px font-600" title="对聚合后的结果再筛一次，字段是 dim0/value/m1 这类别名">
              聚合后过滤
            </span>
            <ElButton
              v-if="!havingTree"
              size="small"
              text
              :disabled="!aliasColumns.length"
              @click="
                patchHaving({ op: 'and', when: [{ field: aliasColumns[0]?.fieldCode || '', op: 'eq', value: '' }] })
              "
            >
              + 条件组
            </ElButton>
          </div>
          <div v-if="!havingTree" class="text-12px opacity-60">未设置</div>
          <DatavFilterTree
            v-else
            :node="havingTree"
            :columns="aliasColumns"
            @update:node="patchHaving"
            @remove="patchHaving(null)"
          />
        </div>

        <!-- TopN：只留前 N 组，可选把其余合成一档「其他」 -->
        <div class="mt-10px">
          <div class="mb-6px flex items-center justify-between">
            <span class="text-12px font-600" title="按某个度量取前 N 组；填了归并名，剩下的会合成一行">TopN</span>
            <ElSwitch
              :model-value="!!topNConfig"
              size="small"
              @update:model-value="v => patchTopN(v ? { n: 10 } : { n: 0 })"
            />
          </div>
          <div v-if="topNConfig" class="flex flex-wrap items-center gap-6px">
            <ElSelect
              :model-value="topNConfig.by || ''"
              size="small"
              class="w-130px"
              placeholder="排序依据"
              @update:model-value="v => patchTopN({ by: (v as string) || undefined })"
            >
              <ElOption
                v-for="opt in aliasColumns"
                :key="opt.fieldCode"
                :label="opt.fieldName"
                :value="opt.fieldCode"
              />
            </ElSelect>
            <ElInputNumber
              :model-value="topNConfig.n"
              size="small"
              class="w-96px"
              :min="1"
              :max="200"
              :controls="false"
              @update:model-value="v => patchTopN({ n: typeof v === 'number' ? v : 0 })"
            />
            <ElInput
              :model-value="topNConfig.mergeRestAs || ''"
              size="small"
              class="w-110px"
              placeholder="其他（留空只截断）"
              @update:model-value="v => patchTopN({ mergeRestAs: (v as string).trim() || null })"
            />
          </div>
          <div v-if="topNConfig?.mergeRestAs" class="mt-4px text-12px opacity-60">
            归并「其他」会取回全部分组再合并；去重计数（COUNTD）无法从分组结果推出，配了归并会直接报错。
          </div>
        </div>

        <!--
 参数绑定：画布参数 → 数据集字段。运行态参数由预览页 URL 查询串/参数栏传入，
             这里只声明「哪个参数落到哪个字段、怎么比、缺值是否放行」 
-->
        <div class="mt-2px">
          <div class="flex items-center justify-between">
            <span class="text-12px font-600" title="运行时参数 → 数据集字段的条件映射">参数绑定</span>
            <ElButton size="small" text :disabled="!canvasParams.length" @click="addBinding">+ 绑定</ElButton>
          </div>
          <div v-if="!canvasParams.length" class="text-12px opacity-60">
            画布还没定义参数（右侧画布面板 → 参数），先去添加才能在这里绑定
          </div>
          <div
            v-for="(item, index) in data.paramBindings ?? []"
            :key="`pb-${index}`"
            class="datav-binding__row flex flex-wrap gap-6px"
          >
            <ElSelect
              :model-value="item.param"
              size="small"
              placeholder="画布参数"
              class="w-100px"
              @update:model-value="v => patchBinding(index, { param: String(v ?? '') })"
            >
              <ElOption v-for="p in canvasParams" :key="p.code" :label="p.name || p.code" :value="p.code" />
            </ElSelect>
            <ElSelect
              :model-value="item.field"
              filterable
              size="small"
              placeholder="字段"
              class="min-w-110px flex-1"
              @update:model-value="v => patchBinding(index, { field: String(v ?? '') })"
            >
              <ElOption v-for="col in dimensionOptions" :key="col.value" :label="col.label" :value="col.value" />
            </ElSelect>
            <ElSelect
              :model-value="item.op || 'eq'"
              size="small"
              class="w-72px"
              @update:model-value="v => patchBinding(index, { op: v as DatavNamespace.ParamBinding['op'] })"
            >
              <ElOption v-for="op in FILTER_OPS" :key="op" :label="op" :value="op" />
            </ElSelect>
            <ElCheckbox
              :model-value="item.required !== false"
              size="small"
              @update:model-value="v => patchBinding(index, { required: v === true })"
            >
              缺值报错
            </ElCheckbox>
            <ElButton size="small" text @click="removeBinding(index)">删</ElButton>
          </div>
          <div v-if="(data.paramBindings ?? []).length" class="text-11px leading-14px opacity-60">
            「缺值报错」勾掉等于允许该条件缺值时放行——只对确实可选的条件关闭。
          </div>
        </div>

        <div class="datav-binding__section">
          <div class="text-12px font-600">刷新</div>
          <div class="datav-binding__row flex flex-wrap items-center gap-6px">
            <ElSelect
              :model-value="refresh.strategy"
              size="small"
              class="w-150px"
              @update:model-value="
                (v: unknown) => patchRefresh({ strategy: String(v) as DatavNamespace.DataRefresh['strategy'] })
              "
            >
              <ElOption v-for="item in REFRESH_STRATEGIES" :key="item.value" :label="item.label" :value="item.value" />
            </ElSelect>
            <template v-if="refresh.strategy === 'interval' || refresh.strategy === 'realtime'">
              <span class="text-12px opacity-70">间隔</span>
              <ElInputNumber
                :model-value="refresh.intervalSec || (refresh.strategy === 'realtime' ? 30 : 60)"
                :min="5"
                :max="3600"
                :step="5"
                size="small"
                class="w-96px"
                @update:model-value="(v: unknown) => patchRefresh({ intervalSec: Number(v) || 30 })"
              />
              <span class="text-12px opacity-70">秒</span>
            </template>
          </div>
          <div class="text-11px leading-14px opacity-60">
            实时=WS 只送节拍、数据仍按你的权限与参数走 HTTP；通道不可用时自动退回按上面的间隔轮询，不会冻住。
          </div>
        </div>

        <div class="datav-binding__section">
          <div class="flex items-center justify-between">
            <span class="text-12px font-600">联动与下钻</span>
            <ElButton size="small" text :disabled="!canvasParams.length" @click="addParamLink">+ 点击传播参数</ElButton>
          </div>

          <div
            v-for="entry in paramLinks"
            :key="`link-${entry.index}`"
            class="datav-binding__row flex flex-wrap gap-6px"
          >
            <span class="text-12px opacity-70">点击</span>
            <ElSelect
              :model-value="entry.item.field || 'dim0'"
              size="small"
              class="w-84px"
              @update:model-value="v => patchInteraction(entry.index, { field: String(v ?? 'dim0') })"
            >
              <ElOption v-for="alias in aliasOptions" :key="alias" :label="alias" :value="alias" />
            </ElSelect>
            <span class="text-12px opacity-70">的值 →</span>
            <ElSelect
              :model-value="entry.item.param"
              size="small"
              placeholder="画布参数"
              class="min-w-110px flex-1"
              @update:model-value="v => patchInteraction(entry.index, { param: String(v ?? '') })"
            >
              <ElOption v-for="p in canvasParams" :key="p.code" :label="p.name || p.code" :value="p.code" />
            </ElSelect>
            <ElButton size="small" text @click="removeInteraction(entry.index)">删</ElButton>
          </div>

          <ElCheckbox
            :model-value="interactions.some(item => item.action === 'drill')"
            size="small"
            @update:model-value="v => toggleDrill(v === true)"
          >
            点击时下钻本组件
          </ElCheckbox>

          <ElSelect
            v-if="drillFields.length || interactions.some(item => item.action === 'drill')"
            :model-value="drillFields"
            multiple
            filterable
            size="small"
            class="mt-6px w-full"
            placeholder="下钻链（按顺序选维度）"
            @update:model-value="v => patchDrillFields((v as string[]) ?? [])"
          >
            <ElOption v-for="col in dimensionOptions" :key="col.value" :label="col.label" :value="col.value" />
          </ElSelect>

          <div class="text-11px leading-14px opacity-60">
            接收方靠自己的「参数绑定」命中同名参数才会被刷新；下钻链第一项应与当前顶层维度一致，
            未声明下钻链的组件即使勾了下钻也只会被点出参数。
          </div>
        </div>

        <div class="flex items-center gap-8px">
          <ElButton size="small" type="primary" :loading="previewing" :disabled="!canPreview" @click="handlePreview">
            预览取数
          </ElButton>
          <ElButton size="small" :disabled="!preview" @click="clearPreview">清除</ElButton>
        </div>
        <div v-if="!canPreview" class="text-12px text-[var(--datav-warning)]">
          当前账号没有「数据集查询」权限，无法预览取数
        </div>

        <div v-if="previewError" class="text-12px text-[var(--datav-error)]">{{ previewError }}</div>

        <div v-else-if="previewRows.length" class="datav-binding__preview overflow-auto">
          <div class="mb-4px text-11px opacity-60">
            前 {{ previewRows.length }} 行 · 共 {{ preview?.rows.length ?? 0 }} 行 · 画布已按此数据渲染
          </div>
          <table class="w-full border-collapse text-11px">
            <thead>
              <tr>
                <th
                  v-for="col in previewColumns"
                  :key="col.key"
                  class="border border-[var(--datav-border)] px-4px py-2px text-left font-500"
                >
                  {{ col.label }}
                  <code class="opacity-60">{{ col.key }}</code>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in previewRows" :key="rowIndex">
                <td
                  v-for="col in previewColumns"
                  :key="col.key"
                  class="border border-[var(--datav-border)] px-4px py-2px tabular-nums"
                >
                  {{ row[col.key] === null || row[col.key] === undefined ? '—' : row[col.key] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="text-11px leading-16px opacity-60">
          别名（dim0 / value）由槽位顺序决定，组件默认取第一个维度与第一个度量；需要改读别的列时，在下方高级里覆盖映射。
        </div>
      </template>
    </template>

    <div v-else class="text-12px opacity-60">静态模式下组件读 {{ meta.name }} 配置里的静态行，投放时不会发请求。</div>

    <!-- 跳屏与数据模式无关：静态的标题、图标同样可以当跳转入口，所以放在 mode 判断之外 -->
    <div class="datav-binding__section">
      <span class="text-12px font-600">点击跳屏</span>
      <ElCheckbox :model-value="jumpOn" size="small" class="mt-4px" @update:model-value="v => toggleJump(v === true)">
        点击后跳到另一块大屏
      </ElCheckbox>

      <ElSelect
        v-if="jumpOn"
        :model-value="jumpTarget"
        filterable
        size="small"
        class="mt-6px w-full"
        placeholder="目标大屏（未发布的置灰，需先发布）"
        @update:model-value="v => patchJumpTarget(String(v ?? ''))"
      >
        <ElOption
          v-for="s in jumpScreens"
          :key="s.screenCode"
          :label="jumpLabel(s)"
          :value="s.screenCode"
          :disabled="!jumpable(s)"
        />
      </ElSelect>

      <div class="text-11px leading-14px opacity-60">
        与「传播参数 / 下钻」互斥，勾了跳屏就不再联动；跳转只带目标编码，不带本屏的参数与下钻，
        目标屏仍按观众自己的权限取数。免登录的分享页不支持——那里没有目标屏的授权上下文，
        凭空拼一个地址等于开一个未鉴权的跳转口子。
      </div>
    </div>
  </div>
</template>

<style scoped>
.datav-binding__row :deep(.el-select__wrapper) {
  min-height: 26px;
}

.datav-binding__preview {
  max-height: 220px;
}
</style>
