<script setup lang="ts">
/**
 * SHEET 模板编辑器（单据打印第二种方式，Luckysheet 画布）。
 * 布局与 doc-template-editor.vue（DOC/AiEditor）同构：左=字段面板（主表/子表/函数插入）/
 * 中=表格画布 + 保存预览工具条 / 右=模板设置（纸张/方向/边距/默认/排序）。
 * 占位符协议见 utils/doc-print/sheet.ts 头注——绑定自描述在单元格文本里，
 * 不存在「设为明细区/模板行」类标记操作，循环块由 {{子表.字段}} 占位符自动识别。
 * Luckysheet（MIT）经 utils/luckysheet-loader.ts 动态加载（独立 chunk），不在本组件静态依赖里。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  ElButton as __forwarded_ElButton,
  ElCollapse as __forwarded_ElCollapse,
  ElCollapseItem as __forwarded_ElCollapseItem,
  ElDialog as __forwarded_ElDialog,
  ElInput as __forwarded_ElInput,
  ElInputNumber as __forwarded_ElInputNumber,
  ElSelect as __forwarded_ElSelect,
  ElTag as __forwarded_ElTag
} from 'element-plus';
import { createDocTemplate, fetchDocTemplate, updateDocTemplate } from '@/service/api/dynamic/doc-template';
import { ensureLuckysheet } from '@/utils/luckysheet-loader';
import { type SheetTemplate, buildSheetBinding, collectSheetTokens, renderSheetHtml } from '@/utils/doc-print/sheet';
import { type FieldNode, extractFieldTree } from './field-tree';

/**
 * 工具栏裁剪（showtoolbarConfig 的键名与官方一一对应）。两个裁剪依据：
 * 1.「更多」是纯宽度驱动的尾部折叠且按钮顺序固定不可调（数字格式排前、边框/合并/对齐
 *   排后）——数字格式类对打印模板无意义（模板单元格装的是占位符文本，货币/百分比/小数位
 *   只作用于画布字面值，打印渲染不感知），裁掉它们才能让边框/合并/对齐这些核心按钮前移；
 * 2. 换行/旋转/图片/图表等渲染链路不还原的版式不给排（换行打印自动换行、竖排旋转未实现），
 *   与 showtoolbarConfig 禁 image/chart 同一口径。
 * 3. 字体下拉（font）不保留：渲染链路不还原 font-family（打印统一用系统字体栈），
 *    且它是工具栏里最宽的控件，占位换不来打印效果。
 * 保留：撤销重做/格式刷/字号/粗斜删下划线/字色填充/边框/合并/水平垂直对齐。
 * 需要调整快捷功能集时改这里的键名即可。
 */
const TOOLBAR_HIDDEN_KEYS = [
  'font',
  'currencyFormat',
  'percentageFormat',
  'numberDecrease',
  'numberIncrease',
  'moreFormats',
  'textWrapMode',
  'textRotateMode',
  'image',
  'link',
  'chart',
  'postil',
  'pivotTable',
  'function',
  'frozenMode',
  'sortAndFilter',
  'conditionalFormat',
  'dataVerification',
  'splitColumn',
  'screenshot',
  'findAndReplace',
  'protection',
  'print'
] as const;

function buildToolbarConfig(): Record<string, boolean> {
  return Object.fromEntries(TOOLBAR_HIDDEN_KEYS.map(key => [key, false]));
}

const props = defineProps<{
  formId: string;
  templateId?: string;
  metaData?: Record<string, any> | null;
}>();

const emit = defineEmits<{ (e: 'saved', id: string): void; (e: 'cancel'): void }>();

const hostId = `doc-sheet-host-${Math.random().toString(36).slice(2, 8)}`;
const sheetReady = ref(false);
const loadError = ref('');

