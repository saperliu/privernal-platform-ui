<script setup lang="ts">
/**
 * 过滤条件构造器（M4.7）：可视化 AND/OR 嵌套树。
 *
 * 与后端 ComputeFilterTree 同构：`{op:'and'|'or', when:[叶子|子树]}`，叶子 `{field, op, value}`。
 * 深度上限必须两边一致（8 层）——前端允许加到第 9 层、后端报错，用户要填完一整棵树才发现保存失败。
 *
 * 值控件按列类型给：数值用数字框、日期用日期选择器、其余用文本框。
 * 统一用文本框的话，`2026/1/5` 这种输入会原样进后端比较，而日期列存的是 `2026-01-05`，
 * 条件永远不成立且没有任何提示。
 */
import { computed } from 'vue';

type FilterNode = ReportChartNamespace.FilterNode;
type FilterLeaf = ReportChartNamespace.FilterLeaf;
type FilterGroup = ReportChartNamespace.FilterGroup;

defineOptions({ name: 'DatavFilterTree' });

const props = withDefaults(
  defineProps<{
    node: FilterNode;
    columns: Array<{ fieldCode: string; fieldName?: string; dataType?: string }>;
    depth?: number;
    /** 顶层不允许再套一层组：树本身已经是一个 and/or，多套一层只会让读法变绕 */
    allowGroup?: boolean;
  }>(),
  { depth: 1, allowGroup: true }
);

const emit = defineEmits<{ (e: 'update:node', value: FilterNode): void; (e: 'remove'): void }>();

/** 与后端 ComputeFilterTree.MAX_DEPTH 同值 */
const MAX_DEPTH = 8;

type LeafOp = ReportChartNamespace.FilterLeaf['op'];

/** 与后端 ComputeSpecs.FILTER_OPS 同集合；标成字面量联合类型，否则 ElSelect 的 string 回写不合法 */
const OPS: Array<{ label: string; value: LeafOp }> = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'ne' },
  { label: '包含', value: 'like' },
  { label: '大于', value: 'gt' },
  { label: '大于等于', value: 'ge' },
  { label: '小于', value: 'lt' },
  { label: '小于等于', value: 'le' }
];

const isGroup = (value: FilterNode): value is FilterGroup =>
  Boolean(value) &&
  (value as FilterGroup).op !== undefined &&
  ((value as FilterGroup).op === 'and' || (value as FilterGroup).op === 'or');

const group = computed(() => (isGroup(props.node) ? (props.node as FilterGroup) : null));

const columnOptions = computed(() =>
  props.columns.map(column => ({ label: column.fieldName || column.fieldCode, value: column.fieldCode }))
);

function typeOf(field: string): string {
  return props.columns.find(column => column.fieldCode === field)?.dataType || 'text';
}

function patchGroup(next: FilterGroup) {
  emit('update:node', next);
}

function patchChild(index: number, child: FilterNode) {
  if (!group.value) return;
  const when = [...group.value.when];
  when[index] = child;
  patchGroup({ ...group.value, when });
}

function removeChild(index: number) {
  if (!group.value) return;
  const when = group.value.when.filter((_, i) => i !== index);
  if (!when.length) {
    emit('remove');
    return;
  }
  patchGroup({ ...group.value, when });
}

function addLeaf() {
  if (!group.value) return;
  const first = props.columns[0];
  patchGroup({
    ...group.value,
    when: [...group.value.when, { field: first?.fieldCode || '', op: 'eq', value: '' }]
  });
}

function addSubGroup() {
  if (!group.value) return;
  patchGroup({
    ...group.value,
    when: [...group.value.when, { op: 'or', when: [{ field: props.columns[0]?.fieldCode || '', op: 'eq', value: '' }] }]
  });
}

function normalizeValue(field: string, raw: unknown): unknown {
  if (raw instanceof Date) {
    // 日期控件给 Date 对象，进树前统一成 ISO 日期串：后端按字符串比较，Date 会被序列化成带时区的长串
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${raw.getFullYear()}-${pad(raw.getMonth() + 1)}-${pad(raw.getDate())}`;
  }
  if (typeOf(field) === 'number' && typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? raw : parsed;
  }
  return raw;
}
</script>

<template>
  <div v-if="group" class="datav-filter-group">
    <div class="mb-6px flex items-center gap-6px">
      <ElSelect
        :model-value="group.op"
        size="small"
        class="w-88px"
        @update:model-value="v => patchGroup({ ...group!, op: v as 'and' | 'or' })"
      >
        <ElOption label="并且" value="and" />
        <ElOption label="或者" value="or" />
      </ElSelect>
      <span class="text-12px text-gray-400">{{ depth >= MAX_DEPTH ? '已达嵌套上限' : `第 ${depth} 层` }}</span>
      <ElButton size="small" text @click="addLeaf">+ 条件</ElButton>
      <ElButton v-if="allowGroup && depth < MAX_DEPTH" size="small" text @click="addSubGroup">+ 条件组</ElButton>
      <ElButton v-if="depth > 1" size="small" text type="danger" @click="emit('remove')">删组</ElButton>
    </div>

    <div class="border-l-2px border-[var(--datav-border)] pl-8px">
      <div v-for="(child, index) in group.when" :key="index" class="mb-6px">
        <div class="flex items-start gap-6px">
          <div class="min-w-0 flex-1">
            <DatavFilterTree
              :node="child"
              :columns="columns"
              :depth="depth + 1"
              @update:node="v => patchChild(index, v)"
              @remove="removeChild(index)"
            />
          </div>
          <ElButton size="small" text type="danger" @click="removeChild(index)">✕</ElButton>
        </div>
      </div>
      <div v-if="!group.when.length" class="text-12px text-gray-400">条件组为空时这一支不生效，请至少加一个条件</div>
    </div>
  </div>

  <div v-else class="flex items-center gap-6px">
    <ElSelect
      :model-value="(node as FilterLeaf).field"
      size="small"
      class="w-130px"
      filterable
      placeholder="字段"
      @update:model-value="v => emit('update:node', { ...(node as FilterLeaf), field: v as string, value: '' })"
    >
      <ElOption v-for="opt in columnOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
    </ElSelect>
    <ElSelect
      :model-value="(node as FilterLeaf).op"
      size="small"
      class="w-96px"
      @update:model-value="v => emit('update:node', { ...(node as FilterLeaf), op: v as LeafOp })"
    >
      <ElOption v-for="opt in OPS" :key="opt.value" :label="opt.label" :value="opt.value" />
    </ElSelect>
    <ElDatePicker
      v-if="typeOf((node as FilterLeaf).field) === 'date'"
      :model-value="String((node as FilterLeaf).value ?? '')"
      type="date"
      size="small"
      class="w-130px"
      value-format="YYYY-MM-DD"
      placeholder="日期"
      @update:model-value="v => emit('update:node', { ...(node as FilterLeaf), value: v })"
    />
    <ElInputNumber
      v-else-if="typeOf((node as FilterLeaf).field) === 'number'"
      :model-value="Number((node as FilterLeaf).value ?? 0)"
      size="small"
      class="w-130px"
      :controls="false"
      @update:model-value="v => emit('update:node', { ...(node as FilterLeaf), value: v })"
    />
    <ElInput
      v-else
      :model-value="String((node as FilterLeaf).value ?? '')"
      size="small"
      class="w-130px"
      placeholder="值"
      @update:model-value="
        v => emit('update:node', { ...(node as FilterLeaf), value: normalizeValue((node as FilterLeaf).field, v) })
      "
    />
  </div>
</template>

<style scoped>
.datav-filter-group {
  min-width: 0;
}
</style>
