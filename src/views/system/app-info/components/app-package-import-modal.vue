<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { ElTag } from 'element-plus';
import { dryRunAppPackage, importAppPackage } from '@/service';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
}

defineOptions({ name: 'AppPackageImportModal' });

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();
const modalVisible = computed({
  get: () => props.visible,
  set: (visible: boolean) => emit('update:visible', visible)
});

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const overwrite = ref(false);
/** 显式豁免签名/校验和不符：只用于确认包来源可信的手工修包场景 */
const ignoreSignature = ref(false);
const loading = ref(false);
const dryRunning = ref(false);
const result = ref<AppPackageNamespace.ImportResult | null>(null);
const dryRunReport = ref<AppPackageNamespace.DryRunResult | null>(null);

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
const signatureLabels: Record<string, string> = {
  verified: '已验签',
  mismatch: '验签失败',
  notSigned: '未签名',
  keyMissing: '无法验签'
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

function signatureTagType(status?: string) {
  if (status === 'verified') return 'success';
  if (status === 'mismatch') return 'danger';
  return 'warning';
}

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

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files && input.files.length > 0 ? input.files[0] : null;
  result.value = null;
  dryRunReport.value = null;
}

function requireFile() {
  if (!selectedFile.value) {
    window.$message?.error('请先选择应用包文件');
    return false;
  }
  return true;
}

/** 预检：解析包并比对目标环境，不落库 */
function handleDryRun() {
  if (!requireFile()) return;
  dryRunning.value = true;
  dryRunAppPackage(selectedFile.value!, overwrite.value)
    .then(res => {
      dryRunning.value = false;
      if (res.error !== null || !res.data) {
        return;
      }
      dryRunReport.value = res.data;
      result.value = null;
      if (res.data.signatureStatus === 'mismatch') {
        window.$message?.error('签名校验失败：包内容在签名后被改动过，直接导入将被拒绝');
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

function handleImport() {
  if (!requireFile()) return;
  loading.value = true;
  importAppPackage(selectedFile.value!, overwrite.value, ignoreSignature.value)
    .then(res => {
      loading.value = false;
      if (res.error !== null || !res.data) {
        return;
      }
      result.value = res.data;
      const failed = res.data.items.filter(item => item.action === 'failed').length;
      if (failed > 0) {
        window.$message?.warning(`导入结束，${failed} 项失败，请查看明细`);
      } else {
        window.$message?.success('导入完成');
      }
      emit('success');
    })
    .catch(() => {
      loading.value = false;
    });
}

watch(modalVisible, show => {
  if (show) {
    selectedFile.value = null;
    result.value = null;
    dryRunReport.value = null;
    overwrite.value = false;
    ignoreSignature.value = false;
  }
});
</script>

<template>
  <ElDialog v-model="modalVisible" title="导入应用包" class="w-860px">
    <ElSpace :size="16">
      <ElAlert type="info" :bordered="false">
        应用包只包含元数据（表单定义、列表配置、流程定义、节点字段与按钮权限、报表/大屏/字典/角色绑定），不含业务数据。
        导入会按当前环境重新生成主键、菜单、按钮权限与物理表；字典只补缺失项、角色按编码匹配重挂授权。
        建议先「预检」查看将发生什么，再执行导入。
      </ElAlert>

      <div class="flex items-center gap-12px">
        <input
          ref="fileInputRef"
          type="file"
          accept="application/json,.json"
          class="hidden"
          @change="handleFileChange"
        />
        <ElButton size="small" tertiary @click="fileInputRef?.click()">选择应用包文件</ElButton>
        <span v-if="selectedFile" class="text-13px">{{ selectedFile.name }}</span>
        <span v-else class="text-13px text-gray-400">未选择文件</span>
      </div>

      <div class="flex items-center gap-8px">
        <ElSwitch v-model="overwrite" size="small" />
        <span class="text-13px">覆盖已存在项</span>
        <span class="text-12px text-gray-400">
          开启后已存在的表单会用包内定义替换表单设计并补列；若目标环境有包内不存在的字段，该表单会被跳过（不会删列丢数据）
        </span>
      </div>

      <div class="flex items-center gap-8px">
        <ElSwitch v-model="ignoreSignature" size="small" />
        <span class="text-13px">忽略签名校验</span>
        <span class="text-12px text-gray-400">
          仅在确认包来源可信时开启（如自行修改过包内容）；签名不符的包默认会被拒绝导入
        </span>
      </div>

      <div v-if="dryRunReport">
        <div class="mb-8px flex items-center gap-8px text-13px">
          <span>
            预检「{{ dryRunReport.appCode }}」：新建 {{ dryRunReport.items.filter(i => i.predicted === 'create').length }} ·
            覆盖 {{ dryRunReport.items.filter(i => i.predicted === 'update').length }} ·
            跳过 {{ dryRunReport.items.filter(i => i.predicted === 'skip').length }} ·
            冲突 {{ dryRunReport.items.filter(i => i.predicted === 'conflict').length }}
          </span>
          <ElTag size="small" :type="signatureTagType(dryRunReport.signatureStatus)">
            {{ signatureLabels[dryRunReport.signatureStatus || ''] || dryRunReport.signatureStatus }}
          </ElTag>
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

      <div v-if="result">
        <div class="mb-8px flex items-center gap-8px text-13px">
          <span>
            应用「{{ result.appCode }}」{{ actionLabels[result.appAction || ''] || result.appAction }} · 共
            {{ result.items.length }} 项
          </span>
          <ElTag v-if="result.signatureStatus" size="small" :type="signatureTagType(result.signatureStatus === '已验签' ? 'verified' : '')">
            {{ result.signatureStatus }}
          </ElTag>
        </div>
        <DataTable
          :columns="resultColumns"
          :data="result.items"
          size="small"
          :max-height="320"
          :pagination="false"
          :bordered="false"
        />
      </div>
    </ElSpace>

    <template #footer>
      <ElSpace justify="end">
        <ElButton size="small" @click="modalVisible = false">关闭</ElButton>
        <ElButton size="small" :loading="dryRunning" :disabled="!selectedFile" @click="handleDryRun">预检</ElButton>
        <ElButton size="small" type="primary" :loading="loading" :disabled="!selectedFile" @click="handleImport">
          开始导入
        </ElButton>
      </ElSpace>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss"></style>
