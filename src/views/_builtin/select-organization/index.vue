<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '@/store';
import { useRouterPush } from '@/hooks/common/router';

defineOptions({
  name: 'SelectOrganization'
});

const auth = useAuthStore();
const { routerPushByKey } = useRouterPush();
const loadingOrgId = ref('');

const orgList = computed(() => auth.organizationList || []);

async function selectOrg(orgId: string) {
  if (loadingOrgId.value !== '') {
    return;
  }
  loadingOrgId.value = orgId;
  await auth.selectOrganization(orgId);
  loadingOrgId.value = '';
}

async function backToLogin() {
  await auth.resetStore();
  // 这个页面是常量路由，resetStore 不会把它跳走
  await routerPushByKey('login');
}
</script>

<template>
  <div class="wh-full flex">
    <div class="w-1/2 flex-col-center">
      <div><SystemLogo class="text-164px text-primary" /></div>
      <div class="pt-12px text-24px font-medium">您有多个组织,选择要登录的组织</div>
    </div>
    <ElDivider style="height: 100%" />
    <div class="w-1/2 flex-col-center">
      <template v-if="orgList.length > 0">
        <ElButton
          v-for="org in orgList"
          :key="org.organizationId"
          text
          class="mt-8px"
          :loading="loadingOrgId === org.organizationId"
          @click="selectOrg(org.organizationId)"
        >
          <span class="text-24px font-medium">{{ org.organizationName }}</span>
        </ElButton>
      </template>
      <div v-else class="flex-col-center">
        <div class="text-16px">登录信息已失效，请重新登录</div>
        <ElButton type="primary" class="mt-16px" @click="backToLogin">重新登录</ElButton>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
