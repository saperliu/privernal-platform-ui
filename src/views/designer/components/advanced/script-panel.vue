<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  ElButton as __forwarded_ElButton,
  ElCard as __forwarded_ElCard,
  ElDialog as __forwarded_ElDialog,
  ElForm as __forwarded_ElForm,
  ElFormItem as __forwarded_ElFormItem,
  ElInput as __forwarded_ElInput,
  ElInputNumber as __forwarded_ElInputNumber,
  ElPopconfirm as __forwarded_ElPopconfirm,
  ElSelect as __forwarded_ElSelect,
  ElSwitch as __forwarded_ElSwitch,
  ElTabPane as __forwarded_ElTabPane,
  ElTabs as __forwarded_ElTabs,
  ElTag as __forwarded_ElTag
} from 'element-plus';
import {
  changeScriptAssetStatus,
  createScriptAsset,
  deleteScriptAsset,
  deleteScriptBinding,
  fetchScriptAssetExecLogs,
  fetchScriptAssetPage,
  fetchScriptAssetReferences,
  fetchScriptAssetVersions,
  fetchScriptBindings,
  publishScriptAsset,
  runScriptAsset,
  saveScriptBindings,
  updateScriptAsset
} from '@/service/api/dynamic/script';
import MonacoEditor from '@/components/monaco-editor/index.vue';

const props = defineProps<{
  form: { formId: string; tableCode: string; fieldOptions: Array<{ label: string; value: string }> };
}>();
// ==================== 脚本资产（组织级） ====================
const assets = ref<ScriptNamespace.ScriptAsset[]>([]);
const assetLoading = ref(false);
const editorVisible = ref(false);
const saving = ref(false);
const editing = ref<ScriptNamespace.ScriptAsset>(blankAsset());
const trialVisible = ref(false);
const trialParams = ref('{}');
const trialResult = ref('');
const trialPassed = ref<boolean | null>(null);
const trialTarget = ref<ScriptNamespace.ScriptAsset | null>(null);
const detailVisible = ref(false);
const detailTab = ref<'refs' | 'versions' | 'logs'>('refs');
const detailTarget = ref<ScriptNamespace.ScriptAsset | null>(null);
const detailRows = ref<any[]>([]);

function blankAsset(): ScriptNamespace.ScriptAsset {
  return {
    scriptCode: '',
    scriptName: '',
    category: 'VALIDATION',
    body: '// 只用白名单包：java.util/java.time/java.math/java.text/cn.hutool/com.alibaba.fastjson2\n// 禁 Math.max / Integer.parseInt / String.format（java.lang 静态调用会被沙箱拒绝），用 hutool 等价工具\nreturn true',
    resultType: 'BOOLEAN',
    timeoutSeconds: 10
  };
}

async function loadAssets() {
  assetLoading.value = true;
  try {
    const { data, error } = await fetchScriptAssetPage({ pageNum: 1, pageSize: 100 });
    if (!error && data) {
      assets.value = (data as any)?.records ?? [];
    }
  } finally {
    assetLoading.value = false;
  }
}

function openCreate() {
  editing.value = blankAsset();
  editorVisible.value = true;
}

function openEdit(row: ScriptNamespace.ScriptAsset) {
  editing.value = { ...row };
  editorVisible.value = true;
}

async function saveAsset() {
  saving.value = true;
  try {
    const isCreate = !editing.value.id;
    const payload = { ...editing.value, language: 'GROOVY' as const };
    const { error } = isCreate ? await createScriptAsset(payload) : await updateScriptAsset(payload);
    if (!error) {
      window.$message?.success(
        isCreate ? '已创建（草稿 v1，试运行成功后才能发布）' : '已保存（已发布资产改正文/签名会自动递增版本回草稿）'
      );
      editorVisible.value = false;
      await loadAssets();
    }
  } finally {
    saving.value = false;
  }
}

/** 参数类型 → 试运行骨架里的默认值（未列出的类型按空串） */
const SCHEMA_TYPE_DEFAULTS: Record<string, string | number | boolean> = { NUMBER: 0, BOOLEAN: false };

