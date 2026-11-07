<script setup lang="ts">
defineOptions({ name: 'DatavUnknownWidget' });

defineProps<{ widget: DatavNamespace.Widget }>();
</script>

<template>
  <div class="datav-unknown-widget">
    <div class="text-13px font-600">未找到组件类型</div>
    <code class="text-12px">{{ widget.type }}</code>
    <div class="mt-6px text-12px opacity-70">该组件可能已被重命名或尚未注册，保存前请先移除它</div>
  </div>
</template>

<style scoped>
.datav-unknown-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px dashed var(--datav-warning);
  color: var(--datav-warning);
  text-align: center;
}
</style>
