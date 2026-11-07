<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { findDatavScreenDetail, saveDatavScreen } from '@/service';
import { useDatavStore } from '@/store';
import { useCanvasFit } from '@/hooks/datav/useCanvasFit';
import { useCanvasViewport } from '@/hooks/datav/useCanvasViewport';
import { customPaletteVars } from '@/utils/datav-schema';
import { allWidgets, categories, createWidgetFromMeta, getWidgetMeta } from '@/packages/components/registry';
import type { WidgetMeta } from '@/packages/components/protocol';
import DatavCanvasStage from '@/components/datav/canvas-stage/index.vue';
import DatavCanvasRuler from '@/components/datav/canvas-ruler/index.vue';
import DatavLayerPanel from '@/components/datav/layer-panel/index.vue';
import DatavCanvasContextMenu from '@/components/datav/canvas-context-menu/index.vue';
import type { MenuItem } from '@/components/datav/canvas-context-menu/index.vue';
import DatavCanvasPanel from '@/components/datav/canvas-panel/index.vue';
import DatavAssetLibrary from '@/components/datav/asset-library/index.vue';
import DatavEmpty from '@/components/datav/datav-empty.vue';
import DatavWidgetPanel from '@/components/datav/widget-panel/index.vue';
import DatavConfigForm from '@/components/datav/config-form/index.vue';
import DatavDatasetBinding from '@/components/datav/dataset-binding/index.vue';
import DatavDataPipelinePanel from '@/components/datav/data-pipeline-panel/index.vue';

defineOptions({ name: 'DatavDesigner' });

const route = useRoute();
const router = useRouter();
const store = useDatavStore();

const saving = ref(false);
const loadFailed = ref(false);
const autoSave = ref(true);

const widgetGroups = categories();
const widgetCount = computed(() => allWidgets().length);

/** 图层面板显隐：编辑器本地偏好（不进 schema，记在 localStorage），隐藏时左栏收成单列给组件列表让宽 */
const LAYER_VISIBLE_KEY = 'datav-layer-visible';
const layerVisible = ref((localStorage.getItem(LAYER_VISIBLE_KEY) ?? '1') !== '0');

function toggleLayerPanel() {
  layerVisible.value = !layerVisible.value;
  localStorage.setItem(LAYER_VISIBLE_KEY, layerVisible.value ? '1' : '0');
}

/** 组件栏搜索：42+ 组件后靠肉眼找分类已经不现实；按名称与 type 前缀模糊匹配 */
const widgetSearch = ref('');
const filteredGroups = computed(() => {
  const keyword = widgetSearch.value.trim().toLowerCase();
  if (!keyword) return widgetGroups;
  return widgetGroups
    .map(group => ({
      ...group,
      widgets: group.widgets.filter(
        item => item.name.toLowerCase().includes(keyword) || item.type.toLowerCase().includes(keyword)
      )
    }))
    .filter(group => group.widgets.length > 0);
});

/** 编码优先取查询串 ?code=，兼容 /datav-designer/{code} 形式，与现有报表页取法一致 */
const screenCode = computed(() => {
  const fromQuery = route.query.code;
  if (typeof fromQuery === 'string' && fromQuery !== '') return fromQuery;
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments[0] === 'datav-designer' && segments.length >= 2) return segments[1];
  return '';
});

const { containerRef, scale: fitScale } = useCanvasFit(() => store.schema.canvas);

// ———— 5.7 视口：Ctrl+滚轮缩放（锚住光标）、空格/中键拖拽平移 ————
const viewport = useCanvasViewport({
  containerRef,
  getFitScale: () => fitScale.value,
  getStageEl: () => containerRef.value?.querySelector('[data-stage]') ?? null
});