function openTrial(row: ScriptNamespace.ScriptAsset) {
  trialTarget.value = row;
  // 按参数契约生成骨架
  const schema = parseSchema(row.paramsSchema);
  const skeleton: Record<string, any> = {};
  for (const def of schema) {
    skeleton[def.name] = SCHEMA_TYPE_DEFAULTS[def.type] ?? '';
  }
  trialParams.value = JSON.stringify(skeleton, null, 2);
  trialResult.value = '';
  trialPassed.value = null;
  trialVisible.value = true;
}

async function runTrial() {
  if (!trialTarget.value?.id) return;
  let params: Record<string, any> = {};
  try {
    params = JSON.parse(trialParams.value || '{}');
  } catch {
    window.$message?.error('参数不是合法 JSON');
    return;
  }
  const { data, error } = await runScriptAsset(trialTarget.value.id, params);
  if (!error && data) {
    trialResult.value = typeof data.result === 'object' ? JSON.stringify(data.result, null, 2) : String(data.result);
    trialPassed.value = data.trialPassed === true;
    if (trialPassed.value) {
      window.$message?.success('试运行成功，该版本已可发布');
    }
  }
}

async function publish(row: ScriptNamespace.ScriptAsset) {
  const { error } = await publishScriptAsset(row.id!);
  if (!error) {
    window.$message?.success('已发布');
    await loadAssets();
  }
}

async function toggleStatus(row: ScriptNamespace.ScriptAsset) {
  const target = row.status === 'PUBLISHED' ? 'DISABLED' : 'PUBLISHED';
  const { error } = await changeScriptAssetStatus(row.id!, target);
  if (!error) {
    window.$message?.success(target === 'DISABLED' ? '已停用' : '已重新启用');
    await loadAssets();
  }
}

async function removeAsset(row: ScriptNamespace.ScriptAsset) {
  const { error } = await deleteScriptAsset(row.id!);
  if (!error) {
    window.$message?.success('已删除');
    await loadAssets();
  }
}

async function openDetail(row: ScriptNamespace.ScriptAsset, tab: 'refs' | 'versions' | 'logs') {
  detailTarget.value = row;
  detailTab.value = tab;
  detailVisible.value = true;
  detailRows.value = [];
  if (tab === 'refs') {
    const { data } = await fetchScriptAssetReferences(row.id!);
    detailRows.value = data ?? [];
  } else if (tab === 'versions') {
    const { data } = await fetchScriptAssetVersions(row.id!);
    detailRows.value = (data as any) ?? [];
  } else {
    const { data } = await fetchScriptAssetExecLogs(row.id!);
    detailRows.value = (data as any) ?? [];
  }
}

function parseSchema(schema: ScriptNamespace.ScriptAsset['paramsSchema']): ScriptNamespace.ScriptParamDef[] {
  if (!schema) return [];
  if (Array.isArray(schema)) return schema;
  try {
    return JSON.parse(schema) ?? [];
  } catch {
    return [];
  }
}

function schemaText(row: ScriptNamespace.ScriptAsset): string {
  const schema = row.paramsSchema;
  if (!schema) return '无参数';
  const arr = parseSchema(schema);
  return arr.length ? arr.map(p => `${p.name}:${p.type}${p.required ? '*' : ''}`).join('，') : '无参数';
}

// ==================== 本表单挂点绑定（SAVE_VALIDATE 主路径） ====================
const bindings = ref<ScriptNamespace.ScriptBinding[]>([]);
const publishedAssets = computed(() => assets.value.filter(a => a.status === 'PUBLISHED'));

async function loadBindings() {
  const { data, error } = await fetchScriptBindings(props.form.formId);
  if (!error && data) {
    bindings.value = data;
  }
}

function addBinding() {
  const first = publishedAssets.value[0];
  if (!first) {
    window.$message?.warning('请先创建并发布一个脚本资产');
    return;
  }
  bindings.value.push({
    assetId: first.id!,
    bindPoint: 'SAVE_VALIDATE',
    paramMapping: buildMappingSkeleton(first),
    failMessage: '',
    executionOrder: bindings.value.length + 1,
    enabled: 'Y',
    assetCode: first.scriptCode,
    assetName: first.scriptName,
    paramsSchema: first.paramsSchema,
    resultType: first.resultType
  });
}

