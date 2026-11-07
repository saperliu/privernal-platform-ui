<script setup lang="tsx">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElButton as __forwarded_ElButton } from 'element-plus';
import { fetchAiChatMessages, fetchAiChatSessions } from '@/service';
import { useAppStore } from '@/store/modules/app';
import DesignerFormModal from '@/views/builder/components/designer-modal.vue';
import DynamicDataList from '@/views/builder/components/dynamic-data-list.vue';
import { chartTitle, useAiChat } from '../use-ai-chat';

defineOptions({ name: 'AiAnalyze' });

// 模板绑定显式转发（规避编译产物 setup 绑定缺失，与 build 页同款）
const ElButton = __forwarded_ElButton;

// ---------------- 窄屏适配（M3-4 一期：APP webview bare 模式 ≈ 400px 视口） ----------------
// isMobile 走全局断点（<640px）：侧栏收进抽屉，聊天区独占整行；桌面端布局不变
const appStore = useAppStore();
const isMobile = computed(() => appStore.isMobile);
const sessionDrawerVisible = ref(false);

// ---------------- 对话编排（B7/B8 共用 composable；analyze 端点 + 问数侧栏回调） ----------------
const {
  chatMessages,
  inputText,
  streaming,
  modelInfo,
  budget,
  lastError,
  listRef,
  canSend,
  handleSend,
  handleNewSession
} = useAiChat({
  chatEndpoint: '/api/ai/analyze/chat',
  onOpenView: openDataView,
  onFinally: loadSessions
});

// ---------------- 「查看数据」容器（open_data_view 工具经编排层转发，与 build 页同构） ----------------
interface DataViewState {
  visible: boolean;
  mode: 'detail' | 'list';
  tableCode: string;
  dataId: string | null;
  filters: Record<string, any> | null;
  title: string;
}

const dataView = ref<DataViewState>({
  visible: false,
  mode: 'detail',
  tableCode: '',
  dataId: null,
  filters: null,
  title: ''
});

function openDataView(payload: Record<string, any>) {
  dataView.value = {
    visible: true,
    mode: payload.mode === 'list' ? 'list' : 'detail',
    tableCode: String(payload.tableCode || ''),
    dataId: payload.dataId ? String(payload.dataId) : null,
    filters: payload.filters || null,
    title: String(payload.title || '')
  };
  window.$message?.success(`已打开：${payload.title || payload.tableCode}`);
}

const detailVisible = computed({
  get: () => dataView.value.visible && dataView.value.mode === 'detail' && Boolean(dataView.value.dataId),
  set: (v: boolean) => {
    if (!v) {
      window.setTimeout(() => {
        dataView.value.visible = false;
      }, 300);
    }
  }
});

const listVisible = computed({
  get: () => dataView.value.visible && dataView.value.mode === 'list',
  set: (v: boolean) => {
    if (!v) {
      dataView.value.visible = false;
    }
  }
});

// ---------------- 历史会话侧栏（system_ai_chat_message；B8-M2-9 历史落库的读侧） ----------------
const sessions = ref<AiNamespace.AiChatSessionSummary[]>([]);
const sessionsLoading = ref(false);
const activeSessionId = ref('');

async function loadSessions() {
  sessionsLoading.value = true;
  const { error, data } = await fetchAiChatSessions();
  if (!error) {
    sessions.value = data || [];
  }
  sessionsLoading.value = false;
}

/** 点历史会话：回放消息（charts JSON 还原为内联图表）；后续追问继续写回同一 sessionId */
async function handleOpenSession(row: AiNamespace.AiChatSessionSummary) {
  if (streaming.value) {
    window.$message?.warning('当前会话处理中，请等待完成');
    return;
  }
  const { error, data } = await fetchAiChatMessages(row.sessionId);
  if (error) {
    return;
  }
  activeSessionId.value = row.sessionId;
  sessionDrawerVisible.value = false;
  chatMessages.value = (data || []).map((m, idx) => ({
    key: `h-${m.id || idx}`,
    role: m.role,
    text: m.content || '',
    streaming: false,
    traces: [],
    charts: parseCharts(m.charts)
  }));
}

