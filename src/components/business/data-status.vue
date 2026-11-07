<script setup lang="ts">
import { computed } from 'vue';
import { dataStatusBgColors, dataStatusColors, dataStatusLabels, processLabels } from '@/constants';

export interface Props {
  /** 值 */
  value: string | number;
  /** 名称 */
  name?: string;
  process?: boolean;
  /** 数据的状态标签 */
  dataStatusLabelList?: Record<number, string>;
  dataStatusColorList?: Record<string, string>;
}
const props = withDefaults(defineProps<Props>(), {
  value: '',
  name: '',
  process: false,
  dataStatusLabelList: () => dataStatusLabels,
  dataStatusColorList: () => dataStatusColors
});
defineOptions({ name: 'DataStatus' });

const colorValue = computed(() => props.dataStatusColorList[props.value]);

const bgColorValue = computed(() => dataStatusBgColors[props.value]);

const name = computed(() => {
  if (props.process) {
    return processLabels[Number(props.value)];
  }
  return props.dataStatusLabelList[Number(props.value)];
});
</script>

<template>
  <div class="status-btn">
    <ElTag size="default" tag="div" round :color="bgColorValue">
      <div :style="{ color: colorValue }">{{ name }}</div>
    </ElTag>
    <!--    <div class="div-status" :style="{ backgroundColor: bgColorValue, color: colorValue }">{{ name }}</div>-->
  </div>
</template>

<style scoped lang="scss">
.status-btn {
  :deep(.n-button.n-button--disabled) {
    cursor: default;
  }
}
</style>
