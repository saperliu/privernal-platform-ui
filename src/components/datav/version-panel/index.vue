<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { findDatavScreenVersionDetail, findDatavScreenVersions, rollbackDatavScreen } from '@/service';
import { diffSchemas, summarizeDiff } from '@/utils/datav-diff';
import { migrateSchema } from '@/utils/datav-schema';
import type { ScreenDiff } from '@/utils/datav-diff';

/**
 * 版本面板（M7.7 + M7.8）：版本列表即「谁改了什么、何时发布的」审计呈现——
 * 每行带操作人/时间/类型（发布快照 vs 保存），发布记录就是 remark 为
 * __publish_snapshot__ 的版本行；对比功能按版本号取两份内容做纯前端 diff。
 */
defineOptions({ name: 'DatavVersionPanel' });

const props = defineProps<{ visible: boolean; screenCode: string }>();

const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>();

const PUBLISH_REMARK = '__publish_snapshot__';

const versions = ref<DatavNamespace.ScreenVersion[]>([]);
const loading = ref(false);
const loadError = ref('');

/** 对比选择：base=旧，target=新；各是一个 versionNo */
const compareBase = ref<number | null>(null);
const compareTarget = ref<number | null>(null);
const comparing = ref(false);
const diff = ref<ScreenDiff | null>(null);
const diffError = ref('');

const canCompare = computed(
  () => compareBase.value !== null && compareTarget.value && compareBase.value !== compareTarget.value
);

async function load() {
  loading.value = true;
  const res = await findDatavScreenVersions(props.screenCode);
  loading.value = false;
  if (res.error === null && res.data) {
    versions.value = res.data;
    loadError.value = '';
    // 默认选最近两个版本，多数对比就是「上次发布到现在改了什么」
    if (compareBase.value === null && versions.value.length >= 2) {
      compareBase.value = versions.value[versions.value.length - 1].versionNo;
      compareTarget.value = versions.value[0].versionNo;
    }
    return;
  }
  versions.value = [];
  loadError.value = res.error?.message || '版本加载失败';
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      diff.value = null;
      diffError.value = '';
      load().catch(() => {});
    }
  }
);

async function onRollback(version: DatavNamespace.ScreenVersion) {
  try {
    await ElMessageBox.confirm(`回滚到 v${version.versionNo}？当前草稿会先保存为一个新版本，不会丢失`, '回滚版本', {
      type: 'warning'
    });
  } catch {
    return;
  }
  const res = await rollbackDatavScreen(props.screenCode, version.versionNo);
  if (res.error !== null) {
    loadError.value = res.error?.message || '回滚失败';
    return;
  }
  window.$message?.success(`已回滚到 v${version.versionNo}`);
  diff.value = null;
  await load();
}

async function onCompare() {
  if (!canCompare.value) return;
  comparing.value = true;
  diffError.value = '';
  diff.value = null;
  const [baseRes, targetRes] = await Promise.all([
    findDatavScreenVersionDetail(props.screenCode, compareBase.value as number),
    findDatavScreenVersionDetail(props.screenCode, compareTarget.value as number)
  ]);
  comparing.value = false;
  if (baseRes.error !== null || !baseRes.data?.schemaJson || targetRes.error !== null || !targetRes.data?.schemaJson) {
    diffError.value = baseRes.error?.message || targetRes.error?.message || '版本内容加载失败';
    return;
  }
  try {
    // 后端版本详情的 schemaJson 是 fastjson JSONObject，序列化后是嵌套对象而不是字符串；
    // migrateSchema 本身兼容两种形态，这里不要再 JSON.parse（对象会被 String 成 "[object Object]" 抛错）
    const base = migrateSchema(baseRes.data.schemaJson).schema;
    const target = migrateSchema(targetRes.data.schemaJson).schema;
    diff.value = diffSchemas(base, target);
  } catch {
    diffError.value = '版本内容解析失败';
  }
}

function isPublish(version: DatavNamespace.ScreenVersion): boolean {
  return version.remark === PUBLISH_REMARK;
}

