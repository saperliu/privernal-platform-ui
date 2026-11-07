<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

defineOptions({ name: 'DatavCarousel' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const images = computed<string[]>(() => {
  const raw = style.value.images;
  if (!Array.isArray(raw)) return [];
  return raw.map(item => String(item ?? '').trim()).filter(Boolean);
});

const fit = computed(() => String(style.value.fit || 'cover'));
const radius = computed(() => `${Math.max(0, Math.min(48, Number(style.value.radius) || 0))}px`);
const intervalMs = computed(() => Math.max(2, Number(style.value.intervalSec) || 5) * 1000);

const active = ref(0);
let timer: number | undefined;

function stopTimer() {
  if (timer !== undefined) {
    window.clearInterval(timer);
    timer = undefined;
  }
}

function restartTimer() {
  stopTimer();
  if (!style.value.autoplay || images.value.length < 2) return;
  timer = window.setInterval(() => {
    active.value = (active.value + 1) % images.value.length;
  }, intervalMs.value);
}

watch([() => style.value.autoplay, intervalMs, images], () => {
  if (active.value >= images.value.length) active.value = 0;
  restartTimer();
});

onMounted(restartTimer);
onBeforeUnmount(stopTimer);
</script>

<template>
  <div class="relative h-full w-full overflow-hidden" :style="{ borderRadius: radius }">
    <template v-if="images.length">
      <img
        v-for="(item, index) in images"
        v-show="index === active"
        :key="`${index}-${item}`"
        :src="item"
        :alt="`轮播 ${index + 1}`"
        class="absolute inset-0 h-full w-full"
        :style="{ objectFit: fit as never }"
        loading="lazy"
      />
      <div
        v-if="images.length > 1 && style.showDots !== false"
        class="absolute bottom-8px left-1/2 flex gap-6px -translate-x-1/2"
      >
        <button
          v-for="(item, index) in images"
          :key="`dot-${index}`"
          type="button"
          class="carousel-dot"
          :class="{ 'carousel-dot--active': index === active }"
          :aria-label="` 切换到第 ${index + 1} 张`"
          @click="active = index"
        ></button>
      </div>
    </template>
    <div
      v-else
      class="h-full w-full flex flex-col items-center justify-center gap-6px text-12px text-[var(--datav-text-secondary)]"
    >
      <SvgIcon icon="mdi:multimedia" class="text-24px opacity-60" />
      <span>未配置轮播图片</span>
    </div>
  </div>
</template>

<style scoped>
.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  background: var(--datav-border);
  transition: background 0.2s ease;
}

.carousel-dot--active {
  background: var(--datav-accent);
}
</style>
