<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ElButton as __forwarded_ElButton,
  ElCard as __forwarded_ElCard,
  ElEmpty as __forwarded_ElEmpty,
  ElForm as __forwarded_ElForm,
  ElFormItem as __forwarded_ElFormItem,
  ElInput as __forwarded_ElInput,
  ElOption as __forwarded_ElOption,
  ElSelect as __forwarded_ElSelect,
  ElTag as __forwarded_ElTag
} from 'element-plus';

/**
 * 复合唯一约束组配置（D14/C2 的 5.9 收尾）：多字段组合判重——活跃行同组合只允许一条，
 * 软删行不占位。配置写 metaData 根节点 compositeUnique:[{name, fields:[字段编码]}]，
 * 随表单保存/存草稿持久化（设计器保存会整体重建 metaData，宿主在保存链回注本面板的值）。
 * 生效口径：新建表随建表落 uni_key 生成列由数据库判重；存量表新增组由写入路径的
 * 应用层兜底即时判重（CompositeUniqueGuard，与生成列同口径 key）。
 * 组内成员 2–7 个（与后端建表/判重校验一致），成员须为本表输入字段（子表字段在独立物理表，不参与）。
 */
export interface CompositeUniqueGroupConfig {
  name: string;
  fields: string[];
}

const props = defineProps<{
  fieldOptions: Array<{ label: string; value: string; type?: string }>;
  groups: CompositeUniqueGroupConfig[];
}>();

const emit = defineEmits<{ (e: 'update:groups', value: CompositeUniqueGroupConfig[]): void }>();

/** 编辑中的组下标（-1=收起，-2=新增，>=0 编辑既有组） */
const editingIndex = ref(-1);
const draftName = ref('');
const draftFields = ref<string[]>([]);
const nameTouched = ref(false);

const hasFields = computed(() => props.fieldOptions.length > 0);

