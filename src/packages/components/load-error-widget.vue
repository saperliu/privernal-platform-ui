<script setup lang="ts">
defineOptions({ name: 'DatavWidgetLoadError' });

// defineAsyncComponent 的 errorComponent 会收到传给异步组件的 props（widget），
// 所以这里能报出「哪个组件」加载失败，而不是一块无名空白
defineProps<{ widget?: DatavNamespace.Widget }>();
</script>

<template>
  <div class="datav-load-error" role="alert">
    <div class="text-13px font-600">组件加载失败</div>
    <code class="text-12px">{{ widget?.type ?? '未知组件' }}</code>
    <div class="mt-6px text-12px opacity-70">网络波动或版本更新可能导致脚本未就绪，刷新页面会自动重试</div>
  </div>
</template>

<style scoped>
.datav-load-error {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px dashed var(--datav-error);
  color: var(--datav-error);
  text-align: center;
}
</style>
