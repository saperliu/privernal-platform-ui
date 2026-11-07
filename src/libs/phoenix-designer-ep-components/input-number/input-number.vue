<script setup lang="ts">
import { ElInputNumber as __forwarded_ElInputNumber } from 'element-plus';

/**
 * 数字输入框（phoenix-designer EP 适配覆盖版）。
 *
 * 内置版渲染裸 ElInputNumber，EP 默认宽度固定 150px，占不满表单项；
 * 文本框（ElInput）默认 100%，两者并排宽度不一致。这里固定 width 100% 对齐文本框。
 * modelValue/onChange/disabled 等其余属性走 Vue 透传（与内置组件同机制），无需显式声明。
 */
export interface Props {
  /** 占位内容 */
  placeholder?: string;
}

withDefaults(defineProps<Props>(), {
  placeholder: '请输入'
});

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInputNumber = __forwarded_ElInputNumber;
</script>

<template>
  <ElInputNumber class="phoenix-ep-input-number" :placeholder="placeholder" />
</template>

<style lang="scss" scoped>
.phoenix-ep-input-number {
  width: 100%;
}
</style>
