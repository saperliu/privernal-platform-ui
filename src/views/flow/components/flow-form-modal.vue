<script setup lang="ts">
import { ElDialog as __forwarded_ElDialog } from 'element-plus';
import FlowFormPanel from './flow-form-panel.vue';

/**
 * 申请单弹窗：流程列表（待办/已办/我发起的）查看业务数据用。
 * 只读视图，字段按当前流程节点的字段权限隐藏；审批人无需被申请单所在表的按钮权限。
 */
const props = defineProps<{
  show: boolean;
  /** 业务数据 id */
  businessId?: string | null;
  flowName?: string;
  businessTitle?: string;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDialog = __forwarded_ElDialog;
</script>

<template>
  <ElDialog
    :model-value="props.show"
    width="900px"
    append-to-body
    @update:model-value="(value: boolean) => emit('update:show', value)"
  >
    <template #header>
      <div class="min-w-0">
        <div class="text-16px font-600 leading-22px">申请单</div>
        <div class="truncate text-12px color-gray leading-18px">
          {{ props.flowName || '流程' }}
          <template v-if="props.businessTitle">· {{ props.businessTitle }}</template>
        </div>
      </div>
    </template>
    <!-- v-if 保证每次打开重新拉取，避免上一条数据的字段残留 -->
    <FlowFormPanel v-if="props.show" :business-id="props.businessId || ''" class="flow-form-modal__body" />
  </ElDialog>
</template>

<style scoped>
.flow-form-modal :deep(.n-card-header) {
  padding: 18px 20px 14px;
}

.flow-form-modal :deep(.n-card-content) {
  padding-top: 0;
}

.flow-form-modal__body {
  height: 62vh;
}
</style>
