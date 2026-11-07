<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElOption, ElSelect } from 'element-plus';
import { Delete, Plus, RefreshRight } from '@element-plus/icons-vue';
import { findSchemas, useDesignerContext } from 'phoenix-designer';
import { loadFormFields, loadRelationFormOptions } from '../shared/relation';
import ConditionEditor from '../condition-editor/condition-editor.vue';

/**
 * 关联配置面板（EP 适配，对齐 naiveUi 版 relation-config）。
 * 注册为 ERelationConfig，编辑组件的 props.relation：
 * - attr 模式：关联表单 + 显示字段
 * - backfill 模式：额外含数据范围（条件表达式）与数据填充规则（mappings）
 */
export interface Props {
  /** 编辑模式：attr 关联属性 / backfill 关联表单回填 */
  mode?: 'attr' | 'backfill';
  /** 关联配置对象（组件的 props.relation 值） */
  modelValue?: any;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'attr',
  modelValue: undefined
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();

const state = reactive<{
  dataUrl?: string;
  displayField?: string;
  formCode?: string;
  mappings?: Array<{ field: string; target: string }>;
  tableName?: string;
  filter?: any;
}>({});

/** 外部 → 内部同步（deep watch 防回环：内部修改时不重复往外 emit） */
let innerChanging = false;
watch(
  () => props.modelValue,
  value => {
    innerChanging = true;
    const relation = value ?? {};
    state.dataUrl = relation.dataUrl;
    state.displayField = relation.displayField;
    state.formCode = relation.formCode;
    state.mappings = relation.mappings?.map((item: any) => ({ ...item }));
    state.tableName = relation.tableName;
    state.filter = relation.filter ? { ...relation.filter } : undefined;
    setTimeout(() => {
      innerChanging = false;
    });
  },
  { immediate: true, deep: true }
);

function emitChange() {
  if (innerChanging) return;
  emit('update:modelValue', {
    ...state,
    mappings: state.mappings?.map(item => ({ ...item }))
  });
}

const formOptions = ref<Array<{ label: string; value: string }>>([]);
const fieldOptions = ref<Array<{ label: string; value: string }>>([]);
const formLoading = ref(false);
const fieldLoading = ref(false);
const formError = ref('');

async function queryFormOptions() {
  formLoading.value = true;
  formError.value = '';
  try {
    formOptions.value = await loadRelationFormOptions();
    if (!formOptions.value.length) {
      formError.value = '接口未返回表单数据';
    }
  } catch (error) {
    console.error('[phoenix]加载动态表单列表失败：', error);
    formOptions.value = [];
    formError.value = '表单列表接口不可用（检查后端与登录态）';
  } finally {
    formLoading.value = false;
  }
}

async function queryFormFields(formCode: string) {
  if (!formCode) {
    fieldOptions.value = [];
    return;
  }
  fieldLoading.value = true;
  try {
    fieldOptions.value = await loadFormFields(formCode);
  } catch (error) {
    console.error('[phoenix]加载表单字段失败：', error);
    fieldOptions.value = [];
  } finally {
    fieldLoading.value = false;
  }
}

/** 从下拉选择关联表单 */
function handleFormSelect(value: any) {
  state.formCode = value ?? undefined;
  state.displayField = undefined;
  state.mappings = [];
  state.filter = undefined;
  state.tableName = formOptions.value.find(item => item.value === state.formCode)?.label ?? state.formCode;
  emitChange();
  queryFormFields(state.formCode ?? '');
}

/** 表单列表不可用时手动填写表单编码 */
function handleFormInput(value: string) {
  state.formCode = value || undefined;
  state.displayField = undefined;
  state.mappings = [];
  state.filter = undefined;
  state.tableName = state.formCode;
  emitChange();
  queryFormFields(state.formCode ?? '');
}

function handleDisplayField(value: any) {
  state.displayField = value ?? undefined;
  emitChange();
}

function addMapping() {
  if (!state.mappings) {
    state.mappings = [];
  }
  state.mappings.push({ field: '', target: '' });
  emitChange();
}

function handleMappingField(index: number, value: any) {
  if (state.mappings?.[index]) {
    state.mappings[index].field = value ?? '';
    emitChange();
  }
}

function handleMappingTarget(index: number, value: any) {
  if (state.mappings?.[index]) {
    state.mappings[index].target = value ?? '';
    emitChange();
  }
}

function removeMapping(index: number) {
  state.mappings?.splice(index, 1);
  emitChange();
}

function handleFilterChange(value: any) {
  state.filter = value;
  emitChange();
}

/** 本画布表单的可输入字段（回填目标下拉） */
let targetFields = ref<Array<{ field: string; label: string }>>([]);
try {
  const designer = useDesignerContext();
  targetFields = computed(() => {
    const schemas = designer?.pageSchema?.schemas ?? [];
    // findSchemas 未传 once，返回的是命中数组；显式收窄以便拿到 ComponentSchema 类型
    const matched = findSchemas(schemas as any[], schema => Boolean(schema?.input && schema?.field));
    const list = Array.isArray(matched) ? matched : [];
    return list.map(schema => ({
      field: String(schema.field),
      label: String(schema.label ?? schema.field)
    }));
  });
} catch {
  targetFields = ref([]);
}

const targetOptions = computed(() =>
  targetFields.value.map(item => ({
    label: `${item.label}(${item.field})`,
    value: item.field
  }))
);

/** 关联表单显示名（优先取选择时记录的 tableName） */
const relationTableName = computed(() => {
  if (state.tableName) return state.tableName;
  return formOptions.value.find(item => item.value === state.formCode)?.label ?? state.formCode ?? '';
});

const filterGroups = computed(() => {
  const groups: Array<{
    label: string;
    relLabel?: string;
    fields: Array<{ field: string; label: string }>;
  }> = [];
  if (state.formCode && fieldOptions.value.length) {
    groups.push({
      label: `关联表单-${relationTableName.value}`,
      relLabel: relationTableName.value,
      fields: fieldOptions.value.map(item => ({
        field: item.value,
        label: item.label
      }))
    });
  }
  groups.push({ label: '当前表单', fields: targetFields.value });
  return groups;
});

const filterTips = [
  '请从左侧面板选择字段或选项，字段也可用英文名（数据字段）引用',
  '支持英文模式下运算符（+、-、*、/、>、<、==、!=、<=、>=）及函数（点右侧「插入函数」查看）',
  '参考场景：仅可选择关联表单中员工状态为未转正的数据，则可将数据范围设置为：关联表单.员工状态 == "未转正"'
];

watch(
  () => props.modelValue?.formCode,
  formCode => {
    queryFormFields(formCode ?? '');
  },
  { immediate: true }
);

queryFormOptions();
</script>

<template>
  <div class="phoenix-relation-config">
    <div class="phoenix-relation-item">
      <div class="phoenix-relation-label">关联表单</div>
      <ElSelect
        v-if="formOptions.length"
        :model-value="state.formCode ?? null"
        :loading="formLoading"
        clearable
        filterable
        placeholder="选择其它动态表单"
        size="small"
        @update:model-value="handleFormSelect"
      >
        <ElOption v-for="opt in formOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </ElSelect>
      <template v-else>
        <ElInput
          :model-value="state.formCode ?? ''"
          :loading="formLoading"
          placeholder="表单编码（接口不可用时手动填写）"
          size="small"
          @update:model-value="handleFormInput"
        />
        <div v-if="formError" class="phoenix-relation-error">
          {{ formError }}
          <ElButton link size="small" type="primary" @click="queryFormOptions">
            <ElIcon><RefreshRight /></ElIcon>
            重试
          </ElButton>
        </div>
      </template>
    </div>

