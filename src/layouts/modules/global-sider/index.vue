<script setup lang="ts">
import { computed } from 'vue';
import { GLOBAL_SIDER_MENU_ID as __forwarded_GLOBAL_SIDER_MENU_ID } from '@/constants/app';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import GlobalLogo from '../global-logo/index.vue';

defineOptions({ name: 'GlobalSider' });

const appStore = useAppStore();
const themeStore = useThemeStore();

const isVerticalMix = computed(() => themeStore.layout.mode === 'vertical-mix');
const isHorizontalMix = computed(() => themeStore.layout.mode === 'horizontal-mix');
const darkMenu = computed(() => !themeStore.darkMode && !isHorizontalMix.value && themeStore.sider.inverted);
const showLogo = computed(() => !isVerticalMix.value && !isHorizontalMix.value);
const menuWrapperClass = computed(() => (showLogo.value ? 'flex-1-hidden' : 'h-full'));

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const GLOBAL_SIDER_MENU_ID = __forwarded_GLOBAL_SIDER_MENU_ID;
</script>

<template>
  <DarkModeContainer class="size-full flex-col-stretch shadow-sider" :inverted="darkMenu">
    <GlobalLogo
      v-if="showLogo"
      :show-title="!appStore.siderCollapse"
      :style="{ height: themeStore.header.height + 'px' }"
    />
    <div :id="GLOBAL_SIDER_MENU_ID" :class="menuWrapperClass"></div>
  </DarkModeContainer>
</template>

<style scoped></style>
