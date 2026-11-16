<script setup lang="tsx">
import { computed, ref } from 'vue';
import { ElButton, ElTag } from 'element-plus';
import { dryRunAppPackageTemplate, fetchAppPackageTemplates, importAppPackageTemplate } from '@/service';
import { useAuth, useLoading } from '@/hooks';

defineOptions({ name: 'SystemAppTemplateMarket' });

const { loading, startLoading, endLoading } = useLoading(false);
const { hasAuth } = useAuth();

const templates = ref<AppPackageNamespace.TemplateSummary[]>([]);

async function getTemplates() {
  startLoading();
  const { data } = await fetchAppPackageTemplates();
  templates.value = data || [];
  endLoading();
}

// 初始化
getTemplates();

const categoryLabels: Record<string, string> = {
  hr: '人力资源',
  campus: '校园教育',
  project: '项目协作',
  office: '行政办公'
};

function categoryLabel(category?: string) {
  if (!category) return '通用';
  return categoryLabels[category] || category;
}

const typeLabels: Record<string, string> = {
  app: '应用',
  form: '表单',
  flow: '流程',
  flowForm: '节点权限',
  dataset: '数据集',
  report: '图表',
  dashboard: '仪表盘',
  datavScreen: '大屏',
  datavAsset: '素材',
  schedule: '定时任务',
  docTemplate: '打印模板',
  dict: '字典',
  roleBinding: '角色绑定'
};
const actionLabels: Record<string, string> = { created: '新建', updated: '更新', skipped: '跳过', failed: '失败' };
const predictedLabels: Record<string, string> = {
  create: '新建',
  update: '覆盖',
  skip: '跳过',
  reuse: '复用',
  conflict: '冲突'
};

function actionTagType(action: string) {
  if (action === 'created') return 'success';
  if (action === 'updated') return 'info';
  if (action === 'failed') return 'danger';
  return 'warning';
}

function predictedTagType(predicted: string) {
  if (predicted === 'create') return 'success';
  if (predicted === 'update' || predicted === 'reuse') return 'info';
  if (predicted === 'conflict') return 'danger';
  return 'warning';
}

const dryRunColumns: DataTable.Column<AppPackageNamespace.DryRunItem>[] = [
  {
    key: 'type',
    title: '对象',
    width: 90,
    render: row => typeLabels[row.type] || row.type
  },
  {
    key: 'code',
    title: '编码',
    ellipsis: { tooltip: true }
  },
  {
    key: 'predicted',
    title: '预检结论',
    width: 90,
    render: row => (
      <ElTag size="small" type={predictedTagType(row.predicted)}>
        {predictedLabels[row.predicted] || row.predicted}
      </ElTag>
    )
  },
  {
    key: 'message',
    title: '说明',
    ellipsis: { tooltip: true }
  }
];

const resultColumns: DataTable.Column<AppPackageNamespace.ImportItem>[] = [
  {
    key: 'type',
    title: '对象',
    width: 90,
    render: row => typeLabels[row.type] || row.type
  },
  {
    key: 'code',
    title: '编码',
    ellipsis: { tooltip: true }
  },
  {
    key: 'action',
    title: '结果',
    width: 80,
    render: row => (
      <ElTag size="small" type={actionTagType(row.action)}>
        {actionLabels[row.action] || row.action}
      </ElTag>
    )
  },
  {
    key: 'message',
    title: '说明',
    ellipsis: { tooltip: true }
  }
];

/** 安装流程：选中模板 → 预检报告 → 确认安装 → 安装结果 */
const installVisible = ref(false);
const installing = ref<AppPackageNamespace.TemplateSummary | null>(null);
const overwrite = ref(false);
const dryRunning = ref(false);
const dryRunReport = ref<AppPackageNamespace.DryRunResult | null>(null);
const installingTemplate = ref(false);
const installResult = ref<AppPackageNamespace.ImportResult | null>(null);

const installTitle = computed(() => (installing.value ? `安装模板：${installing.value.name || installing.value.code}` : '安装模板'));

function openInstall(summary: AppPackageNamespace.TemplateSummary) {
  installing.value = summary;
  dryRunReport.value = null;
  installResult.value = null;
  overwrite.value = false;
  installVisible.value = true;
}

function handleDryRun() {
  if (!installing.value) return;
  dryRunning.value = true;
  dryRunAppPackageTemplate(installing.value.code, overwrite.value)
    .then(res => {
      dryRunning.value = false;
      if (res.error !== null || !res.data) {
        return;
      }
      dryRunReport.value = res.data;
      if (res.data.signatureStatus === 'mismatch') {
        window.$message?.error('模板签名校验失败：包内容被改动过，请重新下发模板包');
      } else {
        const conflicts = res.data.items.filter(item => item.predicted === 'conflict').length;
        if (conflicts > 0) {
          window.$message?.warning(`预检完成，${conflicts} 项存在冲突，请查看明细`);
        } else {
          window.$message?.success('预检完成，未发现阻断性冲突');
        }
      }
    })
    .catch(() => {
      dryRunning.value = false;
    });
}

