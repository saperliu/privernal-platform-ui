<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { TabPaneName } from 'element-plus';
import {
  ElButton as __forwarded_ElButton,
  ElCard as __forwarded_ElCard,
  ElIcon as __forwarded_ElIcon,
  ElTabs as __forwarded_ElTabs
} from 'element-plus';
import { ArrowLeft as __forwarded_ArrowLeft } from '@element-plus/icons-vue';
import { findFlowTaskCount } from '@/service';
import { useAppStore } from '@/store/modules/app';

/**
 * 我的流程：统一列表布局（参考钉钉风格，视觉对齐 perfect-cloud-ui 的 flow-list-layout）
 * 顶部 Tab（待办/我发起的/已办）+ 筛选区（默认空直接分页，填条件按条件查询）+ 表格
 * 待办角标始终显示（非待办页通过任务数量统计接口取待办数）
 */
const props = defineProps<{
  active: 'done' | 'instance' | 'todo';
  /** 列表总数（itemCount 未就绪时可缺省） */
  total?: number;
  /** 待办数量（待办页传列表实时总数；不传则内部查询任务数量统计） */
  todoCount?: number;
}>();

const emit = defineEmits<{
  clear: [];
  'tab-change': [key: string];
  search: [];
}>();

const router = useRouter();
const appStore = useAppStore();

/** 返回首页：bare=1 全屏进入（无侧栏/页签），离开时显式退出全屏，恢复主框架 */
function backToHome() {
  appStore.fullContent = false;
  router.push('/home');
}

const tabs = [
  { key: 'todo', label: '待办' },
  { key: 'instance', label: '我发起的' },
  { key: 'done', label: '已办' }
];

const routeByTab: Record<string, string> = {
  done: '/flow/done',
  instance: '/flow/instance',
  todo: '/flow/todo'
};

function handleTabChange(name: TabPaneName) {
  const key = String(name);
  if (key === props.active) return;
  emit('tab-change', key);
  router.push(routeByTab[key] ?? '/flow/todo');
}

const totalText = computed(() => `共有 ${props.total ?? 0} 条相关记录`);

/** 待办角标数量：外部传入优先，否则内部查询（无权限/失败时不显示） */
const innerTodoCount = ref(-1);

onMounted(async () => {
  if (props.todoCount !== undefined) return;
  const { data, error } = await findFlowTaskCount();
  if (error === null && data) {
    innerTodoCount.value = data.todo ?? 0;
  }
});

const badgeCount = computed(() => (props.todoCount !== undefined ? props.todoCount : innerTodoCount.value));

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElCard = __forwarded_ElCard;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElIcon = __forwarded_ElIcon;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTabs = __forwarded_ElTabs;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ArrowLeft = __forwarded_ArrowLeft;
</script>

<template>
  <div class="h-full flex flex-col gap-12px overflow-hidden">
    <!-- 顶部：返回箭头 + 标题 + Tab -->
    <ElCard shadow="never" class="flow-card rounded-8px" body-class="flow-header">
      <div class="flex items-center">
        <ElButton text circle size="small" title="返回首页" @click="backToHome">
          <ElIcon :size="18"><ArrowLeft /></ElIcon>
        </ElButton>
        <div class="flow-title ml-4px">我的流程</div>
        <div class="flex flex-1 justify-center">
          <!-- 标签文字必须走 #label 插槽：ElTabPane 默认插槽是面板内容而非页签文字 -->
          <ElTabs :model-value="props.active" class="flow-tabs" @tab-change="handleTabChange">
            <ElTabPane v-for="tab in tabs" :key="tab.key" :name="tab.key">
              <template #label>
                <span class="flow-tab-label">
                  {{ tab.label }}
                  <!-- 角标常占位、宽度固定：数量异步到达时只切换可见性，避免标签位移 -->
                  <span
                    v-if="tab.key === 'todo'"
                    class="flow-tab-badge"
                    :class="{ 'flow-tab-badge--hidden': badgeCount <= 0 }"
                  >
                    {{ badgeCount > 0 ? (badgeCount > 99 ? '99+' : badgeCount) : '' }}
                  </span>
                </span>
              </template>
            </ElTabPane>
          </ElTabs>
        </div>
        <div class="w-80px"></div>
      </div>
    </ElCard>

    <!-- 筛选区：条件默认为空直接分页展示，填写后按条件查询 -->
    <ElCard shadow="never" class="flow-card rounded-8px">
      <div class="flow-filter-row">
        <slot name="filter"></slot>
      </div>
      <div class="mt-12px flex items-center justify-between">
        <div class="text-13px text-gray-500">{{ totalText }}</div>
        <div class="flex gap-12px">
          <ElButton @click="emit('clear')">
            <span class="mr-1">✕</span>
            清空
          </ElButton>
          <ElButton type="primary" @click="emit('search')">查 询</ElButton>
        </div>
      </div>
    </ElCard>

    <!-- 表格 -->
    <ElCard shadow="never" class="flow-card min-h-0 flex-1 overflow-hidden rounded-8px" body-class="flow-table-body">
      <slot></slot>
    </ElCard>
  </div>
</template>

<style scoped>
/* perfect 版为无边框 NCard + shadow-sm；EP 的 ElCard 自带 1px 边框，这里去掉只留浅阴影 */
.flow-card {
  border: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.flow-title {
  color: #1d2129;
  font-size: 17px;
  font-weight: 600;
  white-space: nowrap;
  width: 80px;
}

:deep(.flow-header) {
  padding-top: 4px;
  padding-bottom: 0;
}

/* 页签条按内容收缩后居中，标尺线不比标签长出一大截 */
.flow-tabs {
  width: fit-content;
}

.flow-tab-label {
  align-items: center;
  display: inline-flex;
  gap: 4px;
  white-space: nowrap;
}

/* 角标宽度固定（含 99+），保证标签总宽在角标数据到达前后完全一致，下标线不会偏位 */
.flow-tab-badge {
  background: #fdcb2e;
  border-radius: 9px;
  box-sizing: border-box;
  color: #fff;
  flex-shrink: 0;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  width: 28px;
}

.flow-tab-badge--hidden {
  visibility: hidden;
}

.flow-filter-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  justify-content: center;
}

/* 查询条件分组不参与压缩：空间不足时整组换到下一行，而不是把"流程名称"这类标签挤断行 */
.flow-filter-row > * {
  flex-shrink: 0;
}

/* 表格卡片主体撑满卡片，让 DataTable 的 flex-height 生效 */
:deep(.flow-table-body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
</style>
