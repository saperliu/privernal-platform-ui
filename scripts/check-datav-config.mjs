/**
 * 大屏组件面板一致性闸门
 *
 * 检查每个组件 meta.ts 声明的 fields：
 *   1. 样式项的 key 必须真的被运行时读到（否则面板改了没反应，属于「配了没生效」）；
 *   2. defaultStyle 必须给出该项初值（否则滑块停在 min、数字框空白，用户以为坏了）；
 *   3. slider 必须有 min 与 max（缺了会被 config-form 兜成 0..100，量程直接错）；
 *   4. 控件类型与初值类型要匹配（switch 给字符串、slider 给字符串都会导致显示与实际不一致）；
 *   5. data.* 项的键必须落在 WidgetData 里真实存在的字段（写进未知键＝存进 schema 但没人读）。
 *
 * 不引第三方解析器：meta.ts 是纯对象字面量，用受限的正则提取 + 逐字符配对，
 * 抓不准的地方宁可多报让人核对，也不要静默放过。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import process from 'node:process';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PKG_DIR = join(ROOT, 'src/packages/components');
/** 运行时读样式不止看自己的 index.vue，共用 hook 里的读取同样算命中 */
const SHARED_FILES = [
  // chart-option 是图表组件共享的 option 组装层：axisStyleFrom/commonStyleFrom
  // 在这里读取样式键，等效于组件源码读取
  'src/packages/components/charts/chart-option.ts',
  'src/hooks/datav/useDatavChart.ts',
  'src/hooks/datav/useDatavVChart.ts',
  'src/hooks/datav/useWidgetData.ts',
  'src/hooks/datav/useDatavStage.ts',
  'src/components/datav/widget-runtime/index.vue'
];

const failures = [];
const notes = [];

function fail(text) {
  failures.push(text);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('/meta.ts')) out.push(full);
  }
  return out;
}

function read(file) {
  return readFileSync(file, 'utf8');
}

const sharedSource = SHARED_FILES.map(file => read(join(ROOT, file))).join('\n');

/** 取对象字面量片段：从 startIndex 处的 { 起做花括号配对，跳过字符串内的括号 */
function objectLiteralAt(source, startIndex) {
  const open = source.indexOf('{', startIndex);
  if (open < 0) return null;
  let depth = 0;
  let quote = null;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === '\\') i += 1;
      else if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '{') depth += 1;
    else if (ch === '}' && (depth -= 1) === 0) return source.slice(open, i + 1);
  }
  return null;
}

function extractBlock(source, marker) {
  const at = source.indexOf(marker);
  if (at < 0) return null;
  return objectLiteralAt(source, at);
}

/** 数组里的每个 { ... } 片段（fields 用） */
function extractItems(arraySource) {
  const items = [];
  if (!arraySource) return items;
  let depth = 0;
  let quote = null;
  let start = -1;
  for (let i = 0; i < arraySource.length; i += 1) {
    const ch = arraySource[i];
    if (quote) {
      if (ch === '\\') i += 1;
      else if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '{') {
      depth += 1;
      if (depth === 1) start = i;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        items.push(arraySource.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return items;
}

function arrayLiteralAt(source, marker) {
  const at = source.indexOf(marker);
  if (at < 0) return null;
  const open = source.indexOf('[', at);
  if (open < 0) return null;
  let depth = 0;
  let quote = null;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === '\\') i += 1;
      else if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '[') depth += 1;
    else if (ch === ']' && (depth -= 1) === 0) return source.slice(open, i + 1);
  }
  return null;
}

function pickLiteral(item, key) {
  const m = new RegExp(`${key}\\s*:\\s*('[^']*'|"[^"]*"|\\[[^\\]]*\\]|-?[\\d.]+|true|false)`, 'm').exec(item);
  return m ? m[1] : null;
}

/** 初值类型判定：只看能确定类型的字面量 */
function literalKind(value) {
  if (value === null) return 'missing';
  if (/^['"]/.test(value)) return 'string';
  if (/^-?[\d.]+$/.test(value)) return 'number';
  if (value === 'true' || value === 'false') return 'boolean';
  if (value.startsWith('[')) return 'array';
  return 'other';
}

const CONTROL_KIND = {
  slider: ['number'],
  number: ['number'],
  switch: ['boolean'],
  text: ['string'],
  textarea: ['string'],
  json: ['array', 'other', 'object', 'string'],
  color: ['string'],
  select: ['string', 'other'],
  radio: ['string', 'other']
};

/** 累计检查过的 field 数（checkField 里自增，保持原来「先计数再判断」的口径） */
let fieldCount = 0;

/** 组件目录下除 meta.ts 之外的运行时代码 + 共用 hook 的文本 */
function collectRuntimeSource(componentDir) {
  const runtimeFiles = [];
  (function collect(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) collect(full);
      else if ((full.endsWith('.vue') || full.endsWith('.ts')) && !full.endsWith('meta.ts')) runtimeFiles.push(full);
    }
  })(componentDir);
  return `${runtimeFiles.map(read).join('\n')}\n${sharedSource}`;
}

