<script setup lang="tsx">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElButton as __forwarded_ElButton } from 'element-plus';
import {
  fetchAiArtifacts,
  fetchFormDraft,
  findDynamicFormDetail,
  findFlowDefinitionList,
  publishFormLog,
  rollbackAiArtifact
} from '@/service';
import DesignerFormModal from '@/views/builder/components/designer-modal.vue';
import DynamicDataList from '@/views/builder/components/dynamic-data-list.vue';
import { chartTitle, useAiChat } from '../use-ai-chat';

defineOptions({ name: 'AiBuild' });

// ---------------- 对话编排（B7/B8 共用 composable；build 端点 + 产物面板回调） ----------------
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
  chatEndpoint: '/api/ai/chat',
  onOpenView: openDataView,
  onFinally: loadArtifacts
});

// ---------------- 「查看数据」容器（open_data_view 工具经编排层转发） ----------------
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

/** 详情抽屉可见性：关闭后延迟撤容器，保留抽屉收起动画 */
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

/** 列表容器可见性（ElDialog 自带动画，destroy-on-close 复位内嵌列表） */
const listVisible = computed({
  get: () => dataView.value.visible && dataView.value.mode === 'list',
  set: (v: boolean) => {
    if (!v) {
      dataView.value.visible = false;
    }
  }
});

// ---------------- 会话产物面板（发布/撤销） ----------------
const artifacts = ref<(AiNamespace.AiArtifact & { published?: boolean })[]>([]);
const artifactsLoading = ref(false);

// 台账接口返回全量（按组织隔离），面板侧前端分页展示
const artifactPage = ref(1);
const artifactPageSize = ref(10);
const pagedArtifacts = computed(() => {
  const start = (artifactPage.value - 1) * artifactPageSize.value;
  return artifacts.value.slice(start, start + artifactPageSize.value);
});

const artifactPagination = computed(() => ({
  page: artifactPage.value,
  pageSize: artifactPageSize.value,
  itemCount: artifacts.value.length,
  pageSizes: [10, 20, 50],
  onChange: (page: number) => {
    artifactPage.value = page;
  },
  onUpdatePageSize: (size: number) => {
    artifactPageSize.value = size;
    artifactPage.value = 1;
  }
}));

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）；发布中标记集合同样要先于 columns 的 JSX 使用
const ElButton = __forwarded_ElButton;
const publishingIds = ref(new Set<string>());

/** 台账 objectType → 展示名：未识别的类型直接回显原值 */
const objectTypeLabels: Record<string, string> = { FORM: '表单', REPORT: '图表', FLOW: '流程' };

const artifactColumns: DataTable.Column<AiNamespace.AiArtifact & { published?: boolean; artifactName?: string }>[] = [
  {
    title: '名称',
    key: 'artifactName',
    width: 130,
    render: row => row.artifactName || row.code,
    ellipsis: { tooltip: true }
  },
  {
    title: '类型',
    key: 'objectType',
    width: 56,
    render: row => objectTypeLabels[row.objectType] ?? row.objectType
  },
  { title: '编码', key: 'code', ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'rolledBack',
    width: 72,
    render: row => {
      if (row.rolledBack === 'Y') return '已撤销';
      if (row.published) return '已发布';
      return '待发布';
    }
  },
  { title: '时间', key: 'createdTime', width: 92, render: row => (row.createdTime || '').slice(5, 16) },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    render: row => {
      if (row.rolledBack === 'Y') {
        return '-';
      }
      const actions: any[] = [];
      if (row.objectType === 'FORM' && !row.published) {
        actions.push(
          <ElButton
            size="small"
            type="primary"
            plain
            loading={publishingIds.value.has(row.id)}
            onClick={() => handlePublish(row)}
          >
            发布
          </ElButton>
        );
      }
      actions.push(
        <ElButton size="small" type="danger" plain onClick={() => handleRollback(row)}>
          撤销
        </ElButton>
      );
      return actions;
    }
  }
];

async function loadArtifacts() {
  artifactsLoading.value = true;
  // 不过滤 sessionId：产物面板要能看到历史会话的产物（重进页面不再丢），
  // 台账本身持久在 system_ai_artifact，按组织隔离，新会话产物保存后也进同一列表
  const { error, data } = await fetchAiArtifacts();
  if (error) {
    artifactsLoading.value = false;
    return;
  }
  const rows = (data || []) as (AiNamespace.AiArtifact & { published?: boolean; artifactName?: string })[];
  // 发布状态派生：新建草稿发布后被消费（fetchFormDraft 无未发布草稿 ⇒ 已发布），
  // 台账本身不记发布态，靠这一步让按钮消失、状态可见（2026-10-08 用户实测反馈）
  const formRows = rows.filter(r => r.rolledBack === 'N' && r.objectType === 'FORM');
  await Promise.all(
    formRows.map(async r => {
      const { error: e, data: draft } = await fetchFormDraft(r.objectId);
      if (!e) {
        r.published = !draft;
      }
    })
  );
  // 流程定义发布态派生：查该编码的最新定义，isPublish=1 即已发布（AI 只存草稿，发布由人完成）；顺带记下流程名
  const flowRows = rows.filter(r => r.rolledBack === 'N' && r.objectType === 'FLOW' && r.code);
  await Promise.all(
    flowRows.map(async r => {
      const { error: e, data: page } = await findFlowDefinitionList({
        flowCode: r.code,
        pageNum: 1,
        pageSize: 1,
        keywords: []
      });
      if (!e && page?.list?.length) {
        r.published = Number(page.list[0].isPublish ?? 0) === 1;
        r.artifactName = (page.list[0] as any).flowName || r.code;
      }
    })
  );
  // 名称列派生（台账只存 code/objectId）：表单取 dynamic_form 的表单名称
  await Promise.all(
    formRows.map(async r => {
      const { data: form } = await findDynamicFormDetail(r.objectId);
      r.artifactName = form?.tableName || form?.title || r.code;
    })
  );
  artifacts.value = rows;
  artifactsLoading.value = false;
  // 刷新/撤销后页码越界回落（如最后一页唯一行被撤销）
  const maxPage = Math.max(1, Math.ceil(rows.length / artifactPageSize.value));
  if (artifactPage.value > maxPage) {
    artifactPage.value = maxPage;
  }
}