// ---------- 字段树 ----------
const { mainFields, subTables } = extractFieldTree(props.metaData);
const fieldSearch = ref('');
const matches = (f: FieldNode) => {
  const kw = fieldSearch.value.trim().toLowerCase();
  return !kw || f.label.toLowerCase().includes(kw) || f.field.toLowerCase().includes(kw);
};
const filteredMainFields = computed(() => mainFields.filter(matches));
const filteredSubTables = computed(() =>
  subTables.map(t => ({ ...t, children: t.children.filter(matches) })).filter(t => t.children.length || matches(t))
);

// 占位符插入：写入当前选中单元格（追加在已有内容之后）
function insertToken(token: string) {
  const luckysheet = window.luckysheet;
  if (!luckysheet) return;
  try {
    const range = luckysheet.getRange()?.[0];
    const r = range?.row_focus ?? range?.row?.[0] ?? 0;
    const c = range?.column_focus ?? range?.column?.[0] ?? 0;
    const current = luckysheet.getCellValue(r, c);
    const prefix = current === null || current === undefined ? '' : String(current);
    luckysheet.setCellValue(r, c, prefix + token);
  } catch {
    window.$message?.error('插入失败，请重试');
  }
}

function insertMain(field: FieldNode) {
  insertToken(`{{${field.field}}}`);
}

function insertDetail(tableField: string, field: FieldNode) {
  insertToken(`{{${tableField}.${field.field}}}`);
}

// ---------- 聚合插入 ----------
const aggTable = ref<string | null>(subTables[0]?.field ?? null);
const aggField = ref<string | null>(null);
const aggOp = ref<'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT'>('SUM');
const aggTableOptions = subTables.map(t => ({ label: `${t.label}（${t.field}）`, value: t.field }));
const aggFieldOptions = computed(() => {
  const table = subTables.find(t => t.field === aggTable.value);
  return (table?.children ?? []).map(f => ({ label: `${f.label}（${f.field}）`, value: f.field }));
});
const aggOpOptions = [
  { label: '求和 SUM', value: 'SUM' },
  { label: '平均 AVG', value: 'AVG' },
  { label: '最小 MIN', value: 'MIN' },
  { label: '最大 MAX', value: 'MAX' },
  { label: '行数 COUNT', value: 'COUNT' }
];

function insertAggregate() {
  if (!aggTable.value) {
    window.$message?.warning('请选择子表');
    return;
  }
  if (aggOp.value !== 'COUNT' && !aggField.value) {
    window.$message?.warning('请选择参与计算的字段');
    return;
  }
  insertToken(`{{${aggOp.value}(${aggTable.value}${aggField.value ? `.${aggField.value}` : ''})}}`);
}

// ---------- 循环块检测（点击检查，展示识别结果） ----------
interface InspectResult {
  blocks: Array<{ detailKey: string; rows: string; label: string }>;
  issues: string[];
}
const inspect = ref<InspectResult | null>(null);

function snapshotSheet(): SheetTemplate | null {
  const luckysheet = window.luckysheet;
  if (!luckysheet) return null;
  // getAllSheets()[0] 携带编辑后的 data 网格与 celldata；getLuckysheetfile 在本版本
  // 返回内部包装对象（键名 "0"），不可直接当 sheet 用
  const file = luckysheet.getAllSheets?.()[0] ?? luckysheet.getLuckysheetfile?.();
  let celldata: SheetTemplate['celldata'] = [];
  if (file && Array.isArray(file.data)) {
    // data 网格是版式真相（celldata 是否随编辑更新无版本契约），手工展开成 [{r,c,v}]
    (file.data as unknown as any[][]).forEach((row, r) => {
      (row ?? []).forEach((v, c) => {
        if (v !== null && v !== undefined) {
          celldata.push({ r, c, v });
        }
      });
    });
  } else if (file && Array.isArray(file.celldata)) {
    celldata = file.celldata;
  }
  return { name: file?.name ?? '打印模板', celldata, config: file?.config ?? {} };
}

