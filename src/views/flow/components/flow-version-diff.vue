<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { findFlowDefinitionDetail } from '@/service';
import { diffFlowDefinitions, summarizeFlowDefDiff } from '@/utils/flow-def-diff';
import type { FlowDefDiff } from '@/utils/flow-def-diff';

/**
 * 流程定义版本对比抽屉（R2-18 ①）：同一 flowCode 的两个版本各取一份 DefJson
 * （GET /definition/{id} 的 flowDefinition），纯前端语义 diff——
 * 定义级字段 / 节点增删改（含变化区域）/ 连线增删改。骨架照 datav version-panel。
 */
defineOptions({ name: 'FlowVersionDiff' });

interface VersionLike {
  id: string | number;
  version?: string | number;
  flowCode?: string;
  isPublish?: number;
}

const props = defineProps<{
  visible: boolean;
  /** 同一 flowCode 的版本列表（宿主已拉取） */
  definitions: VersionLike[];
  /** 默认对比目标（宿主当前选中的版本） */
  defaultTargetId?: string;
}>();

const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>();

/** 下拉选项：按版本号倒序，标签 vN · 状态 */
const versionOptions = computed(() =>
  [...props.definitions]
    .sort((a, b) => Number(b.version || 0) - Number(a.version || 0))
    .map(item => ({
      label: `v${item.version} · ${item.isPublish === 1 ? '已发布' : item.isPublish === 9 ? '已失效' : '未发布'}`,
      value: String(item.id)
    }))
);

const baseId = ref<string>('');
const targetId = ref<string>('');
const comparing = ref(false);
const diff = ref<FlowDefDiff | null>(null);
const diffError = ref('');

const canCompare = computed(() => Boolean(baseId.value && targetId.value && baseId.value !== targetId.value));

/**
 * 默认选版：新=宿主当前版本；旧=除目标外最近已发布版，没有已发布则取另一版本。
 * 多数对比就是「上次发布到现在改了什么」。
 */
function pickDefaults() {
  const options = versionOptions.value;
  if (!options.length) {
    baseId.value = '';
    targetId.value = '';
    return;
  }
  const wantedTarget = options.find(opt => opt.value === String(props.defaultTargetId ?? ''));
  targetId.value = (wantedTarget ?? options[0]).value;
  const publishedExceptTarget = options.filter(
    opt => opt.value !== targetId.value && opt.label.includes('已发布') && !opt.label.includes('已失效')
  );
  baseId.value = (publishedExceptTarget[0] ?? options.find(opt => opt.value !== targetId.value))?.value ?? '';
}

function parseDefJson(raw: unknown): Record<string, any> {
  if (typeof raw === 'string') return JSON.parse(raw);
  if (raw && typeof raw === 'object') return raw as Record<string, any>;
  throw new TypeError('flowDefinition 内容为空');
}

async function onCompare() {
  if (!canCompare.value) return;
  comparing.value = true;
  diffError.value = '';
  diff.value = null;
  try {
    const [baseRes, targetRes] = await Promise.all([
      findFlowDefinitionDetail(baseId.value),
      findFlowDefinitionDetail(targetId.value)
    ]);
    const baseRaw = (baseRes.data as any)?.flowDefinition;
    const targetRaw = (targetRes.data as any)?.flowDefinition;
    if (baseRes.error !== null || targetRes.error !== null) {
      diffError.value = baseRes.error?.message || targetRes.error?.message || '版本内容加载失败';
      return;
    }
    diff.value = diffFlowDefinitions(parseDefJson(baseRaw), parseDefJson(targetRaw));
  } catch (e) {
    diffError.value = `版本内容解析失败：${e instanceof Error ? e.message : '未知错误'}`;
  } finally {
    comparing.value = false;
  }
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      diff.value = null;
      diffError.value = '';
      pickDefaults();
    }
  }
);
</script>