function typeLabel(version: DatavNamespace.ScreenVersion): string {
  return isPublish(version) ? '发布' : '保存';
}
</script>

<template>
  <ElDrawer
    :model-value="visible"
    title="版本与发布记录"
    size="520px"
    append-to-body
    @update:model-value="(v: boolean) => emit('update:visible', v)"
  >
    <div class="h-full flex flex-col gap-10px">
      <ElAlert v-if="loadError" type="error" :title="loadError" :closable="false" show-icon />

      <div class="flex items-center gap-8px">
        <span class="text-12px">对比</span>
        <ElSelect v-model="compareBase" size="small" class="w-110px" placeholder="旧版本" aria-label="对比旧版本">
          <ElOption
            v-for="item in versions"
            :key="`b-${item.versionNo}`"
            :label="`v${item.versionNo}`"
            :value="item.versionNo"
          />
        </ElSelect>
        <span class="text-12px">→</span>
        <ElSelect v-model="compareTarget" size="small" class="w-110px" placeholder="新版本" aria-label="对比新版本">
          <ElOption
            v-for="item in versions"
            :key="`t-${item.versionNo}`"
            :label="`v${item.versionNo}`"
            :value="item.versionNo"
          />
        </ElSelect>
        <ElButton size="small" :disabled="!canCompare" :loading="comparing" @click="() => void onCompare()">
          对比
        </ElButton>
      </div>

      <div v-if="diffError" class="text-12px" style="color: var(--datav-error)">{{ diffError }}</div>

      <template v-if="diff">
        <div class="text-12px" style="color: var(--datav-text-secondary)">
          v{{ compareBase }} → v{{ compareTarget }}：{{ summarizeDiff(diff) }}
        </div>
        <div class="min-h-0 flex-1 overflow-auto">
          <div v-if="diff.added.length" class="diff-group">
            <div class="diff-group__title">新增组件</div>
            <div v-for="item in diff.added" :key="item.id" class="diff-row">＋ {{ item.name }}（{{ item.type }}）</div>
          </div>
          <div v-if="diff.removed.length" class="diff-group">
            <div class="diff-group__title">删除组件</div>
            <div v-for="item in diff.removed" :key="item.id" class="diff-row">
              － {{ item.name }}（{{ item.type }}）
            </div>
          </div>
          <div v-if="diff.changed.length" class="diff-group">
            <div class="diff-group__title">修改组件</div>
            <div v-for="item in diff.changed" :key="item.id" class="diff-row">
              ～ {{ item.name }}：
              <span class="opacity-70">{{ item.areas.join('、') }}</span>
            </div>
          </div>
          <div v-if="diff.canvasChanged.length" class="diff-group">
            <div class="diff-group__title">画布参数</div>
            <div class="diff-row">～ {{ diff.canvasChanged.join(' / ') }}</div>
          </div>
          <div v-if="diff.paramsChanged" class="diff-group">
            <div class="diff-group__title">全局参数</div>
            <div class="diff-row">～ 参数定义有变化</div>
          </div>
        </div>
      </template>

      <ElTable v-else :data="versions" size="small" :loading="loading" max-height="100%">
        <ElTableColumn prop="versionNo" label="版本" width="60">
          <template #default="{ row }">v{{ row.versionNo }}</template>
        </ElTableColumn>
        <ElTableColumn label="类型" width="70">
          <template #default="{ row }">
            <ElTag size="small" :type="isPublish(row) ? 'success' : 'info'" effect="plain">{{ typeLabel(row) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createBy" label="操作人" width="110" show-overflow-tooltip />
        <ElTableColumn prop="createTime" label="时间" min-width="150" show-overflow-tooltip />
        <ElTableColumn label="操作" width="70" fixed="right">
          <template #default="{ row }">
            <ElButton size="small" text type="primary" @click="() => void onRollback(row)">回滚</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </ElDrawer>
</template>

<style scoped>
.diff-group {
  margin-bottom: 10px;
}

.diff-group__title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--datav-text-secondary);
}

.diff-row {
  font-size: 12px;
  padding: 3px 0;
  color: var(--datav-text-primary);
}
</style>