function runInspect() {
  const sheet = snapshotSheet();
  if (!sheet) return;
  const issues: string[] = [];
  const mainCodes = new Set(mainFields.map(f => f.field));
  const detailKeys = new Set(subTables.map(t => t.field));
  const detailCodes = new Map(subTables.map(t => [t.field, new Set(t.children.map(c => c.field))]));
  const tokens = collectSheetTokens(sheet);
  const blockMap = new Map<string, Array<[number, number]>>();
  for (const d of buildSheetBinding(sheet).details) {
    blockMap.set(d.detailKey, d.blocks);
  }
  for (const k of blockMap.keys()) {
    if (!detailKeys.has(k)) {
      issues.push(`循环区引用的子表「${k}」在表单里不存在（字段已删或编码写错）`);
    }
  }
  for (const token of tokens) {
    if (token.kind === 'main' && !mainCodes.has(token.field)) {
      issues.push(`主表字段 {{${token.field}}} 不存在（字段已删或编码写错）`);
    } else if (token.kind === 'detail') {
      if (detailKeys.has(token.detailKey) && !detailCodes.get(token.detailKey)?.has(token.field)) {
        issues.push(`子表 ${token.detailKey} 里没有字段 {{${token.field}}}`);
      }
      if (!blockMap.has(token.detailKey)) {
        issues.push(`{{${token.detailKey}.${token.field}}} 未构成循环区（占位符所在行就是模板行，检查是否被删）`);
      }
    } else if (token.kind === 'seq' && !blockMap.size) {
      issues.push('{{__seq}} 只在明细循环行内有效');
    }
  }
  const labels = new Map(subTables.map(t => [t.field, t.label]));
  inspect.value = {
    blocks: Array.from(blockMap, ([k, blocks]) => ({
      detailKey: k,
      label: labels.get(k) ?? k,
      rows: blocks.map(([s, e]) => `第 ${s + 1}~${e + 1} 行`).join('、')
    })),
    issues
  };
}

// ---------- 模板属性 ----------
const name = ref('');
const isDefault = ref<'Y' | 'N'>('N');
const sort = ref(0);
const status = ref<'0' | '1'>('1');
const paper = ref<'A4' | 'A5' | 'Letter'>('A4');
const orientation = ref<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
const margins = ref({ top: 12, bottom: 12, left: 14, right: 14 });
const saving = ref(false);
const paperOptions = [
  { label: 'A4', value: 'A4' },
  { label: 'A5', value: 'A5' },
  { label: 'Letter', value: 'Letter' }
];
const orientationOptions = [
  { label: '纵向', value: 'PORTRAIT' },
  { label: '横向', value: 'LANDSCAPE' }
];
const isEditMode = computed(() => Boolean(props.templateId));

// ---------- 侧栏折叠：折叠后画布变宽，「更多」按钮按新容器宽度重排直至消失 ----------
const leftPanelOpen = ref(true);
// 设置面板默认折叠：纸张/边距只设一次，默认让位给工具栏按钮全平铺（点「设置」展开）
const rightPanelOpen = ref(false);

async function relayoutToolbar() {
  await nextTick();
  try {
    window.luckysheet?.resize();
  } catch {
    /* 画布未就绪时 resize 可能抛错，忽略（下次折叠/窗口变化会再触发） */
  }
}

function toggleLeftPanel() {
  leftPanelOpen.value = !leftPanelOpen.value;
  relayoutToolbar();
}

function toggleRightPanel() {
  rightPanelOpen.value = !rightPanelOpen.value;
  relayoutToolbar();
}

function applyPrintConfig(raw: string | null | undefined) {
  try {
    const cfg = JSON.parse(raw ?? '');
    paper.value = cfg.paper ?? 'A4';
    orientation.value = cfg.orientation ?? 'PORTRAIT';
    if (cfg.margins) margins.value = cfg.margins;
  } catch {
    /* 坏配置按默认版式回落 */
  }
}

