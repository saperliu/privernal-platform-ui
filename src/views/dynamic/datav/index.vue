<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  copyDatavScreen,
  delDatavScreen,
  findDatavScreenList,
  findSystemAppListByOrg,
  publishDatavScreen,
  saveDatavScreen
} from '@/service';
import { useDatavStore } from '@/store';
import { useLoading } from '@/hooks';
import { createEmptySchema } from '@/utils/datav-schema';
import DatavVersionPanel from '@/components/datav/version-panel/index.vue';
import DatavShareDialog from '@/components/datav/share-dialog/index.vue';

defineOptions({ name: 'DatavList' });

const router = useRouter();
const datavStore = useDatavStore();
const { loading, startLoading, endLoading } = useLoading(false);

const appOptions = ref<Array<{ label: string; value: string }>>([]);
const currentAppId = ref('');
const list = ref<DatavNamespace.ScreenSummary[]>([]);

const createVisible = ref(false);
const createForm = ref({ screenName: '', appId: '' });

/** 版本面板（M7.7/7.8）：版本列表 + 发布记录 + 对比 + 回滚 */
const versionPanel = ref<{ screenCode: string } | null>(null);

/** 外链分享（M7.6）：只有已发布的屏可分享 */
const shareDialog = ref<{ screenCode: string; screenName: string } | null>(null);

function openShare(item: DatavNamespace.ScreenSummary) {
  if (item.status !== 1) {
    window.$message?.warning('先发布大屏，再生成外链');
    return;
  }
  shareDialog.value = { screenCode: item.screenCode, screenName: item.screenName };
}

function openVersions(screenCode: string) {
  versionPanel.value = { screenCode };
}

const statusText: Record<number, string> = { 0: '草稿', 1: '已发布', 2: '已下线' };

/** 应用筛选的记忆键：创建大屏会跳去设计器，返回列表时页面重挂载，
 *  不记住上次筛选就会退回第一个应用——新屏在别的应用下时看起来像「没创建成功」 */
const APP_FILTER_KEY = 'datav-list-app-filter';

async function loadAppOptions() {
  const res = await findSystemAppListByOrg();
  if (res.error === null && res.data) {
    appOptions.value = res.data.map((item: any) => ({ label: item.appName, value: item.id }));
    if (!currentAppId.value && appOptions.value.length > 0) {
      const saved = window.localStorage.getItem(APP_FILTER_KEY) || '';
      currentAppId.value = appOptions.value.some(opt => opt.value === saved) ? saved : appOptions.value[0].value;
    }
  }
}

async function loadList() {
  startLoading();
  if (currentAppId.value) {
    window.localStorage.setItem(APP_FILTER_KEY, currentAppId.value);
  }
  const res = await findDatavScreenList(currentAppId.value || undefined);
  if (res.error === null && res.data) {
    list.value = res.data;
  } else {
    list.value = [];
    window.$message?.error(res.error?.message || '大屏列表加载失败');
  }
  endLoading();
}

function openDesigner(code: string) {
  router.push({ path: '/datav-designer', query: { code } });
}

function openPreview(code: string) {
  const url = `${window.location.origin}${router.resolve({ path: '/datav-preview', query: { code } }).href}`;
  window.open(url, '_blank');
}

function openCreate() {
  createForm.value = { screenName: '', appId: currentAppId.value };
  createVisible.value = true;
}

async function submitCreate() {
  const name = createForm.value.screenName.trim();
  if (!name) {
    window.$message?.warning('请填写大屏名称');
    return;
  }
  const res = await saveDatavScreen({
    screenName: name,
    appId: createForm.value.appId || undefined,
    layoutMode: 'absolute',
    schemaJson: createEmptySchema()
  });
  if (res.error === null && res.data) {
    createVisible.value = false;
    // 新屏可能建在弹窗里另选的应用（或清空了应用）：把列表过滤切到新屏的应用，保证创建后立即可见
    currentAppId.value = res.data.appId || '';
    window.$message?.success('已创建');
    await loadList();
    openDesigner(res.data.screenCode);
    return;
  }
  window.$message?.error(res.error?.message || '创建失败');
}

async function handleCopy(screenCode: string) {
  const res = await copyDatavScreen(screenCode);
  if (res.error === null) {
    window.$message?.success('已复制');
    await loadList();
    return;
  }
  window.$message?.error(res.error?.message || '复制失败');
}

async function handlePublish(item: DatavNamespace.ScreenSummary) {
  // 发布=1，已发布的再点就是下线=2
  const next: DatavNamespace.ScreenStatus = item.status === 1 ? 2 : 1;
  const res = await publishDatavScreen(item.screenCode, next);
  if (res.error === null) {
    window.$message?.success(next === 1 ? '已发布' : '已下线');
    await loadList();
    return;
  }
  window.$message?.error(res.error?.message || '操作失败');
}

