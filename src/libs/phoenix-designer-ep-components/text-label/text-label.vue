<script setup lang="ts">
import { computed } from 'vue';

/**
 * 文本标签（phoenix-designer EP 适配，补齐 naiveUi 版的 text-label）。
 * 纯展示组件，用于表单内的说明文本，支持换行。
 */
export interface Props {
  /** 文本内容 */
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: ''
});

const content = computed(() => props.text ?? '');
</script>

<template>
  <div class="phoenix-text-label">{{ content }}</div>
</template>

<style lang="scss" scoped>
.phoenix-text-label {
  color: var(--el-text-color-regular, #606266);
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  width: 100%;
}
</style>