// ---------- Luckysheet 装配 ----------
onMounted(async () => {
  let initialSheet: Record<string, any> = {
    name: '打印模板',
    celldata: [],
    config: {}
  };
  if (props.templateId) {
    const { data, error } = await fetchDocTemplate(props.templateId);
    if (!error && data) {
      name.value = data.name;
      isDefault.value = (data.isDefault as 'Y' | 'N') ?? 'N';
      sort.value = data.sort ?? 0;
      status.value = (data.status as '0' | '1') ?? '1';
      if (data.printConfig) applyPrintConfig(data.printConfig);
      if (data.contentSheet) {
        try {
          const parsed = JSON.parse(data.contentSheet) as SheetTemplate;
          initialSheet = { ...parsed, status: 1, order: 0 };
        } catch {
          window.$message?.warning('模板表格数据损坏，按空白模板打开');
        }
      }
    }
  }
  try {
    const luckysheet = await ensureLuckysheet();
    luckysheet.create({
      container: hostId,
      lang: 'zh',
      data: [initialSheet],
      showinfobar: false,
      showsheetbar: false,
      showstatisticBar: false,
      // 工具栏按"打印模板需要什么"裁剪：Luckysheet 的「更多」按钮是纯宽度驱动的
      // （容器宽度 -90px 装不下的尾部按钮全部折叠进更多，顺序固定不可调），
      // 禁掉对排版无意义的尾部按钮（图片/超链接/图表/批注/透视/公式/排序筛选/条件格式/
      // 数据验证/分列/截图/保护/打印——打印走我们自己的预览），其余即可直接平铺；
      // 仍不够宽时折叠左右面板（resize 后更多按钮按新宽度重算）
      showtoolbarConfig: buildToolbarConfig(),
      hook: {}
    });
    sheetReady.value = true;
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e);
  }
});

onBeforeUnmount(() => {
  try {
    window.luckysheet?.destroy();
  } catch {
    /* 容器已随组件卸载时 destroy 抛错可忽略 */
  }
});

// ---------- 预览（示例数据；打印预览弹窗内可直接打印） ----------
const previewVisible = ref(false);
const previewHtml = ref('');
const previewFrame = ref<HTMLIFrameElement>();

function buildSampleDocs(sheet: SheetTemplate) {
  const mainSample: Record<string, unknown> = {};
  const detailsSample: Record<string, Array<Record<string, unknown>>> = {};
  const tokens = collectSheetTokens(sheet);
  const mainLabel = new Map(mainFields.map(f => [f.field, f.label]));
  const subLabel = new Map(subTables.flatMap(t => t.children.map(c => [`${t.field}.${c.field}`, c.label] as const)));
  // 参与聚合的明细字段给数值示例，预览里能看到合计效果
  const aggFields = new Set<string>();
  const usedKeys = new Set<string>();
  for (const token of tokens) {
    if (token.kind === 'agg') {
      usedKeys.add(token.detailKey);
      if (token.field) aggFields.add(`${token.detailKey}.${token.field}`);
    } else if (token.kind === 'detail') {
      usedKeys.add(token.detailKey);
    }
  }
  for (const token of tokens) {
    if (token.kind === 'main') {
      mainSample[token.field] = `${mainLabel.get(token.field) ?? token.field}·示例`;
    }
  }
  for (const key of usedKeys) {
    detailsSample[key] = Array.from({ length: 8 }, (_, i) => {
      const row: Record<string, unknown> = {};
      for (const token of tokens) {
        if (token.kind === 'detail' && token.detailKey === key) {
          row[token.field] = aggFields.has(`${key}.${token.field}`)
            ? (i + 1) * 100
            : `${subLabel.get(`${key}.${token.field}`) ?? token.field}·${i + 1}`;
        }
      }
      return row;
    });
  }
  return [{ main: mainSample, details: detailsSample }];
}

