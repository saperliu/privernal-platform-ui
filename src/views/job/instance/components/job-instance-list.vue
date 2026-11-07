<script setup lang="tsx">
import { onMounted, onUnmounted, ref } from 'vue';
import { ElTag as __forwarded_ElTag } from 'element-plus';
import { findScheduleInstanceState, findScheduleQuota } from '@/service';
import { formatDateTime } from '@/utils/common';

defineOptions({ name: 'JobInstanceList' });

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTag = __forwarded_ElTag;

const instanceRows = ref<
  Array<{ instanceId: string; role: string; leaseUntil: string; startTime: string; statJson?: string }>
>([]);
const lockRows = ref<Array<{ lockKey: string; holder?: string; leaseUntil: string; version: number }>>([]);
const poolStat = ref('');
const localInstance = ref('');
const quota = ref<Record<string, unknown>>({});
const quotaApps = ref<Array<{ appId: string; appName: string; active: number }>>([]);
let timer: ReturnType<typeof setInterval> | null = null;

async function refresh() {
  const { data } = await findScheduleInstanceState();
  if (data) {
    instanceRows.value = data.instances ?? [];
    lockRows.value = data.locks ?? [];
    poolStat.value = data.pool ?? '';
    localInstance.value = data.local ?? '';
  }
  const q = await findScheduleQuota();
  if (q.data) {
    quota.value = q.data;
    quotaApps.value = (q.data.apps ?? []) as never;
  }
}

const instanceColumns: DataTable.Column<{
  instanceId: string;
  role: string;
  leaseUntil: string;
  startTime: string;
  statJson?: string;
}>[] = [
  { title: '实例标识', key: 'instanceId', minWidth: 240 },
  {
    title: '角色',
    key: 'role',
    width: 100,
    render: row => {
      // OFFLINE：租约已过期的僵尸实例行（等 6h 清理周期物理删），后端把 role 置为 OFFLINE 展示
      // ElTag 无 naive 的 default 类型，非 LEADER（含 OFFLINE）统一用 info
      const type = row.role === 'LEADER' ? 'success' : 'info';
      return (
        <ElTag size="small" type={type}>
          {row.role}
        </ElTag>
      );
    }
  },
  {
    title: '启动时间',
    key: 'startTime',
    width: 170,
    render: row => (row.startTime ? formatDateTime(row.startTime) : '-')
  },
  {
    title: '心跳租约至',
    key: 'leaseUntil',
    width: 170,
    render: row => (row.leaseUntil ? formatDateTime(row.leaseUntil) : '-')
  },
  {
    title: '池水位',
    key: 'statJson',
    minWidth: 260,
    ellipsis: { tooltip: true },
    render: row => row.statJson ?? '-'
  }
];

const quotaAppColumns: DataTable.Column<{ appId: string; appName: string; active: number }>[] = [
  { title: '应用', key: 'appName', minWidth: 200 },
  { title: '应用ID', key: 'appId', minWidth: 220, render: row => (row.appId ? row.appId : '-') },
  { title: '活跃任务数', key: 'active', width: 110 }
];

const lockColumns: DataTable.Column<{ lockKey: string; holder?: string; leaseUntil: string; version: number }>[] = [
  { title: '锁名', key: 'lockKey', width: 200 },
  { title: '持有者', key: 'holder', minWidth: 240, render: row => row.holder ?? '-' },
  {
    title: '租约至',
    key: 'leaseUntil',
    width: 170,
    render: row => (row.leaseUntil ? formatDateTime(row.leaseUntil) : '-')
  },
  { title: '版本', key: 'version', width: 90 }
];

onMounted(() => {
  refresh();
  timer = setInterval(refresh, 10000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch card-wrapper p-16px">
    <ElCard :bordered="false" class="mb-12px card-wrapper" size="small" title="调度实例（10 秒自动刷新）">
      <!-- 三行布局：本实例 / 执行池 / 实例列表，左对齐各占一行——原先挤在一行，实例标识过长把表格顶出屏幕 -->
      <div class="w-full flex flex-col items-start gap-4px">
        <div>
          <span class="text-12px text-gray-500">本实例</span>
          <ElTag type="info" size="small" class="ml-8px">{{ localInstance || '-' }}</ElTag>
        </div>
        <div>
          <span class="text-12px text-gray-500">执行池</span>
          <code class="ml-8px">{{ poolStat || '-' }}</code>
        </div>
        <div class="w-full">
          <span class="text-12px text-gray-500">实例列表</span>
          <DataTable
            class="mt-6px"
            :columns="instanceColumns"
            :data="instanceRows"
            size="small"
            :row-key="(row: any) => row.instanceId"
          />
        </div>
      </div>
    </ElCard>

    <ElCard :bordered="false" class="mb-12px card-wrapper" size="small" title="DB 租约锁">
      <DataTable :columns="lockColumns" :data="lockRows" size="small" :row-key="(row: any) => row.lockKey" />
    </ElCard>

    <ElCard :bordered="false" class="card-wrapper" size="small" title="配额水位">
      <ElSpace direction="vertical">
        <ElSpace item-style="line-height:32px" align="center">
          <span>组织活跃任务：{{ (quota.orgActive as number) ?? '-' }} / {{ (quota.orgQuota as number) ?? '-' }}</span>
          <ElProgress
            type="line"
            :percentage="Number(quota.orgUsage ?? 0)"
            :show-indicator="true"
            style="width: 240px"
          />
        </ElSpace>
        <DataTable
          :columns="quotaAppColumns"
          :data="quotaApps"
          size="small"
          :row-key="(row: any) => row.appId"
          :max-height="200"
        />
      </ElSpace>
    </ElCard>
  </div>
</template>
