<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { findIndexSystemNoticeList } from '@/service';
import { sanitizeHtml } from '@/utils/sanitize';

defineOptions({ name: 'HomeNoticeList' });

interface NoticeItem {
  id: string;
  noticeTitle: string;
  content: string;
  createdTime?: string;
  noticeType?: string;
}

/** 只显示最近 10 条系统通知 */
const NOTICE_LIMIT = 10;

const list = ref<NoticeItem[]>([]);
const loading = ref(false);
const detailVisible = ref(false);
const current = ref<NoticeItem | null>(null);

/** 通知正文是富文本，v-html 前必须净化（后端无服务端 XSS 防护，这里是唯一一层） */
const currentContent = computed(() => sanitizeHtml(current.value?.content));

function findNoticeList() {
  loading.value = true;
  findIndexSystemNoticeList()
    .then(res => {
      if (res.error === null && res.data) {
        list.value = ((res.data as any).list || []).slice(0, NOTICE_LIMIT);
      }
    })
    .finally(() => {
      loading.value = false;
    });
}

function openDetail(item: NoticeItem) {
  current.value = item;
  detailVisible.value = true;
}

onMounted(() => {
  findNoticeList();
});
</script>

<template>
  <ElCard shadow="never" class="h-full rd-8px">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-15px font-500">系统通知</span>
        <span class="text-12px text-gray-400">最近 {{ NOTICE_LIMIT }} 条</span>
      </div>
    </template>
    <div v-loading="loading" class="min-h-200px">
      <template v-if="list.length">
        <div
          v-for="item in list"
          :key="item.id"
          class="flex cursor-pointer items-center justify-between gap-12px border-b border-gray-100 py-10px last:border-b-0 hover:bg-#f5f7fa"
          @click="openDetail(item)"
        >
          <div class="flex items-center gap-8px overflow-hidden">
            <span class="size-6px flex-shrink-0 rd-3px bg-primary" />
            <span class="truncate text-14px">{{ item.noticeTitle }}</span>
          </div>
          <span class="flex-shrink-0 text-12px text-gray-400">{{ (item.createdTime || '').slice(0, 10) }}</span>
        </div>
      </template>
      <ElEmpty v-else-if="!loading" description="暂无系统通知" :image-size="72" />
    </div>
  </ElCard>

  <!-- 通知详情 -->
  <ElDialog v-model="detailVisible" :title="current?.noticeTitle" width="640px">
    <div class="max-h-480px overflow-auto text-14px leading-24px" v-html="currentContent" />
    <template #footer>
      <ElButton @click="detailVisible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped></style>