/** field 上下文：{ rel, type, metaSource, defaults, runtimeSource, item, key, control, label, initial, initialLiteral } */

/** data.* 项：键必须落在 defaultData 或运行时里（原来这里是 continue，抽成函数后 return） */
function checkDataField(field) {
  const { rel, type, metaSource, runtimeSource, key, label } = field;
  const dataKey = key.slice('data.'.length);
  if (dataKey.includes('.')) return; // 嵌套路径交给 readPath，静态不判
  const dataBlock = extractBlock(metaSource, 'defaultData');
  const known =
    (dataBlock && new RegExp(`\\b${dataKey}\\s*:`).test(dataBlock)) ||
    new RegExp(`\\b${dataKey}\\b`).test(runtimeSource) ||
    ['staticRows', 'mode', 'datasetCode', 'reportConfig', 'mapping', 'paramBindings', 'drillFields'].includes(dataKey);
  if (!known) fail(`${rel}（${type}）「${label}」: data.${dataKey} 在 defaultData 与运行时都找不到`);
}

/** slider 的初值与量程检查（原来嵌在 5 层里，抽出来把深度降到 4 以内） */
function checkSliderInitial(field) {
  const { rel, type, key, label, item, initial, initialLiteral } = field;
  if (!initial) {
    fail(
      `${rel}（${type}）「${label}」: slider 没有 defaultStyle.${key}，面板会停在 min 而运行时用自己的兜底值，两边不是同一个数`
    );
    return;
  }
  const min = Number((/min\s*:\s*([\d.]+)/.exec(item) || [])[1]);
  const max = Number((/max\s*:\s*([\d.]+)/.exec(item) || [])[1]);
  const num = Number(initialLiteral);
  if (Number.isFinite(num) && Number.isFinite(min) && Number.isFinite(max) && (num < min || num > max)) {
    fail(
      `${rel}（${type}）「${label}」: defaultStyle.${key}=${num} 落在量程 ${min}..${max} 之外，面板一打开就被钳成另一个值`
    );
  }
}

/** 2) 初值检查：只有「无初值会让面板与运行时表现不一致」的控件算不合格 */
function checkInitial(field) {
  const { rel, type, key, label, control, initial } = field;
  if (control === 'slider') {
    checkSliderInitial(field);
    return;
  }
  if (control === 'switch' && !initial) {
    fail(
      `${rel}（${type}）「${label}」: switch 没有 defaultStyle.${key}，面板显示「关」而运行时的默认多半是「非 false 即开」，两边相反`
    );
    return;
  }
  if (!initial && control !== 'slider') {
    notes.push(`${rel}（${type}）「${label}」: 无 ${control} 初值（良性，空值即未设置）`);
  }
}

