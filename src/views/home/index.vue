<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store';
import StatCards from './modules/stat-cards.vue';
import NoticeList from './modules/notice-list.vue';
import AppList from './modules/app-list.vue';

defineOptions({ name: 'HomeIndex' });

const router = useRouter();
const auth = useAuthStore();

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function goPersonInfo() {
  router.push('/person-info');
}
</script>

<template>
  <div class="flex-col gap-16px p-16px">
    <!-- 顶部问候条 -->
    <ElCard shadow="never" class="rd-8px">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-12px">
          <ElAvatar :size="48" :src="auth.userInfo.avatar || undefined">
            {{ (auth.userInfo.nickName || auth.userInfo.loginName || '').slice(0, 1) }}
          </ElAvatar>
          <div class="flex-col gap-4px">
            <div class="text-18px font-500">
              {{ greeting() }}，{{ auth.userInfo.nickName || auth.userInfo.loginName }}！
            </div>
            <div class="text-13px text-gray-400">欢迎回到低代码平台，今天也是充满活力的一天</div>
          </div>
        </div>
        <ElButton text type="primary" @click="goPersonInfo">个人信息</ElButton>
      </div>
    </ElCard>

    <!-- 待办 / 已办 / 全部 统计卡片 -->
    <StatCards />

    <ElRow :gutter="16">
      <ElCol :xs="24" :md="10" class="mb-16px">
        <!-- 所有应用（含平台管理/系统管理，点击切换应用） -->
        <AppList />
      </ElCol>
      <ElCol :xs="24" :md="14" class="mb-16px">
        <!-- 系统通知（最近 10 条） -->
        <NoticeList />
      </ElCol>
    </ElRow>
  </div>
</template>

<style scoped></style>