function handleDelete(item: DatavNamespace.ScreenSummary) {
  window.$dialog?.warning({
    title: '删除确认',
    content: `删除后不可恢复：${item.screenName}`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const res = await delDatavScreen(item.screenCode);
      if (res.error === null) {
        window.$message?.success('删除成功');
        await loadList();
        return;
      }
      window.$message?.error(res.error?.message || '删除失败');
    }
  });
}

/** 进编辑器前先清掉上一个大屏残留的编辑态 */
function handleEnterDesigner(screenCode: string) {
  datavStore.reset();
  openDesigner(screenCode);
}

onMounted(async () => {
  await loadAppOptions();
  await loadList();
});
</script>

<template>
  <div class="main-space h-full overflow-auto">
    <ElCard :bordered="false" class="rounded-8px shadow-sm">
      <div class="mb-16px flex flex-wrap items-center gap-12px">
        <span class="text-16px font-600">数据大屏</span>
        <ElSelect
          v-model="currentAppId"
          size="small"
          class="w-200px"
          placeholder="选择应用"
          clearable
          @change="loadList"
        >
          <ElOption v-for="opt in appOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
        <ElButton size="small" @click="loadList">刷新</ElButton>
        <div class="flex-1"></div>
        <ElButton type="primary" size="small" @click="openCreate">新建大屏</ElButton>
      </div>

      <ElEmpty v-if="!loading && list.length === 0" description="还没有大屏，先新建一个" />

      <div v-else v-loading="loading" class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-16px">
        <div
          v-for="item in list"
          :key="item.screenCode"
          class="group overflow-hidden border-1px border-[var(--el-border-color)] rounded-8px border-solid transition-shadow hover:shadow-md"
        >
          <div
            class="h-140px flex cursor-pointer items-center justify-center bg-[var(--el-fill-color-light)]"
            @click="handleEnterDesigner(item.screenCode)"
          >
            <img v-if="item.thumbnail" :src="item.thumbnail" class="h-full w-full object-cover" alt="" />
            <span v-else class="text-13px opacity-50">1920 × 1080</span>
          </div>
          <div class="p-10px">
            <div class="flex items-center gap-8px">
              <span class="flex-1 truncate text-14px font-600">{{ item.screenName }}</span>
              <ElTag :type="item.status === 1 ? 'success' : 'info'" size="small" effect="light">
                {{ statusText[item.status] }}
              </ElTag>
            </div>
            <div class="mt-4px text-12px opacity-60">
              {{ item.widgetCount || 0 }} 个组件 · {{ item.updateTime || '—' }}
            </div>
            <div class="mt-8px flex flex-wrap gap-6px">
              <ElButton size="small" @click="handleEnterDesigner(item.screenCode)">编辑</ElButton>
              <ElButton size="small" @click="openPreview(item.screenCode)">预览</ElButton>
              <ElButton size="small" @click="handlePublish(item)">
                {{ item.status === 1 ? '下线' : '发布' }}
              </ElButton>
              <ElButton size="small" @click="handleCopy(item.screenCode)">复制</ElButton>
              <ElButton size="small" @click="openVersions(item.screenCode)">版本</ElButton>
              <ElButton size="small" @click="openShare(item)">分享</ElButton>
              <ElButton size="small" type="danger" plain @click="handleDelete(item)">删除</ElButton>
            </div>
          </div>
        </div>
      </div>
    </ElCard>

    <ElDialog v-model="createVisible" title="新建大屏" width="420px">
      <ElForm label-width="80px" @submit.prevent="submitCreate">
        <ElFormItem label="名称">
          <ElInput v-model="createForm.screenName" placeholder="如：生产实时监控大屏" maxlength="50" show-word-limit />
        </ElFormItem>
        <ElFormItem label="所属应用">
          <ElSelect v-model="createForm.appId" class="w-full" placeholder="可留空">
            <ElOption v-for="opt in appOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitCreate">创建并进入编辑</ElButton>
      </template>
    </ElDialog>

    <DatavVersionPanel
      :visible="versionPanel !== null"
      :screen-code="versionPanel?.screenCode ?? ''"
      @update:visible="(v: boolean) => (versionPanel = v ? versionPanel : null)"
    />

    <DatavShareDialog
      :visible="shareDialog !== null"
      :screen-code="shareDialog?.screenCode ?? ''"
      :screen-name="shareDialog?.screenName ?? ''"
      @update:visible="(v: boolean) => (shareDialog = v ? shareDialog : null)"
    />
  </div>
</template>
