<script setup lang="ts" generic="T extends Record<string, unknown>, K = never">
import { VueDraggable as __forwarded_VueDraggable } from 'vue-draggable-plus';

defineOptions({ name: 'TableColumnSetting' });

const columns = defineModel<UI.TableColumnCheck[]>('columns', {
  required: true
});

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const VueDraggable = __forwarded_VueDraggable;
</script>

<template>
  <ElPopover placement="bottom-end" trigger="click">
    <template #reference>
      <ElButton>
        <template #icon>
          <icon-ant-design-setting-outlined class="text-icon" />
        </template>
        {{ $t('common.columnSetting') }}
      </ElButton>
    </template>
    <VueDraggable v-model="columns" :animation="150" filter=".none_draggable" class="h-[200px] overflow-y-auto">
      <div
        v-for="item in columns"
        :key="item.prop"
        class="h-36px flex-y-center rd-4px hover:(bg-primary bg-opacity-20)"
      >
        <icon-mdi-drag class="mr-8px h-full cursor-move text-icon" />
        <ElTooltip :content="item.label as string" :disabled="item.label.length < 10" placement="top">
          <ElCheckbox v-model="item.checked" class="none_draggable flex-1 overflow-hidden">{{ item.label }}</ElCheckbox>
        </ElTooltip>
      </div>
    </VueDraggable>
  </ElPopover>
</template>

<style scoped></style>
