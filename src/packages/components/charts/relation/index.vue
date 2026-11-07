<script setup lang="ts">
import { computed } from 'vue';
import { useDatavChart } from '@/hooks/datav/useDatavChart';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { buildLinkGraph } from '@/utils/datav-data';
import { buildGraphOption } from '../chart-option';

defineOptions({ name: 'DatavRelationGraph' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const graph = computed(() => buildLinkGraph(view.value, mapping.value));

const empty = computed(() => !loading.value && graph.value.links.length === 0);

const { domRef } = useDatavChart(palette => {
  if (!graph.value.links.length) return null;
  return buildGraphOption(graph.value, palette(), {
    nodeSize: Number(style.value.nodeSize) || 22,
    showLabel: style.value.showLabel !== false,
    repulsion: Number(style.value.repulsion) || 220
  });
});
</script>

<template>
  <div class="relative h-full w-full">
    <div ref="domRef" class="h-full w-full"></div>

    <div
      v-if="error || empty"
      class="absolute inset-0 flex items-center justify-center text-12px"
      :class="error ? 'text-[var(--datav-error)]' : 'text-[var(--datav-text-secondary)]'"
    >
      {{ error || '暂无数据' }}
    </div>
  </div>
</template>
