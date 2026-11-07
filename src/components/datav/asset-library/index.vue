<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { delDatavAsset, findDatavAssetList, saveDatavAsset } from '@/service';
import { uploadSystemFile } from '@/service/api/system/system-file-upload';

/**
 * 素材库抽屉（M7.2）：上传走平台文件服务三后端（本地/OSS/MinIO），datav 侧只登记元数据。
 * 「使用」不直接改 schema——把素材抛给父组件（设计器决定写进画布背景还是选中组件），
 * 这样素材面板不需要理解画布结构，也可以被别的入口复用。
 */
defineOptions({ name: 'DatavAssetLibrary' });

const props = defineProps<{ visible: boolean }>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'use', asset: DatavNamespace.DatavAsset): void;
}>();

const assets = ref<DatavNamespace.DatavAsset[]>([]);
const loading = ref(false);
const loadError = ref('');
const keyword = ref('');
const activeCategory = ref('');
const uploadCategory = ref('通用');
const uploading = ref(false);

const categories = computed(() => {
  const set = new Set<string>();
  assets.value.forEach(item => set.add(item.category || '通用'));
  return ['全部', ...Array.from(set)];
});

async function load() {
  loading.value = true;
  const res = await findDatavAssetList(
    activeCategory.value && activeCategory.value !== '全部' ? activeCategory.value : undefined,
    keyword.value.trim() || undefined
  );
  loading.value = false;
  if (res.error === null && res.data) {
    assets.value = res.data;
    loadError.value = '';
    return;
  }
  assets.value = [];
  loadError.value = res.error?.message || '素材列表加载失败';
}

watch(
  () => props.visible,
  visible => {
    if (visible) load().catch(() => {});
  }
);

/** 图片/视频一起放行：类型在登记时由后端白名单归一，面板上按 assetType 分形态展示 */
const accept = '.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.webm';

function inferType(name: string): 'image' | 'video' {
  return /\.(mp4|webm)$/i.test(name) ? 'video' : 'image';
}

async function onUpload(options: { file: File }) {
  const file = options.file;
  uploading.value = true;
  try {
    // 第一步：文件服务落字节（本地/OSS/MinIO 由部署配置决定），filePath 按素材分类归档
    const uploadRes = await uploadSystemFile(
      [{ file, name: file.name }],
      'datav_asset',
      '',
      'INIT',
      inferType(file.name) === 'video' ? 'FILE' : 'IMAGE',
      `datav/${uploadCategory.value.trim() || '通用'}`
    );
    if (uploadRes.error !== null || !uploadRes.data) {
      loadError.value = uploadRes.error?.message || '文件上传失败';
      return;
    }
    // 第二步：datav 登记元数据（含引用保护所需的一切）
    const saveRes = await saveDatavAsset({
      fileUrl: uploadRes.data.url,
      assetName: file.name.replace(/\.[^.]+$/, ''),
      originalName: file.name,
      assetType: inferType(file.name),
      category: uploadCategory.value.trim() || '通用',
      fileSize: file.size
    });
    if (saveRes.error !== null) {
      loadError.value = saveRes.error?.message || '素材登记失败';
      return;
    }
    loadError.value = '';
    await load();
  } finally {
    uploading.value = false;
  }
}

function onUse(asset: DatavNamespace.DatavAsset) {
  emit('use', asset);
  emit('update:visible', false);
}

async function onRemove(asset: DatavNamespace.DatavAsset) {
  // 引用保护在后端：被引用时会收到带引用屏名的错误文案，直接透传给操作者
  const res = await delDatavAsset(asset.assetCode);
  if (res.error !== null) {
    loadError.value = res.error?.message || '删除失败';
    return;
  }
  window.$message?.success('已删除');
  await load();
}

async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    window.$message?.success('地址已复制');
  } catch {
    window.$message?.warning('复制失败，请在素材卡片上手动复制');
  }
}

function formatSize(size?: number): string {
  if (!size || size <= 0) return '';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}
</script>

<template>
  <ElDrawer
    :model-value="visible"
    title="素材库"
    size="460px"
    append-to-body
    :close-on-click-modal="true"
    @update:model-value="(v: boolean) => emit('update:visible', v)"
  >
    <div class="h-full flex flex-col gap-10px">
      <div class="flex items-center gap-8px">
        <ElInput
          v-model="keyword"
          size="small"
          clearable
          placeholder="搜名称 / 原始文件名"
          aria-label="搜索素材"
          @change="() => void load()"
        />
        <ElButton size="small" :loading="loading" @click="() => void load()">刷新</ElButton>
      </div>

      <div class="flex flex-wrap gap-6px">
        <ElTag
          v-for="item in categories"
          :key="item"
          size="small"
          :effect="activeCategory === item ? 'dark' : 'plain'"
          style="cursor: pointer"
          @click="
            activeCategory = item;
            void load();
          "
        >
          {{ item }}
        </ElTag>
      </div>

      <div class="flex items-center gap-8px">
        <ElUpload :show-file-list="false" :accept="accept" :http-request="onUpload as never" class="flex-1">
          <ElButton size="small" type="primary" :loading="uploading">上传素材</ElButton>
        </ElUpload>
        <ElInput v-model="uploadCategory" size="small" class="w-110px" placeholder="分类" aria-label="上传分类" />
      </div>

      <ElAlert v-if="loadError" type="error" :title="loadError" :closable="false" show-icon />

      <div class="min-h-0 flex-1 overflow-auto">
        <div
          v-if="!assets.length && !loading"
          class="py-40px text-center text-13px"
          style="color: var(--datav-text-secondary)"
        >
          还没有素材，上传一张图片或一段视频开始
        </div>
        <div class="grid grid-cols-2 gap-10px">
          <div
            v-for="asset in assets"
            :key="asset.assetCode"
            class="asset-card flex flex-col overflow-hidden"
            :title="`${asset.assetName}（${asset.category}）`"
          >
            <div class="asset-card__preview">
              <img v-if="asset.assetType === 'image'" :src="asset.fileUrl" :alt="asset.assetName" loading="lazy" />
              <div
                v-else
                class="h-full w-full flex flex-col items-center justify-center gap-4px"
                style="color: var(--datav-text-secondary)"
              >
                <SvgIcon icon="mdi:file-video-outline" class="text-28px" />
                <span class="text-11px">{{ formatSize(asset.fileSize) || '视频' }}</span>
              </div>
            </div>
            <div class="truncate px-6px pt-4px text-12px" style="color: var(--datav-text-primary)">
              {{ asset.assetName }}
            </div>
            <div class="flex items-center gap-4px px-6px pb-6px">
              <ElButton size="small" text type="primary" @click="onUse(asset)">使用</ElButton>
              <ElButton size="small" text @click="() => void copyUrl(asset.fileUrl)">复制URL</ElButton>
              <ElButton size="small" text type="danger" @click="() => void onRemove(asset)">删</ElButton>
            </div>
          </div>
        </div>
      </div>

      <div class="text-11px leading-14px" style="color: var(--datav-text-tertiary)">
        「使用」写入当前选中的图片/视频组件（未选中时写入画布背景）；素材被大屏引用时不可删除。
      </div>
    </div>
  </ElDrawer>
</template>

<style scoped>
.asset-card {
  border-radius: var(--datav-radius-md);
  background: var(--datav-panel);
  border: 1px solid var(--datav-border);
}

.asset-card__preview {
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.asset-card__preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