function handleInstall() {
  if (!installing.value) return;
  installingTemplate.value = true;
  importAppPackageTemplate(installing.value.code, overwrite.value)
    .then(res => {
      installingTemplate.value = false;
      if (res.error !== null || !res.data) {
        return;
      }
      installResult.value = res.data;
      const failed = res.data.items.filter(item => item.action === 'failed').length;
      if (failed > 0) {
        window.$message?.warning(`安装结束，${failed} 项失败，请查看明细`);
      } else {
        window.$message?.success('安装完成，可在应用管理中查看新应用');
      }
    })
    .catch(() => {
      installingTemplate.value = false;
    });
}
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col overflow-auto">
        <div class="mb-12px flex items-center justify-between">
          <div>
            <div class="text-16px font-bold">模板市场</div>
            <div class="mt-4px text-12px text-gray-400">
              官方行业模板一键安装：预检确认目标环境无冲突后，按应用包链路重建表单、流程、字典与角色授权
            </div>
          </div>
          <ElButton size="small" @click="getTemplates">刷新</ElButton>
        </div>

        <div v-if="loading" class="flex flex-1 items-center justify-center text-13px text-gray-400">加载中…</div>
        <ElAlert v-else-if="templates.length === 0" type="info" :bordered="false">
          暂无可用模板：发布包未携带官方模板（apptemplates/manifest.json 缺失），请联系供应商获取
        </ElAlert>

        <div v-else class="grid grid-cols-3 gap-12px">
          <ElCard
            v-for="tpl in templates"
            :key="tpl.code"
            :bordered="true"
            class="rounded-8px"
            body-class="flex-col h-full"
          >
            <div class="flex-col h-full gap-8px">
              <div class="flex items-center justify-between">
                <span class="text-15px font-bold">{{ tpl.name || tpl.code }}</span>
                <ElTag size="small" type="info">{{ categoryLabel(tpl.category) }}</ElTag>
              </div>
              <div class="min-h-40px text-12px text-gray-500">
                {{ tpl.description || '暂无描述' }}
              </div>
              <div class="flex flex-wrap gap-8px text-12px text-gray-400">
                <ElTag size="small" type="warning" effect="plain">应用编码 {{ tpl.appCode }}</ElTag>
                <ElTag size="small" effect="plain">{{ tpl.formCount || 0 }} 表单</ElTag>
                <ElTag v-if="tpl.flowCount" size="small" effect="plain">{{ tpl.flowCount }} 流程</ElTag>
                <ElTag v-if="tpl.screenCount" size="small" effect="plain">{{ tpl.screenCount }} 大屏</ElTag>
                <ElTag v-if="tpl.dictCount" size="small" effect="plain">{{ tpl.dictCount }} 字典</ElTag>
                <ElTag size="small" effect="plain">包规格 {{ tpl.specVersion }}</ElTag>
              </div>
              <div class="mt-auto flex items-center justify-between pt-8px">
                <span class="text-12px text-gray-400">
                  v{{ tpl.version || '1.0.0' }} · {{ tpl.author === 'official' ? '官方内置' : tpl.author || '未知来源' }}
                </span>
                <ElButton v-if="hasAuth('system:appPackage:import')" size="small" type="primary" plain @click="openInstall(tpl)">
                  安装
                </ElButton>
              </div>
            </div>
          </ElCard>
        </div>
      </div>
    </ElCard>

    <ElDialog v-model="installVisible" :title="installTitle" class="w-860px">
      <ElSpace :size="16" class="w-full">
        <ElAlert type="info" :bordered="false">
          模板来自随系统发布的内置资源，安装会按当前环境重建表单、流程与菜单（不包含业务数据）。
          同编码应用/表单已存在时默认跳过，开启「覆盖已存在项」后按包内定义更新。
        </ElAlert>

        <div class="flex items-center gap-8px">
          <ElSwitch v-model="overwrite" size="small" />
          <span class="text-13px">覆盖已存在项</span>
          <span class="text-12px text-gray-400">
            已存在的表单会被包内定义替换并补列；目标环境有包内不存在的字段时该表单会被跳过（不会删列丢数据）
          </span>
        </div>

        <div v-if="dryRunReport">
          <div class="mb-8px text-13px">
            预检「{{ dryRunReport.appCode }}」：新建 {{ dryRunReport.items.filter(i => i.predicted === 'create').length }} ·
            覆盖 {{ dryRunReport.items.filter(i => i.predicted === 'update').length }} ·
            跳过 {{ dryRunReport.items.filter(i => i.predicted === 'skip').length }} ·
            冲突 {{ dryRunReport.items.filter(i => i.predicted === 'conflict').length }}
          </div>
          <ElAlert
            v-for="(warning, index) in dryRunReport.warnings"
            :key="index"
            type="warning"
            :bordered="false"
            class="mb-4px"
          >
            {{ warning }}
          </ElAlert>
          <DataTable
            :columns="dryRunColumns"
            :data="dryRunReport.items"
            size="small"
            :max-height="260"
            :pagination="false"
            :bordered="false"
          />
        </div>

        <div v-if="installResult">
          <div class="mb-8px text-13px">
            安装「{{ installResult.appCode }}」{{ actionLabels[installResult.appAction || ''] || installResult.appAction }} · 共
            {{ installResult.items.length }} 项
          </div>
          <DataTable
            :columns="resultColumns"
            :data="installResult.items"
            size="small"
            :max-height="320"
            :pagination="false"
            :bordered="false"
          />
        </div>
      </ElSpace>

      <template #footer>
        <ElSpace justify="end">
          <ElButton size="small" @click="installVisible = false">关闭</ElButton>
          <ElButton size="small" :loading="dryRunning" @click="handleDryRun">预检</ElButton>
          <ElButton
            v-if="!installResult"
            size="small"
            type="primary"
            :loading="installingTemplate"
            @click="handleInstall"
          >
            确认安装
          </ElButton>
        </ElSpace>
      </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.main-space {
  // 与其他 system 页面保持一致的外边距由布局层处理
}
</style>
