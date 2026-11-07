<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, reactive, ref } from 'vue';
import type { FormInstance } from 'element-plus';
import {
  ElCard,
  ElForm,
  ElTag,
  ElButton as __forwarded_ElButton,
  ElDialog as __forwarded_ElDialog,
  ElFormItem as __forwarded_ElFormItem,
  ElInput as __forwarded_ElInput,
  ElSelect as __forwarded_ElSelect,
  ElSpace as __forwarded_ElSpace
} from 'element-plus';
import {
  copyFlowFormVersion,
  delFlowFormVersion,
  findDynamicFormList,
  findFlowDefinitionList,
  findFlowFormVersionList,
  initFlowFormVersion,
  migrateFlowFormVersionFromLegacy,
  publishFlowFormVersion,
  rollbackFlowFormVersion
} from '@/service';
import { useLoading } from '@/hooks';
import VersionFormDrawer from './components/version-form-drawer.vue';
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElFormItem = __forwarded_ElFormItem;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInput = __forwarded_ElInput;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDialog = __forwarded_ElDialog;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;

/**
 * 流程表单配置（版本管理）：
 * 1. 一个流程定义（flow_code）绑定一个动态表单（table_code），表单提交数据后自动发起流程；
 * 2. 配置按版本管理：草稿可编辑，发布后生效（currentFlag=Y），支持复制新草稿与回滚；
 * 3. 字段/按钮权限按节点结构化配置，运行时由 /back/flow/form/runtime/field-permission 返回给表单渲染器（契约不变）。
 */

const { loading, startLoading, endLoading } = useLoading(false);
const allVersions = ref<FlowNamespace.FormVersion[]>([]);

/** 本地筛选（后端列表为全量返回） */
const filter = reactive({
  flowName: '',
  tableCode: '',
  publishStatus: null as number | null
});

const filteredData = computed(() =>
  allVersions.value.filter(item => {
    if (filter.flowName && !(item.flowName || '').includes(filter.flowName)) return false;
    if (filter.tableCode && !(item.tableCode || '').includes(filter.tableCode)) return false;
    if (filter.publishStatus !== null && item.publishStatus !== filter.publishStatus) return false;
    return true;
  })
);

async function getTableData() {
  startLoading();
  const { data } = await findFlowFormVersionList({});
  allVersions.value = (data || []).slice().sort((a, b) => {
    if (a.flowCode !== b.flowCode) return a.flowCode.localeCompare(b.flowCode);
    return (b.version || 0) - (a.version || 0);
  });
  endLoading();
}

const publishStatusOptions: CommonType.Option<number>[] = [
  { label: '全部', value: null as unknown as number },
  { label: '草稿', value: 0 },
  { label: '已发布', value: 1 }
];

function renderStatusTag(row: FlowNamespace.FormVersion) {
  return row.publishStatus === 1 ? (
    <ElTag size="small" type="success">
      已发布
    </ElTag>
  ) : (
    <ElTag size="small" type="warning">
      草稿
    </ElTag>
  );
}

