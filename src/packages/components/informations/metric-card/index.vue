<script setup lang="ts">
import { computed } from 'vue';
import { useWidgetData } from '@/hooks/datav/useWidgetData';
import { useWidgetLinkage } from '@/hooks/datav/useDatavLinkage';
import { buildSingleValue, formatValue } from '@/utils/datav-data';
import { resolveColor } from '@/packages/components/protocol';

defineOptions({ name: 'MetricCard' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const { view, mapping, loading, error } = useWidgetData(() => props.widget);

const { clickFirstRow, isFirstRowSelected } = useWidgetLinkage();

/** 数字卡只看第一行：聚合内核的 stat 类型本来就把 LIMIT 锁成 1 */
const rawValue = computed(() => buildSingleValue(view.value, mapping.value));

/**
 * 格式化配置统一走 data.format（ValueFormat），旧的 style.decimals/thousands 只作为回落，
 * 已经配好的大屏不会因为这次改动突然丢掉千分位。
 */
const format = computed(() => {
  const stored = (props.widget.data as Record<string, any> | undefined)?.format;
  if (stored) return stored as Record<string, any>;
  return { decimals: style.value.decimals, thousands: style.value.thousands, unit: style.value.unit };
});

const shown = computed(() =>
  formatValue(rawValue.value, { ...format.value, decimals: Number(format.value.decimals) || 0 })
);

const displayValue = computed(() => {
  // 取数中显示占位而不是 0：投放屏上 0 会被当成真实指标读一次，等数据回来又跳变
  if (rawValue.value === null && loading.value) return '…';
  return shown.value.text;
});

// 负数覆盖成告警色；非负数仍走用户配的色值，resolveColor 的 fallback 位不能放字面色
const valueColor = computed(() =>
  shown.value.negative ? 'var(--datav-danger)' : resolveColor(style.value.valueColor, 'datav-accent')
);

/** align 三档映射：left/right 贴对应边，其余（含未配置）居中 */
function alignOffset(align: unknown): 'flex-start' | 'flex-end' | 'center' {
  if (align === 'left') return 'flex-start';
  if (align === 'right') return 'flex-end';
  return 'center';
}

const rootStyle = computed(() => ({
  justifyContent: alignOffset(style.value.align),
  alignItems: alignOffset(style.value.align)
}));
</script>

<template>
  <div
    class="h-full w-full flex flex-col gap-4px px-10px py-8px"
    :class="{ 'datav-linked': isFirstRowSelected(view.rows) }"
    :style="rootStyle"
    @click="clickFirstRow(view.rows)"
  >
    <div
      class="truncate"
      :style="{
        fontSize: `${Number(style.labelFontSize) || 13}px`,
        color: resolveColor(style.labelColor, 'datav-text-secondary')
      }"
    >
      {{ style.label || '指标' }}
    </div>
    <div
      class="font-700 leading-none tabular-nums"
      :style="{ fontSize: `${Number(style.fontSize) || 36}px`, color: valueColor }"
    >
      {{ displayValue }}
      <span v-if="style.unit" class="ml-4px text-14px font-400">{{ style.unit }}</span>
    </div>
    <div v-if="error" class="truncate text-11px text-[var(--datav-error)]" :title="error">取数失败</div>
  </div>
</template>