/** 设计稿 → 屏幕的总比例：适配缩放 × 用户缩放，画布的占位尺寸也由它撑开 */
const stageScale = computed(() => fitScale.value * viewport.zoom.value);
/** 画布框：占位尺寸按缩放比，位置由视口的 transform 平移驱动（无滚动边界，拖到哪画布到哪） */
const stageBoxStyle = computed(() => ({
  width: `${store.schema.canvas.width * stageScale.value}px`,
  height: `${store.schema.canvas.height * stageScale.value}px`,
  transform: viewport.panStyle.value.transform
}));

const showRuler = ref(true);
const menu = ref<{ x: number; y: number; items: MenuItem[]; widgetId?: string } | null>(null);

/** 标尺原点：设计稿 (0,0) 落在屏幕哪儿，等于舞台 rect 减滚动容器 rect */
const rulerOrigin = computed(() => {
  const stage = viewport.stageRect.value;
  const box = viewport.containerRect.value;
  return { x: stage && box ? stage.left - box.left : 0, y: stage && box ? stage.top - box.top : 0 };
});

function menuItems(widgetId?: string): MenuItem[] {
  const hasTarget = Boolean(widgetId) || store.selectedIds.length > 0;
  const target = widgetId ? store.schema.widgets.find(item => item.id === widgetId) : null;
  return [
    { key: 'copy', label: '复制', disabled: !hasTarget },
    { key: 'paste', label: '粘贴', disabled: !store.hasClipboard },
    { key: 'duplicate', label: '原地复制', disabled: !hasTarget },
    { key: 'delete', label: '删除', disabled: !hasTarget, danger: true, divided: true },
    { key: 'front', label: '置于顶层', disabled: !hasTarget },
    { key: 'back', label: '置于底层', disabled: !hasTarget },
    { key: 'lock', label: target?.layout.locked ? '解锁' : '锁定', disabled: !hasTarget, divided: true },
    { key: 'hide', label: target?.layout.hidden ? '显示' : '隐藏', disabled: !hasTarget }
  ];
}

function openMenu(event: MouseEvent, widgetId?: string) {
  event.preventDefault();
  if (widgetId && !store.selectedIds.includes(widgetId)) {
    // 先选中再弹菜单：菜单项的可用状态是按选中集合算的
    store.select([widgetId]);
  }
  menu.value = { x: event.clientX, y: event.clientY, items: menuItems(widgetId), widgetId };
}

function onMenuPick(key: string) {
  const target = menu.value?.widgetId;
  menu.value = null;
  const ids = target ? [target] : store.selectedIds;
  if (key !== 'paste') store.select(ids);
  switch (key) {
    case 'copy':
      store.copySelected();
      break;
    case 'paste':
      store.pasteClipboard();
      break;
    case 'duplicate':
      store.duplicateSelected();
      break;
    case 'delete':
      store.removeSelected();
      break;
    case 'front':
      store.bringToFront();
      break;
    case 'back':
      store.sendToBack();
      break;
    case 'lock':
      store.toggleLockSelected();
      break;
    case 'hide':
      store.toggleHiddenSelected();
      break;
    default:
      break;
  }
}

function onViewportPointerDown(event: PointerEvent) {
  // 画布框以外的工作台空白：左键直接拖拽即平移（画布内左键是框选/选中，按落点分流不冲突）；
  // 空格/中键在任何位置都能平移，由 tryBeginPan 自己判定
  const target = event.target as Element | null;
  const onWorkspace = event.button === 0 && Boolean(target) && !target!.closest('.datav-stage-frame');
  if (viewport.tryBeginPan(event, onWorkspace)) {
    // 平移吃掉这一帧：否则空格拖拽会同时在画布上拉出一个框选
    event.stopPropagation();
  }
}

/** 只单选时给组件属性面板 */
const singleSelected = computed<DatavNamespace.Widget | null>(() =>
  store.selectedIds.length === 1 ? (store.selectedWidgets[0] ?? null) : null
);