/** 组名归一（与后端建表列名口径同构）：驼峰转下划线 + 非法字符替换为下划线 */
function normalizeGroupName(raw: string): string {
  return raw
    .replace(/([A-Z])/g, (_m, c: string) => `_${c.toLowerCase()}`)
    .replace(/[^0-9a-z_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

const draftNormalizedName = computed(() => normalizeGroupName(draftName.value.trim()));

const nameError = computed(() => {
  if (!nameTouched.value) return '';
  if (!draftName.value.trim()) return '请填写组名';
  if (!draftNormalizedName.value) return '组名需包含字母或数字';
  const conflict = props.groups.some(
    (group, index) =>
      index !== editingIndex.value && normalizeGroupName(group.name) === draftNormalizedName.value
  );
  return conflict ? '组名与既有组重复（归一后同名）' : '';
});

const fieldsError = computed(() => {
  if (draftFields.value.length < 2) return '至少选择 2 个成员字段';
  if (draftFields.value.length > 7) return '成员字段最多 7 个';
  return '';
});

function fieldLabel(code: string): string {
  const option = props.fieldOptions.find(item => item.value === code);
  return option ? option.label : code;
}

function openCreate() {
  editingIndex.value = -2;
  draftName.value = '';
  draftFields.value = [];
  nameTouched.value = false;
}

function openEdit(index: number) {
  editingIndex.value = index;
  draftName.value = props.groups[index].name;
  draftFields.value = [...props.groups[index].fields];
  nameTouched.value = false;
}

function cancelEdit() {
  editingIndex.value = -1;
}

function saveDraft() {
  nameTouched.value = true;
  if (nameError.value || fieldsError.value) {
    window.$message?.error(nameError.value || fieldsError.value);
    return;
  }
  const next = [...props.groups];
  const config: CompositeUniqueGroupConfig = {
    name: draftNormalizedName.value || draftName.value.trim(),
    fields: [...draftFields.value]
  };
  if (editingIndex.value >= 0) {
    next[editingIndex.value] = config;
  } else {
    next.push(config);
  }
  emit('update:groups', next);
  editingIndex.value = -1;
}

function removeGroup(index: number) {
  const next = props.groups.filter((_item, i) => i !== index);
  emit('update:groups', next);
  if (editingIndex.value === index) {
    editingIndex.value = -1;
  }
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElCard = __forwarded_ElCard;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElEmpty = __forwarded_ElEmpty;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElForm = __forwarded_ElForm;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElFormItem = __forwarded_ElFormItem;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInput = __forwarded_ElInput;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElOption = __forwarded_ElOption;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTag = __forwarded_ElTag;
</script>

<template>
  <div class="cu-panel">
    <ElCard shadow="never" class="cu-tip-card">
      <div class="cu-tip">
        复合唯一约束：所选字段<strong>组合值</strong>在活跃数据中不允许重复（单字段重复请用字段属性里的「不允许重复」）。
        组内 2–7 个成员；配置随表单保存/存草稿写入 metaData，保存表单后生效——新建表落数据库唯一索引，存量表由应用层判重即时兜底。
      </div>
    </ElCard>

    <ElEmpty v-if="!hasFields" description="请先在设计器画布添加输入字段，再配置复合唯一组" />

    <template v-else>
      <div v-for="(group, index) in groups" :key="group.name" class="cu-group">
        <div class="cu-group-head">
          <ElTag type="primary" effect="plain">{{ group.name }}</ElTag>
          <div class="cu-group-members">
            <ElTag v-for="field in group.fields" :key="field" type="info" effect="plain" size="small">
              {{ fieldLabel(field) }}
            </ElTag>
          </div>
          <div class="cu-group-actions">
            <ElButton size="small" text type="primary" @click="openEdit(index)">编辑</ElButton>
            <ElButton size="small" text type="danger" @click="removeGroup(index)">删除</ElButton>
          </div>
        </div>
        <div v-if="editingIndex === index" class="cu-editor">
          <ElForm label-width="96px" size="small">
            <ElFormItem label="组名" :error="nameError" required>
              <ElInput v-model="draftName" placeholder="字母/数字/下划线，保存时归一为数据库列名口径" @blur="nameTouched = true" />
            </ElFormItem>
            <ElFormItem label="成员字段" :error="fieldsError" required>
              <ElSelect v-model="draftFields" multiple filterable placeholder="选择 2–7 个本表字段">
                <ElOption v-for="option in fieldOptions" :key="option.value" :label="option.label" :value="option.value" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label=" ">
              <ElButton size="small" type="primary" @click="saveDraft">确定</ElButton>
              <ElButton size="small" @click="cancelEdit">取消</ElButton>
            </ElFormItem>
          </ElForm>
        </div>
      </div>

      <div v-if="editingIndex === -2" class="cu-editor cu-editor-new">
        <ElForm label-width="96px" size="small">
          <ElFormItem label="组名" :error="nameError" required>
            <ElInput v-model="draftName" placeholder="字母/数字/下划线，保存时归一为数据库列名口径" @blur="nameTouched = true" />
          </ElFormItem>
          <ElFormItem label="成员字段" :error="fieldsError" required>
            <ElSelect v-model="draftFields" multiple filterable placeholder="选择 2–7 个本表字段">
              <ElOption v-for="option in fieldOptions" :key="option.value" :label="option.label" :value="option.value" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label=" ">
            <ElButton size="small" type="primary" @click="saveDraft">确定</ElButton>
            <ElButton size="small" @click="cancelEdit">取消</ElButton>
          </ElFormItem>
        </ElForm>
      </div>

      <ElButton v-else class="cu-add" size="small" plain type="primary" @click="openCreate">新增约束组</ElButton>

      <div v-if="groups.length" class="cu-persist-hint">组配置将在点击「保存表单」或「存草稿」后写入表单元数据</div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.cu-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cu-tip-card {
  --el-card-padding: 10px 14px;
}

.cu-tip {
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.7;
}

.cu-group {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px 12px;
}

.cu-group-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cu-group-members {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.cu-group-actions {
  flex-shrink: 0;
}

.cu-editor {
  margin-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
  padding-top: 10px;
}

.cu-editor-new {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  margin-top: 0;
  padding: 10px 12px;
}

.cu-add {
  align-self: flex-start;
}

.cu-persist-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
