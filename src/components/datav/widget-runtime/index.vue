<script setup lang="ts">
import { computed } from 'vue';
import { provideDatavWidget, useDatavLinkage } from '@/hooks/datav/useDatavLinkage';
import { hasClickAction } from '@/utils/datav-linkage';
import { getWidgetMeta } from '@/packages/components/registry';

defineOptions({ name: 'DatavWidgetRuntime' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const meta = computed(() => getWidgetMeta(props.widget.type));

// 联动接线在 useDatavChart / DOM 组件里，它们只认这个 provide，
// 于是 14 个图表组件不必各写一遍「把 widget 传进钩子」
provideDatavWidget(props.widget);

const linkage = useDatavLinkage();

/** 只有运行态且真配了点击行为才给手型：设计态点什么都不会有反应，光标不该先撒谎 */
const linkable = computed(() => Boolean(linkage) && hasClickAction(props.widget));

/** 组件按自身逻辑尺寸渲染，舞台负责把它缩到实际屏幕 */
const contentStyle = computed(() => ({ width: '100%', height: '100%' }));
</script>

<template>
  <div
    class="datav-widget overflow-hidden"
    :class="{ 'datav-widget--linkable': linkable }"
    :style="contentStyle"
    :data-widget-type="widget.type"
  >
    <component :is="meta.runtime" :widget="props.widget" />
  </div>
</template>

<style scoped>
.datav-widget {
  box-sizing: border-box;
}
</style>
