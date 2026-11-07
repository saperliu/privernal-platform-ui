<script setup lang="ts">
import { ref, watch } from 'vue';
import { createDatavShare, disableDatavShare, findDatavShareList } from '@/service';

/**
 * 外链分享管理（M7.6）：创建（有效期 + referer 白名单）、链接复制、吊销。
 * sign 只在创建响应里出现一次——丢了就禁用旧的重建，后端列表接口刻意不回传签名。
 */
defineOptions({ name: 'DatavShareDialog' });

const props = defineProps<{ visible: boolean; screenCode: string; screenName?: string }>();

const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>();

const EXPIRE_OPTIONS = [
  { label: '1 小时', value: 1 },
  { label: '1 天', value: 24 },
  { label: '7 天', value: 168 },
  { label: '30 天', value: 720 },
  { label: '长期', value: 0 }
];

const expireHours = ref(168);
const refererWhitelist = ref('');
const creating = ref(false);

const shares = ref<DatavNamespace.DatavShare[]>([]);
const loading = ref(false);
const loadError = ref('');

/** 创建成功后的完整链接（含 sign），一次生成一次复制 */
const generatedLink = ref('');

async function loadShares() {
  loading.value = true;
  const res = await findDatavShareList(props.screenCode);
  loading.value = false;
  if (res.error === null && res.data) {
    shares.value = res.data;
    loadError.value = '';
    return;
  }
  shares.value = [];
  loadError.value = res.error?.message || '分享列表加载失败';
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      generatedLink.value = '';
      loadShares().catch(() => {});
    }
  }
);

async function onCreate() {
  creating.value = true;
  const res = await createDatavShare(props.screenCode, expireHours.value, refererWhitelist.value.trim() || undefined);
  creating.value = false;
  if (res.error !== null || !res.data) {
    loadError.value = res.error?.message || '创建失败';
    return;
  }
  const { share, sign } = res.data;
  generatedLink.value = `${window.location.origin}/pub/datav?sc=${share.shareCode}&sign=${sign}`;
  loadError.value = '';
  await loadShares();
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(generatedLink.value);
    window.$message?.success('链接已复制');
  } catch {
    window.$message?.warning('复制失败，请手动选中复制');
  }
}

async function onDisable(shareCode: string) {
  const res = await disableDatavShare(shareCode);
  if (res.error !== null) {
    loadError.value = res.error?.message || '禁用失败';
    return;
  }
  window.$message?.success('已禁用，链接立即失效');
  await loadShares();
}

function expireText(share: DatavNamespace.DatavShare): string {
  if (!share.expireTime) return '长期';
  return share.expireTime.replace('T', ' ').slice(0, 16);
}

function stateText(share: DatavNamespace.DatavShare): string {
  if (share.enabled !== 'Y') return '已禁用';
  if (share.expireTime && new Date(share.expireTime).getTime() < Date.now()) return '已过期';
  return '有效';
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    :title="`外链分享${screenName ? ` - ${screenName}` : ''}`"
    width="640px"
    append-to-body
    @update:model-value="(v: boolean) => emit('update:visible', v)"
  >
    <div class="flex flex-col gap-12px">
      <ElAlert
        type="info"
        :closable="false"
        show-icon
        title="外链按分享所属组织的全部数据取数（部门行级范围不生效），只应分享脱敏或公开性质的大屏"
      />

      <div class="flex flex-wrap items-center gap-8px">
        <ElSelect v-model="expireHours" size="small" class="w-110px" aria-label="有效期">
          <ElOption v-for="opt in EXPIRE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
        <ElInput
          v-model="refererWhitelist"
          size="small"
          class="min-w-220px flex-1"
          placeholder="来源域名白名单，逗号分隔，留空不限制（如 portal.example.com）"
          aria-label="来源白名单"
        />
        <ElButton size="small" type="primary" :loading="creating" @click="() => void onCreate()">生成链接</ElButton>
      </div>

      <div v-if="generatedLink" class="flex items-center gap-8px">
        <ElInput :model-value="generatedLink" size="small" readonly aria-label="分享链接" />
        <ElButton size="small" @click="() => void copyLink()">复制</ElButton>
      </div>
      <div v-if="generatedLink" class="text-11px" style="color: var(--datav-text-secondary)">
        签名只显示这一次：丢失后请禁用旧链接重新生成
      </div>

      <ElAlert v-if="loadError" type="error" :title="loadError" :closable="false" show-icon />

      <ElTable :data="shares" size="small" :loading="loading" max-height="260">
        <ElTableColumn label="编码" width="150">
          <template #default="{ row }">
            <span class="tabular-nums" :title="row.shareCode">{{ row.shareCode.slice(0, 16) }}…</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="80">
          <template #default="{ row }">
            <ElTag size="small" :type="stateText(row) === '有效' ? 'success' : 'info'" effect="plain">
              {{ stateText(row) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="失效时间" width="130">
          <template #default="{ row }">{{ expireText(row) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="refererWhitelist" label="来源白名单" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.refererWhitelist || '不限' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="createBy" label="创建人" width="100" show-overflow-tooltip />
        <ElTableColumn label="操作" width="70" fixed="right">
          <template #default="{ row }">
            <ElButton
              v-if="row.enabled === 'Y'"
              size="small"
              text
              type="danger"
              @click="() => void onDisable(row.shareCode)"
            >
              禁用
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </ElDialog>
</template>
