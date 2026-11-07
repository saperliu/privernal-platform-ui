<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDatavStore } from '@/store';

defineOptions({ name: 'DatavCanvasPanel' });

const store = useDatavStore();

const canvas = computed(() => store.schema.canvas);
const grid = computed(() => store.schema.canvas.grid);

const FIT_OPTIONS = [
  { label: '等比缩放（推荐）', value: 'scale' },
  { label: '锁定宽度', value: 'width' },
  { label: '锁定高度', value: 'height' },
  { label: '不缩放', value: 'none' }
] as const;

const PALETTE_OPTIONS = [
  { label: '科技蓝', value: 'tech-blue' },
  { label: '极光紫', value: 'aurora-purple' },
  { label: '石墨金', value: 'graphite-gold' },
  { label: '翠绿', value: 'emerald' },
  { label: '霓虹青', value: 'neon-cyan' },
  { label: '自定义色板', value: 'custom' }
] as const;

/** 自定义色板槽位：第 N 个对应 --datav-series-N；空槽回落主题层默认色 */
const PALETTE_SLOTS = 8;

const customPalette = computed(() => canvas.value.customPalette ?? []);

function onCustomColorChange(index: number, value: string | null) {
  const next = [...customPalette.value];
  next[index] = value === null || value === '' ? '' : value;
  // 只保留前 8 个槽；全空的色板不落键，让 migrate/渲染层回落内置色
  store.patchCanvas({ customPalette: next.slice(0, PALETTE_SLOTS) });
}

/** ElInputNumber 的回调值可能是 undefined，统一在这里收口，模板里不写内联箭头 */
function onSizeChange(key: 'width' | 'height', value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return;
  store.patchCanvas({ [key]: Math.round(value) } as Partial<DatavNamespace.Canvas>);
}

function onFitChange(value: string) {
  store.patchCanvas({ fit: value as DatavNamespace.CanvasFit });
}

function onThemeChange(value: string | number | boolean | undefined) {
  store.patchCanvas({ theme: value === 'light' ? 'light' : 'dark' });
}

function onPaletteChange(value: string) {
  store.patchCanvas({ palette: value as DatavNamespace.PaletteKey });
}

/** 背景值既允许 token 名（datav-bg），也允许直接写 CSS 色值或素材 URL */
function onBackgroundChange(value: string) {
  store.patchCanvas({
    background: { ...canvas.value.background, value, type: value.startsWith('http') ? 'image' : 'color' }
  });
}

/** 颜色选择器只在值是十六进制色时回显；token 名/URL 不是可选色，给空 */
const backgroundPickerValue = computed(() =>
  /^#[0-9a-fA-F]{3,8}$/.test(canvas.value.background?.value ?? '') ? canvas.value.background.value : undefined
);

function onBackgroundPick(value: string | null) {
  if (value) onBackgroundChange(value);
}

function onGridChange(key: keyof DatavNamespace.GridConfig, value: unknown) {
  store.patchGrid({ [key]: Boolean(value) } as Partial<DatavNamespace.GridConfig>);
}

const params = computed(() => store.schema.params ?? []);

const PARAM_TYPES = [
  { label: '下拉', value: 'select' },
  { label: '日期', value: 'date' },
  { label: '日期范围', value: 'daterange' },
  { label: '文本', value: 'text' }
];

