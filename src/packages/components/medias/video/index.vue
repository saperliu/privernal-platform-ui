<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'DatavVideo' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const src = computed(() => String(style.value.src ?? '').trim());

// 浏览器策略：非静音 autoplay 会被直接拦下。投放屏要的是「打开就播」，所以自动播放时强制静音。
const autoplay = computed(() => Boolean(style.value.autoplay));
const muted = computed(() => autoplay.value || Boolean(style.value.muted));

const fit = computed(() => String(style.value.fit || 'cover'));
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <video
      v-if="src"
      :src="src"
      class="h-full w-full"
      :style="{ objectFit: fit as never }"
      :autoplay="autoplay"
      :muted="muted"
      :loop="style.loop !== false"
      :controls="Boolean(style.controls)"
      playsinline
      preload="auto"
    ></video>
    <div
      v-else
      class="h-full w-full flex flex-col items-center justify-center gap-6px text-12px text-[var(--datav-text-secondary)]"
    >
      <SvgIcon icon="mdi:movie-open-outline" class="text-24px opacity-60" />
      <span>未配置视频地址</span>
    </div>
  </div>
</template>