function handlePreview() {
  const sheet = snapshotSheet();
  if (!sheet) return;
  const out = renderSheetHtml({
    sheet,
    docs: buildSampleDocs(sheet),
    printConfig: { paper: paper.value, orientation: orientation.value, margins: margins.value },
    formName: name.value || '表格模板预览'
  });
  if (out.warnings.length) {
    window.$message?.warning(
      `预览提示：${out.warnings[0]}${out.warnings.length > 1 ? `（共 ${out.warnings.length} 条）` : ''}`
    );
  }
  previewHtml.value = out.html;
  previewVisible.value = true;
}

function printPreview() {
  previewFrame.value?.contentWindow?.focus();
  previewFrame.value?.contentWindow?.print();
}

// ---------- 保存 ----------
async function handleSave() {
  if (!name.value.trim()) {
    window.$message?.warning('请先填写模板名称');
    return;
  }
  const sheet = snapshotSheet();
  if (!sheet) return;
  const tokens = collectSheetTokens(sheet);
  if (!tokens.length) {
    window.$message?.warning('模板里还没有任何字段占位符：请在左侧点击字段插入 {{字段}} 后再保存');
    return;
  }
  runInspect();
  if (inspect.value?.issues.length) {
    window.$message?.warning(
      `占位符存在 ${inspect.value.issues.length} 处与表单字段不匹配（不阻断保存，明细见左侧「循环区检查」）`
    );
  }
  const body: AdvancedNamespace.DocTemplate = {
    id: props.templateId,
    formId: props.formId,
    name: name.value.trim(),
    templateType: 'SHEET',
    contentHtml: '',
    contentSheet: JSON.stringify(sheet),
    bindingJson: JSON.stringify(buildSheetBinding(sheet)),
    printConfig: JSON.stringify({ paper: paper.value, orientation: orientation.value, margins: margins.value }),
    isDefault: isDefault.value,
    sort: sort.value,
    status: status.value
  };
  saving.value = true;
  try {
    const { data, error } = props.templateId ? await updateDocTemplate(body) : await createDocTemplate(body);
    if (!error && data) {
      window.$message?.success('模板已保存');
      emit('saved', data.id ?? '');
    }
  } finally {
    saving.value = false;
  }
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
const ElCollapse = __forwarded_ElCollapse;
const ElCollapseItem = __forwarded_ElCollapseItem;
const ElDialog = __forwarded_ElDialog;
const ElInput = __forwarded_ElInput;
const ElInputNumber = __forwarded_ElInputNumber;
const ElSelect = __forwarded_ElSelect;
const ElTag = __forwarded_ElTag;
</script>

<template>
  <div class="sheet-template-editor">
    <aside v-show="leftPanelOpen" class="ste-left">
      <ElInput v-model="fieldSearch" size="small" placeholder="搜索字段" clearable class="ste-search" />
      <div class="ste-left-body">
        <div class="ste-section">
          <div class="ste-section-title">主表字段（点选插入到选中单元格）</div>
          <div class="ste-fields">
            <ElTag
              v-for="f in filteredMainFields"
              :key="f.field"
              class="ste-field"
              size="small"
              :bordered="false"
              @click="insertMain(f)"
            >
              {{ f.label }}
            </ElTag>
            <span v-if="!filteredMainFields.length" class="ste-empty">无匹配字段</span>
          </div>
        </div>
        <div v-for="t in filteredSubTables" :key="t.field" class="ste-section">
          <div class="ste-section-title">子表：{{ t.label }}（连续放入多行即明细循环区）</div>
          <div class="ste-fields">
            <ElTag
              v-for="f in t.children"
              :key="f.field"
              class="ste-field ste-field-detail"
              size="small"
              :bordered="false"
              @click="insertDetail(t.field, f)"
            >
              {{ f.label }}
            </ElTag>
            <span v-if="!t.children.length" class="ste-empty">子表无字段</span>
          </div>
        </div>
        <div class="ste-section">
          <div class="ste-section-title">序号与合计</div>
          <div class="ste-fields">
            <ElTag class="ste-field" size="small" :bordered="false" @click="insertToken('{{__seq}}')">明细行序号</ElTag>
          </div>
          <div class="ste-agg">
            <ElSelect v-model="aggOp" size="small" class="ste-w-op">
              <ElOption v-for="opt in aggOpOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
            <ElSelect v-model="aggTable" size="small" placeholder="子表" @change="aggField = null">
              <ElOption v-for="opt in aggTableOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
            <ElSelect v-if="aggOp !== 'COUNT'" v-model="aggField" size="small" placeholder="字段">
              <ElOption v-for="opt in aggFieldOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
            <ElButton size="small" class="ste-margin-top" @click="insertAggregate">插入合计占位符</ElButton>
          </div>
          <div class="ste-hint">合计占位符放在循环区外（如合计行），对整块明细计算。</div>
        </div>
        <div class="ste-section">
          <div class="ste-section-title">循环区检查</div>
          <ElButton size="small" @click="runInspect">检查循环块</ElButton>
          <template v-if="inspect">
            <div v-for="b in inspect.blocks" :key="b.detailKey" class="ste-block">
              <ElTag size="small" type="success" :bordered="false">{{ b.label }}</ElTag>
              {{ b.rows }}
            </div>
            <div v-if="!inspect.blocks.length" class="ste-hint">未检测到明细循环区：把子表字段放入连续行即可。</div>
            <div v-for="issue in inspect.issues" :key="issue" class="ste-issue">{{ issue }}</div>
            <div v-if="!inspect.issues.length && inspect.blocks.length" class="ste-hint">
              占位符与表单字段全部匹配。
            </div>
          </template>
        </div>
      </div>
    </aside>

    <div class="ste-main">
      <div class="ste-props">
        <ElButton
          size="small"
          quaternary
          :type="leftPanelOpen ? 'primary' : 'default'"
          :title="leftPanelOpen ? '折叠字段面板，加宽画布让工具栏按钮全部平铺' : '展开字段面板'"
          @click="toggleLeftPanel"
        >
          字段
        </ElButton>
        <ElButton
          size="small"
          quaternary
          :type="rightPanelOpen ? 'primary' : 'default'"
          :title="rightPanelOpen ? '折叠设置面板，加宽画布让工具栏按钮全部平铺' : '展开设置面板'"
          @click="toggleRightPanel"
        >
          设置
        </ElButton>
        <ElInput v-model="name" size="small" placeholder="模板名称（如：报销单打印）" class="ste-name" />
        <div class="ste-props-spacer" />
        <ElButton size="small" :disabled="!sheetReady" @click="handlePreview">打印预览（示例数据）</ElButton>
        <ElButton size="small" type="primary" :loading="saving" :disabled="!sheetReady" @click="handleSave">
          {{ isEditMode ? '保存修改' : '保存模板' }}
        </ElButton>
        <ElButton size="small" quaternary @click="emit('cancel')">取消</ElButton>
      </div>
      <div v-if="loadError" class="ste-error">Luckysheet 加载失败：{{ loadError }}</div>
      <div :id="hostId" class="ste-canvas" />
    </div>

    <aside v-show="rightPanelOpen" class="ste-right">
      <div class="ste-section-title ste-right-title">模板设置</div>
      <ElCollapse :default-expanded-names="['paper', 'base']" arrow-placement="right">
        <ElCollapseItem title="纸张" name="paper">
          <div class="ste-right-row">
            <ElSelect v-model="paper" size="small" class="ste-w-block">
              <ElOption v-for="opt in paperOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </div>
          <div class="ste-right-row">
            <ElSelect v-model="orientation" size="small" class="ste-w-block">
              <ElOption v-for="opt in orientationOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </div>
          <div class="ste-right-grid">
            <span>上</span>
            <ElInputNumber v-model="margins.top" size="small" :min="0" :max="50" />
            <span>下</span>
            <ElInputNumber v-model="margins.bottom" size="small" :min="0" :max="50" />
            <span>左</span>
            <ElInputNumber v-model="margins.left" size="small" :min="0" :max="50" />
            <span>右</span>
            <ElInputNumber v-model="margins.right" size="small" :min="0" :max="50" />
            <span class="ste-unit">单位：mm</span>
          </div>
        </ElCollapseItem>
        <ElCollapseItem title="基础信息" name="base">
          <div class="ste-right-row">
            <ElSelect v-model="isDefault" size="small" class="ste-w-block">
              <ElOption
                v-for="opt in [
                  { label: '默认模板', value: 'Y' },
                  { label: '普通模板', value: 'N' }
                ]"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </div>
          <div class="ste-right-row ste-right-sort">
            <span class="ste-unit">排序</span>
            <ElInputNumber v-model="sort" size="small" :min="0" class="ste-w-block" />
          </div>
        </ElCollapseItem>
      </ElCollapse>
    </aside>

    <ElDialog v-model="previewVisible" title="打印预览（示例数据）" width="920px" top="4vh" destroy-on-close>
      <!-- sandbox（无 token）：预览是纯 HTML/CSS，不需要脚本；阻断模板注入脚本在预览域执行 -->
      <iframe ref="previewFrame" :srcdoc="previewHtml" sandbox="" class="ste-preview-frame" title="打印预览" />
      <template #footer>
        <ElButton size="small" @click="previewVisible = false">关闭</ElButton>
        <ElButton size="small" type="primary" @click="printPreview">打印</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.sheet-template-editor {
  display: flex;
  gap: 10px;
  height: 100%;
  min-height: 560px;
  background: var(--ds-canvas, #f5f6f8);

  .ste-left {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 248px;
    padding: 10px;
    overflow: hidden;
    background: #fff;
    border-right: 1px solid #e6e8eb;

    .ste-search {
      margin-bottom: 10px;
    }

    .ste-left-body {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
  }

  .ste-main {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .ste-props {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: #fff;
    border-bottom: 1px solid #e6e8eb;
  }

  .ste-props-spacer {
    flex: 1;
  }

  .ste-name {
    width: 200px;
  }

  .ste-canvas {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: #fff;

    :deep(.luckysheet-wrap) {
      height: 100%;
    }
  }

  .ste-error {
    padding: 10px;
    font-size: 13px;
    color: #c45656;
  }

  .ste-right {
    flex-shrink: 0;
    width: 224px;
    padding: 10px;
    overflow-y: auto;
    background: #fff;
    border-left: 1px solid #e6e8eb;

    .ste-right-title {
      font-size: 13px;
    }

    .ste-right-row {
      margin-bottom: 10px;
    }

    .ste-w-block {
      width: 100%;
    }

    .ste-right-grid {
      display: grid;
      grid-template-columns: auto 1fr auto 1fr;
      gap: 6px 4px;
      align-items: center;
      font-size: 12px;
      color: #666;
    }

    .ste-right-sort {
      display: flex;
      gap: 6px;
      align-items: center;
    }
  }
}

.ste-section {
  margin-bottom: 16px;
}

.ste-section-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.ste-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ste-field {
  cursor: pointer;
}

.ste-field-detail {
  color: #2f6f3f;
  background: #eaf5ec;
}

.ste-empty {
  font-size: 12px;
  color: #999;
}

.ste-agg {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.ste-margin-top {
  margin-top: 8px;
}

.ste-w-op {
  width: 110px;
}

.ste-hint {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #999;
}

.ste-block {
  margin-top: 8px;
  font-size: 12px;
  color: #333;
}

.ste-issue {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: #b25e09;
}

.ste-unit {
  color: #999;
}

.ste-preview-frame {
  width: 100%;
  height: 72vh;
  border: 1px solid #e6e8eb;
  background: #fff;
}
</style>