function patchParam(index: number, patch: Partial<DatavNamespace.ScreenParam>) {
  store.patchParams(params.value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
}

function addParam() {
  store.patchParams([
    ...params.value,
    { code: `param${params.value.length + 1}`, name: '新参数', type: 'text', defaultValue: '' }
  ]);
}

function removeParam(index: number) {
  store.patchParams(params.value.filter((_item, i) => i !== index));
}

function onGridSizeChange(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return;
  store.patchGrid({ size: Math.max(1, Math.round(value)) });
}

/** 画布属性分页：画布 / 外观 / 参数，避免整列铺开过长 */
const canvasTab = ref('canvas');
</script>

<template>
  <ElTabs v-model="canvasTab" class="datav-prop-tabs">
    <ElTabPane label="画布" name="canvas">
      <ElForm label-position="top" size="small">
        <ElFormItem label="宽度 / 高度">
          <div class="flex gap-8px">
            <ElInputNumber
              :model-value="canvas.width"
              :min="320"
              :max="7680"
              :step="10"
              @update:model-value="v => onSizeChange('width', v as number | undefined)"
            />
            <ElInputNumber
              :model-value="canvas.height"
              :min="320"
              :max="4320"
              :step="10"
              @update:model-value="v => onSizeChange('height', v as number | undefined)"
            />
          </div>
        </ElFormItem>

        <ElFormItem label="适配方式">
          <ElSelect :model-value="canvas.fit" class="w-full" @update:model-value="onFitChange">
            <ElOption v-for="opt in FIT_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="网格">
          <div class="mb-6px flex flex-wrap gap-12px">
            <ElCheckbox :model-value="grid.show" @update:model-value="v => onGridChange('show', v)">显示</ElCheckbox>
            <ElCheckbox :model-value="grid.snap" @update:model-value="v => onGridChange('snap', v)">吸附</ElCheckbox>
            <ElCheckbox :model-value="grid.alignGuide" @update:model-value="v => onGridChange('alignGuide', v)">
              对齐线
            </ElCheckbox>
          </div>
          <ElInputNumber
            :model-value="grid.size"
            :min="1"
            :max="200"
            :step="1"
            @update:model-value="v => onGridSizeChange(v as number | undefined)"
          />
        </ElFormItem>
      </ElForm>
    </ElTabPane>

    <ElTabPane label="外观" name="appearance">
      <ElForm label-position="top" size="small">
        <ElFormItem label="主题">
          <ElRadioGroup :model-value="canvas.theme" @update:model-value="onThemeChange">
            <ElRadioButton value="dark">深色</ElRadioButton>
            <ElRadioButton value="light">浅色</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem label="配色板">
          <ElSelect :model-value="canvas.palette" class="w-full" @update:model-value="onPaletteChange">
            <ElOption v-for="opt in PALETTE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
          <div v-if="canvas.palette === 'custom'" class="w-full">
            <div class="mt-6px flex flex-wrap gap-6px">
              <ElColorPicker
                v-for="slot in PALETTE_SLOTS"
                :key="slot"
                :model-value="customPalette[slot - 1] || null"
                size="small"
                :aria-label="`系列色 ${slot}`"
                @update:model-value="(v: string | null) => onCustomColorChange(slot - 1, v)"
              />
            </div>
            <div class="mt-4px text-11px leading-14px opacity-60">
              依次对应系列色 1–8，留空的槽位沿用深/浅主题的默认系列色。
            </div>
          </div>
        </ElFormItem>

        <ElFormItem label="背景">
          <!-- 色值场景用取色器直选；token 名（datav-bg）与素材 URL 仍走文本框 -->
          <div class="w-full flex items-center gap-8px">
            <ElColorPicker :model-value="backgroundPickerValue" @change="(v: string | null) => onBackgroundPick(v)" />
            <ElInput
              :model-value="canvas.background.value"
              placeholder="色值 / datav-bg / https://…"
              @update:model-value="onBackgroundChange"
            />
          </div>
        </ElFormItem>
      </ElForm>
    </ElTabPane>

    <ElTabPane label="参数" name="params">
      <ElForm label-position="top" size="small">
        <ElFormItem label="画布参数">
          <div class="w-full">
            <div v-for="(item, index) in params" :key="index" class="mb-6px flex flex-wrap items-center gap-4px">
              <ElInput
                class="w-96px"
                size="small"
                :model-value="item.code"
                placeholder="code"
                @update:model-value="v => patchParam(index, { code: v })"
              />
              <ElInput
                class="w-96px"
                size="small"
                :model-value="item.name"
                placeholder="显示名"
                @update:model-value="v => patchParam(index, { name: v })"
              />
              <ElSelect
                class="w-104px"
                size="small"
                :model-value="item.type"
                @update:model-value="v => patchParam(index, { type: v as DatavNamespace.ScreenParam['type'] })"
              >
                <ElOption v-for="opt in PARAM_TYPES" :key="opt.value" :label="opt.label" :value="opt.value" />
              </ElSelect>
              <ElInput
                class="w-90px"
                size="small"
                :model-value="String(item.defaultValue ?? '')"
                placeholder="默认值"
                @update:model-value="v => patchParam(index, { defaultValue: v })"
              />
              <ElInput
                v-if="item.type === 'select'"
                class="w-110px"
                size="small"
                :model-value="String(item.dataSource ?? '')"
                placeholder="候选：A|B 或数据集编码"
                @update:model-value="v => patchParam(index, { dataSource: v })"
              />
              <ElButton size="small" text @click="removeParam(index)">删</ElButton>
            </div>
            <div class="mb-4px text-11px leading-14px opacity-60">
              code 要与组件绑定里的参数名一致；下拉的选项可以直接写候选值（用 | 分隔），也可以填数据集编码。
            </div>
            <ElButton size="small" text @click="addParam">+ 新增参数</ElButton>
          </div>
        </ElFormItem>
      </ElForm>
    </ElTabPane>
  </ElTabs>
</template>
