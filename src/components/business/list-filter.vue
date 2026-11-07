<script setup lang="ts">
import { computed, nextTick, ref, useSlots } from 'vue';
import { ElButton as __forwarded_ElButton, ElSpace as __forwarded_ElSpace } from 'element-plus';
import { DeleteOutlined as __forwarded_DeleteOutlined, PlusOutlined as __forwarded_PlusOutlined } from '@vicons/antd';
import {
  FunnelOutline as __forwarded_FunnelOutline,
  SearchOutline as __forwarded_SearchOutline
} from '@vicons/ionicons5';
import { useFormCommandStore } from '@/store';

export interface Props {
  /** 关键字 */
  keyword: string;
  /** 权限：添加 */
  permissionAdd: string;
  showAdd?: boolean;
  /** 权限：删除 */
  permissionRemove: string;
  showRemove?: boolean;
  /** 权限：导出 */
  permissionExport: string;
  showExport?: boolean;
  /** 权限：导入 */
  permissionImport: string;
  showImport?: boolean;
  /** 是否工作流控制按钮 */
  workflowControl?: boolean;
  /** 是否显示操作按钮 */
  showOperation?: boolean;
  /** 隐藏按钮后显示的内容 */
  operationTitle?: string;
  /** 是否显示标题 */
  showTitle?: boolean;
}

defineOptions({ name: 'ListFilter' });
const props = withDefaults(defineProps<Props>(), {
  permissionAdd: '',
  showAdd: true,
  permissionRemove: '',
  showRemove: true,
  permissionExport: '',
  showExport: true,
  permissionImport: '',
  showImport: true,
  operationTitle: '',
  showOperation: true,
  showTitle: true,
  workflowControl: false
});

interface Emits {
  (e: 'update:keyword', data: any): void;
  (e: 'search', data: any): void;
  (e: 'reset', data: any): void;
  (e: 'keywordSearch', data: any): void;
  (e: 'keywordClear', data: any): void;
  (e: 'add', data: any): void;
  (e: 'delete', data: any): void;
  (e: 'import', data: any): void;
  (e: 'export', data: any): void;
}

const emit = defineEmits<Emits>();
const keywords = computed({
  get() {
    return props.keyword;
  },
  set(keyword) {
    emit('update:keyword', keyword);
  }
});
const formStore = useFormCommandStore();
const slots = useSlots();
const showFilter = ref(false);
/** 筛选面板容器（展开后挂自动查询监听） */
const filterPanelRef = ref<HTMLElement>();

/** 自动查询：筛选面板内任意条件变化 / 关键字输入后防抖触发 */
let autoSearchTimer: ReturnType<typeof setTimeout> | null = null;
function autoSearch() {
  if (autoSearchTimer) clearTimeout(autoSearchTimer);
  autoSearchTimer = setTimeout(() => {
    autoSearchTimer = null;
    search();
  }, 500);
}

/**
 * 关键字防抖走 keywordSearch 口径而不是 search：
 * 页面的 search 处理器直接拿 formFilter 查询，此刻 keywords 数组还是旧值（只有回车/图标点击才会拆词），
 * 而后端 FilterDTO 只认 keywords 数组、不认 keyword 字符串——走 search 等于不过滤。
 */
function keywordAutoSearch() {
  if (autoSearchTimer) clearTimeout(autoSearchTimer);
  autoSearchTimer = setTimeout(() => {
    autoSearchTimer = null;
    keywordSearch();
  }, 500);
}
/** 页面是否传入筛选字段（无 #filter slot 时隐藏筛选开关） */
const hasFilterSlot = computed(() => Boolean(slots.filter));

/** 搜索 */
function search() {
  emit('search', keywords.value);
}

/** 是否显示搜索条件 */
function showFilterFiled() {
  showFilter.value = !showFilter.value;
  if (!showFilter.value) return;
  // 展开后给面板挂自动查询监听（EP 控件值变化派发的原生 input/change 在捕获阶段统一接住）
  nextTick(() => {
    const panel = filterPanelRef.value;
    if (!panel || panel.dataset.autoSearchBound === '1') return;
    panel.dataset.autoSearchBound = '1';
    panel.addEventListener('change', autoSearch, true);
    panel.addEventListener('input', autoSearch, true);
    panel.addEventListener('keyup', autoSearch, true);
  });
}

/** 关键字搜索 */
function keywordSearch() {
  emit('keywordSearch', keywords.value);
}

/** 清除关键字 */
function keywordClear() {
  emit('keywordClear', '');
}

/** 添加 */
function handleAdd() {
  emit('add', keywords.value);
}

/** 删除 */
function handleDeleteRows() {
  emit('delete', keywords.value);
}