    <div class="phoenix-relation-item">
      <div class="phoenix-relation-label">显示字段</div>
      <ElSelect
        v-if="fieldOptions.length"
        :model-value="state.displayField ?? null"
        :loading="fieldLoading"
        clearable
        filterable
        placeholder="选择显示的字段"
        size="small"
        @update:model-value="handleDisplayField"
      >
        <ElOption v-for="opt in fieldOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </ElSelect>
      <ElInput
        v-else
        :model-value="state.displayField ?? ''"
        :disabled="fieldLoading"
        placeholder="字段名（自定义数据源时直接填写）"
        size="small"
        @update:model-value="handleDisplayField"
      />
    </div>

    <div v-if="props.mode === 'backfill'" class="phoenix-relation-item">
      <div class="phoenix-relation-label">数据范围</div>
      <ConditionEditor
        :model-value="state.filter"
        title="数据范围"
        banner="仅可选择符合以下条件的数据"
        placeholder='请输入数据范围条件，或点击左侧字段插入，如：关联表单.员工状态 == "未转正"'
        :tips="filterTips"
        :groups="filterGroups"
        @update:model-value="handleFilterChange"
      />
    </div>

    <div v-if="props.mode === 'backfill'" class="phoenix-relation-item">
      <div class="phoenix-relation-label">数据填充规则</div>
      <div class="phoenix-relation-rules">
        <div v-for="(mapping, index) in state.mappings" :key="index" class="phoenix-relation-rule">
          <ElSelect
            :model-value="mapping.field || null"
            :loading="fieldLoading"
            clearable
            filterable
            placeholder="关联表单字段"
            size="small"
            @update:model-value="(value: any) => handleMappingField(index, value)"
          >
            <ElOption v-for="opt in fieldOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
          <span class="phoenix-relation-rule-text">的值填充到</span>
          <ElSelect
            :model-value="mapping.target || null"
            clearable
            filterable
            placeholder="本表单字段"
            size="small"
            @update:model-value="(value: any) => handleMappingTarget(index, value)"
          >
            <ElOption v-for="opt in targetOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
          <ElButton link size="small" type="danger" @click="removeMapping(index)">
            <ElIcon><Delete /></ElIcon>
          </ElButton>
        </div>
        <ElButton link size="small" type="primary" @click="addMapping">
          <ElIcon><Plus /></ElIcon>
          添加规则
        </ElButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.phoenix-relation-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.phoenix-relation-item {
  width: 100%;
}

.phoenix-relation-label {
  color: var(--el-text-color-regular, #606266);
  font-size: 12px;
  margin-bottom: 4px;
}

.phoenix-relation-rules {
  background: var(--el-fill-color-light, #f7f8fa);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  width: 100%;

  .phoenix-relation-rule .el-select {
    flex: 1;
    min-width: 0;
  }
}

.phoenix-relation-rule {
  align-items: center;
  display: flex;
  gap: 6px;
  width: 100%;
}

.phoenix-relation-rule-text {
  color: var(--el-text-color-regular, #606266);
  flex: 0 0 auto;
  font-size: 12px;
  white-space: nowrap;
}

.phoenix-relation-error {
  align-items: center;
  color: var(--el-color-danger, #e88080);
  display: flex;
  font-size: 12px;
  gap: 4px;
  margin-top: 4px;
}
</style>