const columns: Ref<DataTable.Column<FlowNamespace.FormVersion>[]> = ref([
  { key: 'flowName', title: '流程名称', width: 160, align: 'left', ellipsis: { tooltip: true } },
  { key: 'flowCode', title: '流程编码', width: 140, align: 'left', ellipsis: { tooltip: true } },
  { key: 'formName', title: '表单名称', width: 140, align: 'left', ellipsis: { tooltip: true } },
  { key: 'tableCode', title: '表单编码', width: 140, align: 'left', ellipsis: { tooltip: true } },
  { key: 'version', title: '版本', width: 70, align: 'center', render: row => `v${row.version ?? '-'}` },
  { key: 'publishStatus', title: '状态', width: 90, align: 'center', render: renderStatusTag },
  {
    key: 'currentFlag',
    title: '当前生效',
    width: 90,
    align: 'center',
    render: row =>
      row.currentFlag === 'Y' ? (
        <ElTag size="small" type="info">
          生效中
        </ElTag>
      ) : (
        <span>-</span>
      )
  },
  { key: 'publishTime', title: '发布时间', width: 170, align: 'center' },
  { key: 'publishBy', title: '发布人', width: 110, align: 'center' },
  { key: 'remark', title: '备注', align: 'left', ellipsis: { tooltip: true } },
  {
    key: 'action',
    title: '操作',
    width: 260,
    align: 'center',
    render: row => (
      <ElSpace class="justify-center" size="small">
        <ElButton size="small" type="primary" onClick={() => openDrawer(row)}>
          {row.publishStatus === 0 ? '配置' : '查看'}
        </ElButton>
        <ElButton size="small" onClick={() => handleCopy(row)}>
          复制新草稿
        </ElButton>
        {row.publishStatus === 0 && (
          <ElButton size="small" type="success" onClick={() => handlePublish(row)}>
            发布
          </ElButton>
        )}
        {row.publishStatus === 1 && row.currentFlag !== 'Y' && (
          <ElButton size="small" type="warning" onClick={() => handleRollback(row)}>
            回滚
          </ElButton>
        )}
        {(row.publishStatus === 0 || row.currentFlag !== 'Y') && (
          <ElButton size="small" type="danger" onClick={() => handleDelete(row)}>
            删除
          </ElButton>
        )}
      </ElSpace>
    )
  }
]);

/** 版本明细抽屉 */
const showDrawer = ref(false);
const drawerVersionId = ref<string | null>(null);

function openDrawer(row: FlowNamespace.FormVersion) {
  drawerVersionId.value = row.id;
  showDrawer.value = true;
}

function handleCopy(row: FlowNamespace.FormVersion) {
  window.$dialog?.info({
    title: '复制确认',
    content: `将「${row.flowName}」v${row.version} 复制为新的草稿版本吗？`,
    positiveText: '复制',
    negativeText: '取消',
    onPositiveClick: async () => {
      await copyFlowFormVersion(row.id);
      window.$message?.success('已复制为新草稿');
      getTableData();
    }
  });
}

function handlePublish(row: FlowNamespace.FormVersion) {
  window.$dialog?.warning({
    title: '发布确认',
    content: `发布「${row.flowName}」v${row.version} 后将立即对运行中的表单生效，确定发布吗？`,
    positiveText: '发布',
    negativeText: '取消',
    onPositiveClick: async () => {
      await publishFlowFormVersion(row.id);
      window.$message?.success('发布成功');
      getTableData();
    }
  });
}

function handleRollback(row: FlowNamespace.FormVersion) {
  window.$dialog?.warning({
    title: '回滚确认',
    content: `将「${row.flowName}」的生效版本回滚到 v${row.version} 吗？`,
    positiveText: '回滚',
    negativeText: '取消',
    onPositiveClick: async () => {
      await rollbackFlowFormVersion(row.id);
      window.$message?.success('回滚成功');
      getTableData();
    }
  });
}

