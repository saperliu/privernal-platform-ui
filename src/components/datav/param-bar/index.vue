<script setup lang="ts">
import { computed } from 'vue';

/**
 * 大屏运行态参数栏（M6.1）
 *
 * 只负责「改哪个参数的值」，不碰取数：值写回父级后由 runtime 的 params 侦测到变化整屏重取。
 * 这条链路必须只有一个触发点——如果在组件里也挂一次「参数变了就刷新」，就会出现一次改
 * 日期发两遍整屏请求，压测时看不出来，上线后是双倍的库负载。
 *
 * 下拉的选项来源支持两种：静态串（`a|b` 或 `a,b`）与数据集编码。后者是真实需求
 * （组织、班级这种候选集本来就在库里），但它要走设计态那条预览接口取列，
 * 所以取不到时退化成手输而不是把控件空在那里。
 */
const props = defineProps<{
  params: DatavNamespace.ScreenParam[];

  /** 当前生效值（默认值 + URL + 用户已改的合并结果） */
  values: Record<string, unknown>;

  /** 数据集编码 → 该数据集第一列的取值，供 select 型参数用 */
  optionsByDataset?: Record<string, string[]>;
}>();

const emit = defineEmits<{ (e: 'update', code: string, value: string | number | null): void }>();

const visible = computed(() => props.params.filter(item => item.code));

function current(param: DatavNamespace.ScreenParam) {
  const value = props.values[param.code];
  return value === null || value === undefined ? '' : String(value);
}

/** 静态 dataSource 与数据集编码混用：含中文/字母点号且能在 optionsByDataset 里查到才算数据集 */
function optionsFor(param: DatavNamespace.ScreenParam) {
  const source = (param.dataSource ?? '').trim();
  if (!source) return [];
  const fromDataset = props.optionsByDataset?.[source];
  if (fromDataset) return fromDataset;
  return source
    .split(/[|\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}
</script>

<template>
  <div v-if="visible.length" class="datav-param-bar flex flex-wrap items-center gap-12px">
    <div v-for="param in visible" :key="param.code" class="flex items-center gap-6px">
      <span class="datav-param-bar__label">{{ param.name || param.code }}</span>
      <ElSelect
        v-if="param.type === 'select'"
        class="w-150px"
        size="small"
        clearable
        filterable
        :model-value="current(param)"
        :allow-create="!optionsFor(param).length"
        placeholder="全部"
        @update:model-value="emit('update', param.code, $event === '' ? null : ($event as string))"
      >
        <ElOption v-for="option in optionsFor(param)" :key="option" :label="option" :value="option" />
      </ElSelect>
      <ElDatePicker
        v-else-if="param.type === 'date'"
        class="w-150px"
        size="small"
        type="date"
        value-format="YYYY-MM-DD"
        :model-value="current(param)"
        placeholder="选择日期"
        @update:model-value="emit('update', param.code, ($event as string) || null)"
      />
      <ElDatePicker
        v-else-if="param.type === 'daterange'"
        class="w-240px"
        size="small"
        type="daterange"
        value-format="YYYY-MM-DD"
        range-separator="至"
        start-placeholder="开始"
        end-placeholder="结束"
        :model-value="current(param)"
        @update:model-value="emit('update', param.code, ($event as string) || null)"
      />
      <ElInput
        v-else
        class="w-150px"
        size="small"
        clearable
        :model-value="current(param)"
        placeholder="输入后回车"
        @update:model-value="emit('update', param.code, $event || null)"
      />
    </div>
  </div>
</template>

<style scoped>
.datav-param-bar__label {
  font-size: 12px;
  color: var(--datav-text-secondary);
  white-space: nowrap;
}
</style>