/* 属性面板分页：样式字段与 data.* 映射字段分列两页，绑定面板并入数据页 */
const widgetTab = ref('base');
const widgetMeta = computed(() => getWidgetMeta(singleSelected.value?.type ?? ''));
const widgetStyleFields = computed(() => widgetMeta.value.fields.filter(field => !field.key.startsWith('data.')));
const widgetDataFields = computed(() => widgetMeta.value.fields.filter(field => field.key.startsWith('data.')));
const widgetDataTabVisible = computed(
  () => widgetMeta.value.supportData !== false || widgetDataFields.value.length > 0
);
watch(singleSelected, () => {
  widgetTab.value = 'base';
});

async function load() {
  if (!screenCode.value) {
    loadFailed.value = true;
    window.$message?.error('缺少大屏编码');
    return;
  }
  const res = await findDatavScreenDetail(screenCode.value);
  if (res.error === null && res.data) {
    store.loadScreen(res.data);
    return;
  }
  loadFailed.value = true;
  window.$message?.error(res.error?.message || '大屏加载失败');
}

async function save(silent = false) {
  if (saving.value) return;
  // 滑块改动是延后压栈的，保存前先落栈，免得存完之后撤销跳过头
  store.flushStyleCommit();
  saving.value = true;
  const res = await saveDatavScreen(store.buildSaveRequest());
  saving.value = false;
  if (res.error === null && res.data) {
    store.markSaved(res.data.screenCode);
    if (!silent) window.$message?.success('已保存');
    return;
  }
  if (!silent) window.$message?.error(res.error?.message || '保存失败');
}

function addWidget(meta: WidgetMeta) {
  store.addWidget(createWidgetFromMeta(meta, store.schema.canvas, store.schema.widgets.length + 1));
}
/** 素材落点：选中的是图片/视频/轮播组件就写它的数据源，否则写画布背景图 */
const assetLibraryVisible = ref(false);

function onUseAsset(asset: DatavNamespace.DatavAsset) {
  const target = store.selectedWidgets.find(item =>
    ['medias.image', 'medias.video', 'medias.carousel'].includes(item.type)
  );
  if (target) {
    if (target.type === 'medias.carousel') {
      const style = (target.style ?? {}) as Record<string, unknown>;
      const current = Array.isArray(style.images) ? (style.images as string[]) : [];
      store.updateWidgetStyle(target.id, { images: [...current, asset.fileUrl] });
    } else {
      store.updateWidgetStyle(target.id, { src: asset.fileUrl });
    }
    window.$message?.success(`已写入组件「${target.name}」`);
    return;
  }
  store.patchCanvas({
    background: { ...store.schema.canvas.background, type: 'image', value: asset.fileUrl }
  });
  window.$message?.success('已设为画布背景');
}

function onSelect(ids: string[], additive: boolean) {
  store.select(ids, additive);
}

/** 方向键微调向量（配合 shift 的 10px 步长） */
const NUDGE_VECTORS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }
};

/** 无修饰键的编辑操作，返回是否已消费该按键（与原 switch 的 case + return 一致） */
function handlePlainKey(event: KeyboardEvent): boolean {
  if (event.key === 'Escape') {
    store.clearSelection();
    return true;
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (store.hasSelection) {
      event.preventDefault();
      store.removeSelected();
    }
    return true;
  }
  const vector: { x: number; y: number } | undefined = NUDGE_VECTORS[event.key];
  if (!vector) return false;
  if (store.hasSelection) {
    const step = event.shiftKey ? 10 : 1;
    event.preventDefault();
    store.nudgeSelected(vector.x * step, vector.y * step);
  }
  return true;
}

/** 图层移动：forward 对应 `]`（上移），shift 为置顶/置底 */
function moveLayer(forward: boolean, shift: boolean) {
  if (forward) {
    if (shift) store.bringToFront();
    else store.bringForward();
    return;
  }
  if (shift) store.sendToBack();
  else store.sendBackward();
}