function parseCharts(chartsJson: string | null | undefined): AiNamespace.AiChartSpec[] {
  if (!chartsJson) {
    return [];
  }
  try {
    const arr = JSON.parse(chartsJson);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** 新会话按钮：清空侧栏选中态（对话继续走新 sessionId，历史落库按新会话聚合） */
function wrapNewSession() {
  handleNewSession();
  activeSessionId.value = '';
}

/** 「保存为报表」引导：把保存意图发给模型，由模型调 chat_save_chart（按钮只做引导发送） */
function guideSaveChart(chart: AiNamespace.AiChartSpec, title: string) {
  if (streaming.value) {
    window.$message?.warning('当前会话处理中，请等待完成');
    return;
  }
  const anchor = chart.datasetCode ? `datasetCode=${chart.datasetCode}` : '（用刚才取数的表）';
  inputText.value = `把刚才这张「${title}」保存为报表（${anchor}，reportType=${chart.reportType}）`;
}

/** 「投放仪表盘」引导：存图+投放由模型串两步执行（chat_save_chart → chat_add_to_dashboard） */
function guideAddDashboard(chart: AiNamespace.AiChartSpec, title: string) {
  if (streaming.value) {
    window.$message?.warning('当前会话处理中，请等待完成');
    return;
  }
  const anchor = chart.reportCode ? `reportCode=${chart.reportCode}` : '（先保存为报表再投放）';
  inputText.value = `把刚才这张「${title}」保存为报表并投放到仪表盘（${anchor}）`;
}

/** 「投放大屏」引导：存图+投屏由模型串两步执行（chat_save_chart → chat_append_to_screen）；大屏名由模型向用户确认 */
function guideAppendScreen(chart: AiNamespace.AiChartSpec, title: string) {
  if (streaming.value) {
    window.$message?.warning('当前会话处理中，请等待完成');
    return;
  }
  const saved = chart.datasetCode && !chart.datasetCode.startsWith('TRANSIENT:');
  const anchor = saved ? `datasetCode=${chart.datasetCode}` : '（先保存为报表拿到已落库数据集再投屏）';
  const type = ['bar', 'line', 'pie', 'gauge'].includes(chart.reportType)
    ? chart.reportType
    : 'bar（原图为 stat/ranking/table，投屏需改用这四种之一）';
  inputText.value = `把刚才这张「${title}」追加到 datav 大屏（${anchor}，reportType=${type}，目标大屏名请先问我）`;
}

onMounted(() => {
  loadSessions();
});

onBeforeUnmount(() => {
  handleNewSession();
});
</script>

<template>
  <div class="h-full flex gap-12px overflow-hidden p-12px">
    <!-- 左：历史会话侧栏（个人问数痕迹，按组织+用户隔离；窄屏收进抽屉见页面底部） -->
    <ElCard v-if="!isMobile" class="w-220px flex flex-col shrink-0" content-class="flex flex-col h-full" size="small">
      <template #header>
        <span>历史会话</span>
      </template>
      <template #header-extra>
        <ElButton size="small" quaternary :loading="sessionsLoading" @click="loadSessions">刷新</ElButton>
      </template>
      <div class="flex-1 overflow-y-auto">
        <ElEmpty v-if="sessions.length === 0" class="mt-40px" description="暂无历史会话" :image-size="60" />
        <div
          v-for="s in sessions"
          :key="s.sessionId"
          class="mb-6px cursor-pointer rounded-6px px-8px py-6px text-12px leading-18px hover:bg-gray-100"
          :class="{ 'bg-primary-100': activeSessionId === s.sessionId }"
          @click="handleOpenSession(s)"
        >
          <div class="truncate">{{ s.title || '（无标题会话）' }}</div>
          <div class="mt-2px flex items-center justify-between text-11px text-gray-400">
            <span>{{ (s.createdTime || '').slice(5, 16) }}</span>
            <span>{{ s.messageCount || 0 }} 条</span>
          </div>
        </div>
      </div>
      <div class="mt-6px border-t border-gray-100 pt-6px text-11px text-gray-400 leading-18px">
        点会话回看历史；追问会继续写入原会话。数据范围与列表页一致：你看到的数字都在你权限内。
      </div>
    </ElCard>

    <!-- 右：问数对话区 -->
    <ElCard class="min-w-0 flex flex-col flex-1" content-class="flex flex-col h-full" size="small">
      <template #header>
        <div class="flex items-center gap-8px">
          <span>AI 问数</span>
          <ElTag v-if="modelInfo?.model" size="small" type="success">{{ modelInfo.model }}</ElTag>
          <ElTag v-if="budget.limit" size="small" :type="budget.tokensUsed >= budget.limit ? 'danger' : 'info'">
            token {{ budget.tokensUsed }}/{{ budget.limit }}
          </ElTag>
        </div>
      </template>
      <template #header-extra>
        <div class="flex items-center gap-8px">
          <ElButton v-if="isMobile" size="small" @click="sessionDrawerVisible = true">历史</ElButton>
          <ElButton size="small" @click="wrapNewSession">新会话</ElButton>
        </div>
      </template>

      <div ref="listRef" class="flex-1 overflow-y-auto pr-4px">
        <ElEmpty
          v-if="chatMessages.length === 0"
          class="mt-80px"
          description="试试问：统计每个点位的巡检时长总和，用柱状图展示"
        />
        <div v-for="item in chatMessages" :key="item.key" class="mb-12px">
          <div v-if="item.role === 'user'" class="flex justify-end">
            <div class="max-w-75% whitespace-pre-wrap rounded-8px bg-primary-100 px-12px py-8px">{{ item.text }}</div>
          </div>
          <div v-else class="max-w-90%">
            <div class="whitespace-pre-wrap rounded-8px bg-gray-100 px-12px py-8px">
              {{ item.text }}
              <div v-if="item.streaming && !item.text" v-loading="true" class="ml-4px" />
              <span v-if="item.streaming && item.text" class="animate-pulse">▍</span>
            </div>
            <!-- B8 Chat BI：内联图表 + 保存为报表引导（chat_save_chart 由模型执行） -->
            <div v-if="item.charts.length" class="mt-8px flex flex-col gap-8px">
              <div
                v-for="(chart, chartIndex) in item.charts"
                :key="`${item.key}-chart-${chartIndex}`"
                class="overflow-hidden border border-gray-200 rounded-8px bg-white"
              >
                <div class="flex items-center justify-between px-12px pt-8px">
                  <span class="text-13px font-500">{{ chartTitle(chart, chartIndex) }}</span>
                  <div class="chart-actions ml-8px flex flex-wrap items-center gap-4px">
                    <ElTag v-if="chart.datasetCode" size="small" type="info">{{ chart.datasetCode }}</ElTag>
                    <ElTag v-if="chart.reportCode" size="small" type="success">已存报表</ElTag>
                    <ElButton
                      size="small"
                      text
                      type="primary"
                      @click="guideSaveChart(chart, chartTitle(chart, chartIndex))"
                    >
                      保存为报表
                    </ElButton>
                    <ElButton
                      size="small"
                      text
                      type="primary"
                      @click="guideAddDashboard(chart, chartTitle(chart, chartIndex))"
                    >
                      投放仪表盘
                    </ElButton>
                    <ElButton
                      size="small"
                      text
                      type="primary"
                      @click="guideAppendScreen(chart, chartTitle(chart, chartIndex))"
                    >
                      投放大屏
                    </ElButton>
                  </div>
                </div>
                <div class="h-280px w-full">
                  <ChartCard
                    :report-type="chart.reportType"
                    :report-name="chartTitle(chart, chartIndex)"
                    :rows="chart.rows"
                    :dimension-aliases="chart.dimensionAliases"
                    :measure-aliases="chart.measureAliases"
                    :dimension-labels="chart.dimensionLabels"
                    :measure-labels="chart.measureLabels"
                    :comparison="chart.comparison"
                  />
                </div>
              </div>
            </div>
            <!-- 工具调用轨迹 -->
            <ElCollapse v-if="item.traces.length" class="mt-4px" :default-expanded-names="[]">
              <ElCollapseItem :title="`工具调用（${item.traces.length}）`" name="traces">
                <div v-for="t in item.traces" :key="t.key" class="mb-6px">
                  <ElSpace align="center" :size="6">
                    <ElTag size="small" :type="t.ok === null ? 'info' : t.ok ? 'success' : 'danger'">
                      {{ t.ok === null ? '执行中' : t.ok ? '成功' : '失败' }}
                    </ElTag>
                    <span class="text-12px font-mono">{{ t.name }}</span>
                  </ElSpace>
                  <div
                    v-if="t.resultText"
                    class="ml-8px mt-2px max-h-120px overflow-y-auto whitespace-pre-wrap text-11px text-gray-500 font-mono"
                  >
                    {{ t.resultText.slice(0, 1200) }}
                  </div>
                </div>
              </ElCollapseItem>
            </ElCollapse>
          </div>
        </div>
        <ElAlert v-if="lastError" type="error" class="mb-8px">{{ lastError }}</ElAlert>
      </div>

      <div class="mt-8px">
        <ElInput
          v-model="inputText"
          type="textarea"
          :rows="3"
          :disabled="streaming"
          placeholder="用自然语言问数，例如：本月各班提交的请假单有多少？占比用饼图（Ctrl+Enter 发送）"
          @keydown.ctrl.enter.prevent="handleSend"
        />
        <div class="mt-6px flex justify-end">
          <ElButton type="primary" :disabled="!canSend" :loading="streaming" @click="handleSend">发送</ElButton>
        </div>
      </div>
    </ElCard>

    <!-- 「查看数据」容器·单条（问数追问明细，与 build 页同构） -->
    <DesignerFormModal
      v-if="dataView.visible && dataView.mode === 'detail' && dataView.dataId"
      :key="`${dataView.tableCode}_${dataView.dataId}`"
      v-model:visible="detailVisible"
      type="view"
      :edit-data="{ id: dataView.dataId }"
      :form-code="dataView.tableCode"
    />
    <!-- 窄屏（APP webview）：历史会话抽屉，内容与桌面侧栏同源 -->
    <ElDrawer v-model="sessionDrawerVisible" title="历史会话" size="78%" append-to-body>
      <ElButton size="small" quaternary :loading="sessionsLoading" class="mb-8px" @click="loadSessions">刷新</ElButton>
      <ElEmpty v-if="sessions.length === 0" description="暂无历史会话" :image-size="60" />
      <div
        v-for="s in sessions"
        :key="s.sessionId"
        class="mb-6px cursor-pointer rounded-6px px-8px py-6px text-12px leading-18px hover:bg-gray-100"
        :class="{ 'bg-primary-100': activeSessionId === s.sessionId }"
        @click="handleOpenSession(s)"
      >
        <div class="truncate">{{ s.title || '（无标题会话）' }}</div>
        <div class="mt-2px flex items-center justify-between text-11px text-gray-400">
          <span>{{ (s.createdTime || '').slice(5, 16) }}</span>
          <span>{{ s.messageCount || 0 }} 条</span>
        </div>
      </div>
    </ElDrawer>
    <ElDialog v-model="listVisible" :title="dataView.title || '数据列表'" top="6vh" style="width: 90%" destroy-on-close>
      <div style="height: 72vh" class="overflow-hidden">
        <DynamicDataList
          :query-code="dataView.tableCode"
          :preset-filters="dataView.filters"
          :show-operation="false"
          :multiple="false"
        />
      </div>
    </ElDialog>
  </div>
</template>

<style scoped>
/* EP 相邻按钮默认规则 .el-button + .el-button { margin-left: 12px } 会叠加在 gap-4px 之上，
   把图卡按钮组里第二个按钮（投放仪表盘）多推 12px；这里显式清零（datav-designer 同手法） */
.chart-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