function onBindingAssetChange(row: ScriptNamespace.ScriptBinding, assetId: string) {
  const asset = publishedAssets.value.find(a => a.id === assetId);
  if (!asset) return;
  row.assetId = assetId;
  row.assetCode = asset.scriptCode;
  row.assetName = asset.scriptName;
  row.paramsSchema = asset.paramsSchema;
  row.resultType = asset.resultType;
  row.paramMapping = buildMappingSkeleton(asset);
}

function buildMappingSkeleton(asset: ScriptNamespace.ScriptAsset): string {
  const mapping: Record<string, string> = {};
  for (const def of parseSchema(asset.paramsSchema)) {
    // 默认映射到同名字段（若有），否则留常量空串由用户填
    const hasField = props.form.fieldOptions.some(f => f.value === def.name);
    mapping[def.name] = hasField ? def.name : '';
  }
  return JSON.stringify(mapping);
}

async function persistBindings() {
  const payload = bindings.value.map(b => ({
    assetId: b.assetId,
    bindPoint: b.bindPoint,
    paramMapping: b.paramMapping,
    failMessage: b.failMessage || null,
    executionOrder: b.executionOrder,
    enabled: b.enabled
  }));
  const { error } = await saveScriptBindings(props.form.formId, props.form.tableCode, payload as any);
  if (!error) {
    window.$message?.success('绑定已保存（独立表存储，设计器再保存不会冲掉）');
    await loadBindings();
  }
}

async function removeBinding(index: number) {
  const row = bindings.value[index];
  if (row.id) {
    const { error } = await deleteScriptBinding(row.id);
    if (error) return;
  }
  bindings.value.splice(index, 1);
}

function mappingPlaceholder(schema: ScriptNamespace.ScriptAsset['paramsSchema']): string {
  const defs = parseSchema(schema);
  return defs.length ? defs.map(p => `${p.name}=字段编码 / {{currentUser}} / {{now}} / 常量`).join('\n') : '无参数';
}

onMounted(async () => {
  await loadAssets();
  await loadBindings();
});

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElCard = __forwarded_ElCard;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElForm = __forwarded_ElForm;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElFormItem = __forwarded_ElFormItem;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInput = __forwarded_ElInput;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInputNumber = __forwarded_ElInputNumber;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDialog = __forwarded_ElDialog;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElPopconfirm = __forwarded_ElPopconfirm;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSwitch = __forwarded_ElSwitch;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTabPane = __forwarded_ElTabPane;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTabs = __forwarded_ElTabs;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTag = __forwarded_ElTag;
</script>