/** Ctrl/Cmd 编辑类组合键，返回是否已处理 */
function handleEditHotkey(event: KeyboardEvent, key: string, shift: boolean): boolean {
  if (key === 'z') {
    event.preventDefault();
    if (shift) store.redo();
    else store.undo();
    return true;
  }
  if (key === 'y') {
    event.preventDefault();
    store.redo();
    return true;
  }
  if (key === 'c') {
    // 复制不拦截默认行为，保留浏览器原生复制
    store.copySelected();
    return true;
  }
  if (key === 'v') {
    event.preventDefault();
    store.pasteClipboard();
    return true;
  }
  if (key === 'a') {
    event.preventDefault();
    store.selectAll();
    return true;
  }
  if (key === 'g') {
    event.preventDefault();
    if (shift) store.ungroupSelected();
    else store.groupSelected();
    return true;
  }
  if (key === 'd') {
    event.preventDefault();
    store.duplicateSelected();
    return true;
  }
  if (key === 's') {
    // 不拦就是浏览器的「保存网页」对话框，而这里保存的就是正在编辑的东西
    event.preventDefault();
    save();
    return true;
  }
  if (key === 'l' && !shift) {
    event.preventDefault();
    store.toggleLockSelected();
    return true;
  }
  if (key === 'h' && !shift) {
    event.preventDefault();
    store.toggleHiddenSelected();
    return true;
  }
  return false;
}

/** Ctrl/Cmd 视图与层级组合键 */
function handleViewHotkey(event: KeyboardEvent, key: string, shift: boolean) {
  if (key === '0') {
    event.preventDefault();
    viewport.resetView();
    return;
  }
  if (key === '=' || key === '+') {
    event.preventDefault();
    viewport.zoomBy(1.2);
    return;
  }
  if (key === '-') {
    event.preventDefault();
    viewport.zoomBy(1 / 1.2);
    return;
  }
  if (key === ']' || key === '[') {
    if (!store.hasSelection) return;
    event.preventDefault();
    moveLayer(key === ']', shift);
  }
}

/** 键盘操纵：编辑框内不拦截，否则打字会被当成方向键微调 */
function onKeyDown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
  if (target?.isContentEditable) return;

  if (handlePlainKey(event)) return;

  const meta = event.ctrlKey || event.metaKey;
  if (!meta) return;

  const key = event.key.toLowerCase();
  if (handleEditHotkey(event, key, event.shiftKey)) return;
  handleViewHotkey(event, key, event.shiftKey);
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!store.dirty) return;
  event.preventDefault();
  event.returnValue = '';
}

/** 自动保存：45s 一轮，只在脏时提交；失败保持脏标记等下一轮重试 */
let autoTimer: number | undefined;

watch(autoSave, enabled => {
  if (!enabled && autoTimer !== undefined) {
    window.clearInterval(autoTimer);
    autoTimer = undefined;
  }
});

onMounted(async () => {
  await load();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('beforeunload', onBeforeUnload);
  autoTimer = window.setInterval(() => {
    if (autoSave.value && store.dirty && !saving.value) save(true);
  }, 45_000);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('beforeunload', onBeforeUnload);
  if (autoTimer !== undefined) window.clearInterval(autoTimer);
});

async function goBack() {
  if (store.dirty) {
    try {
      await ElMessageBox.confirm('有未保存的修改，确定离开？', '离开编辑器', { type: 'warning' });
    } catch {
      return;
    }
  }
  router.push({ path: '/dynamic/datav' });
}

/** 页签上显示组件数：设计者要靠它判断某一页是不是空的（空页轮播时会被跳过） */
function pageWidgetCount(pageId: string): number {
  return store.schema.widgets.filter(item => (item.pageId ?? store.pages[0]?.id) === pageId).length;
}

async function renamePage(page: DatavNamespace.ScreenPage) {
  try {
    const { value } = await ElMessageBox.prompt('页面名称', '重命名页面', {
      inputValue: page.name,
      inputValidator: (text: string) => (text && text.trim() !== '' ? true : '名称不能为空')
    });
    store.renamePage(page.id, String(value ?? ''));
  } catch {
    /* 取消不是错误 */
  }
}

