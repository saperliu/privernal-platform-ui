<script setup lang="ts">
defineOptions({ name: 'GlobalLogo' });

interface Props {
  /** Whether to show the title */
  showTitle?: boolean;
}

withDefaults(defineProps<Props>(), {
  showTitle: true
});
</script>

<template>
  <!-- 显式回首页：to="/" 走根路由 redirect，依赖初始化时序，特定状态下会落 404 -->
  <RouterLink to="/home" class="w-full flex-center nowrap-hidden">
    <SystemLogo class="size-32px" />
    <h2 v-show="showTitle" class="pl-8px text-16px text-primary font-bold transition duration-300 ease-in-out">
      {{ $t('system.title') }}
    </h2>
  </RouterLink>
</template>

<style scoped></style>
