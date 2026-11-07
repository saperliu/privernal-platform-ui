<script setup lang="ts">
import { computed, ref, watch } from 'vue';

defineOptions({ name: 'DatavImage' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const src = computed(() => String(style.value.src ?? '').trim());
const fit = computed(() => String(style.value.fit || 'contain'));
const radius = computed(() => `${Math.max(0, Math.min(48, Number(style.value.radius) || 0))}px`);

// onerror 兜底：素材被清理或 URL 拼错时给出可读占位，而不是裂图图标；换图后撤掉失败态
const failed = ref(false);
watch(src, () => {
  failed.value = false;
});
</script>

<template>
  <div class="h-full w-full overflow-hidden" :style="{ borderRadius: radius }">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="widget.name"
      class="h-full w-full"
      :style="{ objectFit: fit as never }"
      loading="lazy"
      @error="failed = true"
    />
    <div
      v-else
      class="h-full w-full flex flex-col items-center justify-center gap-6px text-12px text-[var(--datav-text-secondary)]"
    >
      <SvgIcon icon="mdi:image-off-outline" class="text-24px opacity-60" />
      <span>{{ style.fallbackText || '未配置图片' }}</span>
    </div>
  </div>
</template>
