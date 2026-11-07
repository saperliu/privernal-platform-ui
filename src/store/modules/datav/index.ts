import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { boundingBox as boxOf, computeAligned, computeDistributed } from '@/utils/datav-geometry';
import type { AlignEdge } from '@/utils/datav-geometry';
import {
  DEFAULT_ROTATION_SEC,
  MIN_ROTATION_SEC,
  cloneWidget,
  createEmptySchema,
  createId,
  deepCloneWidget,
  migrateSchema
} from '@/utils/datav-schema';
import { resolvePages } from '@/utils/datav-pages';
import { assembleShards, createSchemaHistory, shardSchema } from '@/utils/datav-history';
import { SetupStoreId } from '@/enum';

/** 历史栈上限：按组件驻留共享后，步数不再是内存的线性因子（验收要求 200 步 < 50MB） */
const HISTORY_LIMIT = 200;

/**
 * 大屏编辑器状态
 *
 * 所有修改都必须走这里的 action，action 内部统一 commit 历史记录。
 * 不给 schema 挂深度 watch 自动记历史——那会在 undo 触发变更时递归写栈。
 */
export const useDatavStore = defineStore(SetupStoreId.Datav, () => {
  /** 大屏元信息（保存时需要一起提交） */
  const screenCode = ref('');
  const screenName = ref('未命名大屏');
  const appId = ref<string | undefined>(undefined);
  const layoutMode = ref<DatavNamespace.LayoutMode>('absolute');
  const status = ref<DatavNamespace.ScreenStatus>(0);
  const thumbnail = ref<string | null>(null);

  const schema = ref<DatavNamespace.ScreenSchema>(createEmptySchema());

  /** schema 归一化时的降级说明，界面上必须显示，不能静默吞掉 */
  const schemaWarnings = ref<string[]>([]);

  /** 当前选中的组件 id */
  const selectedIds = ref<string[]>([]);

  /** 相对最近一次保存/载入是否有改动 */
  const dirty = ref(false);

  /** 复制粘贴用的临时区 */
  const clipboard = ref<DatavNamespace.Widget[]>([]);

  /**
   * 设计态取数缓存：widgetId → 聚合结果。
   *
   * 只活在编辑器里，**不写进 schema、不进历史**——否则一次预览取数就会把几十 KB 的
   * 结果数据存进画布，还会被撤销栈当成一次改动。绑定的语义仍然只有 reportConfig，
   * 缓存是「让人看见数据」而不是「让数据变成配置」。
   */
  const designPreview = ref<Record<string, ReportChartNamespace.AggResult>>({});

  const history = createSchemaHistory(HISTORY_LIMIT);
  const historyIndex = ref(-1);

  const widgets = computed(() => schema.value.widgets);

  const selectedWidgets = computed(() => schema.value.widgets.filter(item => selectedIds.value.includes(item.id)));

  const hasSelection = computed(() => selectedIds.value.length > 0);

  /** 剪贴板有没有东西：粘贴菜单项要按它置灰，否则点了没反应像是坏了 */
  const hasClipboard = computed(() => clipboard.value.length > 0);

  /** 按 z 升序排好的组件，图层面板与渲染都用它 */
  const orderedWidgets = computed(() => [...schema.value.widgets].sort((a, b) => a.layout.z - b.layout.z));

  /**
   * 正在编辑哪一页。这是**视图态**：不进 schema、不进撤销栈——
   * 切页不是画布改动，撤销一次不该把观众（这里是设计者）跳回另一页。
   */
  const currentPageId = ref('');

  const pages = computed(() => resolvePages(schema.value));

  /** 撤销或删页之后当前页可能已经不存在，回落第一页而不是留下一块空白画布 */
  const activePageId = computed(() => {
    const list = pages.value;
    return list.some(page => page.id === currentPageId.value) ? currentPageId.value : (list[0]?.id ?? '');
  });

  /** 当前页的组件（z 升序），画布与图层面板都只认它 */
  const pageWidgets = computed(() =>
    orderedWidgets.value.filter(item => (item.pageId ?? pages.value[0]?.id) === activePageId.value)
  );

  /** 记录一次可撤销的变更 */
  function commit() {
    dirty.value = true;
    historyIndex.value = history.push(shardSchema(schema.value));
  }

  function restoreSnapshot(shards: ReturnType<typeof shardSchema>) {
    const { schema: next, warnings } = migrateSchema(assembleShards(shards));
    schema.value = next;
    schemaWarnings.value = warnings;
    // 撤销后选中项可能已不存在
    const alive = new Set(next.widgets.map(item => item.id));
    selectedIds.value = selectedIds.value.filter(id => alive.has(id));
  }

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.size - 1);

  /** 撤销栈的体量：步数与驻留字节，状态栏与验收都用它 */
  const historyStats = computed(() => ({
    steps: history.size,
    index: historyIndex.value,
    bytes: history.bytes,
    segments: history.segmentCount,
    limit: HISTORY_LIMIT
  }));

  function undo() {
    // 待压的连续写入先落栈，否则撤销会把刚改的值直接跳回更早状态
    flushStyleCommit();
    const shards = history.undo();
    if (!shards) return;
    historyIndex.value = history.index;
    restoreSnapshot(shards);
    dirty.value = true;
  }

  function redo() {
    flushStyleCommit();
    const shards = history.redo();
    if (!shards) return;
    historyIndex.value = history.index;
    restoreSnapshot(shards);
    dirty.value = true;
  }

  /** 载入大屏：历史与脏标记都重置 */
  function loadScreen(screen: DatavNamespace.Screen) {
    const result = migrateSchema(screen.schemaJson);
    schema.value = result.schema;
    schemaWarnings.value = result.warnings;
    screenCode.value = screen.screenCode;
    screenName.value = screen.screenName;
    appId.value = screen.appId;
    layoutMode.value = screen.layoutMode || 'absolute';
    status.value = screen.status ?? 0;
    thumbnail.value = screen.thumbnail ?? null;
    selectedIds.value = [];
    clipboard.value = [];
    currentPageId.value = resolvePages(schema.value)[0]?.id ?? '';
    clearDesignPreview();
    historyIndex.value = history.reset(shardSchema(schema.value));
    dirty.value = false;
  }

  function createBlankScreen(code: string, name = '未命名大屏') {
    schema.value = createEmptySchema();
    schemaWarnings.value = [];
    screenCode.value = code;
    screenName.value = name;
    status.value = 0;
    thumbnail.value = null;
    selectedIds.value = [];
    clipboard.value = [];
    currentPageId.value = resolvePages(schema.value)[0]?.id ?? '';
    clearDesignPreview();
    historyIndex.value = history.reset(shardSchema(schema.value));
    dirty.value = false;
  }

  /** 保存成功后调用，清掉脏标记并把当前状态作为历史基线 */
  /**
   * 保存成功：只清脏标记与补回服务端生成的编码。
   *
   * 刻意不动历史栈——保存不是文档内容的变化。之前这里顺手重置了历史，
   * 表现是编辑器每 45s 自动保存一次就把用户此前的全部可撤销操作清空（端到端实测发现）。
   */
  function markSaved(nextCode?: string) {
    if (nextCode) screenCode.value = nextCode;
    dirty.value = false;
  }

  function patchCanvas(patch: Partial<DatavNamespace.Canvas>) {
    schema.value.canvas = { ...schema.value.canvas, ...patch };
    commit();
  }

  // ==================== 人工辅助线（标尺拖出） ====================

  function addGuide(axis: DatavNamespace.UserGuide['axis'], at: number) {
    const list = schema.value.canvas.guides ?? [];
    schema.value.canvas.guides = [...list, { axis, at: Math.round(at) }];
    commit();
  }

  function updateGuide(index: number, at: number) {
    const list = schema.value.canvas.guides ?? [];
    if (index < 0 || index >= list.length) return;
    const next = [...list];
    next[index] = { ...next[index], at: Math.round(at) };
    schema.value.canvas.guides = next;
    commit();
  }

  function removeGuide(index: number) {
    const list = schema.value.canvas.guides ?? [];
    if (index < 0 || index >= list.length) return;
    schema.value.canvas.guides = list.filter((_item, position) => position !== index);
    commit();
  }

  function clearGuides() {
    if (!schema.value.canvas.guides?.length) return;
    schema.value.canvas.guides = [];
    commit();
  }

  /**
   * 整表替换画布参数。
   *
   * 逐条 patch 会让「改一个参数的编码」产生两条历史（先删后加），而且组件上的
   * paramBindings 是按 code 引用的——中间那一步撤销回来会出现绑定悬空。
   */
  function patchParams(params: DatavNamespace.ScreenParam[]) {
    schema.value.params = params.map(item => ({ ...item }));
    commit();
  }

  function patchGrid(patch: Partial<DatavNamespace.GridConfig>) {
    schema.value.canvas.grid = { ...schema.value.canvas.grid, ...patch };
    commit();
  }

  /** 参数栏 */
  function upsertParam(param: DatavNamespace.ScreenParam) {
    const index = schema.value.params.findIndex(item => item.code === param.code);
    if (index >= 0) {
      schema.value.params.splice(index, 1, param);
    } else {
      schema.value.params.push(param);
    }
    commit();
  }

  function removeParam(code: string) {
    schema.value.params = schema.value.params.filter(item => item.code !== code);
    commit();
  }

  function nextZ(): number {
    return schema.value.widgets.reduce((max, item) => Math.max(max, item.layout.z), 0) + 1;
  }

  /**
   * 添加组件
   *
   * @param type 组件注册表的键
   * @param seed 组件自己的默认 layout/style/data，由注册表提供
   */
  function addWidget(seed: Omit<DatavNamespace.Widget, 'id'> & { id?: string }): DatavNamespace.Widget {
    const widget: DatavNamespace.Widget = {
      ...seed,
      id: seed.id || createId(),
      // 新组件落在当前编辑的页上，而不是永远落在第一页
      pageId: seed.pageId || activePageId.value,
      layout: { ...seed.layout, z: seed.layout.z || nextZ() }
    } as DatavNamespace.Widget;
    schema.value.widgets.push(widget);
    selectedIds.value = [widget.id];
    commit();
    return widget;
  }

  function updateWidget(id: string, patch: Partial<DatavNamespace.Widget>) {
    const target = schema.value.widgets.find(item => item.id === id);
    if (!target) return;
    Object.assign(target, patch);
    commit();
  }

  /** 位置尺寸变更：拖拽过程中不调这个，松手时才调（否则历史栈会被刷屏） */
  function updateWidgetLayout(id: string, patch: Partial<DatavNamespace.Layout>) {
    const target = schema.value.widgets.find(item => item.id === id);
    if (!target) return;
    target.layout = { ...target.layout, ...patch };
    commit();
  }

  function updateWidgetStyle(id: string, patch: DatavNamespace.WidgetStyle) {
    const target = schema.value.widgets.find(item => item.id === id);
    if (!target) return;
    target.style = { ...target.style, ...patch };
    commit();
  }

  /**
   * 面板连续写入（滑块拖动、长按步进）压成一条历史。
   *
   * 口径与画布拖拽一致：过程中只改 schema、不压栈，停手后补一条。不这么做的话
   * 一次滑块拖动就是几十条撤销记录，Ctrl+Z 要按几十次才回到改之前的值。
   */
  let styleCommitTimer: ReturnType<typeof setTimeout> | null = null;

  function flushStyleCommit() {
    if (!styleCommitTimer) return;
    clearTimeout(styleCommitTimer);
    styleCommitTimer = null;
    commit();
  }

  function updateWidgetStyleLive(id: string, patch: DatavNamespace.WidgetStyle) {
    const target = schema.value.widgets.find(item => item.id === id);
    if (!target) return;
    target.style = { ...target.style, ...patch };
    dirty.value = true;
    if (styleCommitTimer) clearTimeout(styleCommitTimer);
    styleCommitTimer = setTimeout(flushStyleCommit, 260);
  }

  function updateWidgetData(id: string, patch: Partial<DatavNamespace.WidgetData>) {
    const target = schema.value.widgets.find(item => item.id === id);
    if (!target) return;
    target.data = { ...target.data, ...patch };
    commit();
  }

  /** 设计态预览取数结果写缓存；传 null 清除该组件 */
  function setDesignPreview(widgetId: string, result: ReportChartNamespace.AggResult | null) {
    if (result) designPreview.value[widgetId] = result;
    else Reflect.deleteProperty(designPreview.value, widgetId);
  }

  /** 换屏或删组件时清缓存：留着上一个屏的结果会变成「看起来有数」的假象 */
  function clearDesignPreview(widgetIds?: string[]) {
    if (!widgetIds) {
      designPreview.value = {};
      return;
    }
    widgetIds.forEach(widgetId => Reflect.deleteProperty(designPreview.value, widgetId));
  }

  /** 批量移动/缩放：一次提交一条历史 */
  function updateManyLayouts(patches: Record<string, Partial<DatavNamespace.Layout>>) {
    schema.value.widgets.forEach(item => {
      const patch = patches[item.id];
      if (patch) item.layout = { ...item.layout, ...patch };
    });
    commit();
  }

  // ==================== 选择 ====================

  function select(ids: string[], additive = false) {
    if (!additive) {
      selectedIds.value = [...ids];
      return;
    }
    const set = new Set(selectedIds.value);
    ids.forEach(id => {
      if (set.has(id)) set.delete(id);
      else set.add(id);
    });
    selectedIds.value = [...set];
  }

  /** 全选只选当前页：画布上看不见的组件被选中最直观的表现是「删不掉但一直占着选中」 */
  function selectAll() {
    selectedIds.value = pageWidgets.value.map(item => item.id);
  }

  function clearSelection() {
    selectedIds.value = [];
  }

  /** 选中组件时同时选中其所在分组的成员，成组操作的基本语义 */
  function expandToGroups(ids: string[]): string[] {
    const result = new Set(ids);
    schema.value.groups.forEach(group => {
      if (ids.some(id => group.widgetIds.includes(id))) {
        group.widgetIds.forEach(id => result.add(id));
      }
    });
    return [...result];
  }

  // ==================== 删除 / 剪贴板 / 层级 ====================

  function removeSelected() {
    const removing = new Set(selectedIds.value);
    const before = schema.value.widgets;
    // 锁定项删不掉（与画布上的交互一致），所以清缓存也只能清真正被移除的那些
    schema.value.widgets = before.filter(item => !removing.has(item.id) || item.layout.locked);
    // 分组里剔掉已删除成员，避免留下悬空 id
    schema.value.groups.forEach(group => {
      group.widgetIds = group.widgetIds.filter(id => !removing.has(id));
    });
    schema.value.groups = schema.value.groups.filter(group => group.widgetIds.length > 0);
    selectedIds.value = [];
    clearDesignPreview(before.filter(item => !schema.value.widgets.includes(item)).map(item => item.id));
    commit();
  }

  function copySelected() {
    // 深拷贝：剪贴板里留浅拷贝的话，复制之后再改原件，粘贴出来的还是改过的样子
    clipboard.value = selectedWidgets.value.map(item => deepCloneWidget(item));
  }

  /** 原地复制一份并选中它（Ctrl+D）：与「复制→粘贴」的区别是不碰剪贴板 */
  function duplicateSelected() {
    if (!selectedWidgets.value.length) return;
    const copies = selectedWidgets.value.map(item => cloneWidget(item));
    schema.value.widgets.push(...copies);
    selectedIds.value = copies.map(item => item.id);
    commit();
  }

  function pasteClipboard() {
    if (clipboard.value.length === 0) return;
    const pasted = clipboard.value.map(item => {
      const copy = cloneWidget(item);
      // 粘贴到当前页：跨页粘贴时保留原页归属会得到一个「粘了但看不见」的组件
      copy.pageId = activePageId.value;
      return copy;
    });
    schema.value.widgets.push(...pasted);
    selectedIds.value = pasted.map(item => item.id);
    commit();
  }

  /* ---------- 分页与轮播（M6.3） ---------- */

  function setCurrentPage(id: string) {
    if (!pages.value.some(page => page.id === id)) return;
    currentPageId.value = id;
    // 选中集是按页的，跨页留着选中会让「删除选中」打到另一页上
    selectedIds.value = [];
  }

  function addPage(): string {
    const page: DatavNamespace.ScreenPage = { id: createId('page'), name: `第 ${pages.value.length + 1} 页` };
    schema.value.pages = [...pages.value, page];
    currentPageId.value = page.id;
    selectedIds.value = [];
    commit();
    return page.id;
  }

  function renamePage(id: string, name: string) {
    const trimmed = name.trim();
    if (trimmed === '') return;
    schema.value.pages = pages.value.map(page => (page.id === id ? { ...page, name: trimmed } : page));
    commit();
  }

  /**
   * 删页连带删掉该页的组件。
   *
   * 不提供「把组件挪到别页」的隐式行为：那会让一次误删变成一堆散落在其他页上的孤儿组件，
   * 比整页消失更难收拾。要挪请用 moveSelectedToPage，那是明确的一次操作。
   */
  function removePage(id: string) {
    const rest = pages.value.filter(page => page.id !== id);
    if (!rest.length) return;
    schema.value.pages = rest;
    schema.value.widgets = schema.value.widgets.filter(item => (item.pageId ?? id) !== id);
    const alive = new Set(schema.value.widgets.map(item => item.id));
    selectedIds.value = selectedIds.value.filter(item => alive.has(item));
    if (!rest.some(page => page.id === currentPageId.value)) {
      currentPageId.value = rest[0].id;
    }
    commit();
  }

  function moveSelectedToPage(id: string) {
    if (!pages.value.some(page => page.id === id) || !selectedIds.value.length) return;
    const selected = new Set(selectedIds.value);
    schema.value.widgets.forEach(item => {
      if (selected.has(item.id)) item.pageId = id;
    });
    commit();
  }

  function patchRotation(patch: Partial<DatavNamespace.ScreenRotation>) {
    const current = schema.value.rotation ?? { enabled: false, intervalSec: DEFAULT_ROTATION_SEC };
    const next = { ...current, ...patch };
    next.intervalSec = Math.max(MIN_ROTATION_SEC, Math.round(Number(next.intervalSec) || DEFAULT_ROTATION_SEC));
    schema.value.rotation = next;
    commit();
  }

  function bringForward() {
    selectedIds.value.forEach(id => {
      const target = schema.value.widgets.find(item => item.id === id);
      if (target) target.layout.z += 1;
    });
    commit();
  }

  function sendBackward() {
    selectedIds.value.forEach(id => {
      const target = schema.value.widgets.find(item => item.id === id);
      if (target) target.layout.z = Math.max(1, target.layout.z - 1);
    });
    commit();
  }

  /**
   * 图层面板的上下移：与相邻层交换 z，而不是 +1/-1。
   * +1/-1 在 z 有空洞（历史里很常见）时表现为「点了没反应」，
   * 而且连续点会一路穿过所有层，跟面板里的行序对不上。
   */
  function moveLayer(id: string, direction: 'up' | 'down') {
    const ordered = [...schema.value.widgets].sort((a, b) => a.layout.z - b.layout.z);
    const position = ordered.findIndex(item => item.id === id);
    if (position < 0) return;
    const neighborIndex = direction === 'up' ? position + 1 : position - 1;
    if (neighborIndex < 0 || neighborIndex >= ordered.length) return;
    const current = ordered[position];
    const neighbor = ordered[neighborIndex];
    const z = current.layout.z;
    current.layout.z = neighbor.layout.z;
    neighbor.layout.z = z;
    commit();
  }

  function bringToFront() {
    const top = nextZ();
    selectedIds.value.forEach(id => {
      const target = schema.value.widgets.find(item => item.id === id);
      if (target) target.layout.z = top;
    });
    commit();
  }

  function sendToBack() {
    const bottom = Math.max(1, Math.min(...schema.value.widgets.map(item => item.layout.z)) - 1);
    selectedIds.value.forEach(id => {
      const target = schema.value.widgets.find(item => item.id === id);
      if (target) target.layout.z = bottom;
    });
    commit();
  }

  // ==================== 成组 / 锁定 ====================

  function groupSelected() {
    if (selectedIds.value.length < 2) return;
    // 先把已有分组的成员合并进来，符合「解散再重建」的直觉
    const memberIds = expandToGroups(selectedIds.value);
    schema.value.groups = schema.value.groups.filter(group => !memberIds.some(id => group.widgetIds.includes(id)));
    schema.value.groups.push({ id: createId('g'), widgetIds: memberIds });
    selectedIds.value = memberIds;
    commit();
  }

  function ungroupSelected() {
    const ids = new Set(selectedIds.value);
    schema.value.groups = schema.value.groups
      .map(group => ({ ...group, widgetIds: group.widgetIds.filter(id => !ids.has(id)) }))
      .filter(group => group.widgetIds.length > 1);
    commit();
  }

  /** 找某组件所在分组的其余成员，拖拽时联动移动 */
  function groupMembersOf(id: string): string[] {
    const group = schema.value.groups.find(item => item.widgetIds.includes(id));
    return group ? [...group.widgetIds] : [id];
  }

  /**
   * 拖一个组件时要一起带走的集合。
   *
   * 画布的 `resolveMembers` 原先直接挂的是 `groupMembersOf`，于是「多选后拖住其中一个」只动被按住
   * 那一个——而键盘微调、对齐、分布全都按选中集合走，同一批组件两套口径。实测全选 100 个再拖，
   * 只有 1 个动、98 个留在原地。
   *
   * 规则：选中集合里有它且不止一个 → 整个选中集合，并上它所在组（组里没被选中的成员也得跟着走，
   * 否则拖一次就把组拖散）；否则只按成组关系走。两种情况都剔掉锁定组件，与 alignSelected /
   * nudgeSelected 同一口径：特意钉住的装饰层不该被一次拖拽带走。
   */
  function dragMembersOf(id: string): string[] {
    const locked = new Set(schema.value.widgets.filter(item => item.layout.locked).map(item => item.id));
    const group = schema.value.groups.find(item => item.widgetIds.includes(id));
    const selected = selectedIds.value;
    let ids: string[];
    if (selected.includes(id) && selected.length > 1) {
      ids = [...new Set([...selected, ...(group ? group.widgetIds : [id])])];
    } else if (group) {
      ids = [...group.widgetIds];
    } else {
      ids = [id];
    }
    return ids.filter(item => !locked.has(item));
  }

  function toggleLock(id: string) {
    const target = schema.value.widgets.find(item => item.id === id);
    if (!target) return;
    target.layout.locked = !target.layout.locked;
    commit();
  }

  function toggleHidden(id: string) {
    const target = schema.value.widgets.find(item => item.id === id);
    if (!target) return;
    target.layout.hidden = !target.layout.hidden;
    commit();
  }

  /**
   * 批量锁定 / 隐藏：一次快捷键只留一条历史，且按「多数状态取反」统一。
   * 逐个翻转会选出一半锁一半没锁的混合状态，再按一次又全部翻回去。
   */
  function toggleLockSelected() {
    const targets = selectedWidgets.value;
    if (!targets.length) return;
    const next = targets.some(item => !item.layout.locked);
    targets.forEach(item => (item.layout.locked = next));
    commit();
  }

  function toggleHiddenSelected() {
    const targets = selectedWidgets.value;
    if (!targets.length) return;
    const next = targets.some(item => !item.layout.hidden);
    targets.forEach(item => (item.layout.hidden = next));
    commit();
  }

  /**
   * 对齐与分布
   *
   * 只作用于选中集合的包围盒；锁定组件参与计算但不被移动，
   * 否则「对齐」会把用户特意钉住的装饰层拖走。
   */
  function alignSelected(edge: AlignEdge) {
    const movable = selectedWidgets.value.filter(item => !item.layout.locked);
    if (movable.length < 2) return;
    const outer = boxOf(selectedWidgets.value.map(item => item.layout));
    movable.forEach(item => Object.assign(item.layout, computeAligned(item.layout, edge, outer)));
    commit();
  }

  /** 等距分布：首尾固定、中间按空隙均分，不足 3 个无意义 */
  function distributeSelected(axis: 'x' | 'y') {
    const movable = selectedWidgets.value.filter(item => !item.layout.locked);
    if (movable.length < 3) return;
    const patches = computeDistributed(
      movable.map(item => item.layout),
      axis
    );
    patches.forEach(patch => Object.assign(movable[patch.index].layout, { [axis]: patch.pos }));
    commit();
  }

  /** 选中集合的包围盒，供对齐与后续智能参考线复用 */
  function selectionBox() {
    return boxOf(
      (selectedWidgets.value.length ? selectedWidgets.value : schema.value.widgets).map(item => item.layout)
    );
  }

  function renameWidget(id: string, name: string) {
    const target = schema.value.widgets.find(item => item.id === id);
    if (!target) return;
    target.name = name;
    commit();
  }

  /** 键盘微调：方向键 1px、Shift 方向键 10px，一次按键记一条历史 */
  function nudgeSelected(dx: number, dy: number) {
    const movable = selectedWidgets.value.filter(item => !item.layout.locked);
    if (!movable.length) return;
    movable.forEach(item => {
      item.layout.x += dx;
      item.layout.y += dy;
    });
    commit();
  }

  /** 提交给后端的最外层对象 */
  function buildSaveRequest(): DatavNamespace.ScreenSaveRequest {
    return {
      screenCode: screenCode.value || undefined,
      screenName: screenName.value,
      appId: appId.value,
      layoutMode: layoutMode.value,
      schemaJson: schema.value,
      thumbnail: thumbnail.value
    };
  }

  function reset() {
    schema.value = createEmptySchema();
    schemaWarnings.value = [];
    screenCode.value = '';
    screenName.value = '未命名大屏';
    status.value = 0;
    thumbnail.value = null;
    selectedIds.value = [];
    clipboard.value = [];
    currentPageId.value = resolvePages(schema.value)[0]?.id ?? '';
    clearDesignPreview();
    history.clear();
    historyIndex.value = -1;
    dirty.value = false;
  }

  return {
    // state
    screenCode,
    screenName,
    appId,
    layoutMode,
    status,
    thumbnail,
    schema,
    schemaWarnings,
    selectedIds,
    dirty,
    clipboard,
    designPreview,
    // getters
    widgets,
    orderedWidgets,
    pages,
    activePageId,
    pageWidgets,
    selectedWidgets,
    hasSelection,
    hasClipboard,
    canUndo,
    historyStats,
    duplicateSelected,
    canRedo,
    // actions
    commit,
    undo,
    redo,
    loadScreen,
    createBlankScreen,
    markSaved,
    patchCanvas,
    patchGrid,
    upsertParam,
    removeParam,
    addWidget,
    updateWidget,
    updateWidgetLayout,
    updateWidgetStyle,
    updateWidgetStyleLive,
    flushStyleCommit,
    setCurrentPage,
    addPage,
    renamePage,
    removePage,
    moveSelectedToPage,
    patchRotation,
    updateWidgetData,
    updateManyLayouts,
    setDesignPreview,
    clearDesignPreview,
    select,
    selectAll,
    clearSelection,
    expandToGroups,
    removeSelected,
    copySelected,
    pasteClipboard,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    moveLayer,
    groupSelected,
    ungroupSelected,
    groupMembersOf,
    dragMembersOf,
    toggleLock,
    toggleHidden,
    toggleLockSelected,
    toggleHiddenSelected,
    patchParams,
    addGuide,
    updateGuide,
    removeGuide,
    clearGuides,
    renameWidget,
    alignSelected,
    distributeSelected,
    selectionBox,
    nudgeSelected,
    buildSaveRequest,
    reset
  };
});