<template>
  <div class="script-panel">
    <ElCard title="本表单挂点绑定（保存校验：在数据落库前按顺序执行，失败中止保存）" size="small" class="panel-card">
      <div v-if="!bindings.length" class="empty-hint">还没有绑定：先在下方创建并发布脚本资产，再添加绑定</div>
      <div v-for="(row, index) in bindings" :key="index" class="binding-row">
        <div class="binding-line">
          <ElSelect
            :model-value="row.assetId"
            filterable
            placeholder="选择已发布资产"
            class="sel-asset"
            @change="(v: string) => onBindingAssetChange(row, v)"
          >
            <ElOption
              v-for="a in publishedAssets"
              :key="a.id"
              :label="`${a.scriptName}(${a.scriptCode})`"
              :value="a.id!"
            />
          </ElSelect>
          <ElTag size="small" :type="row.resultType === 'BOOLEAN' ? 'success' : 'info'">
            {{ row.resultType === 'BOOLEAN' ? '返回 false 拦截' : row.resultType }}
          </ElTag>
          <ElInput v-model="row.failMessage" placeholder="失败提示（可空）" class="inp-msg" />
          <ElInputNumber v-model="row.executionOrder" :min="1" size="small" class="inp-order" />
          <ElSwitch v-model="row.enabled" active-value="Y" inactive-value="N" size="small" />
          <ElButton size="small" quaternary type="danger" @click="removeBinding(index)">移除</ElButton>
        </div>
        <div class="mapping-line">
          <span class="mapping-label">参数映射</span>
          <ElInput
            v-model="row.paramMapping"
            type="textarea"
            :rows="2"
            :placeholder="mappingPlaceholder(row.paramsSchema)"
            class="inp-mapping"
          />
        </div>
      </div>
      <div class="binding-ops">
        <ElButton size="small" dashed @click="addBinding">添加绑定</ElButton>
        <ElButton size="small" type="primary" :loading="assetLoading" @click="persistBindings">保存绑定</ElButton>
        <span class="hint">绑定独立存储，设计器再保存本表单不会被冲掉</span>
      </div>
    </ElCard>

    <ElCard title="脚本资产（组织级，写一次多表单复用）" size="small" class="panel-card">
      <div class="asset-ops">
        <ElButton size="small" type="primary" @click="openCreate">新建资产</ElButton>
        <span class="hint">沙箱白名单内编写；试运行成功后才能发布</span>
      </div>
      <div v-for="row in assets" :key="row.id" class="asset-row">
        <ElTag
          size="small"
          :type="row.status === 'PUBLISHED' ? 'success' : row.status === 'DISABLED' ? 'danger' : 'warning'"
        >
          {{ row.status }} v{{ row.version }}
        </ElTag>
        <span class="code">{{ row.scriptCode }}</span>
        <span class="name">{{ row.scriptName }}</span>
        <span class="schema">{{ schemaText(row) }}</span>
        <div class="row-ops">
          <ElButton size="small" @click="openTrial(row)">试运行</ElButton>
          <ElButton v-if="row.status === 'DRAFT'" size="small" type="primary" @click="publish(row)">发布</ElButton>
          <ElButton v-if="row.status !== 'DRAFT'" size="small" @click="toggleStatus(row)">
            {{ row.status === 'PUBLISHED' ? '停用' : '启用' }}
          </ElButton>
          <ElButton size="small" quaternary @click="openEdit(row)">编辑</ElButton>
          <ElButton size="small" quaternary @click="openDetail(row, 'refs')">引用</ElButton>
          <ElButton size="small" quaternary @click="openDetail(row, 'logs')">日志</ElButton>
          <ElPopconfirm
            title="被绑定引用时会被拒绝，确认删除？"
            confirm-button-text="确认"
            cancel-button-text="取消"
            @confirm="removeAsset(row)"
          >
            <template #reference>
              <ElButton size="small" text type="danger">删除</ElButton>
            </template>
          </ElPopconfirm>
        </div>
      </div>
    </ElCard>

    <ElDialog v-model="editorVisible" title="脚本资产编辑器" style="width: 860px">
      <ElForm label-position="left" label-width="110">
        <ElFormItem label="资产编码">
          <ElInput
            v-model="editing.scriptCode"
            :disabled="!!editing.id"
            placeholder="小写蛇形，如 room_conflict_check"
          />
        </ElFormItem>
        <ElFormItem label="资产名称">
          <ElInput v-model="editing.scriptName" />
        </ElFormItem>
        <ElFormItem label="类别 / 结果">
          <ElSelect v-model="editing.category" class="half">
            <ElOption
              v-for="opt in [
                { label: '校验 VALIDATION', value: 'VALIDATION' },
                { label: '计算 CALC', value: 'CALC' },
                { label: '回填 AUTOFILL', value: 'AUTOFILL' },
                { label: '数据操作 DATA_OP', value: 'DATA_OP' }
              ]"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
          <ElSelect v-model="editing.resultType" class="half">
            <ElOption
              v-for="opt in [
                { label: 'BOOLEAN（校验：false 拦截）', value: 'BOOLEAN' },
                { label: 'OBJECT', value: 'OBJECT' },
                { label: 'NONE', value: 'NONE' }
              ]"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="参数契约">
          <ElInput
            :model-value="
              typeof editing.paramsSchema === 'string'
                ? editing.paramsSchema
                : JSON.stringify(editing.paramsSchema ?? [])
            "
            type="textarea"
            :rows="3"
            placeholder='[{"name":"startTime","type":"STRING","required":true}]'
            @update:model-value="(v: string) => (editing.paramsSchema = v)"
          />
        </ElFormItem>
        <ElFormItem label="Groovy 正文">
          <div class="editor-wrap">
            <MonacoEditor
              v-model:model-value="editing.body"
              language="java"
              :config="{ minimap: { enabled: false } }"
            />
          </div>
        </ElFormItem>
        <ElFormItem label=" ">
          <ElButton type="primary" :loading="saving" @click="saveAsset">保存</ElButton>
        </ElFormItem>
      </ElForm>
    </ElDialog>

    <ElDialog v-model="trialVisible" :title="`试运行：${trialTarget?.scriptCode ?? ''}`" style="width: 680px">
      <ElFormItem label="参数 JSON" label-position="top">
        <ElInput v-model="trialParams" type="textarea" :rows="6" />
      </ElFormItem>
      <ElButton type="primary" @click="runTrial">实跑</ElButton>
      <div v-if="trialPassed !== null" class="trial-result">
        <ElTag size="small" :type="trialPassed ? 'success' : 'warning'">
          {{ trialPassed ? '试运行成功（该版本已可发布）' : '试运行完成' }}
        </ElTag>
        <pre class="trial-pre">{{ trialResult || '(无返回值)' }}</pre>
      </div>
    </ElDialog>

    <ElDialog v-model="detailVisible" :title="`资产详情：${detailTarget?.scriptCode ?? ''}`" style="width: 720px">
      <ElTabs v-model="detailTab">
        <ElTabPane name="refs" label="引用影响面">
          <div v-for="r in detailRows" :key="r.id" class="detail-row">
            {{ r.tableCode || r.formId }} · {{ r.bindPoint }} · 顺序 {{ r.executionOrder }}
          </div>
          <div v-if="!detailRows.length" class="empty-hint">无引用（可安全删除/改签名）</div>
        </ElTabPane>
        <ElTabPane name="versions" label="版本历史">
          <div v-for="r in detailRows" :key="r.id" class="detail-row">
            v{{ r.version }} · {{ r.logType }} · {{ r.createdTime }}
          </div>
          <div v-if="!detailRows.length" class="empty-hint">暂无发布记录</div>
        </ElTabPane>
        <ElTabPane name="logs" label="执行日志">
          <div v-for="r in detailRows" :key="r.id" class="detail-row">
            <ElTag size="small" :type="r.success === 'Y' ? 'success' : 'danger'">
              {{ r.bindPoint }} {{ r.success === 'Y' ? '成功' : '失败' }}
            </ElTag>
            {{ r.errorMessage || r.resultSummary || '' }} · {{ r.elapsedMs }}ms · {{ r.createdTime }}
          </div>
          <div v-if="!detailRows.length" class="empty-hint">暂无执行记录</div>
        </ElTabPane>
      </ElTabs>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.script-panel {
  .panel-card {
    margin-bottom: 12px;
  }

  .empty-hint {
    padding: 12px;
    color: #999;
  }

  .hint {
    margin-left: 12px;
    font-size: 12px;
    color: #999;
  }

  .binding-row {
    padding: 8px 0;
    border-bottom: 1px dashed #eee;
  }

  .binding-line {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .sel-asset {
    width: 280px;
  }

  .inp-msg {
    flex: 1;
  }

  .inp-order {
    width: 90px;
  }

  .mapping-line {
    display: flex;
    gap: 8px;
    margin-top: 6px;
    align-items: flex-start;
  }

  .mapping-label {
    font-size: 12px;
    color: #888;
    line-height: 32px;
  }

  .inp-mapping {
    flex: 1;
  }

  .binding-ops {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    align-items: center;
  }

  .asset-ops {
    display: flex;
    margin-bottom: 8px;
    align-items: center;
  }

  .asset-row {
    display: flex;
    gap: 10px;
    padding: 8px 4px;
    font-size: 13px;
    border-bottom: 1px dashed #eee;
    align-items: center;
  }

  .code {
    font-family: monospace;
    color: #555;
  }

  .name {
    font-weight: 500;
  }

  .schema {
    flex: 1;
    overflow: hidden;
    font-size: 12px;
    color: #999;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row-ops {
    display: flex;
    gap: 4px;
  }

  .half {
    flex: 1;
  }

  .editor-wrap {
    width: 100%;
    height: 320px;
    border: 1px solid #eee;
    border-radius: 6px;

    // MonacoEditor 根节点自带 min-height: calc(100vh - 120px)（为整页场景设计），
    // 弹窗内必须压掉，否则编辑区撑到视口高、溢出对话框
    :deep(.phoenix-code-editor) {
      min-height: 0;
      height: 100%;
    }
  }

  .trial-result {
    margin-top: 12px;
  }

  .trial-pre {
    padding: 10px;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
    background: #f7f7f7;
    border-radius: 6px;
  }

  .detail-row {
    padding: 6px 0;
    font-size: 13px;
    border-bottom: 1px dashed #eee;
  }
}
</style>
