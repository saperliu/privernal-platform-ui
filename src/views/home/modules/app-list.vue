<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { findSystemAppListByOrg } from '@/service';
import { useAppStore, useAuthStore } from '@/store';
import { isPlatformAdmin } from '@/utils/auth/user';

defineOptions({ name: 'HomeAppList' });

interface AppItem {
  id: string;
  code: string;
  appName: string;
  icon?: string | null;
  localIcon?: string;
  pcPath?: string | null;
  type?: string;
}

/** 应用卡片的图标配色（iconify 图标继承 currentColor）：每个应用一种颜色区分 */
const APP_COLOR: Record<string, { bg: string; color: string }> = {
  PLATFORM: { bg: '#f5f3ff', color: '#7c3aed' },
  SYSTEM: { bg: '#ecfeff', color: '#0e7490' },
  campus: { bg: '#fff7ed', color: '#ea580c' }
};
const FALLBACK_COLOR = { bg: '#f0f9eb', color: '#67c23a' };

function colorOf(code: string) {
  return APP_COLOR[code] ?? FALLBACK_COLOR;
}

const appStore = useAppStore();
const auth = useAuthStore();

const list = ref<AppItem[]>([]);
const loading = ref(false);

function findAppList() {
  loading.value = true;
  findSystemAppListByOrg()
    .then(result => {
      if (result.error === null && result.data) {
        const all: SystemAppInfoNamespace.SystemAppInfoForm[] = [];
        result.data.forEach(item => {
          // icon 含 ':' 是 iconify 名（直接渲染可着色）；否则视为本地 application-* 素材名
          const isIconify = String(item.icon || '').includes(':');
          const app: SystemAppInfoNamespace.SystemAppInfoForm = {
            ...item,
            localIcon: item.icon && !isIconify ? `application-${item.icon}` : '',
            pcPath: item.pcPath ?? ''
          };
          // 卡片展示全部应用（平台管理/系统管理/业务应用）：
          // - 业务应用与「系统管理」直接展示，可见性由后端按角色授权收口
          //   （管理员=组织全部应用；普通用户=仅被授权应用，未授权看不到系统应用）
          // - 「平台管理」仅平台级管理员可见（SuperPlatformRole）
          if (item.code === 'PLATFORM') {
            if (isPlatformAdmin()) {
              list.value.push(app);
            }
          } else {
            list.value.push(app);
          }
          all.push(app);
        });
        auth.setAppList(all);
      }
    })
    .finally(() => {
      loading.value = false;
    });
}

/** 进入应用：装载该应用的动态菜单路由并跳转到应用首页 */
function enterApp(item: AppItem) {
  auth.handleAppJump(item.code, item.pcPath || '');
  appStore.isWorkbench(false);
  appStore.setAppSelectShow(true);
}

onMounted(() => {
  findAppList();
});
</script>

<template>
  <ElCard shadow="never" class="h-full rd-8px">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-15px font-500">所有应用</span>
        <span class="text-12px text-gray-400">{{ list.length }} 个，点击切换</span>
      </div>
    </template>
    <div v-loading="loading" class="min-h-200px">
      <template v-if="list.length">
        <div class="grid grid-cols-2 gap-12px xl:grid-cols-3">
          <div
            v-for="item in list"
            :key="item.id"
            class="flex-col-center cursor-pointer border border-gray-100 rd-8px px-8px py-16px transition-all hover:border-primary hover:shadow-sm"
            @click="enterApp(item)"
          >
            <div class="size-52px flex-center rd-12px" :style="{ backgroundColor: colorOf(item.code).bg }">
              <SvgIcon
                :icon="item.icon && item.icon.includes(':') ? item.icon : 'mdi:application'"
                :local-icon="item.localIcon"
                class="text-32px"
                :style="{ color: colorOf(item.code).color }"
              />
            </div>
            <p class="w-full truncate pt-8px text-center text-13px">{{ item.appName }}</p>
          </div>
        </div>
      </template>
      <ElEmpty v-else-if="!loading" description="暂无应用" :image-size="72" />
    </div>
  </ElCard>
</template>

<style scoped></style>
