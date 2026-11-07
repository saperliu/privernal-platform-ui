<script setup lang="ts">
import { computed } from 'vue';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { useWidgetLinkage } from '@/hooks/datav/useDatavLinkage';
import { buildPieSeries, formatNumber } from '@/utils/datav-data';

defineOptions({ name: 'DatavRankingTable' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const { clickRow, isSelected } = useWidgetLinkage();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const slices = computed(() => buildPieSeries(view.value, mapping.value).sort((a, b) => b.value - a.value));

const max = computed(() => slices.value.reduce((acc, item) => Math.max(acc, item.value), 0));

const fontSize = computed(() => Math.max(11, Math.min(20, Number(style.value.fontSize) || 13)));

const topN = computed(() => Math.max(0, Math.min(10, Number(style.value.topN) || 0)));

interface RankRow {
  rank: number;
  name: string;
  value: string;
  ratio: number;
}

const rows = computed<RankRow[]>(() =>
  slices.value.map((item, index) => ({
    rank: index + 1,
    name: item.name,
    value: formatNumber(item.value, { decimals: 0, thousands: true }),
    ratio: max.value > 0 ? item.value / max.value : 0
  }))
);

/**
 * 滚动：内容复制一份做无缝循环，CSS 线性滚动由 scrollSec 控制一轮时长；
 * 行数少于一屏时静态展示（外层 overflow hidden，不滚动也无损）。
 */
const needScroll = computed(() => rows.value.length > 6);
const scrollDuration = computed(() => `${Math.max(2, Number(style.value.scrollSec) || 6)}s`);
const rowHeight = computed(() => `${Math.round(fontSize.value * 2.4)}px`);

const empty = computed(() => !loading.value && rows.value.length === 0);

/** 榜单行是派生数据（还排过序），联动要的是聚合结果里那一行，按显示名回查 */
function sourceRow(name: string): ReportChartNamespace.AggRow | null {
  const axis = mapping.value?.axis || view.value?.dimensionAliases?.[0] || 'dim0';
  return view.value.rows.find(row => String(row[axis] ?? '') === name) ?? null;
}

function onRowClick(row: RankRow) {
  const source = sourceRow(row.name);
  if (source) clickRow(source);
}

function isRowLinked(row: RankRow) {
  const source = sourceRow(row.name);
  return source ? isSelected(source) : false;
}
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <div v-if="!error && !empty" class="h-full flex flex-col">
      <div class="rank-head" :style="{ fontSize: `${fontSize - 1}px` }">
        <span class="w-36px text-center">#</span>
        <span class="flex-1">{{ view?.dimensionLabels?.[0] || '名称' }}</span>
        <span class="w-88px text-right">{{ view?.measureLabels?.[0] || '数值' }}</span>
      </div>

      <div class="min-h-0 flex-1 overflow-hidden">
        <div
          class="rank-scroll"
          :class="{ 'rank-scroll--animate': needScroll }"
          :style="{ animationDuration: scrollDuration }"
        >
          <div
            v-for="(row, index) in needScroll ? [...rows, ...rows] : rows"
            :key="`${index}-${row.rank}`"
            class="rank-row"
            :class="{ 'datav-linked': isRowLinked(row) }"
            :style="{ height: rowHeight }"
            @click="onRowClick(row)"
          >
            <span class="rank-no w-36px text-center tabular-nums" :class="row.rank <= topN ? 'rank-no--top' : ''">
              {{ row.rank }}
            </span>
            <span class="relative flex-1 truncate">
              <span
                v-if="style.barShow !== false"
                class="rank-bar"
                :style="{ width: `${Math.round(row.ratio * 92)}%` }"
              ></span>
              <span class="relative">{{ row.name }}</span>
            </span>
            <span class="w-88px text-right tabular-nums">{{ row.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="error || empty"
      class="absolute inset-0 flex items-center justify-center text-12px"
      :class="error ? 'text-[var(--datav-error)]' : 'text-[var(--datav-text-secondary)]'"
    >
      {{ error || '暂无数据' }}
    </div>
  </div>
</template>

<style scoped>
.rank-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  color: var(--datav-text-secondary);
  border-bottom: 1px solid var(--datav-border);
}

.rank-scroll--animate {
  animation: rank-scroll linear infinite;
}

@keyframes rank-scroll {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(-50%);
  }
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  color: var(--datav-text-primary);
}

.rank-no {
  color: var(--datav-text-tertiary);
}

.rank-no--top {
  font-weight: 600;
  color: var(--datav-accent);
}

.rank-bar {
  position: absolute;
  left: 0;
  top: 20%;
  height: 60%;
  border-radius: 3px;
  background: var(--datav-series-1);
  opacity: 0.22;
}

.rank-no--top ~ span .rank-bar {
  background: var(--datav-accent);
  opacity: 0.32;
}
</style>