/** 发布草稿：先取未发布草稿拿 logId，再走原生发布链（AI 会话无此权限，人是真的在点按钮） */
async function handlePublish(row: AiNamespace.AiArtifact & { published?: boolean }) {
  publishingIds.value.add(row.id);
  publishingIds.value = new Set(publishingIds.value);
  try {
    const { error, data } = await fetchFormDraft(row.objectId);
    if (error) {
      return;
    }
    if (!data) {
      row.published = true;
      window.$message?.info('该表单没有未发布草稿（可能已发布）');
      return;
    }
    const publishResult = await publishFormLog(data.id);
    if (!publishResult.error) {
      row.published = true;
      window.$message?.success(`表单 ${row.code} 已发布（物理表与列表列已生成）`);
    }
  } finally {
    publishingIds.value.delete(row.id);
    publishingIds.value = new Set(publishingIds.value);
  }
}

async function handleRollback(row: AiNamespace.AiArtifact) {
  const { error, data } = await rollbackAiArtifact(row.id);
  if (!error) {
    window.$message?.success(`已撤销：${data || row.code}`);
    loadArtifacts();
  }
}

onMounted(() => {
  loadArtifacts();
});

onBeforeUnmount(() => {
  handleNewSession();
});
</script>

<template>
  <div class="h-full flex gap-12px overflow-hidden p-12px">
    <!-- 左：对话区 -->
    <ElCard class="min-w-0 flex flex-col flex-1" content-class="flex flex-col h-full" size="small">
      <template #header>
        <div class="flex items-center gap-8px">
          <span>AI 对话搭建</span>
          <ElTag v-if="modelInfo?.model" size="small" type="success">{{ modelInfo.model }}</ElTag>
          <ElTag v-if="budget.limit" size="small" :type="budget.tokensUsed >= budget.limit ? 'danger' : 'info'">
            token {{ budget.tokensUsed }}/{{ budget.limit }}
          </ElTag>
        </div>
      </template>
      <template #header-extra>
        <ElButton size="small" @click="handleNewSession">新会话</ElButton>
      </template>

      <div ref="listRef" class="flex-1 overflow-y-auto pr-4px">
        <ElEmpty
          v-if="chatMessages.length === 0"
          class="mt-80px"
          description="描述你的需求，例如：建一个设备巡检应用，包含巡检点和巡检记录两张表，巡检记录走主管审批"
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
            <!-- B8 Chat BI：内联图表（取数工具聚合行，ChartCard 已全局自动注册） -->
            <div v-if="item.charts.length" class="mt-8px flex flex-col gap-8px">
              <div
                v-for="(chart, chartIndex) in item.charts"
                :key="`${item.key}-chart-${chartIndex}`"
                class="overflow-hidden border border-gray-200 rounded-8px bg-white"
              >
                <div class="flex items-center justify-between px-12px pt-8px">
                  <span class="text-13px font-500">{{ chartTitle(chart, chartIndex) }}</span>
                  <ElTag v-if="chart.datasetCode" size="small" type="info" class="ml-8px">
                    {{ chart.datasetCode }}
                  </ElTag>
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
          placeholder="输入需求描述（Ctrl+Enter 发送）"
          @keydown.ctrl.enter.prevent="handleSend"
        />
        <!-- 发送按钮在需求描述右下角 -->
        <div class="mt-6px flex justify-end">
          <ElButton type="primary" :disabled="!canSend" :loading="streaming" @click="handleSend">发送</ElButton>
        </div>
      </div>
    </ElCard>

    <!-- 右：会话产物面板（占 55%，保证名称/编码/操作完整可读） -->
    <ElCard class="min-w-520px w-40% flex flex-col shrink-0" content-class="flex flex-col h-full" size="small">
      <template #header>
        <span>AI 产物（全部会话）</span>
      </template>
      <template #header-extra>
        <ElButton size="small" quaternary @click="loadArtifacts">刷新</ElButton>
      </template>
      <DataTable
        size="small"
        :columns="artifactColumns"
        :data="pagedArtifacts"
        :loading="artifactsLoading"
        :row-key="(row: any) => row.id"
        :pagination="artifactPagination"
        flex-height
        class="flex-1"
      />
      <div class="mt-8px text-11px text-gray-400 leading-18px">
        台账持久保存（含历史会话）。表单停在草稿：点「发布」后生成物理表与菜单权限；「撤销」=
        表单改名+逻辑删（物理表保留）。
      </div>
    </ElCard>

    <!-- 「查看数据」容器·单条：复用列表页详情抽屉（只读；编辑/删除按钮按 dynamic:{tableCode}:edit/remove 权限显示） -->
    <DesignerFormModal
      v-if="dataView.visible && dataView.mode === 'detail' && dataView.dataId"
      :key="`${dataView.tableCode}_${dataView.dataId}`"
      v-model:visible="detailVisible"
      type="view"
      :edit-data="{ id: dataView.dataId }"
      :form-code="dataView.tableCode"
    />

    <!-- 「查看数据」容器·多条：内嵌运行时列表（预置过滤并入查询，可继续筛选） -->
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
