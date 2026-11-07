<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'DatavIframe' });

const props = defineProps<{ widget: DatavNamespace.Widget }>();

const style = computed(() => (props.widget.style ?? {}) as Record<string, any>);

const src = computed(() => String(style.value.src ?? '').trim());

/**
 * 只放行 http(s)：javascript:/data: 协议的 iframe 等于把任意脚本放进画布作用域，
 * 保存进 schema 后任何打开这块屏的人都会执行它。
 */
const safeSrc = computed(() => (/^https?:\/\//i.test(src.value) ? src.value : ''));

const pointerEvents = computed(() => (style.value.scrollbar !== false ? 'auto' : 'none'));
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <iframe
      v-if="safeSrc"
      :src="safeSrc"
      class="h-full w-full border-none"
      :style="{ pointerEvents }"
      :title="widget.name"
      :scrolling="style.scrollbar !== false ? 'yes' : 'no'"
      loading="lazy"
      referrerpolicy="no-referrer"
    ></iframe>
    <div
      v-else
      class="h-full w-full flex flex-col items-center justify-center gap-6px text-12px text-[var(--datav-text-secondary)]"
    >
      <SvgIcon icon="mdi:open-in-new" class="text-24px opacity-60" />
      <span>{{ src ? '地址必须是 http/https 开头' : '未配置网页地址' }}</span>
    </div>
  </div>
</template>
