<script setup lang="ts">
import { ref } from 'vue';
import SystemWebhookSubscriptionList from './components/system-webhook-subscription-list.vue';
import SystemWebhookEventList from './components/system-webhook-event-list.vue';

defineOptions({ name: 'SystemWebhook' });

const activeTab = ref('subscription');
</script>

<template>
  <div class="h-full overflow-hidden">
    <ElTabs v-model="activeTab" :animated="false" class="webhook-tabs h-full">
      <ElTabPane name="subscription" label="事件订阅" display-directive="show" class="h-full">
        <SystemWebhookSubscriptionList />
      </ElTabPane>
      <ElTabPane name="event" label="事件与投递记录" display-directive="show" class="h-full">
        <SystemWebhookEventList />
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<style scoped>
/* NTabs 默认不给内容高度，不铺平的话下面的 NDataTable flex-height 会塌成 0 高 */
.webhook-tabs :deep(.n-tabs-pane-wrapper) {
  height: calc(100% - 46px);
}

.webhook-tabs :deep(.n-tab-pane) {
  height: 100%;
}
</style>
