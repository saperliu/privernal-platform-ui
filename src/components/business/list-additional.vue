<script setup lang="ts">
import { computed } from 'vue';
import { ReloadCircleOutline as __forwarded_ReloadCircleOutline } from '@vicons/ionicons5';

export interface Props {
  /** 显示的列 */
  columns: any;
  /** 显示刷新 */
  showReload?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  showReload: true
});
defineOptions({ name: 'ListAdditional' });
interface Emits {
  (e: 'update:columns', data: any): void;
  (e: 'reload', data: any): void;
}
const emit = defineEmits<Emits>();

const keywords = computed({
  get() {
    return props.columns;
  },
  set(columns) {
    emit('update:columns', columns);
  }
});

function reload() {
  emit('reload', {});
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ReloadCircleOutline = __forwarded_ReloadCircleOutline;
</script>

<template>
  <ElSpace class="pb-4px" justify="space-between" align="center">
    <div class="v-mid font-400"></div>
    <ElSpace align="center" :size="12">
      <ElTooltip v-if="showReload" content="刷新列表" placement="top">
        <ElButton size="small" quaternary @click="reload">
          <ElIcon size="16" class="list-top-font mr-4px"><component :is="ReloadCircleOutline" /></ElIcon>
          <div class="list-top-font">刷新</div>
        </ElButton>
      </ElTooltip>

      <ColumnSetting v-model:columns="keywords" />
    </ElSpace>
  </ElSpace>
</template>

<style scoped lang="scss"></style>
