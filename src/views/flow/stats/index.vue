<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, onMounted, ref } from 'vue';
import {
  ElButton,
  ElDialog,
  ElProgress as __forwarded_ElProgress,
  ElSelect as __forwarded_ElSelect,
  ElOption as __forwarded_ElOption
} from 'element-plus';
import { findFlowStatsByDefinition, findFlowStatsByNode, findFlowStatsHandlerWorkload, findFlowStatsOverview } from '@/service';
import { useLoading } from '@/hooks';

/**
 * 流程绩效看板（R2-17）：实例总览 / 按定义统计 / 在办负载 / 节点停留下钻。
 * 纯统计只读页，数据口径见 FlowStatsMapper（引擎表聚合，按组织拦截器忽略+数据范围豁免）。
 */
defineOptions({ name: 'FlowStats' });

const ElSelect = __forwarded_ElSelect;
const ElOption = __forwarded_ElOption;
const ElProgress = __forwarded_ElProgress;

const { loading, startLoading, endLoading } = useLoading(false);

const overview = ref<Record<string, number>>({});
const definitions = ref<FlowNamespace.StatsRow[]>([]);
const handlers = ref<FlowNamespace.StatsRow[]>([]);

/** 节点停留下钻 */
const showNodeDialog = ref(false);
const nodeDefinitionId = ref('');
const nodeDefinitionName = ref('');
const nodeRows = ref<FlowNamespace.StatsRow[]>([]);
const nodeLoading = ref(false);

function formatDurationText(seconds: number): string {
  if (!seconds || seconds <= 0) return '-';
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} 分钟`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} 小时`;
  return `${(seconds / 86400).toFixed(1)} 天`;
}

function statOf(row: FlowNamespace.StatsRow, key: string): number {
  const value = row[key];
  return typeof value === 'number' ? value : Number(value ?? 0);
}

const overviewCards = computed(() => [
  { label: '实例总数', value: overview.value.total ?? 0, tone: 'total' },
  { label: '进行中', value: overview.value.running ?? 0, tone: 'running' },
  { label: '已完成', value: overview.value.finished ?? 0, tone: 'finished' },
  { label: '终止/作废/撤销', value: overview.value.terminated ?? 0, tone: 'terminated' },
  { label: '平均办结时长', value: formatDurationText(overview.value.avgDurationSeconds ?? 0), tone: 'duration' }
]);

async function loadData() {
  startLoading();
  try {
    const [ov, defs, workload] = await Promise.all([
      findFlowStatsOverview(),
      findFlowStatsByDefinition({ limit: 20 }),
      findFlowStatsHandlerWorkload({ limit: 10 })
    ]);
    overview.value = ov.data ?? {};
    definitions.value = defs.data ?? [];
    handlers.value = workload.data ?? [];
  } finally {
    endLoading();
  }
}

async function openNodeStats(row: FlowNamespace.StatsRow) {
  nodeDefinitionId.value = String(row.definitionId ?? '');
  nodeDefinitionName.value = String(row.flowName ?? row.definitionId);
  nodeRows.value = [];
  showNodeDialog.value = true;
  nodeLoading.value = true;
  try {
    const { data } = await findFlowStatsByNode(nodeDefinitionId.value);
    nodeRows.value = data ?? [];
  } finally {
    nodeLoading.value = false;
  }
}

const definitionColumns: Ref<DataTable.Column<FlowNamespace.StatsRow>[]> = ref([
  {
    key: 'flowName',
    title: '流程',
    minWidth: 180,
    align: 'left',
    ellipsis: true,
    render: row => <span class="font-500">{String(row.flowName ?? '-')}</span>
  },
  { key: 'total', title: '实例总数', width: 90, align: 'center', render: row => statOf(row, 'total') },
  { key: 'running', title: '进行中', width: 90, align: 'center', render: row => statOf(row, 'running') },
  { key: 'finished', title: '已完成', width: 90, align: 'center', render: row => statOf(row, 'finished') },
  { key: 'terminated', title: '终止/作废', width: 100, align: 'center', render: row => statOf(row, 'terminated') },
  {
    key: 'completionRate',
    title: '完成率',
    width: 140,
    align: 'center',
    render: row => {
      const total = statOf(row, 'total');
      const finished = statOf(row, 'finished');
      const rate = total > 0 ? Math.round((finished / total) * 100) : 0;
      return (
        <div class="w-full">
          <ElProgress percentage={rate} stroke-width={8} show-text={false} />
          <span class="text-12px color-gray">{rate}%</span>
        </div>
      );
    }
  },
  {
    key: 'node',
    title: '节点分析',
    width: 100,
    align: 'center',
    render: row => (
      <ElButton size="small" text type="primary" onClick={() => openNodeStats(row)}>
        节点停留
      </ElButton>
    )
  }
]);