async function removeCurrentPage() {
  const page = store.pages.find(item => item.id === store.activePageId);
  if (!page || store.pages.length <= 1) return;
  const count = pageWidgetCount(page.id);
  try {
    await ElMessageBox.confirm(
      count > 0
        ? `删除「${page.name}」会连带删掉该页的 ${count} 个组件，且不可自动恢复（可用撤销回退）。`
        : `删除「${page.name}」？`,
      '删除页面',
      { type: 'warning' }
    );
  } catch {
    return;
  }
  store.removePage(page.id);
}

function openPreview() {
  const code = store.screenCode;
  if (!code) return;
  window.open(`${window.location.origin}/datav-preview?code=${code}`, '_blank');
}
</script>

<template>
  <div
    class="datav-scope h-full flex-col overflow-hidden p-12px"
    :data-datav-theme="store.schema.canvas.theme"
    :data-datav-palette="store.schema.canvas.palette"
    :style="customPaletteVars(store.schema.canvas)"
  >
    <div v-if="loadFailed" class="h-full flex items-center justify-center">
      <ElEmpty description="大屏加载失败或不存在">
        <ElButton @click="goBack">返回列表</ElButton>
      </ElEmpty>
    </div>

    <template v-else>
      <div class="mb-10px flex flex-wrap items-center gap-10px">
        <ElButton size="small" text @click="goBack">← 返回</ElButton>
        <ElInput v-model="store.screenName" size="small" class="w-220px" placeholder="大屏名称" />
        <ElTag size="small" :type="store.dirty ? 'warning' : 'success'" effect="plain">
          {{ store.dirty ? '未保存' : '已保存' }}
        </ElTag>
        <div class="flex-1"></div>
        <ElButtonGroup size="small">
          <ElButton :disabled="!store.canUndo" @click="store.undo()">撤销</ElButton>
          <ElButton :disabled="!store.canRedo" @click="store.redo()">重做</ElButton>
        </ElButtonGroup>
        <ElButtonGroup size="small">
          <ElButton :disabled="store.selectedIds.length < 2" @click="store.copySelected()">复制</ElButton>
          <ElButton :disabled="!store.clipboard.length" @click="store.pasteClipboard()">粘贴</ElButton>
          <ElButton :disabled="store.selectedIds.length < 2" @click="store.groupSelected()">成组</ElButton>
          <ElButton :disabled="!store.hasSelection" @click="store.ungroupSelected()">解组</ElButton>
          <ElButton :disabled="!store.hasSelection" type="danger" plain @click="store.removeSelected()">删除</ElButton>
        </ElButtonGroup>
        <ElCheckbox v-model="autoSave" size="small">自动保存</ElCheckbox>
        <ElButton size="small" :type="layerVisible ? 'primary' : 'default'" plain @click="toggleLayerPanel">
          {{ layerVisible ? '隐藏图层' : '图层' }}
        </ElButton>
        <ElButton size="small" @click="assetLibraryVisible = true">素材</ElButton>
        <ElButton size="small" @click="openPreview">预览</ElButton>
        <ElButton type="primary" size="small" :loading="saving" @click="save()">保存</ElButton>
      </div>

      <!--
        页签条。切页只是换视图，不进撤销栈；但增删页、改名、把选中组件挪页都是画布改动，
        走 store 的 commit 进历史。删除会连带删掉该页组件，所以必须二次确认。
      -->
      <div class="datav-pagebar flex flex-wrap items-center gap-6px py-6px">
        <button
          v-for="page in store.pages"
          :key="page.id"
          type="button"
          class="datav-pagebar__tab"
          :class="{ 'is-active': page.id === store.activePageId }"
          @click="store.setCurrentPage(page.id)"
          @dblclick="renamePage(page)"
        >
          {{ page.name }}
          <span class="datav-pagebar__count">{{ pageWidgetCount(page.id) }}</span>
        </button>
        <button type="button" class="datav-pagebar__tab datav-pagebar__tab--add" @click="store.addPage()">
          + 新页
        </button>
        <span class="flex-1"></span>
        <ElSelect
          v-if="store.pages.length > 1 && store.hasSelection"
          size="small"
          class="w-140px"
          placeholder="选中组件移到"
          @change="(v: unknown) => store.moveSelectedToPage(String(v ?? ''))"
        >
          <ElOption v-for="page in store.pages" :key="page.id" :label="page.name" :value="page.id" />
        </ElSelect>
        <ElButton size="small" text :disabled="store.pages.length <= 1" @click="removeCurrentPage()">删除本页</ElButton>
        <ElCheckbox
          :model-value="store.schema.rotation?.enabled === true"
          size="small"
          @update:model-value="(v: unknown) => store.patchRotation({ enabled: v === true })"
        >
          轮播
        </ElCheckbox>
        <span v-if="store.schema.rotation?.enabled" class="flex items-center gap-4px text-12px">
          每页
          <ElInputNumber
            :model-value="store.schema.rotation.intervalSec"
            :min="5"
            :max="600"
            :step="5"
            size="small"
            class="w-92px"
            @update:model-value="(v: unknown) => store.patchRotation({ intervalSec: Number(v) || 10 })"
          />
          秒
        </span>
      </div>

      <ElAlert
        v-if="store.schemaWarnings.length"
        class="mb-10px"
        type="warning"
        closable
        show-icon
        title="画布配置做过兼容性处理"
      >
        <ul class="m-0 pl-16px">
          <li v-for="(item, index) in store.schemaWarnings" :key="index">{{ item }}</li>
        </ul>
      </ElAlert>

      <div class="min-h-0 flex flex-1 gap-10px">
        <!-- 左侧：组件与图层并列两列（图层可经顶部按钮隐藏，隐藏后组件列表独占整栏） -->
        <div :class="layerVisible ? 'w-440px' : 'w-220px'" class="min-h-0 flex flex-shrink-0 gap-10px transition-all">
          <div
            :class="layerVisible ? 'w-1/2' : 'w-full'"
            class="datav-panel min-h-0 flex flex-col overflow-hidden p-10px"
          >
            <div class="mb-8px flex items-center justify-between">
              <span class="text-13px font-600">组件（{{ widgetCount }}）</span>
            </div>
            <ElInput
              v-model="widgetSearch"
              size="small"
              class="mb-8px"
              clearable
              placeholder="搜索组件"
              aria-label="搜索组件"
            />
            <div class="min-h-0 flex-1 overflow-auto">
              <div v-for="group in filteredGroups" :key="group.label" class="widget-group mb-12px">
                <div class="mb-4px text-12px opacity-60">{{ group.label }}</div>
                <ElButton
                  v-for="item in group.widgets"
                  :key="item.type"
                  class="mb-4px w-full justify-start"
                  size="small"
                  text
                  :title="`${item.name}（${item.type}）`"
                  :aria-label="`添加组件 ${item.name}`"
                  @click="addWidget(item)"
                >
                  <!--
 图标槽固定宽度：没有图标/图标未加载完的组件与有图标的对不齐，
                       表现为同组内每个组件的缩进不一样 