/** 导入 */
function handleImport() {
  emit('import', keywords.value);
}

/** 导出 */
function handleExport() {
  emit('export', keywords.value);
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const DeleteOutlined = __forwarded_DeleteOutlined;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const PlusOutlined = __forwarded_PlusOutlined;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const FunnelOutline = __forwarded_FunnelOutline;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const SearchOutline = __forwarded_SearchOutline;
</script>

<template>
  <div class="flex-col gap-8px">
    <!-- 行1：标题 + 筛选折叠开关（顶层） -->
    <div class="flex items-center justify-between">
      <div v-if="props.showTitle" class="cus-list-title text-15px font-500">{{ operationTitle }}</div>
      <div v-else class="w-1px"></div>
      <ElTooltip v-if="hasFilterSlot" :content="showFilter ? '收起筛选' : '展开筛选'" placement="top">
        <ElButton
          size="small"
          circle
          :type="showFilter ? 'primary' : 'default'"
          :plain="!showFilter"
          @click="showFilterFiled"
        >
          <ElIcon size="15" class="text-15px"><component :is="FunnelOutline" /></ElIcon>
        </ElButton>
      </ElTooltip>
    </div>

    <!-- 行2：筛选面板（上下折叠；条件变化自动查询，面板右下角提供手动"搜索"） -->
    <div v-if="showFilter" class="rounded-4px bg-#f7f8fa px-12px py-12px dark:bg-#26282b">
      <div ref="filterPanelRef" class="flex flex-row justify-start gap-16px">
        <div class="w-100%">
          <slot name="filter"></slot>
        </div>
      </div>
      <div class="flex justify-end pt-8px">
        <ElButton size="small" type="primary" @click="search">
          <ElIcon size="14" class="mr-4px"><component :is="SearchOutline" /></ElIcon>
          搜索
        </ElButton>
      </div>
    </div>

    <!-- 行3：操作按钮（左） + 关键字搜索与扩展工具（右） -->
    <div class="flex items-center justify-between pb-4px">
      <ElSpace v-if="props.showOperation" :size="8" wrap>
        <ElButton
          v-show="(formStore.hasBtnShow('SUBADD') || !workflowControl) && showAdd"
          v-permission="permissionAdd"
          type="primary"
          size="small"
          @click="handleAdd"
        >
          <ElIcon size="20" class="mr-4px text-20px"><component :is="PlusOutlined" /></ElIcon>
          新增
        </ElButton>

        <div
          v-show="(formStore.hasBtnShow('SUBDEL') || !workflowControl) && showRemove"
          v-permission="permissionRemove"
        >
          <!-- EP 的 Popconfirm 正文只认 title prop，默认插槽会被丢弃（naive 写法会得到空白确认框） -->
          <ElPopconfirm
            title="删除后将无法恢复，确认删除选择的数据吗？"
            confirm-button-text="确认"
            cancel-button-text="取消"
            width="260"
            @confirm="handleDeleteRows"
          >
            <template #reference>
              <ElButton tertiary size="small">
                <ElIcon size="20" class="mr-4px text-20px"><component :is="DeleteOutlined" /></ElIcon>
                删除
              </ElButton>
            </template>
          </ElPopconfirm>
        </div>
        <slot name="button"></slot>
        <ElButton
          v-show="(formStore.hasBtnShow('SUBEXPORT') || !workflowControl) && showExport"
          v-permission="permissionExport"
          tertiary
          size="small"
          @click="handleExport"
        >
          <icon-mdi-tray-arrow-up class="mr-4px text-20px" />
          导出
        </ElButton>
        <ElButton
          v-show="(formStore.hasBtnShow('SUBIMPORT') || !workflowControl) && showImport"
          v-permission="permissionImport"
          tertiary
          size="small"
          @click="handleImport"
        >
          <icon-mdi-tray-arrow-down class="mr-4px text-20px" />
          导入
        </ElButton>
      </ElSpace>

      <!-- ml-auto：左侧操作区不渲染（如日志页无新增）时，右侧工具组仍靠右 -->
      <ElSpace align="center" :size="12" class="ml-auto">
        <ElInput
          v-model="keywords"
          placeholder="输入关键字"
          clearable
          size="small"
          class="w-180px"
          @input="keywordAutoSearch"
          @keyup.enter="keywordSearch"
          @clear="keywordClear"
        >
          <template #suffix>
            <ElIcon class="cursor-pointer" @click="keywordSearch"><component :is="SearchOutline" /></ElIcon>
          </template>
        </ElInput>
        <!-- 页面级扩展工具（刷新/列设置等，由 toolbar-extra slot 传入） -->
        <slot name="toolbar-extra"></slot>
      </ElSpace>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