<template>
  <ElDrawer
    :model-value="visible"
    title="版本对比"
    size="560px"
    append-to-body
    @update:model-value="(v: boolean) => emit('update:visible', v)"
  >
    <div class="h-full flex flex-col gap-10px">
      <ElAlert v-if="!definitions.length" type="info" title="该流程还没有可对比的版本" :closable="false" show-icon />

      <template v-else>
        <div class="flex items-center gap-8px">
          <span class="text-12px">对比</span>
          <ElSelect v-model="baseId" size="small" class="w-150px" placeholder="旧版本" aria-label="对比旧版本">
            <ElOption v-for="opt in versionOptions" :key="`b-${opt.value}`" :label="opt.label" :value="opt.value" />
          </ElSelect>
          <span class="text-12px">→</span>
          <ElSelect v-model="targetId" size="small" class="w-150px" placeholder="新版本" aria-label="对比新版本">
            <ElOption v-for="opt in versionOptions" :key="`t-${opt.value}`" :label="opt.label" :value="opt.value" />
          </ElSelect>
          <ElButton size="small" :disabled="!canCompare" :loading="comparing" @click="() => void onCompare()">
            对比
          </ElButton>
        </div>

        <div v-if="diffError" class="text-12px text-error">{{ diffError }}</div>

        <template v-if="diff">
          <div class="text-12px text-secondary">{{ summarizeFlowDefDiff(diff) }}</div>
          <div class="min-h-0 flex-1 overflow-auto">
            <div v-if="diff.defChanged.length" class="diff-group">
              <div class="diff-group__title">定义级</div>
              <div class="diff-row">～ {{ diff.defChanged.join('、') }}</div>
            </div>
            <div v-if="diff.nodesAdded.length" class="diff-group">
              <div class="diff-group__title">新增节点</div>
              <div v-for="item in diff.nodesAdded" :key="item.code" class="diff-row">
                ＋ {{ item.name }}（{{ item.typeLabel }}）
              </div>
            </div>
            <div v-if="diff.nodesRemoved.length" class="diff-group">
              <div class="diff-group__title">删除节点</div>
              <div v-for="item in diff.nodesRemoved" :key="item.code" class="diff-row">
                － {{ item.name }}（{{ item.typeLabel }}）
              </div>
            </div>
            <div v-if="diff.nodesChanged.length" class="diff-group">
              <div class="diff-group__title">修改节点</div>
              <div v-for="item in diff.nodesChanged" :key="item.code" class="diff-row">
                ～ {{ item.name }}（{{ item.typeLabel }}）：
                <span class="opacity-70">{{ (item.areas ?? []).join('、') }}</span>
              </div>
            </div>
            <div v-if="diff.skipsAdded.length" class="diff-group">
              <div class="diff-group__title">新增连线</div>
              <div v-for="item in diff.skipsAdded" :key="item.key" class="diff-row">＋ {{ item.label }}</div>
            </div>
            <div v-if="diff.skipsRemoved.length" class="diff-group">
              <div class="diff-group__title">删除连线</div>
              <div v-for="item in diff.skipsRemoved" :key="item.key" class="diff-row">－ {{ item.label }}</div>
            </div>
            <div v-if="diff.skipsChanged.length" class="diff-group">
              <div class="diff-group__title">修改连线</div>
              <div v-for="item in diff.skipsChanged" :key="item.key" class="diff-row">
                ～ {{ item.label }}：
                <span class="opacity-70">{{ (item.areas ?? []).join('、') }}</span>
              </div>
            </div>
            <div
              v-if="!diff.defChanged.length && !diff.nodesAdded.length && !diff.nodesRemoved.length && !diff.nodesChanged.length && !diff.skipsAdded.length && !diff.skipsRemoved.length && !diff.skipsChanged.length"
              class="text-12px text-secondary"
            >
              没有语义差异（画布坐标变化不计入）
            </div>
          </div>
        </template>
      </template>
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
  color: var(--ds-text-weak, #909699);
}

.diff-row {
  font-size: 12px;
  padding: 3px 0;
  color: var(--ds-text, #333);
}

.text-secondary {
  color: var(--ds-text-sub, #606266);
}

.text-error {
  color: #d03050;
}
</style>