/** 3) slider 必须给量程 */
function checkSliderScale(field) {
  const { rel, type, label, item, control } = field;
  if (control !== 'slider') return;
  const hasMin = /(^|[{,\s])min\s*:/.test(item);
  const hasMax = /(^|[{,\s])max\s*:/.test(item);
  if (!hasMin || !hasMax)
    fail(
      `${rel}（${type}）「${label}」: slider 缺 ${!hasMin ? 'min' : ''}${!hasMin && !hasMax ? '/' : ''}${!hasMax ? 'max' : ''}，会被兜成 0..100`
    );
}

/** 4) 控件类型与初值类型一致 */
function checkControlKind(field) {
  const { rel, type, key, label, control, defaults, initial } = field;
  if (!initial || !defaults || !CONTROL_KIND[control]) return;
  const value = new RegExp(`(^|[{,\\s])${key}\\s*:\\s*([^,}]+)`).exec(defaults)?.[2]?.trim();
  const kind = literalKind(value || null);
  if (!CONTROL_KIND[control].includes(kind)) {
    fail(`${rel}（${type}）「${label}」: control=${control} 但 defaultStyle 初值是 ${kind}（${value}）`);
  }
}

/** 单个 field 的检查 */
function checkField(ctx, item) {
  const { rel, type, defaults, runtimeSource } = ctx;
  fieldCount += 1;
  const rawKey = pickLiteral(item, 'key');
  if (!rawKey) {
    fail(`${rel}（${type}）: 有 field 没有 key`);
    return;
  }
  const key = rawKey.slice(1, -1);
  const control = (pickLiteral(item, 'control') || '').replace(/^['"]|['"]$/g, '');
  const label = (pickLiteral(item, 'label') || key).replace(/^['"]|['"]$/g, '');
  const field = {
    ...ctx,
    item,
    key,
    control,
    label,
    initial: defaults ? new RegExp(`(^|[{,\\s])${key}\\s*:`).test(defaults) : false,
    initialLiteral: defaults
      ? (new RegExp(`(^|[{,\\s])${key}\\s*:\\s*([^,}]+)`).exec(defaults)?.[2]?.trim() ?? null)
      : null
  };

  if (key.startsWith('data.')) {
    checkDataField(field);
    return;
  }

  // 1) 样式项必须被运行时读到
  if (!new RegExp(`\\b${key}\\b`).test(runtimeSource)) {
    fail(`${rel}（${type}）「${label}」: 面板写 style.${key}，但组件源码里从没读过它`);
  }

  checkInitial(field);
  checkSliderScale(field);
  checkControlKind(field);
}

/** defaultStyle 里有键但面板没有 → 存进 schema 却改不了 */
function checkGhostDefaults(ctx, items) {
  const { rel, type, defaults } = ctx;
  for (const m of defaults.matchAll(/(^|[{,\s])([a-zA-Z][a-zA-Z0-9]*)\s*:/g)) {
    const styleKey = m[2];
    if (!items.some(item => new RegExp(`key:\\s*['"]${styleKey}['"]`).test(item))) {
      notes.push(`${rel}（${type}）: defaultStyle.${styleKey} 没有对应面板项（有值但改不了）`);
    }
  }
}

/** 单个 meta.ts 的检查，返回它贡献的 fieldCount（原来那两个 continue 改成 return） */
function checkMetaFile(metaFile) {
  const metaSource = read(metaFile);
  const type = pickLiteral(metaSource, 'type');
  const rel = relative(PKG_DIR, metaFile).replace(/\\/g, '/');
  if (!type) {
    fail(`${rel}: 取不到 type`);
    return 0;
  }

  const defaults = extractBlock(metaSource, 'defaultStyle');
  const fieldsArray = arrayLiteralAt(metaSource, 'fields:');
  const items = extractItems(fieldsArray);
  if (items.length === 0) {
    notes.push(`${rel}: 没有 fields（面板显示「该组件无可配置项」）`);
    return 0;
  }

  const ctx = { rel, type, metaSource, defaults, runtimeSource: collectRuntimeSource(dirname(metaFile)) };
  for (const item of items) checkField(ctx, item);
  if (defaults) checkGhostDefaults(ctx, items);
  return items.length;
}

const metaFiles = walk(PKG_DIR);

for (const metaFile of metaFiles) {
  fieldCount += checkMetaFile(metaFile);
}

console.log(`大屏组件面板校验：${metaFiles.length} 个组件、${fieldCount} 个配置项`);

/**
 * 全项目只有一处 ElSlider（config-form），它一旦退回「单向 :model-value + @change」就会让
 * 所有滑块集体失效——element-plus 的 change 带出去的是 props.modelValue 而不是新值。
 * 这条断言就是为了拦住那次回退，比组件清单更值得常驻。
 */
const sliderFiles = [];
(function scanSlider(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!full.includes('/node_modules/')) scanSlider(full);
    } else if (full.endsWith('.vue')) {
      const source = read(full);
      const at = source.indexOf('<ElSlider');
      if (at >= 0)
        sliderFiles.push({
          file: relative(ROOT, full),
          block: source.slice(at, source.indexOf('/>', at) + 2 || at + 900)
        });
    }
  }
})(join(ROOT, 'src'));

for (const item of sliderFiles) {
  if (!item.block.includes('@update:model-value')) {
    fail(
      `${item.file}: ElSlider 只接 @change 会让所有滑块拖完回弹（EP 的 change 带的是 props.modelValue），必须接 @update:model-value`
    );
  }
  if (/@change/.test(item.block)) {
    fail(`${item.file}: ElSlider 同时接了 @change，会把 update 写进去的新值用旧 props 覆盖回去`);
  }
}
console.log(`滑块控件写法校验：${sliderFiles.length} 处 ElSlider`);

for (const note of notes) console.log(`  · ${note}`);
if (failures.length) {
  console.error(`\n${failures.length} 项不合格：`);
  failures.forEach(item => console.error(`  ✗ ${item}`));
  process.exit(1);
}
console.log('全部通过');
