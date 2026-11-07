<script setup lang="ts">
/**
 * 自定义页面设计面板（设计器第 5 页签）
 *
 * 列表页/编辑页两组配置，每组：启用开关 + Monaco 在线写 Vue（受限 SFC 协议）
 * + 插入预置模板 + 字段代码辅助 + 编译校验 + 运行时预览。
 * 配置值经 v-model 上交宿主（designer-modal），随表单保存/草稿/发布链持久化到
 * metaData.customView。
 */
import { computed, nextTick, ref, watch } from 'vue';
import { compileCustomSfc } from '@/utils/custom-view/compile';
import { buildCustomViewPageApi, collectFieldLabels, normalizeCustomViewFields } from '@/utils/custom-view/page-api';
import { EDIT_PAGE_SAMPLE, LIST_PAGE_SAMPLE } from '@/utils/custom-view/samples';
import { collectFormComponents } from '@/components/business/field-translate';
import MonacoEditor from '@/components/monaco-editor/index.vue';
import CustomViewHost from '@/views/builder/components/custom-view-host.vue';

export interface CustomViewPageConfig {
  enabled: boolean;
  source: string;
}

export interface CustomViewConfig {
  list: CustomViewPageConfig;
  edit: CustomViewPageConfig;
}

const props = withDefaults(
  defineProps<{
    /** 当前表单 metaData：字段清单/翻译器数据源 */
    metaData?: Record<string, any>;
    tableCode?: string;
    tableName?: string;
    modelValue: CustomViewConfig;
  }>(),
  {
    metaData: () => ({}),
    tableCode: '',
    tableName: ''
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: CustomViewConfig): void }>();

defineOptions({ name: 'CustomViewPanel' });

type SubKey = 'list' | 'edit';
const activeSub = ref<SubKey>('list');
const monacoListRef = ref<InstanceType<typeof MonacoEditor>>();
const monacoEditRef = ref<InstanceType<typeof MonacoEditor>>();
const checkState = ref<'idle' | 'ok' | 'fail'>('idle');
const checkErrors = ref<string[]>([]);
const checking = ref(false);
const previewVisible = ref(false);

const current = computed<CustomViewPageConfig>(
  () => props.modelValue[activeSub.value] ?? { enabled: false, source: '' }
);
const monacoRef = computed(() => (activeSub.value === 'list' ? monacoListRef.value : monacoEditRef.value));

/** 字段清单（schemas 深遍历 + 顶层 label 映射，与运行时字段元数据同口径） */
const fieldList = computed(() => {
  const comps = collectFormComponents({ schemas: (props.metaData as any)?.schemas });
  const labels = collectFieldLabels(props.metaData);
  return comps.map(comp => ({
    field: String(comp.field ?? ''),
    label: labels.get(String(comp.field ?? '')) || String(comp.field ?? '')
  }));
});

function update(patch: Partial<CustomViewPageConfig>) {
  const nextSource = patch.source ?? current.value.source;
  // 值未变化不再上报：Monaco setValue 回流会形成 emit 环，靠这里截断
  if (patch.source !== undefined && nextSource === lastSynced.value[activeSub.value]) {
    return;
  }
  if (patch.source !== undefined) {
    lastSynced.value[activeSub.value] = nextSource;
  }
  emit('update:modelValue', {
    ...props.modelValue,
    [activeSub.value]: { ...current.value, ...patch }
  });
}

function switchSub(key: SubKey) {
  activeSub.value = key;
  checkState.value = 'idle';
  checkErrors.value = [];
  // Monaco 封装是"挂载时取值"语义（不监听 modelValue），切子页签时把已同步的值推给它
  nextTick(() => monacoRef.value?.setValue(props.modelValue[key]?.source ?? ''));
}

/**
 * Monaco 封装（@/components/monaco-editor）只在挂载时读取 modelValue，外部值变化需要
 * 主动 setValue（插入模板、载入草稿、表单重载等）。lastSynced 记录已推送/已上报的值，
 * 既避免 setValue 与 emit 打环，也避免把用户正在输入的内容回写覆盖。
 */
const lastSynced = ref<Record<SubKey, string>>({ list: '', edit: '' });

watch(
  () => props.modelValue,
  value => {
    (['list', 'edit'] as SubKey[]).forEach(key => {
      const source = value[key]?.source ?? '';
      if (source === lastSynced.value[key]) return;
      lastSynced.value[key] = source;
      if (key === activeSub.value) {
        monacoRef.value?.setValue(source);
      }
    });
  },
  { deep: true }
);

/** 插入预置模板：已有代码时确认覆盖 */
function insertSample() {
  const sample = activeSub.value === 'list' ? LIST_PAGE_SAMPLE : EDIT_PAGE_SAMPLE;
  const overwrite = () => {
    update({ source: sample });
    nextTick(() => monacoRef.value?.setValue(sample));
  };
  if (current.value.source?.trim()) {
    window.$dialog?.warning({
      title: '插入预置模板',
      content: '当前编辑器已有代码，插入预置模板会覆盖全部内容，是否继续？',
      positiveText: '覆盖插入',
      negativeText: '取消',
      onPositiveClick: overwrite
    });
    return;
  }
  overwrite();
}

