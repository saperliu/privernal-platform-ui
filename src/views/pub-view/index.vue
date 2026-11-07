<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  ElCard,
  ElDialog,
  ElButton as __forwarded_ElButton,
  ElPagination as __forwarded_ElPagination,
  ElResult as __forwarded_ElResult
} from 'element-plus';
import { fetchPublicViewDetail, fetchPublicViewList } from '@/service/api/dynamic/advanced';

const route = useRoute();
const token = computed(() => String(route.params.token ?? ''));

const loading = ref(true);
const notFound = ref(false);
const errorMsg = ref('');
const rows = ref<Array<Record<string, any>>>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const detailVisible = ref(false);
const detailRow = ref<Record<string, any> | null>(null);

const columns = ref<Array<{ title: string; key: string; ellipsis?: boolean; width?: number }>>([]);

function deriveColumns(sampleRows: Array<Record<string, any>>) {
  const first = sampleRows.find(Boolean) ?? {};
  const cols = Object.keys(first)
    .filter(key => !['id', 'tenant_id', 'deleted_flag', 'revision'].includes(key))
    .slice(0, 8)
    .map(key => ({ title: key, key, ellipsis: { tooltip: true } }) as any);
  cols.unshift({ title: '#', key: '__index', width: 60 });
  columns.value = cols;
}

async function load() {
  loading.value = true;
  try {
    const { data, error } = await fetchPublicViewList(token.value, { pageNum: page.value, pageSize });
    if (!error && data) {
      rows.value = (data.list ?? []).map((row: any, index: number) => ({ ...row, __index: index + 1 }));
      // PageResultInfo 无 total，用 pages*pageSize 估算（末页允许少量越界显示为空页）
      total.value = Number(data.pages > 0 ? data.pages * pageSize : rows.value.length);
      deriveColumns(rows.value);
      errorMsg.value = '';
    } else {
      errorMsg.value = error?.message ?? '';
      notFound.value = true;
    }
  } finally {
    loading.value = false;
  }
}

async function openDetail(row: Record<string, any>) {
  const { data, error } = await fetchPublicViewDetail(token.value, String(row.id));
  if (!error && data) {
    detailRow.value = data;
    detailVisible.value = true;
  }
}

const rowKey = (row: any) => String(row.id);

function rowProps(row: Record<string, any>) {
  return { style: 'cursor: pointer;', onClick: () => openDetail(row) };
}

function changePage(nextPage: number) {
  page.value = nextPage;
  load();
}

onMounted(load);

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElPagination = __forwarded_ElPagination;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElResult = __forwarded_ElResult;
</script>

<template>
  <div class="public-page">
    <div v-loading="loading">
      <ElResult
        v-if="notFound"
        :status="errorMsg.includes('登录') ? '403' : '404'"
        :title="errorMsg || '链接不存在或已失效'"
        description="请联系表单管理员"
      >
        <template #footer>
          <ElButton v-if="errorMsg.includes('登录')" tag="a" href="/login?type=pwd" type="primary">
            去登录后回跳本页
          </ElButton>
        </template>
      </ElResult>
      <ElCard v-else title="数据列表（只读）" class="list-card">
        <DataTable :columns="columns" :data="rows" size="small" :row-key="rowKey" :row-props="rowProps" />
        <div class="footer-row">
          <ElPagination :page="page" :page-size="pageSize" :item-count="total" @update:page="changePage" />
        </div>
      </ElCard>
    </div>

    <ElDialog v-model="detailVisible" title="数据详情" style="width: 640px">
      <div v-if="detailRow" class="detail-list">
        <div v-for="(value, key) in detailRow" :key="String(key)" class="detail-item">
          <span class="detail-key">{{ key }}</span>
          <span class="detail-value">{{ value ?? '-' }}</span>
        </div>
      </div>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.public-page {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 16px;
  background: #f4f6f9;
}

.list-card {
  width: 960px;
}

.footer-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.detail-list {
  max-height: 60vh;
  overflow: auto;
}

.detail-item {
  display: flex;
  padding: 6px 0;
  border-bottom: 1px dashed #eee;
}

.detail-key {
  width: 160px;
  flex-shrink: 0;
  color: #888;
}

.detail-value {
  flex: 1;
  word-break: break-all;
}
</style>
