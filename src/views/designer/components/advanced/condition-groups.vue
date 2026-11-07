<script setup lang="ts">
/* eslint-disable vue/no-mutating-props -- 本组件是父级持有的条件组模型的就地编辑器（与面板内直接编辑 draft.actions 同一模式） */
import { computed } from 'vue';
import {
  ElButton as __forwarded_ElButton,
  ElInput as __forwarded_ElInput,
  ElRadioButton as __forwarded_ElRadioButton,
  ElRadioGroup as __forwarded_ElRadioGroup,
  ElSelect as __forwarded_ElSelect
} from 'element-plus';

/**
 * 联动条件组编辑器（两层组合：组内 AND/OR + 组间 AND/OR）。
 * 保存时由 linkage-panel 把模型映射为嵌套条件树 {op, children:[{op, children:[叶子]}]}，
 * 后端 ConditionEvaluator/SafeConditionSql 天然支持该结构。
 */
const props = defineProps<{
  model: AdvancedNamespace.ConditionModel;
  fieldOptions: Array<{ label: string; value: string }>;
  valuePlaceholder?: string;
}>();

const CMP_OPTIONS = [
  { label: '等于', value: 'EQ' },
  { label: '不等于', value: 'NE' },
  { label: '大于', value: 'GT' },
  { label: '大于等于', value: 'GTE' },
  { label: '小于', value: 'LT' },
  { label: '小于等于', value: 'LTE' },
  { label: '属于', value: 'IN' },
  { label: '包含', value: 'CONTAINS' },
  { label: '前缀是', value: 'STARTS_WITH' },
  { label: '为空', value: 'IS_EMPTY' },
  { label: '不为空', value: 'NOT_EMPTY' }
];

const NO_VALUE_CMPS = ['IS_EMPTY', 'NOT_EMPTY'];

function needsValue(cmp: string) {
  return !NO_VALUE_CMPS.includes(cmp);
}

function addGroup() {
  props.model.groups.push({ logic: 'AND', rows: [] });
}

function fieldLabel(code: string) {
  return props.fieldOptions.find(option => option.value === code)?.label ?? code;
}

function cmpLabel(code: string) {
  return CMP_OPTIONS.find(option => option.value === code)?.label ?? code;
}

/** 人读逻辑预览：((字段 等于 值 且 …) 或 (…))，帮助确认组合语义 */
const logicPreview = computed(() => {
  const parts = props.model.groups
    .map(group => {
      const rows = group.rows.filter(row => row.field && row.cmp);
      if (!rows.length) return null;
      const inner = rows
        .map(row => {
          const valueText = needsValue(row.cmp) ? ` ${row.value || '…'}` : '';
          return `${fieldLabel(row.field)} ${cmpLabel(row.cmp)}${valueText}`;
        })
        .join(group.logic === 'AND' ? ' 且 ' : ' 或 ');
      return `(${inner})`;
    })
    .filter(Boolean) as string[];
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0];
  return parts.join(props.model.groupLogic === 'AND' ? ' 且 ' : ' 或 ');
});

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInput = __forwarded_ElInput;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElRadioButton = __forwarded_ElRadioButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElRadioGroup = __forwarded_ElRadioGroup;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;
</script>

<template>
  <div class="cond-groups">
    <div v-if="model.groups.length > 1" class="groups-logic">
      <span class="logic-label">条件组之间</span>
      <ElRadioGroup v-model="model.groupLogic" size="small">
        <ElRadioButton value="AND">全部满足（且）</ElRadioButton>
        <ElRadioButton value="OR">任一满足（或）</ElRadioButton>
      </ElRadioGroup>
    </div>

    <div v-for="(group, groupIndex) in model.groups" :key="groupIndex" class="cond-group">
      <div class="group-head">
        <span class="group-title">条件组 {{ groupIndex + 1 }}</span>
        <ElRadioGroup v-model="group.logic" size="small">
          <ElRadioButton value="AND">组内全部满足</ElRadioButton>
          <ElRadioButton value="OR">组内任一满足</ElRadioButton>
        </ElRadioGroup>
        <ElButton
          v-if="model.groups.length > 1"
          size="small"
          quaternary
          type="danger"
          @click="model.groups.splice(groupIndex, 1)"
        >
          删除组
        </ElButton>
      </div>
      <div v-for="(row, rowIndex) in group.rows" :key="rowIndex" class="condition-row">
        <span class="row-logic" :class="{ 'is-or': group.logic === 'OR' }">
          {{ group.logic === 'AND' ? '且' : '或' }}
        </span>
        <ElSelect v-model="row.field" placeholder="字段" class="cond-field">
          <ElOption v-for="opt in fieldOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
        <ElSelect v-model="row.cmp" placeholder="比较" class="cond-cmp">
          <ElOption v-for="opt in CMP_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
        <ElInput
          v-if="needsValue(row.cmp)"
          v-model="row.value"
          :placeholder="valuePlaceholder ?? '值'"
          class="cond-value"
        />
        <ElInput v-else v-model="row.value" disabled placeholder="无需填写" class="cond-value" />
        <ElButton size="small" quaternary type="danger" @click="group.rows.splice(rowIndex, 1)">删</ElButton>
      </div>
      <ElButton size="small" dashed @click="group.rows.push({ field: '', cmp: 'EQ', value: '' })">+ 组内条件</ElButton>
    </div>

    <ElButton size="small" dashed @click="addGroup">+ 添加条件组</ElButton>
    <div v-if="logicPreview" class="logic-preview">逻辑预览：{{ logicPreview }}</div>
    <div v-else class="logic-preview empty">未配置条件 = 恒触发</div>
  </div>
</template>

<style lang="scss" scoped>
.cond-groups {
  width: 100%;
}

.groups-logic {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.logic-label {
  font-size: 12px;
  color: #666;
}

.cond-group {
  padding: 8px 10px;
  margin-bottom: 8px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  background: #fafafa;
}

.group-head {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}

.group-title {
  font-size: 12px;
  font-weight: 600;
  color: #555;
}

.condition-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
}

.row-logic {
  width: 14px;
  font-size: 12px;
  color: #4c8bda;
  text-align: center;

  &.is-or {
    color: #d9932f;
  }
}

.cond-field {
  width: 170px;
}

.cond-cmp {
  width: 110px;
}

.cond-value {
  flex: 1;
}

.logic-preview {
  padding: 6px 10px;
  margin-top: 6px;
  font-size: 12px;
  color: #555;
  word-break: break-all;
  background: #f2f3f5;
  border-radius: 4px;

  &.empty {
    color: #999;
  }
}
</style>
