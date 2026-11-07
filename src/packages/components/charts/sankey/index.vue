<script setup lang="ts">
import { computed } from 'vue';
import { registerSankeyChart, registerSankeySeries } from '@visactor/vchart';
import { useDatavVChart } from '@/hooks/datav/useDatavVChart';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { buildLinkGraph } from '@/utils/datav-data';
import type { ChartPalette } from '../chart-option';

registerSankeySeries();
registerSankeyChart();

defineOptions({ name: 'DatavSankeyChart' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const graph = computed(() => buildLinkGraph(view.value, mapping.value));

const empty = computed(() => !loading.value && graph.value.links.length === 0);

const { domRef } = useDatavVChart((palette: ChartPalette) => {
  if (!graph.value.links.length) return null;
  const colors = palette.series.length ? palette.series : [palette.text];
  return {
    type: 'sankey',
    data: [
      {
        id: 'flow',
        values: {
          nodes: graph.value.nodes.map((node, index) => ({ name: node.name, color: colors[index % colors.length] })),
          links: graph.value.links
        }
      }
    ],
    categoryField: 'name',
    valueField: 'value',
    sourceField: 'source',
    targetField: 'target',
    node: { style: { width: Number(style.value.nodeWidth) || 14, fill: (datum: { color?: string }) => datum.color } },
    label: { visible: style.value.showLabel !== false, style: { fill: palette.text, fontSize: 11 } },
    link: { style: { fillOpacity: 0.28 } },
    background: 'transparent',
    tooltip: { isVisible: true },
    animations: false
  } as never;
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
