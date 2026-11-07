<script setup lang="ts">
import { createTextVNode, defineComponent } from 'vue';
import { createDialogAdapters } from '@/utils/dialog-adapter';

defineOptions({ name: 'AppProvider' });

const ContextHolder = defineComponent({
  name: 'ContextHolder',
  setup() {
    function register() {
      window.$notification = ElNotification;
      window.$messageBox = ElMessageBox;
      window.$message = ElMessage;
      // naive 风格 $dialog 适配（业务代码从 perfect-cloud-ui 迁移而来）
      const dialogs = createDialogAdapters();
      window.$dialog = dialogs;
      window.$loadingBar = { start: () => {}, finish: () => {}, error: () => {} };
    }

    register();

    return () => createTextVNode();
  }
});
</script>

<template>
  <div class="h-full">
    <ContextHolder />
    <slot></slot>
  </div>
</template>

<style scoped></style>
