<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useWidgetData } from '@/hooks/datav/useWidgetData';

defineOptions({ name: 'DatavFlipTable' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

interface FlipColumn {
  field: string;
  title: string;
}

const columns = computed<FlipColumn[]>(() => {
  const list: FlipColumn[] = [];
  const dimensions = view.value?.dimensionAliases ?? [];
  dimensions.forEach((alias, index) => {
    list.push({ field: alias, title: view.value?.dimensionLabels?.[index] || alias });
  });
  const measures = view.value?.measureAliases?.length
    ? view.value.measureAliases
    : [mapping.value?.value || 'value'].filter(Boolean);
  measures.forEach((alias, index) => {
    list.push({ field: alias, title: view.value?.measureLabels?.[index] || alias });
  });
  return list.length ? list : inferFromRows();
});

/** 静态行没有别名清单时按第一行的键推断列（含映射别名），顺序不稳定由 JSON 键序兜底 */
function inferFromRows(): FlipColumn[] {
  const first = view.value?.rows?.[0];
  if (!first) return [];
  return Object.keys(first).map(key => ({ field: key, title: key }));
}

const rows = computed(() => view.value?.rows ?? []);

const pageSize = computed(() => Math.max(3, Math.min(20, Number(style.value.pageSize) || 6)));
const pageCount = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize.value)));

const page = ref(0);
let timer: number | undefined;

function stopTimer() {
  if (timer !== undefined) {
    window.clearInterval(timer);
    timer = undefined;
  }
}

function restartTimer() {
  stopTimer();
  if (pageCount.value < 2) return;
  timer = window.setInterval(
    () => {
      page.value = (page.value + 1) % pageCount.value;
    },
    Math.max(2, Number(style.value.intervalSec) || 6) * 1000
  );
}

watch([pageCount, () => style.value.intervalSec], () => {
  if (page.value >= pageCount.value) page.value = 0;
  restartTimer();
});

onMounted(restartTimer);
onBeforeUnmount(stopTimer);

const pageRows = computed(() => rows.value.slice(page.value * pageSize.value, (page.value + 1) * pageSize.value));

const fontSize = computed(() => Math.max(11, Math.min(20, Number(style.value.fontSize) || 13)));

const empty = computed(() => !loading.value && rows.value.length === 0);

function cellText(row: Record<string, unknown>, field: string): string {
  const raw = row[field];
  return raw === null || raw === undefined ? '-' : String(raw);
}
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <div v-if="!error && !empty" class="h-full flex flex-col">
      <div class="flip-head" :style="{ fontSize: `${fontSize - 1}px` }">
        <span v-for="col in columns" :key="col.field" class="flip-cell truncate">{{ col.title }}</span>
      </div>

      <Transition name="flip-page" mode="out-in">
        <div :key="page" class="min-h-0 flex flex-col flex-1">
          <div
            v-for="(row, rowIndex) in pageRows"
            :key="`${page}-${rowIndex}`"
            class="min-h-0 flex flex-1 items-center"
            :class="{ 'flip-row--stripe': style.striped !== false && rowIndex % 2 === 1 }"
            :style="{ fontSize: `${fontSize}px` }"
          >
            <span
              v-for="col in columns"
              :key="col.field"
              class="flip-cell truncate tabular-nums"
              :title="cellText(row, col.field)"
            >
              {{ cellText(row, col.field) }}
            </span>
          </div>
        </div>
      </Transition>

      <div v-if="pageCount > 1" class="pt-4px text-center text-11px text-[var(--datav-text-tertiary)]">
        {{ page + 1 }} / {{ pageCount }} 页
      </div>
    </div>

    <div
      v-if="error || empty"
      class="absolute inset-0 flex items-center justify-center text-12px"
      :class="error ? 'text-[var(--datav-error)]' : 'text-[var(--datav-text-secondary)]'"
    >
      {{ error || '暂无数据' }}
    </div>
  </div>
</template>

<style scoped>
.flip-head {
  display: flex;
  align-items: center;
  padding: 6px 0;
  color: var(--datav-text-secondary);
  border-bottom: 1px solid var(--datav-border);
}

.flip-cell {
  flex: 1 1 0;
  min-width: 0;
  padding: 0 6px;
}

.flip-row--stripe {
  background: var(--datav-panel);
}

.flip-page-enter-active,
.flip-page-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.flip-page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.flip-page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
