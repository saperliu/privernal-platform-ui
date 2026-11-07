<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAppStore } from '@/store/modules/app';
import DesignerModal from './components/designer-modal.vue';

defineOptions({ name: 'Designer' });

const route = useRoute();
const appStore = useAppStore();

// 动态表单「设计」以 bare=1 弹出的专用标签：进入内容全屏（不渲染侧栏/头部/页签），
// 工作区占满整窗。setup 内同步设置，避免先渲染框架再切换的闪动。
if (route.query.bare === '1') {
  appStore.fullContent = true;
}
</script>

<template>
  <DesignerModal></DesignerModal>
</template>

<style lang="scss" scoped></style>
