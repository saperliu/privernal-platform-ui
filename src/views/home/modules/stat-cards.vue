<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  CircleCheck as __forwarded_CircleCheck,
  Clock as __forwarded_Clock,
  Files as __forwarded_Files
} from '@element-plus/icons-vue';
import { applicationCodeSystem } from '@/constants/system';
import { findFlowTaskCount } from '@/service';
import { useAuthStore } from '@/store';

defineOptions({ name: 'HomeStatCards' });

const router = useRouter();
const authStore = useAuthStore();

const todoNum = ref(0);
const doneNum = ref(0);
const allNum = ref(0);

/**
 * 当前页全屏打开流程列表页（待办/已办/我发起的）：bare=1 进入全屏内容模式，
 * 页面内「返回首页」负责退出全屏。flow 路由注册在 SYSTEM 应用菜单下且流程菜单整体隐藏，
 * 当前应用上下文未装载它——先按 SYSTEM 重装路由（与应用卡片切换同一机制），再导航。
 */
async function goFlowPage(path: string) {
  if (authStore.getSelectApp() !== applicationCodeSystem) {
    await authStore.handleAppJump(applicationCodeSystem, path);
  }
  await router.push({ path, query: { app: applicationCodeSystem, bare: '1' } });
}

function findTaskCount() {
  findFlowTaskCount().then(res => {
    if (res.error === null && res.data) {
      todoNum.value = Number(res.data.todo || 0);
      doneNum.value = Number(res.data.done || 0);
      allNum.value = todoNum.value + doneNum.value + Number(res.data.start || 0);
    }
  });
}

onMounted(() => {
  findTaskCount();
});

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const Clock = __forwarded_Clock;
const CircleCheck = __forwarded_CircleCheck;
const Files = __forwarded_Files;
</script>

<template>
  <ElRow :gutter="16">
    <ElCol :xs="24" :sm="8" class="mb-16px">
      <ElCard shadow="hover" class="cursor-pointer rd-8px" @click="goFlowPage('/flow/todo')">
        <div class="flex items-center gap-16px">
          <div class="size-56px flex-center rd-12px bg-#ecf5ff text-28px text-#409eff">
            <ElIcon :size="28" class="text-28px"><Clock /></ElIcon>
          </div>
          <div class="flex-col gap-4px">
            <div class="text-13px text-gray-400">待办工单</div>
            <div class="flex items-baseline gap-4px">
              <span class="text-26px font-600">{{ todoNum }}</span>
              <span class="text-12px text-gray-400">单</span>
            </div>
          </div>
        </div>
      </ElCard>
    </ElCol>
    <ElCol :xs="24" :sm="8" class="mb-16px">
      <ElCard shadow="hover" class="cursor-pointer rd-8px" @click="goFlowPage('/flow/done')">
        <div class="flex items-center gap-16px">
          <div class="size-56px flex-center rd-12px bg-#f0f9eb text-28px text-#67c23a">
            <ElIcon :size="28" class="text-28px"><CircleCheck /></ElIcon>
          </div>
          <div class="flex-col gap-4px">
            <div class="text-13px text-gray-400">已办工单</div>
            <div class="flex items-baseline gap-4px">
              <span class="text-26px font-600">{{ doneNum }}</span>
              <span class="text-12px text-gray-400">单</span>
            </div>
          </div>
        </div>
      </ElCard>
    </ElCol>
    <ElCol :xs="24" :sm="8" class="mb-16px">
      <ElCard shadow="hover" class="cursor-pointer rd-8px" @click="goFlowPage('/flow/instance')">
        <div class="flex items-center gap-16px">
          <div class="size-56px flex-center rd-12px bg-#fdf6ec text-28px text-#e6a23c">
            <ElIcon :size="28" class="text-28px"><Files /></ElIcon>
          </div>
          <div class="flex-col gap-4px">
            <div class="text-13px text-gray-400">全部工单</div>
            <div class="flex items-baseline gap-4px">
              <span class="text-26px font-600">{{ allNum }}</span>
              <span class="text-12px text-gray-400">单</span>
            </div>
          </div>
        </div>
      </ElCard>
    </ElCol>
  </ElRow>
</template>

<style scoped></style>