/** 字段代码辅助：按页面类型插入取值代码（编辑页 model['xxx']，列表页 row['xxx']） */
function insertField(code: string) {
  const snippet = activeSub.value === 'list' ? `row['${code}']` : `model['${code}']`;
  monacoRef.value?.insertText(snippet);
}

/** 编译校验：与运行时同一编译器，错误就地展示 */
async function checkCompile() {
  checking.value = true;
  checkState.value = 'idle';
  try {
    const result = await compileCustomSfc(current.value.source ?? '');
    if (result.errors.length || !result.component) {
      checkState.value = 'fail';
      checkErrors.value = result.errors;
    } else {
      checkState.value = 'ok';
      checkErrors.value = [];
    }
  } finally {
    checking.value = false;
  }
}

/** 预览：编译通过后打开抽屉，用运行时同款宿主渲染（列表页预览会真实查询当前表数据） */
async function openPreview() {
  await checkCompile();
  if (checkState.value !== 'ok') return;
  previewVisible.value = true;
}

/** 预览用 pageApi：动作回调为空操作，数据接口真实可用（便于对照真实数据调试样式） */
const previewPageApi = computed(() =>
  buildCustomViewPageApi({
    tableCode: props.tableCode || 'preview',
    formName: props.tableName,
    metaData: props.metaData
  })
);

/** 预览上下文：列配置未加载，用字段清单模拟 showList/showQuery 全开的列 */
const previewContext = computed(() => {
  const fields = normalizeCustomViewFields(props.metaData);
  if (activeSub.value === 'list') {
    return {
      tableCode: props.tableCode,
      formName: props.tableName,
      fields,
      columns: fields.map(f => ({ filedCode: f.code, filedName: f.label, showList: 1, showQuery: 1 })),
      perm: previewPageApi.value.perm,
      pageApi: previewPageApi.value
    };
  }
  return {
    tableCode: props.tableCode,
    formName: props.tableName,
    mode: 'add',
    fields,
    data: {},
    pageApi: previewPageApi.value
  };
});

const previewSource = computed(() => current.value.source ?? '');
</script>

<template>
  <div class="custom-view-panel">
    <ElAlert
      class="mb-12px"
      type="info"
      :closable="false"
      title="在线编写 Vue 页面替代默认渲染：编辑页与列表页可分别启用。协议为受限单文件组件（template + script setup + style scoped），vue API 免导入，业务数据一律走 props.pageApi（动态绑定本表单的数据库表）。"
    />

    <ElTabs :model-value="activeSub" @tab-change="(key: any) => switchSub(key as 'list' | 'edit')">
      <ElTabPane label="列表页" name="list" />
      <ElTabPane label="编辑页" name="edit" />
    </ElTabs>

    <div class="mb-8px flex flex-wrap items-center gap-12px">
      <ElSwitch :model-value="current.enabled" @update:model-value="v => update({ enabled: Boolean(v) })" />
      <span class="text-13px">
        启用自定义{{ activeSub === 'list' ? '列表' : '编辑' }}页
        <span class="opacity-60">（关闭即恢复默认渲染）</span>
      </span>
      <span class="flex-1"></span>
      <ElDropdown @command="(cmd: any) => insertField(String(cmd))">
        <ElButton size="small">插入字段</ElButton>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem v-for="f in fieldList" :key="f.field" :command="f.field">
              {{ f.label }}（{{ f.field }}）
            </ElDropdownItem>
            <ElDropdownItem v-if="!fieldList.length" disabled>请先在表单设计中添加字段</ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
      <ElButton size="small" @click="insertSample">插入预置模板</ElButton>
      <ElButton size="small" type="primary" :loading="checking" @click="checkCompile">编译校验</ElButton>
      <ElButton size="small" :disabled="checkState !== 'ok'" @click="openPreview">预览</ElButton>
    </div>

    <ElAlert v-if="checkState === 'fail'" class="mb-8px" type="error" :closable="false">
      <ul class="m-0 list-disc pl-16px">
        <li v-for="(err, index) in checkErrors" :key="index">{{ err }}</li>
      </ul>
    </ElAlert>
    <ElAlert
      v-else-if="checkState === 'ok'"
      class="mb-8px"
      type="success"
      :closable="false"
      title="编译通过，可点击「预览」查看实际效果"
    />

    <div class="custom-view-editor">
      <MonacoEditor
        v-show="activeSub === 'list'"
        ref="monacoListRef"
        :model-value="modelValue.list.source"
        language="html"
        @update:model-value="v => activeSub === 'list' && update({ source: v ?? '' })"
      />
      <MonacoEditor
        v-show="activeSub === 'edit'"
        ref="monacoEditRef"
        :model-value="modelValue.edit.source"
        language="html"
        @update:model-value="v => activeSub === 'edit' && update({ source: v ?? '' })"
      />
    </div>

    <ElDrawer v-model="previewVisible" title="自定义页面预览" size="70%" destroy-on-close>
      <CustomViewHost :source="previewSource" :context="previewContext" />
    </ElDrawer>
  </div>
</template>

<style lang="scss" scoped>
.custom-view-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.custom-view-editor {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;

  // Monaco 封装默认 min-height: calc(100vh - 120px)，在面板内收敛为容器高度
  :deep(.phoenix-code-editor) {
    min-height: 0;
  }
}
</style>
