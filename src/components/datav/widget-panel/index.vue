<script setup lang="ts">
import { computed } from 'vue';
import { useDatavStore } from '@/store';

/**
 * 组件「基础」属性：名称 / 位置尺寸 / 层级旋转 / 状态。
 * 样式字段与数据绑定拆到了设计器属性面板的独立页签（原先是整列铺开，面板过长）。
 */
defineOptions({ name: 'DatavWidgetPanel' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const store = useDatavStore();

const layout = computed(() => props.widget.layout);

/** 数值约束收进 options，避免参数个数超限 */
function onNumber(
  key: keyof Pick<DatavNamespace.Layout, 'x' | 'y' | 'w' | 'h' | 'z' | 'rotate'>,
  value: number | undefined,
  options: { min?: number; max?: number; integer?: boolean } = {}
) {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, integer = true } = options;
  if (typeof value !== 'number' || !Number.isFinite(value)) return;
  const clamped = Math.min(max, Math.max(min, value));
  store.updateWidgetLayout(props.widget.id, { [key]: integer ? Math.round(clamped) : clamped });
}

function onRename(value: string) {
  store.renameWidget(props.widget.id, value);
}

function onToggle(key: 'locked' | 'hidden') {
  if (key === 'locked') store.toggleLock(props.widget.id);
  else store.toggleHidden(props.widget.id);
}
</script>

<template>
  <ElForm label-position="top" size="small">
    <ElFormItem label="名称">
      <ElInput :model-value="widget.name" maxlength="60" @update:model-value="onRename" />
    </ElFormItem>

    <ElFormItem label="X / Y">
      <div class="flex gap-8px">
        <ElInputNumber
          :model-value="layout.x"
          :step="1"
          @update:model-value="v => onNumber('x', v as number | undefined)"
        />
        <ElInputNumber
          :model-value="layout.y"
          :step="1"
          @update:model-value="v => onNumber('y', v as number | undefined)"
        />
      </div>
    </ElFormItem>

    <ElFormItem label="宽 / 高">
      <div class="flex gap-8px">
        <ElInputNumber
          :model-value="layout.w"
          :min="10"
          :step="1"
          @update:model-value="v => onNumber('w', v as number | undefined, { min: 10 })"
        />
        <ElInputNumber
          :model-value="layout.h"
          :min="10"
          :step="1"
          @update:model-value="v => onNumber('h', v as number | undefined, { min: 10 })"
        />
      </div>
    </ElFormItem>

    <ElFormItem label="层级 / 旋转">
      <div class="flex gap-8px">
        <ElInputNumber
          :model-value="layout.z"
          :step="1"
          @update:model-value="v => onNumber('z', v as number | undefined)"
        />
        <ElInputNumber
          :model-value="layout.rotate"
          :min="-180"
          :max="180"
          :step="1"
          @update:model-value="
            v => onNumber('rotate', v as number | undefined, { min: -180, max: 180, integer: false })
          "
        />
      </div>
    </ElFormItem>

    <ElFormItem label="状态">
      <div class="flex gap-12px">
        <ElCheckbox :model-value="layout.locked" @update:model-value="() => onToggle('locked')">锁定</ElCheckbox>
        <ElCheckbox :model-value="layout.hidden" @update:model-value="() => onToggle('hidden')">隐藏</ElCheckbox>
      </div>
    </ElFormItem>

    <div class="text-12px opacity-60">
      类型
      <code>{{ widget.type }}</code>
      · id
      <code>{{ widget.id }}</code>
    </div>
  </ElForm>
</template>
