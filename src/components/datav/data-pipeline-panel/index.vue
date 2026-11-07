<script setup lang="ts">
import { computed } from 'vue';
import {
  ElButton as __forwarded_ElButton,
  ElIcon as __forwarded_ElIcon,
  ElInput as __forwarded_ElInput,
  ElInputNumber as __forwarded_ElInputNumber,
  ElOption as __forwarded_ElOption,
  ElSelect as __forwarded_ElSelect
} from 'element-plus';
import { Delete as __forwarded_Delete } from '@element-plus/icons-vue';
import { useDatavStore } from '@/store';
import { FILTER_OPS, opNeedsValue, rowFieldOptions } from '@/utils/datav-data';

/**
 * 数据加工管线（前端行级：过滤 → 排序 → Top N）。
 *
 * 与绑定面板里「过滤条件 / 聚合后过滤 / TopN」（后端 SQL 侧）互补：
 * - 静态数据没有 SQL 可走，只有这里能筛；
 * - 数据集结果取回后的二次加工（再排序、再截断）也在这里，编辑器所见即投放所得。
 */
defineOptions({ name: 'DatavDataPipelinePanel' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const store = useDatavStore();

const pipeline = computed<DatavNamespace.DataPipeline>(() => props.widget.data?.pipeline ?? {});

const filters = computed<DatavNamespace.DataFilter[]>(() => pipeline.value.filters ?? []);
const sorters = computed<DatavNamespace.DataSorter[]>(() => pipeline.value.sorters ?? []);

/** 字段下拉的键来源：取数结果的行键并集（静态行或预览缓存），数据集还并上后端别名 */
const fieldOptions = computed<string[]>(() => {
  const keys: string[] = [];
  const seen = new Set<string>();
  const push = (key: string) => {
    if (key && !seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  };
  const cached = store.designPreview[props.widget.id];
  if (cached) {
    (cached.dimensionAliases ?? []).forEach(push);
    (cached.measureAliases ?? []).forEach(push);
    rowFieldOptions(cached.rows ?? []).forEach(push);
  } else if (props.widget.data?.mode === 'static') {
    rowFieldOptions(props.widget.data.staticRows ?? []).forEach(push);
  }
  return keys;
});

const fieldLabel = (key: string) => `${key}${cachedLabels()[key] ? `（${cachedLabels()[key]}）` : ''}`;

/** 别名 → 中文列名（数据集预览缓存里带着），有就缀在键后方便认列 */
function cachedLabels(): Record<string, string> {
  const cached = store.designPreview[props.widget.id];
  const out: Record<string, string> = {};
  const aliases = cached?.dimensionAliases ?? [];
  const labels = cached?.dimensionLabels ?? [];
  aliases.forEach((alias, index) => {
    if (labels[index]) out[alias] = labels[index];
  });
  return out;
}

function persist(next: DatavNamespace.DataPipeline) {
  // 空管线不存键，schema 里不留垃圾对象
  const clean: DatavNamespace.DataPipeline = {};
  if (next.filters?.length) clean.filters = next.filters;
  if (next.sorters?.length) clean.sorters = next.sorters;
  if (next.limit && next.limit > 0) clean.limit = next.limit;
  store.updateWidgetData(props.widget.id, { pipeline: Object.keys(clean).length ? clean : undefined });
}

function patchFilter(index: number, patch: Partial<DatavNamespace.DataFilter>) {
  const next = filters.value.map((item, i) => (i === index ? { ...item, ...patch } : item));
  persist({ ...pipeline.value, filters: next });
}

function addFilter() {
  const field = fieldOptions.value[0] ?? '';
  persist({
    ...pipeline.value,
    filters: [...filters.value, { field, op: 'eq', value: '' }]
  });
}

function removeFilter(index: number) {
  persist({ ...pipeline.value, filters: filters.value.filter((_, i) => i !== index) });
}

function patchSorter(index: number, patch: Partial<DatavNamespace.DataSorter>) {
  const next = sorters.value.map((item, i) => (i === index ? { ...item, ...patch } : item));
  persist({ ...pipeline.value, sorters: next });
}

function addSorter() {
  const field = fieldOptions.value[0] ?? '';
  persist({
    ...pipeline.value,
    sorters: [...sorters.value, { field, order: 'desc' }]
  });
}

function removeSorter(index: number) {
  persist({ ...pipeline.value, sorters: sorters.value.filter((_, i) => i !== index) });
}

function setLimit(value: number | null | undefined) {
  persist({ ...pipeline.value, limit: typeof value === 'number' && value > 0 ? Math.floor(value) : 0 });
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
const ElIcon = __forwarded_ElIcon;
const ElInput = __forwarded_ElInput;
const ElInputNumber = __forwarded_ElInputNumber;
const ElOption = __forwarded_ElOption;
const ElSelect = __forwarded_ElSelect;
const Delete = __forwarded_Delete;
</script>

<template>
  <div class="datav-pipeline flex flex-col gap-8px">
    <div class="text-12px font-600" title="对取数结果在前端再加工：过滤 → 排序 → Top N；静态数据与数据集结果同等生效">
      数据加工（前端）
    </div>
    <div v-if="!fieldOptions.length" class="text-12px opacity-60">
      暂无可用字段：数据集模式先在上方「预览取数」，静态模式确认示例数据有内容
    </div>

    <template v-if="fieldOptions.length">
      <!-- 行过滤：AND 组合，比较类数值优先、字符串兜底 -->
      <div class="flex items-center justify-between">
        <span class="text-11px opacity-60">过滤条件（同时满足）</span>
        <ElButton size="small" text @click="addFilter">+ 条件</ElButton>
      </div>
      <div v-for="(item, index) in filters" :key="`flt-${index}`" class="flex items-center gap-4px">
        <ElSelect
          :model-value="item.field"
          size="small"
          filterable
          class="min-w-0 flex-1"
          @change="(v: string) => patchFilter(index, { field: v })"
        >
          <ElOption v-for="key in fieldOptions" :key="key" :label="fieldLabel(key)" :value="key" />
        </ElSelect>
        <ElSelect
          :model-value="item.op"
          size="small"
          class="w-96px flex-shrink-0"
          @change="(v: DatavNamespace.DataFilter['op']) => patchFilter(index, { op: v })"
        >
          <ElOption v-for="op in FILTER_OPS" :key="op.value" :label="op.label" :value="op.value" />
        </ElSelect>
        <ElInput
          v-if="opNeedsValue(item.op)"
          :model-value="item.value"
          size="small"
          class="w-88px flex-shrink-0"
          placeholder="值"
          @update:model-value="(v: string) => patchFilter(index, { value: v })"
        />
        <ElButton size="small" text type="danger" class="flex-shrink-0" @click="removeFilter(index)">
          <ElIcon :size="12"><Delete /></ElIcon>
        </ElButton>
      </div>
      <div v-if="!filters.length" class="text-11px opacity-50">未设置（保留全部行）</div>

      <!-- 排序：多级，数值列按数比 -->
      <div class="mt-4px flex items-center justify-between">
        <span class="text-11px opacity-60">排序</span>
        <ElButton size="small" text @click="addSorter">+ 排序</ElButton>
      </div>
      <div v-for="(item, index) in sorters" :key="`srt-${index}`" class="flex items-center gap-4px">
        <ElSelect
          :model-value="item.field"
          size="small"
          filterable
          class="min-w-0 flex-1"
          @change="(v: string) => patchSorter(index, { field: v })"
        >
          <ElOption v-for="key in fieldOptions" :key="key" :label="fieldLabel(key)" :value="key" />
        </ElSelect>
        <ElSelect
          :model-value="item.order"
          size="small"
          class="w-72px flex-shrink-0"
          @change="(v: DatavNamespace.DataSorter['order']) => patchSorter(index, { order: v })"
        >
          <ElOption label="升序" value="asc" />
          <ElOption label="降序" value="desc" />
        </ElSelect>
        <ElButton size="small" text type="danger" class="flex-shrink-0" @click="removeSorter(index)">
          <ElIcon :size="12"><Delete /></ElIcon>
        </ElButton>
      </div>
      <div v-if="!sorters.length" class="text-11px opacity-50">未设置（保持取数顺序）</div>

      <div class="mt-4px flex items-center gap-8px">
        <span class="text-11px opacity-60">只保留前</span>
        <ElInputNumber
          :model-value="pipeline.limit || undefined"
          size="small"
          :min="1"
          :max="1000"
          controls-position="right"
          class="w-88px"
          placeholder="不限"
          @update:model-value="setLimit"
        />
        <span class="text-11px opacity-60">行（排序后截断，常用于 Top N 排行）</span>
      </div>
    </template>
  </div>
</template>

<style scoped></style>