function handleDelete(row: FlowNamespace.FormVersion) {
  window.$dialog?.error({
    title: '删除确认',
    content: `确定删除「${row.flowName}」v${row.version} 及其全部权限配置吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await delFlowFormVersion(row.id);
      window.$message?.success('删除成功');
      getTableData();
    }
  });
}

/** 新增配置：选择已发布流程定义 + 动态表单，初始化 v1 草稿 */
const showCreateModal = ref(false);
const createFormRef = ref<FormInstance | null>(null);
const createForm = reactive({ flowCode: '', flowName: '', tableCode: '', formName: '' });
const createRules = {
  flowCode: { required: true, message: '请选择流程定义', trigger: 'change' },
  tableCode: { required: true, message: '请选择动态表单', trigger: 'change' }
};

const definitionOptions = ref<Array<{ label: string; value: string }>>([]);
const dynamicFormOptions = ref<Array<{ label: string; value: string }>>([]);

async function openCreateModal() {
  createForm.flowCode = '';
  createForm.flowName = '';
  createForm.tableCode = '';
  createForm.formName = '';
  showCreateModal.value = true;
  const dynamicQuery = { pageNum: 1, pageSize: 200 } as unknown as DynamicFormNamespace.DynamicFormQuery;
  const [defResult, formResult] = await Promise.all([
    findFlowDefinitionList({ pageNum: 1, pageSize: 200, isPublish: 1, keywords: [] }),
    findDynamicFormList(dynamicQuery)
  ]);
  definitionOptions.value = (defResult.data?.list || []).map(item => ({
    label: `${item.flowName}（${item.flowCode}）`,
    value: item.flowCode
  }));
  dynamicFormOptions.value = (formResult.data?.list || [])
    .filter(item => item.tableCode)
    .map(item => ({
      label: `${item.tableName || item.title || item.tableCode}（${item.tableCode}）`,
      value: item.tableCode as string
    }));
}

function onDefinitionSelected(flowCode: string) {
  const option = definitionOptions.value.find(item => item.value === flowCode);
  createForm.flowName = option ? option.label.split('（')[0] : '';
}

function onDynamicFormSelected(tableCode: string) {
  const option = dynamicFormOptions.value.find(item => item.value === tableCode);
  createForm.formName = option ? option.label.split('（')[0] : '';
}

async function submitCreate() {
  await createFormRef.value?.validate();
  await initFlowFormVersion(createForm.flowCode, createForm.tableCode);
  window.$message?.success('草稿已创建（字段权限已按动态表单字段初始化），可点击"配置"编辑后发布');
  showCreateModal.value = false;
  getTableData();
}

/** 旧配置数据迁移 */
function handleMigrate() {
  window.$dialog?.warning({
    title: '迁移确认',
    content:
      '将旧绑定/节点配置（flow_form_bind、flow_form_node_config）迁移为发布版 v1，已迁移过的流程会自动跳过，确定执行吗？',
    positiveText: '迁移',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { data } = await migrateFlowFormVersionFromLegacy();
      window.$message?.success(`迁移完成，共迁移 ${data ?? 0} 个流程配置`);
      getTableData();
    }
  });
}

getTableData();
</script>

<template>
  <div class="h-full overflow-hidden">
    <ElCard title="流程表单配置" class="h-full flex-col" content-class="flex-1 overflow-hidden">
      <template #header-extra>
        <ElSpace>
          <ElButton secondary @click="handleMigrate">从旧配置迁移</ElButton>
          <ElButton type="primary" @click="openCreateModal">新增配置</ElButton>
        </ElSpace>
      </template>
      <ElSpace class="h-full" :size="12">
        <ElSpace :size="12" align="center">
          <ElInput v-model="filter.flowName" placeholder="流程名称" clearable class="w-180px" />
          <ElInput v-model="filter.tableCode" placeholder="表单编码" clearable class="w-180px" />
          <ElSelect v-model="filter.publishStatus" class="w-120px">
            <ElOption v-for="opt in publishStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
          <ElButton secondary @click="getTableData">刷新</ElButton>
        </ElSpace>
        <DataTable
          :columns="columns"
          :data="filteredData"
          :loading="loading"
          :row-key="(row: FlowNamespace.FormVersion) => row.id"
          flex-height
          class="flex-1"
        />
      </ElSpace>
    </ElCard>

    <ElDialog v-model="showCreateModal" title="新增表单配置" class="w-520px">
      <ElForm ref="createFormRef" :model="createForm" :rules="createRules" label-position="left" label-width="100">
        <ElFormItem label="流程定义" path="flowCode">
          <ElSelect
            v-model="createForm.flowCode"
            filterable
            placeholder="选择已发布的流程定义"
            @change="onDefinitionSelected"
          >
            <ElOption v-for="opt in definitionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="动态表单" path="tableCode">
          <ElSelect
            v-model="createForm.tableCode"
            filterable
            placeholder="选择动态表单（字段全集将自动初始化）"
            @update:value="onDynamicFormSelected"
          >
            <ElOption v-for="opt in dynamicFormOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElSpace justify="end">
          <ElButton @click="showCreateModal = false">取消</ElButton>
          <ElButton type="primary" @click="submitCreate">创建草稿</ElButton>
        </ElSpace>
      </template>
    </ElDialog>

    <VersionFormDrawer v-model:show="showDrawer" :version-id="drawerVersionId" @saved="getTableData()" />
  </div>
</template>