const handlerColumns: Ref<DataTable.Column<FlowNamespace.StatsRow>[]> = ref([
  {
    key: 'displayName',
    title: '办理人/标识',
    minWidth: 220,
    align: 'left',
    ellipsis: true,
    render: row => String(row.displayName ?? row.processedBy ?? '-')
  },
  {
    key: 'pendingCount',
    title: '在办任务',
    width: 120,
    align: 'center',
    render: row => <span class="font-500">{statOf(row, 'pendingCount')}</span>
  }
]);

const nodeColumns: Ref<DataTable.Column<FlowNamespace.StatsRow>[]> = ref([
  {
    key: 'nodeName',
    title: '节点',
    minWidth: 160,
    align: 'left',
    ellipsis: true,
    render: row => (
      <div class="min-w-0 w-full">
        <div class="font-500 truncate">{String(row.nodeName ?? '-')}</div>
        <div class="text-11px color-gray">{String(row.nodeCode ?? '')}</div>
      </div>
    )
  },
  { key: 'passCount', title: '通过', width: 80, align: 'center', render: row => statOf(row, 'passCount') },
  { key: 'rejectCount', title: '驳回', width: 80, align: 'center', render: row => statOf(row, 'rejectCount') },
  {
    key: 'avgDwellSeconds',
    title: '平均停留',
    width: 110,
    align: 'center',
    render: row => formatDurationText(statOf(row, 'avgDwellSeconds'))
  },
  {
    key: 'maxDwellSeconds',
    title: '最长停留',
    width: 110,
    align: 'center',
    render: row => formatDurationText(statOf(row, 'maxDwellSeconds'))
  }
]);

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="h-full min-h-500px flex-col overflow-auto gap-16px p-16px" v-loading="loading">
    <!-- 总览卡片 -->
    <div class="flow-stats-cards">
      <div v-for="card in overviewCards" :key="card.label" class="flow-stats-card" :class="`flow-stats-card--${card.tone}`">
        <div class="flow-stats-card__label">{{ card.label }}</div>
        <div class="flow-stats-card__value">{{ card.value }}</div>
      </div>
    </div>

    <!-- 按流程定义统计 -->
    <div class="flow-stats-section">
      <div class="flow-stats-section__head">
        <span class="flow-stats-section__title">按流程统计</span>
        <ElButton size="small" @click="loadData">刷新</ElButton>
      </div>
      <DataTable :columns="definitionColumns" :data="definitions" :row-key="(row: FlowNamespace.StatsRow) => String(row.definitionId)" class="min-h-160px" />
    </div>

    <!-- 在办负载 -->
    <div class="flow-stats-section">
      <div class="flow-stats-section__head">
        <span class="flow-stats-section__title">在办负载 TOP {{ handlers.length }}</span>
        <span class="text-12px color-gray">按办理人标识聚合的当前待办数（角色/部门标识解析失败时原样展示）</span>
      </div>
      <DataTable :columns="handlerColumns" :data="handlers" :row-key="(row: FlowNamespace.StatsRow) => String(row.processedBy)" class="min-h-120px" />
    </div>

    <!-- 节点停留下钻 -->
    <ElDialog v-model="showNodeDialog" :title="`节点分析：${nodeDefinitionName}`" class="w-720px">
      <div v-loading="nodeLoading">
        <DataTable :columns="nodeColumns" :data="nodeRows" :row-key="(row: FlowNamespace.StatsRow) => String(row.nodeCode)" class="min-h-120px" />
        <div v-if="!nodeRows.length && !nodeLoading" class="py-24px text-center text-13px color-gray">
          该流程暂无历史办理记录（PASS/REJECT），产生流转数据后可分析节点停留
        </div>
      </div>
    </ElDialog>
  </div>
</template>

<style scoped>
.flow-stats-cards {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(5, 1fr);
}

.flow-stats-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 16px;
}

.flow-stats-card__label {
  color: #909399;
  font-size: 12px;
}

.flow-stats-card__value {
  color: #303133;
  font-size: 22px;
  font-weight: 600;
  margin-top: 6px;
}

.flow-stats-card--running .flow-stats-card__value {
  color: #409eff;
}

.flow-stats-card--finished .flow-stats-card__value {
  color: #67c23a;
}

.flow-stats-card--terminated .flow-stats-card__value {
  color: #f56c6c;
}

.flow-stats-section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px 16px;
}

.flow-stats-section__head {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 8px;
}

.flow-stats-section__title {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}
</style>
