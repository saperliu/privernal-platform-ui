<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { ElTag } from 'element-plus';
import { importAppPackage } from '@/service';

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
const loading = ref(false);
const result = ref<AppPackageNamespace.ImportResult | null>(null);

const typeLabels: Record<string, string> = {
  app: '应用',
  form: '表单',
  flow: '流程',
  flowForm: '节点权限',
  dataset: '数据集',
  report: '图表',
  dashboard: '仪表盘'
};
const actionLabels: Record<string, string> = { created: '新建', updated: '更新', skipped: '跳过', failed: '失败' };

function actionTagType(action: string) {
  if (action === 'created') return 'success';
  if (action === 'updated') return 'info';
  if (action === 'failed') return 'danger';
  return 'warning';
}

const columns: DataTable.Column<AppPackageNamespace.ImportItem>[] = [
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

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files && input.files.length > 0 ? input.files[0] : null;
  result.value = null;
}

function handleImport() {
  if (!selectedFile.value) {
    window.$message?.error('请先选择应用包文件');
    return;
  }
  loading.value = true;
  importAppPackage(selectedFile.value, overwrite.value).then(res => {
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
  });
}

watch(modalVisible, show => {
  if (show) {
    selectedFile.value = null;
    result.value = null;
    overwrite.value = false;
  }
});
</script>

<template>
  <ElDialog v-model="modalVisible" title="导入应用包" class="w-860px">
    <ElSpace :size="16">
      <ElAlert type="info" :bordered="false">
        应用包只包含元数据（表单定义、列表配置、流程定义、节点字段与按钮权限、报表数据集/图表/仪表盘），不含业务数据。
        导入会按当前环境重新生成主键、菜单、按钮权限与物理表；报表数据集的列快照会在目标环境重新解析，
        目标表缺少包内引用的字段时该资产记为失败并给出原因，不会静默丢图。
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

      <div v-if="result">
        <div class="mb-8px text-13px">
          应用「{{ result.appCode }}」{{ actionLabels[result.appAction || ''] || result.appAction }} · 共
          {{ result.items.length }} 项
        </div>
        <DataTable
          :columns="columns"
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
        <ElButton size="small" type="primary" :loading="loading" @click="handleImport">开始导入</ElButton>
      </ElSpace>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss"></style>