-->
                  <span class="mr-4px w-16px inline-flex flex-shrink-0 items-center justify-center">
                    <SvgIcon v-if="item.icon" :icon="item.icon" class="text-15px" />
                  </span>
                  <span class="truncate">{{ item.name }}</span>
                </ElButton>
              </div>
              <div
                v-if="!filteredGroups.length"
                class="py-12px text-center text-12px text-[var(--datav-text-secondary)]"
              >
                没有匹配的组件
              </div>
            </div>
          </div>

          <div v-if="layerVisible" class="datav-panel min-h-0 w-1/2 flex flex-col overflow-hidden">
            <DatavLayerPanel
              :widgets="store.pageWidgets"
              :selected-ids="store.selectedIds"
              @select="store.select"
              @rename="store.renameWidget"
              @toggle-lock="store.toggleLock"
              @toggle-hidden="store.toggleHidden"
              @move="store.moveLayer"
            />
          </div>
        </div>

        <div class="relative min-h-0 min-w-0 flex flex-col flex-1">
          <div class="relative min-h-0 flex-1">
            <div
              ref="containerRef"
              class="datav-panel datav-stage-workspace absolute inset-0 overflow-hidden p-40px"
              :class="{ 'cursor-grabbing': viewport.panning.value }"
              @wheel="viewport.onWheel"
              @pointerdown.capture="onViewportPointerDown"
              @contextmenu="openMenu($event)"
            >
              <div
                class="datav-stage-frame relative mx-auto"
                :style="stageBoxStyle"
                @contextmenu.stop="openMenu($event)"
              >
                <div
                  v-if="!store.pageWidgets.length"
                  class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4px opacity-90"
                >
                  <DatavEmpty text="从左侧组件栏点击添加第一个组件" :size="140" />
                </div>
                <DatavCanvasStage
                  :widgets="store.pageWidgets"
                  :canvas="store.schema.canvas"
                  :scale="stageScale"
                  :selected-ids="store.selectedIds"
                  :resolve-members="store.dragMembersOf"
                  @select="onSelect"
                  @widget-contextmenu="(id: string, event: MouseEvent) => openMenu(event, id)"
                  @clear-select="store.clearSelection()"
                  @commit="store.updateManyLayouts"
                />
              </div>
            </div>
            <DatavCanvasRuler
              :scale="stageScale"
              :origin-x="rulerOrigin.x"
              :origin-y="rulerOrigin.y"
              :width="store.schema.canvas.width"
              :height="store.schema.canvas.height"
              :guides="store.schema.canvas.guides ?? []"
              :enabled="showRuler"
              @add="store.addGuide"
              @move="store.updateGuide"
              @remove="store.removeGuide"
            />
          </div>
          <div class="flex flex-wrap items-center gap-10px px-16px py-8px">
            <span class="text-12px opacity-60">
              设计稿 {{ store.schema.canvas.width }}×{{ store.schema.canvas.height }} ·
              {{ store.schema.widgets.length }} 个组件 · 选中 {{ store.selectedIds.length }} · 撤销
              {{ store.historyStats.index + 1 }}/{{ store.historyStats.steps }} 步 ·
              {{ (store.historyStats.bytes / 1048576).toFixed(1) }}MB
            </span>
            <span class="text-12px opacity-45" title="画布框以外的空白处按住左键拖动即可平移；画布内拖动是框选">
              · 空白处拖拽 / 空格拖拽 / 中键拖拽平移 · Ctrl+滚轮缩放
            </span>
            <div class="flex-1"></div>
            <div class="flex items-center gap-4px">
              <ElButton size="small" text @click="viewport.zoomBy(1 / 1.2)">−</ElButton>
              <span class="w-56px text-center text-12px">{{ (stageScale * 100).toFixed(0) }}%</span>
              <ElButton size="small" text @click="viewport.zoomBy(1.2)">＋</ElButton>
              <ElButton size="small" text title="Ctrl+0 复位视图" @click="viewport.resetView()">复位</ElButton>
            </div>
            <ElButtonGroup size="small">
              <ElButton :disabled="store.selectedIds.length < 2" title="左对齐" @click="store.alignSelected('left')">
                左
              </ElButton>
              <ElButton
                :disabled="store.selectedIds.length < 2"
                title="水平居中"
                @click="store.alignSelected('hcenter')"
              >
                横中
              </ElButton>
              <ElButton :disabled="store.selectedIds.length < 2" title="右对齐" @click="store.alignSelected('right')">
                右
              </ElButton>
              <ElButton :disabled="store.selectedIds.length < 2" title="顶对齐" @click="store.alignSelected('top')">
                上
              </ElButton>
              <ElButton
                :disabled="store.selectedIds.length < 2"
                title="垂直居中"
                @click="store.alignSelected('vcenter')"
              >
                纵中
              </ElButton>
              <ElButton :disabled="store.selectedIds.length < 2" title="底对齐" @click="store.alignSelected('bottom')">
                下
              </ElButton>
            </ElButtonGroup>
            <ElButtonGroup size="small">
              <ElButton :disabled="store.selectedIds.length < 3" @click="store.distributeSelected('x')">
                横等距
              </ElButton>
              <ElButton :disabled="store.selectedIds.length < 3" @click="store.distributeSelected('y')">
                纵等距
              </ElButton>
            </ElButtonGroup>
            <ElButton size="small" text @click="showRuler = !showRuler">
              {{ showRuler ? '隐藏标尺' : '显示标尺' }}
            </ElButton>
            <ElButton v-if="store.schema.canvas.guides?.length" size="small" text @click="store.clearGuides()">
              清除辅助线
            </ElButton>
          </div>
        </div>

        <div class="datav-panel w-300px flex-shrink-0 overflow-auto p-12px">
          <template v-if="singleSelected">
            <div class="mb-8px flex items-center justify-between gap-8px">
              <span class="text-13px font-600">组件属性</span>
              <span class="truncate text-11px opacity-50">{{ singleSelected.name }}</span>
            </div>
            <!--
              属性按「基础 / 样式 / 数据」分页：42 类组件的字段全铺在一个滚动列里，
              面板动辄两三屏，找一项要滚很久。数据页签聚合绑定面板与 data.* 映射字段。
            -->
            <ElTabs v-model="widgetTab" class="datav-prop-tabs">
              <ElTabPane label="基础" name="base">
                <DatavWidgetPanel :widget="singleSelected" />
              </ElTabPane>
              <ElTabPane label="样式" name="style">
                <DatavConfigForm v-if="widgetStyleFields.length" :fields="widgetStyleFields" :widget="singleSelected" />
                <div v-else class="py-8px text-12px opacity-60">该组件没有样式配置项</div>
              </ElTabPane>
              <ElTabPane v-if="widgetDataTabVisible" label="数据" name="data">
                <DatavDatasetBinding v-if="widgetMeta.supportData !== false" :widget="singleSelected" />
                <!-- 数据加工（前端行级过滤/排序/Top N）：静态与数据集结果统一生效，与上方 SQL 侧过滤互补 -->
                <DatavDataPipelinePanel
                  v-if="widgetMeta.supportData !== false"
                  class="mt-10px"
                  :widget="singleSelected"
                />
                <DatavConfigForm
                  v-if="widgetDataFields.length"
                  class="mt-10px"
                  :fields="widgetDataFields"
                  :widget="singleSelected"
                />
                <div v-if="widgetMeta.supportData === false" class="mt-8px text-12px opacity-50">
                  该组件为纯展示组件，不需要绑定数据
                </div>
              </ElTabPane>
            </ElTabs>
          </template>
          <div v-else-if="store.hasSelection" class="text-12px opacity-60">
            已选中
            {{ store.selectedIds.length }} 个组件，可整体移动与对齐；点选单个组件编辑它的属性，取消选中回到画布属性
          </div>
          <template v-else>
            <div class="mb-8px text-13px font-600">画布属性</div>
            <DatavCanvasPanel />
            <div class="mt-14px text-12px opacity-60">
              点选组件编辑属性；拖拽移动、拖角缩放、顶部圆点旋转，Shift 加选、空白处拖动框选
            </div>
          </template>
        </div>
      </div>

      <DatavCanvasContextMenu
        v-if="menu"
        :x="menu.x"
        :y="menu.y"
        :items="menu.items"
        @pick="onMenuPick"
        @close="menu = null"
      />
    </template>

    <DatavAssetLibrary v-model:visible="assetLibraryVisible" @use="onUseAsset" />
  </div>
</template>

<style scoped>
/* EP 相邻按钮的默认规则 .el-button + .el-button { margin-left: 12px } 会把组件列表里
   每组第 2 项起整体右推 12px，表现为同组内组件缩进参差；这里显式清零 */
.widget-group :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
