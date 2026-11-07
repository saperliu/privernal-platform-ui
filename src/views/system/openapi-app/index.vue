<script setup lang="ts">
import { ref } from 'vue';
import SystemOpenapiCredentialList from './components/system-openapi-credential-list.vue';
import SystemOpenapiCallLogList from './components/system-openapi-call-log-list.vue';

defineOptions({ name: 'SystemOpenapiApp' });

const activeTab = ref('credential');
</script>

<template>
  <div class="h-full overflow-hidden">
    <ElTabs v-model="activeTab" :animated="false" class="openapi-tabs h-full">
      <ElTabPane name="credential" label="应用凭证" display-directive="show" class="h-full">
        <SystemOpenapiCredentialList />
      </ElTabPane>
      <ElTabPane name="callLog" label="调用统计" display-directive="show" class="h-full">
        <SystemOpenapiCallLogList />
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<style scoped>
/* NTabs 默认不给内容高度，不铺平的话下面的 NDataTable flex-height 会塌成 0 高 */
.openapi-tabs :deep(.n-tabs-pane-wrapper) {
  height: calc(100% - 46px);
}

.openapi-tabs :deep(.n-tab-pane) {
  height: 100%;
}
</style>
