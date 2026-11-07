<script setup lang="tsx">
import { onMounted, onUnmounted, ref } from 'vue';
import { ElTag as __forwarded_ElTag } from 'element-plus';
import { type ScheduleAlarmItem, findScheduleAlarms } from '@/service';

defineOptions({ name: 'JobAlarmList' });

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）；必须先于 columns 声明
const ElTag = __forwarded_ElTag;

const alarms = ref<ScheduleAlarmItem[]>([]);
const appFailures = ref<Array<{ appId: string; total: number; failed: number; rate: string }>>([]);
const metricTrend = ref<Array<{ metric: string; value: string | number }>>([]);
const hitCount = ref(0);
const loading = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

async function refresh() {
  loading.value = true;
  try {
    const { data } = await findScheduleAlarms();
    if (data) {
      alarms.value = data.alarms ?? [];
      appFailures.value = data.appFailures ?? [];
      metricTrend.value = data.metricTrend ?? [];
      hitCount.value = data.hitCount ?? 0;
    }
  } finally {
    loading.value = false;
  }
}

const columns: DataTable.Column<ScheduleAlarmItem>[] = [
  { title: '告警项', key: 'title', width: 170 },
  {
    title: '当前值',
    key: 'value',
    width: 190,
    render: row => <span style={row.hit ? 'color:#d03050;font-weight:600' : ''}>{row.value}</span>
  },
  { title: '阈值', key: 'threshold', width: 150 },
  {
    title: '状态',
    key: 'hit',
    width: 90,
    render: row => (
      <ElTag size="small" type={row.hit ? 'danger' : 'success'}>
        {row.hit ? '触发' : '正常'}
      </ElTag>
    )
  },
  { title: '说明', key: 'detail', minWidth: 320 }
];

const trendColumns: DataTable.Column<{ metric: string; value: string | number }>[] = [
  { title: '指标', key: 'metric', minWidth: 200 },
  { title: '窗口值', key: 'value', width: 160 }
];

const appColumns: DataTable.Column<{ appId: string; total: number; failed: number; rate: string }>[] = [
  { title: '应用', key: 'appId', minWidth: 260 },
  { title: '执行次数', key: 'total', width: 100 },
  { title: '失败次数', key: 'failed', width: 100 },
  { title: '失败率', key: 'rate', width: 100 }
];

onMounted(() => {
  refresh();
  timer = setInterval(refresh, 30000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch card-wrapper p-16px">
    <ElCard :bordered="false" class="mb-12px card-wrapper" size="small">
      <ElSpace align="center">
        <span>告警状态（30 秒自动刷新）：</span>
        <ElTag :type="hitCount > 0 ? 'danger' : 'success'" size="large">
          {{ hitCount > 0 ? `${hitCount} 项触发告警` : '全部正常' }}
        </ElTag>
        <ElButton size="small" quaternary :loading="loading" @click="refresh">手动刷新</ElButton>
      </ElSpace>
    </ElCard>

    <ElCard :bordered="false" class="mb-12px card-wrapper" size="small" title="告警项">
      <DataTable :columns="columns" :data="alarms" :loading="loading" size="small" :row-key="(row: any) => row.code" />
    </ElCard>

    <ElCard :bordered="false" class="mb-12px card-wrapper" size="small" title="指标趋势（30 分钟窗口，每分钟快照采集）">
      <DataTable
        :columns="trendColumns"
        :data="metricTrend"
        :loading="loading"
        size="small"
        :row-key="(row: any) => row.metric"
        :max-height="260"
      />
    </ElCard>

    <ElCard :bordered="false" class="card-wrapper" size="small" title="近 1 小时单应用聚合失败率（仅列命中阈值的应用）">
      <DataTable
        :columns="appColumns"
        :data="appFailures"
        :loading="loading"
        size="small"
        :row-key="(row: any) => row.appId"
        :max-height="240"
      />
    </ElCard>
  </div>
</template>
