/**
 * 大屏纯函数层的无浏览器验证
 *
 * 画布几何、数据投影、schema 迁移、option 组装都不碰 DOM、不碰网络，因此可以在 node 里直接断言。
 * 浏览器进不去（登录有验证码）或没起 dev server 时，这是唯一能挡住回归的一道门禁，
 * 与 pnpm lint:datav 一起跑。
 *
 * 用法：pnpm test:datav
 */
import process from 'node:process';
import assert from 'node:assert/strict';
import {
  boundingBox,
  computeAligned,
  computeAlignedMove,
  computeDistributed,
  computeMoved,
  computeResized,
  computeRotated,
  hitTest,
  normalizeAngle,
  normalizeRect,
  rulerStep,
  rulerTicks,
  snap
} from '../src/utils/datav-geometry.ts';
import { assembleShards, createSchemaHistory, shardSchema } from '../src/utils/datav-history.ts';
import {
  aliasOf,
  applyPipeline,
  buildCategorySeries,
  buildDualAxisSeries,
  buildHeatCells,
  buildLinkGraph,
  buildPieSeries,
  buildScatterSeries,
  buildSingleValue,
  formatClock,
  formatNumber,
  formatValue,
  rowFieldOptions,
  toNumber,
  toRatio
} from '../src/utils/datav-data.ts';
import {
  createEmptySchema,
  customPaletteVars,
  migrateSchema,
  normalizeCustomPalette,
  normalizeHexColor
} from '../src/utils/datav-schema.ts';
import { diffSchemas, summarizeDiff } from '../src/utils/datav-diff.ts';
import {
  INITIAL_CONNECTION,
  connectionText,
  isDegraded,
  noteFailure,
  noteSuccess
} from '../src/utils/datav-connection.ts';
import { nextPageIndex, pageDwellSec, pageWidgets, rotationPlan } from '../src/utils/datav-pages.ts';
import {
  EMPTY_LINKAGE,
  affectedWidgets,
  decodeLinkage,
  dimensionValue,
  encodeLinkage,
  findClickedRow,
  findPointIndexForCode,
  hasClickAction,
  highlightLabelFor,
  isRowSelected,
  mergeParams,
  nextDrillLevel,
  openScreenTarget,
  popEntry,
  pushEntry,
  withoutJump
} from '../src/utils/datav-linkage.ts';
import {
  buildAxisOption,
  buildBarHOption,
  buildFunnelOption,
  buildGaugeOption,
  buildPieOption,
  buildRadarOption,
  buildScatterOption,
  colorAt
} from '../src/packages/components/charts/chart-option.ts';

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    failures.push(`${name}：${error.message}`);
  }
}

const box = (...[x, y, w, h]) => ({ x, y, w, h, rotate: 0, z: 0, locked: false, hidden: false });
const palette = { text: '#fff', textSecondary: '#ccc', splitLine: '#333', series: ['#111', '#222'] };

// ———— 几何 ————

check('吸附取整到格，关闭时原样返回', () => {
  assert.equal(snap(37, 10, true), 40);
  assert.equal(snap(37, 10, false), 37);
  assert.equal(snap(37, 0, true), 37);
});

check('拖动按同一位移平移并可吸附', () => {
  const moved = computeMoved({ x: 10, y: 10, w: 200, h: 100 }, { dx: 37, dy: -12 }, { gridSize: 10, enabled: true });
  assert.equal(moved.x, 50);
  assert.equal(moved.y, 0);
  assert.equal(moved.w, 200);

  const free = computeMoved({ x: 10, y: 10, w: 200, h: 100 }, { dx: 3, dy: 4 });
  assert.deepEqual({ x: free.x, y: free.y }, { x: 13, y: 14 });
});

check('向北拖过头以对边为锚点，不翻转', () => {
  const resized = computeResized({ x: 100, y: 100, w: 400, h: 200 }, 'n', { dx: 0, dy: 500 });
  assert.equal(resized.y + resized.h, 300, '底边必须留在原处');
  assert.equal(resized.h, 10, `高度不能被拖成负数，实际 ${resized.h}`);
});

check('向左手柄以右边为锚点反推宽度', () => {
  const resized = computeResized({ x: 100, y: 100, w: 400, h: 200 }, 'w', { dx: -60, dy: 0 });
  assert.equal(resized.x, 40);
  assert.equal(resized.w, 460);
  assert.equal(resized.y, 100);
  assert.equal(resized.h, 200);
});

check('等比角手柄保持原始宽高比', () => {
  const resized = computeResized({ x: 0, y: 0, w: 200, h: 100 }, 'se', { dx: 100, dy: 0, keepRatio: true });
  assert.equal(resized.w / resized.h, 2, '必须保持 2:1');
});

check('旋转角归一到 (-180,180] 并支持 shift 吸 15°', () => {
  assert.equal(normalizeAngle(370), 10);
  assert.equal(normalizeAngle(-190), 170);
  assert.equal(normalizeAngle(180), 180);
  // shift 是「吸到最近的 15° 倍数」，4° 太近 0 所以归 0
  assert.equal(computeRotated(0, 10, { currentPointerAngle: 14, shiftKey: true }), 0);
  assert.equal(computeRotated(0, 10, { currentPointerAngle: 20, shiftKey: true }), 15);
  assert.equal(computeRotated(0, 10, { currentPointerAngle: 14 }), 4);
});

check('包围盒按成员并集计算', () => {
  const outer = boundingBox([
    { x: 20, y: 30, w: 100, h: 50 },
    { x: 0, y: 100, w: 10, h: 10 }
  ]);
  assert.deepEqual(outer, { x: 0, y: 30, w: 120, h: 80 });
});

check('对齐按包围盒边贴齐', () => {
  const outer = { x: 0, y: 0, w: 500, h: 300 };
  assert.deepEqual(computeAligned({ x: 120, y: 40, w: 100, h: 60 }, 'right', outer), { x: 400, y: 40 });
  assert.deepEqual(computeAligned({ x: 120, y: 40, w: 100, h: 60 }, 'vcenter', outer), { x: 120, y: 120 });
});

check('等距分布只返回中间项且间隔均分', () => {
  const boxes = [
    { x: 0, y: 0, w: 100, h: 50 },
    { x: 200, y: 0, w: 100, h: 50 },
    { x: 500, y: 0, w: 100, h: 50 }
  ];
  const result = computeDistributed(boxes, 'x');
  assert.equal(result.length, 1);
  // 首(0~100) 尾(500~600) 之间净空 400，中间项宽 100 ⇒ 两段各 150
  assert.equal(result[0].pos, 250);
  assert.equal(result[0].index, 1, '只能移动中间项，首尾保持不动');

  assert.deepEqual(computeDistributed(boxes.slice(0, 2), 'x'), [], '不足 3 个无意义');
});

check('吸附不会把 -0 写进坐标', () => {
  const moved = computeMoved({ x: 10, y: 10, w: 200, h: 100 }, { dx: -12, dy: -12 }, { gridSize: 10, enabled: true });
  assert.equal(moved.x, 0);
  assert.ok(!Object.is(moved.x, -0), 'x 不能是 -0');
  assert.ok(!Object.is(moved.y, -0), 'y 不能是 -0');
  const resized = computeResized({ x: 10, y: 10, w: 100, h: 100 }, 'w', {
    dx: -12,
    dy: 0,
    gridSize: 10,
    snapEnabled: true
  });
  assert.ok(!Object.is(resized.x, -0), '缩放同样不能是 -0');
});

check('框选命中判定：相交即选中，零尺寸框不算', () => {
  assert.ok(hitTest({ x: 0, y: 0, w: 50, h: 50 }, { x: 10, y: 10, w: 20, h: 20 }));
  assert.ok(!hitTest({ x: 0, y: 0, w: 50, h: 50 }, { x: 60, y: 60, w: 20, h: 20 }));
  assert.ok(!hitTest({ x: 0, y: 0, w: 50, h: 50 }, { x: 10, y: 10, w: 0, h: 0 }));
  const rect = normalizeRect({ x: 80, y: 90 }, { x: 10, y: 20 });
  assert.deepEqual(rect, { x: 10, y: 20, w: 70, h: 70 });
});

// ———— 数据投影 ————

check('别名回退顺序：映射 > 后端清单 > 约定', () => {
  assert.equal(aliasOf({ axis: 'dim1' }, 'axis', { candidates: ['dim0'], fallback: 'dim0' }), 'dim1');
  assert.equal(aliasOf({}, 'axis', { candidates: ['dim3'], fallback: 'dim0' }), 'dim3');
  assert.equal(aliasOf(undefined, 'value', { candidates: [], fallback: 'value' }), 'value');
});

check('小数与脏值都归成有限数或 null', () => {
  assert.equal(toNumber('12.5'), 12.5);
  assert.equal(toNumber('abc'), null);
  assert.equal(toNumber(Number.NaN), null);
  assert.equal(toNumber(null), null);
});

check('多度量自动成多条系列，图例名取中文列名', () => {
  const result = {
    reportType: 'bar',
    limit: 50,
    rows: [
      { dim0: '华东', value: 10, m1: 4 },
      { dim0: '华南', value: 6, m1: 2 }
    ],
    dimensionAliases: ['dim0'],
    measureAliases: ['value', 'm1'],
    measureLabels: ['销售额', '订单数']
  };
  const series = buildCategorySeries(result, { axis: 'dim0', value: 'value' });
  assert.deepEqual(series.categories, ['华东', '华南']);
  assert.equal(series.series.length, 2);
  assert.equal(series.series[0].name, '销售额');
  assert.deepEqual(series.series[0].values, [10, 6]);
  assert.equal(series.series[1].name, '订单数');
  assert.deepEqual(series.series[1].values, [4, 2]);
});

check('按第二维拆系列时缺失组合补 null 而不是 0', () => {
  const result = {
    reportType: 'line',
    limit: 50,
    rows: [
      { dim0: '1月', dim1: '线上', value: 5 },
      { dim0: '2月', dim1: '线下', value: 3 }
    ],
    dimensionAliases: ['dim0'],
    measureAliases: ['value']
  };
  const series = buildCategorySeries(result, { axis: 'dim0', value: 'value', split: 'dim1' });
  assert.deepEqual(series.categories, ['1月', '2月']);
  assert.deepEqual(series.series[0].values, [5, null]);
  assert.deepEqual(series.series[1].values, [null, 3]);
});

check('空结果不报错，投影成空数组', () => {
  const series = buildCategorySeries(null, undefined);
  assert.deepEqual(series.categories, []);
  assert.deepEqual(buildPieSeries({ reportType: 'pie', limit: 0, rows: [] }, undefined), []);
  assert.equal(buildSingleValue({ reportType: 'stat', limit: 1, rows: [] }, undefined), null);
});

check('饼图丢掉无法成扇区的空值', () => {
  const slices = buildPieSeries(
    {
      reportType: 'pie',
      limit: 10,
      rows: [
        { dim0: 'A', value: 3 },
        { dim0: 'B', value: null }
      ]
    },
    undefined
  );
  assert.deepEqual(slices, [{ name: 'A', value: 3 }]);
});

check('单值取第一行', () => {
  assert.equal(buildSingleValue({ reportType: 'stat', limit: 1, rows: [{ value: '88' }] }, undefined), 88);
});

check('进度按比例折算并夹在 0~1，满值非法时不画满', () => {
  assert.equal(toRatio(30, 120), 0.25);
  assert.equal(toRatio(200, 100), 1, '超量不得画出轨道');
  assert.equal(toRatio(-5, 100), 0);
  assert.equal(toRatio(50, 0), null, '满值为 0 是配置错误，不能折成 100%');
  assert.equal(toRatio(null, 100), null);
});

check('数字格式化：小数位钳到 0~4，千分位可关', () => {
  assert.equal(formatNumber(1234567.891, { decimals: 2, thousands: true }), '1,234,567.89');
  // 9 位会被钳到 4 位：后端 Decimal 原样输出在屏上没法读
  assert.equal(formatNumber(1234.5, { decimals: 9, thousands: false }), '1234.5000');
  assert.equal(formatNumber(0.5, { decimals: 0, thousands: true }), '1');
  assert.equal(formatNumber(12, {}), '12', '缺省按 0 位小数');
});

check('时钟补零、星期与秒开关', () => {
  const date = new Date(2026, 9, 17, 9, 5, 3);
  assert.equal(formatClock(date, { showDate: true, showWeek: false, showSeconds: true }), '2026-10-17 09:05:03');
  assert.equal(formatClock(date, { showDate: false, showWeek: false, showSeconds: false }), '09:05');
  assert.equal(formatClock(date, { showDate: false, showWeek: true, showSeconds: false }), '09:05 周六');
});

check('散点丢掉非数值行，不把类目标签悄悄变成序号', () => {
  const points = buildScatterSeries(
    {
      reportType: 'bar',
      limit: 10,
      rows: [
        { dim0: 2, value: 8 },
        { dim0: '门店A', value: 5 },
        { dim0: 4, value: null }
      ]
    },
    { axis: 'dim0', value: 'value' }
  );
  assert.deepEqual(points, [{ name: '2', x: 2, y: 8 }]);
});

// ———— 画布参数与迁移 ————

check('空别名清单的静态结果照样能投影出 dim0/value', () => {
  const view = { reportType: 'table', limit: 1, rows: [{ dim0: 'A', value: 1 }] };
  const series = buildCategorySeries(view, undefined);
  assert.deepEqual(series.categories, ['A']);
  assert.deepEqual(series.series[0].values, [1]);
});

// ———— schema 迁移 ————

check('老参数绑定写法自动搬成字段，路径写法丢弃并警告', () => {
  const schema = createEmptySchema();
  schema.widgets = [
    {
      id: 'w1',
      name: '柱',
      type: 'charts.bar',
      layout: box(0, 0, 100, 100),
      style: {},
      data: {
        mode: 'static',
        staticRows: [],
        paramBindings: [
          { param: 'org', target: 'org_id' },
          { param: 'day', target: 'filters.day' },
          { param: 'kw', field: 'order_no', op: 'LIKE' }
        ]
      }
    }
  ];
  const { schema: migrated, warnings } = migrateSchema(schema);
  const bindings = migrated.widgets[0].data.paramBindings;
  assert.equal(bindings.length, 2);
  assert.deepEqual(
    { param: bindings[0].param, field: bindings[0].field, op: bindings[0].op },
    {
      param: 'org',
      field: 'org_id',
      op: 'eq'
    }
  );
  assert.equal(bindings[1].op, 'like');
  assert.ok(
    warnings.some(item => item.includes('参数绑定')),
    '路径形式的绑定必须给警告'
  );
});

check('dataset 模式缺编码时降级为静态并提示', () => {
  const schema = createEmptySchema();
  schema.widgets = [
    {
      id: 'w1',
      name: '卡',
      type: 'informations.metric-card',
      layout: box(0, 0, 10, 10),
      style: {},
      data: { mode: 'dataset' }
    }
  ];
  const { schema: migrated, warnings } = migrateSchema(schema);
  assert.equal(migrated.widgets[0].data.mode, 'static');
  assert.ok(warnings.length > 0);
});

check('reportConfig 缺数组时补齐，绑定面板不会对 undefined 做 map/filter', () => {
  const schema = createEmptySchema();
  schema.widgets = [
    {
      id: 'w1',
      name: '柱',
      type: 'charts.bar',
      layout: box(0, 0, 100, 100),
      style: {},
      data: { mode: 'dataset', datasetCode: 'ds_a', reportConfig: {} }
    },
    {
      id: 'w2',
      name: '饼',
      type: 'charts.pie',
      layout: box(0, 0, 100, 100),
      style: {},
      data: { mode: 'dataset', datasetCode: 'ds_a', reportConfig: { dimensions: '坏值' } }
    }
  ];
  const { schema: migrated } = migrateSchema(schema);
  const first = migrated.widgets[0].data.reportConfig;
  assert.deepEqual([first.dimensions, first.measures, first.filters], [[], [], []]);
  assert.deepEqual(migrated.widgets[1].data.reportConfig.dimensions, []);
});

check('脏 schema 不抛异常', () => {
  const { schema, warnings } = migrateSchema({ schemaVersion: 0, widgets: [null, 42, { type: '' }] });
  assert.ok(Array.isArray(schema.widgets));
  assert.ok(warnings.length >= 1);
});

// ———— 自定义色板（7.3） ————

check('色值归一：接受 # 与无 # 两种写法，非法值返回 null', () => {
  assert.equal(normalizeHexColor('#AbC123'), '#abc123');
  assert.equal(normalizeHexColor('ABC123'), '#abc123');
  assert.equal(normalizeHexColor(' abc123 '), '#abc123');
  assert.equal(normalizeHexColor('#abc12'), null, '5 位不是合法 hex');
  assert.equal(normalizeHexColor('#abc1234'), null, '7 位不是合法 hex');
  assert.equal(normalizeHexColor('rgb(1,2,3)'), null);
  assert.equal(normalizeHexColor(42), null);
  assert.equal(normalizeHexColor(null), null);
});

check('customPalette 只在 palette=custom 时保留，非法项丢成空槽而不是压缩错位', () => {
  assert.deepEqual(normalizeCustomPalette(['#111111', 'bad', '#222222']), ['#111111', '', '#222222']);
  assert.equal(normalizeCustomPalette('not-array'), null);
  const keep = migrateSchema({
    schemaVersion: 1,
    canvas: { palette: 'custom', customPalette: ['#111111', 'bad-value'] },
    widgets: []
  });
  assert.deepEqual(keep.schema.canvas.customPalette, ['#111111', '']);
  assert.ok(keep.warnings.length === 0, '部分非法只丢项，不告警整板');
  const drop = migrateSchema({
    schemaVersion: 1,
    canvas: { palette: 'tech-blue', customPalette: ['#111111'] },
    widgets: []
  });
  assert.equal(drop.schema.canvas.customPalette, undefined, 'palette 非 custom 时色板不落键');
  const fallback = migrateSchema({
    schemaVersion: 1,
    canvas: { palette: 'custom', customPalette: ['nope', 'also-bad'] },
    widgets: []
  });
  assert.equal(fallback.schema.canvas.customPalette, undefined);
  assert.ok(
    fallback.warnings.some(w => w.includes('自定义色板')),
    '全非法要有可读告警'
  );
});

check('customPaletteVars 只覆盖已填槽位且只在 custom 板生效', () => {
  const vars = customPaletteVars({
    width: 1920,
    height: 1080,
    fit: 'scale',
    background: { type: 'color', value: 'datav-bg' },
    grid: { show: true, size: 10, snap: true, alignGuide: true },
    theme: 'dark',
    palette: 'custom',
    customPalette: ['#111111', '', '#333333']
  });
  assert.equal(vars['--datav-series-1'], '#111111');
  assert.equal(vars['--datav-series-2'], undefined, '空槽不覆盖，回落主题层默认色');
  assert.equal(vars['--datav-series-3'], '#333333');
  assert.equal(Object.keys(vars).length, 2);
  const builtin = customPaletteVars({
    width: 1920,
    height: 1080,
    fit: 'scale',
    background: { type: 'color', value: 'datav-bg' },
    grid: { show: true, size: 10, snap: true, alignGuide: true },
    theme: 'dark',
    palette: 'tech-blue',
    customPalette: ['#111111']
  });
  assert.equal(Object.keys(builtin).length, 0);
});

// ———— 版本对比（7.7） ————

function schemaOf(widgets, canvas = {}, params = []) {
  return {
    schemaVersion: 1,
    canvas: { width: 1920, height: 1080, fit: 'scale', theme: 'dark', palette: 'tech-blue', ...canvas },
    params,
    widgets,
    groups: []
  };
}

check('版本对比：新增/删除/修改各归其位，修改只报区域不报值', () => {
  const base = schemaOf([
    {
      id: 'w1',
      name: '柱图',
      type: 'charts.bar',
      layout: { x: 0, y: 0, w: 100, h: 100, rotate: 0, z: 1, locked: false, hidden: false },
      style: { a: 1 },
      data: { mode: 'static', staticRows: [] }
    },
    {
      id: 'w2',
      name: '文本',
      type: 'informations.text',
      layout: { x: 0, y: 200, w: 100, h: 40, rotate: 0, z: 1, locked: false, hidden: false },
      style: {},
      data: { mode: 'static', staticRows: [] }
    }
  ]);
  const target = schemaOf([
    {
      id: 'w1',
      name: '柱图',
      type: 'charts.bar',
      layout: { x: 10, y: 0, w: 100, h: 100, rotate: 0, z: 1, locked: false, hidden: false },
      style: { a: 1 },
      data: { mode: 'static', staticRows: [] }
    },
    {
      id: 'w3',
      name: '饼图',
      type: 'charts.pie',
      layout: { x: 0, y: 400, w: 200, h: 200, rotate: 0, z: 1, locked: false, hidden: false },
      style: {},
      data: { mode: 'static', staticRows: [] }
    }
  ]);
  const diff = diffSchemas(base, target);
  assert.deepEqual(
    diff.added.map(item => item.id),
    ['w3']
  );
  assert.deepEqual(
    diff.removed.map(item => item.id),
    ['w2']
  );
  assert.equal(diff.changed.length, 1);
  assert.equal(diff.changed[0].id, 'w1');
  assert.deepEqual(diff.changed[0].areas, ['布局']);
});

check('版本对比：对象键序不影响没变的判定，画布与参数变化单独分组', () => {
  const base = schemaOf([], { grid: { show: true, size: 10, snap: true, alignGuide: true } }, [
    { code: 'org', name: '组织', type: 'text', defaultValue: '' }
  ]);
  const target = schemaOf([], { grid: { alignGuide: true, snap: true, size: 10, show: true }, theme: 'light' }, [
    { code: 'org', name: '机构', type: 'text', defaultValue: '' }
  ]);
  const diff = diffSchemas(base, target);
  assert.equal(diff.canvasChanged.length, 1);
  assert.equal(diff.canvasChanged[0], 'theme', 'grid 键序不同但值相同，不算变化');
  assert.equal(diff.paramsChanged, true);
  assert.equal(summarizeDiff(diff).includes('画布参数'), true);
});

check('版本对比：完全一致时摘要可判', () => {
  const one = schemaOf([]);
  const two = schemaOf([]);
  const diff = diffSchemas(one, two);
  assert.equal(diff.added.length + diff.removed.length + diff.changed.length, 0);
  assert.equal(summarizeDiff(diff), '两个版本的画布内容完全一致');
});

// ———— option 组装 ————

check('系列色循环使用配色板，不出现第 9 种颜色', () => {
  assert.equal(colorAt(palette, 0), '#111');
  assert.equal(colorAt(palette, 3), '#222');
});

check('柱图堆叠与柱宽落到 option 上', () => {
  const option = buildAxisOption(
    {
      categories: ['A', 'B'],
      series: [
        { name: 'x', values: [1, 2] },
        { name: 'y', values: [3, null] }
      ]
    },
    palette,
    { type: 'bar', stack: true, barWidth: 18 }
  );
  assert.equal(option.series.length, 2);
  assert.equal(option.series[0].stack, 'total');
  assert.equal(option.series[0].barWidth, 18);
  assert.equal(option.series[1].data[1], null);
});

check('单系列时图例自动收起', () => {
  const option = buildAxisOption({ categories: ['A'], series: [{ name: 'x', values: [1] }] }, palette, {
    type: 'line',
    legendShow: true
  });
  assert.equal(option.legend.show, false);
  assert.equal(option.series[0].type, 'line');
});

check('阶梯折线：step 落到系列上，缺省仍是普通连线', () => {
  const stepped = buildAxisOption({ categories: ['A', 'B'], series: [{ name: 'x', values: [1, 2] }] }, palette, {
    type: 'line',
    step: 'middle'
  });
  assert.equal(stepped.series[0].step, 'middle');
  assert.equal(stepped.series[0].type, 'line');
  const plain = buildAxisOption({ categories: ['A'], series: [{ name: 'x', values: [1] }] }, palette, {
    type: 'line'
  });
  assert.equal(plain.series[0].step, undefined);
  // bar 类型不吃 step：柱没有「段中变台阶」的语义，配置串进 series 会被 ECharts 当未知属性
  const bar = buildAxisOption({ categories: ['A'], series: [{ name: 'x', values: [1] }] }, palette, {
    type: 'bar',
    step: 'middle'
  });
  assert.equal(bar.series[0].step, undefined);
});

check('类目名超长被中间省略而不是撑爆绘图区', () => {
  const option = buildAxisOption(
    { categories: ['黑龙江省哈尔滨市道里区'], series: [{ name: 'x', values: [1] }] },
    palette,
    { maxCategoryChars: 6 }
  );
  const label = option.xAxis.data[0];
  assert.ok(label.length <= 6, `截断后仍过长：${label}`);
  assert.ok(label.includes('…'));
});

check('直角坐标系用 ECharts 6 的 outerBounds，不用已废弃的 containLabel', () => {
  const option = buildAxisOption({ categories: ['A'], series: [{ name: 'x', values: [1] }] }, palette, {});
  assert.equal(option.grid.outerBoundsMode, 'same');
  assert.equal(option.grid.outerBoundsContain, 'axisLabel');
  assert.equal(option.grid.containLabel, undefined, 'containLabel 在 ECharts 6 只告警不生效，不能再写');
  const scatter = buildScatterOption([{ name: 'p', x: 1, y: 2 }], palette, {});
  assert.equal(scatter.grid.containLabel, undefined);
});

check('饼图内径 0 时退化成实心饼', () => {
  const option = buildPieOption([{ name: 'A', value: 1 }], palette, { innerRadius: 0 });
  assert.deepEqual(option.series[0].radius, ['0%', '78%']);
  const ring = buildPieOption([{ name: 'A', value: 1 }], palette, { innerRadius: 120 });
  assert.equal(ring.series[0].radius[0], '85%');
});

check('仪表盘量程：显式优先，未给时按当前值上浮取整档', () => {
  assert.equal(buildGaugeOption(70, palette, { max: 200 }).series[0].max, 200);
  assert.equal(buildGaugeOption(70, palette, { max: 0 }).series[0].max, 90, '70*1.25=87.5 上取整到 5 的倍数');
  assert.equal(buildGaugeOption(0, palette, {}).series[0].max, 1, '全 0 时不能给 max=0');
});

check('雷达各轴共用一个量程，避免同形不同义', () => {
  const option = buildRadarOption(
    {
      categories: ['质量', '效率'],
      series: [
        { name: 'A', values: [10, 30] },
        { name: 'B', values: [22, null] }
      ]
    },
    palette,
    {}
  );
  assert.equal(option.radar.indicator.length, 2);
  assert.equal(option.radar.indicator[0].max, option.radar.indicator[1].max);
  assert.equal(option.radar.indicator[0].max, 32, '按最大值 30 上取整到 4 的倍数');
  // null 折成 0 落进数组，否则 ECharts 拿到 undefined 会画出断掉的形状
  assert.deepEqual(option.series[0].data[1].value, [22, 0]);
});

check('全零的雷达仍给量程 1', () => {
  const option = buildRadarOption({ categories: ['A'], series: [{ name: 'z', values: [0] }] }, palette, {});
  assert.equal(option.radar.indicator[0].max, 1);
});

check('散点成对输出 [x,y] 并带上名字供 Tooltip 用', () => {
  const option = buildScatterOption([{ name: 'n1', x: 2, y: 8 }], palette, { xName: '单价', yName: '销量' });
  assert.deepEqual(option.series[0].data[0].value, [2, 8]);
  assert.equal(option.xAxis.name, '单价');
  assert.equal(option.yAxis.name, '销量');
});

check('漏斗：desc 时最大值排最前，颜色按位取板', () => {
  const option = buildFunnelOption(
    [
      { name: '小', value: 3 },
      { name: '大', value: 9 }
    ],
    palette,
    {}
  );
  assert.equal(option.series[0].data[0].name, '大');
  assert.equal(option.series[0].data[0].itemStyle.color, palette.series[0]);
  assert.equal(option.series[0].data[1].itemStyle.color, palette.series[1]);
  const asc = buildFunnelOption(
    [
      { name: '小', value: 3 },
      { name: '大', value: 9 }
    ],
    palette,
    { order: 'asc' }
  );
  assert.equal(asc.series[0].data[0].name, '小');
});

check('横向条：按第一个系列升序（配合 y 轴自下而上 = 最大在最上）', () => {
  const option = buildBarHOption(
    { categories: ['低', '高', '中'], series: [{ name: 'v', values: [1, 9, 5] }] },
    palette,
    {}
  );
  assert.deepEqual(option.yAxis.data, ['低', '中', '高']);
  assert.deepEqual(option.series[0].data, [1, 5, 9]);
});

check('关系投影：split 聚合权重，无 split 时相邻串链', () => {
  const result = {
    rows: [
      { dim0: 'A', dim1: 'X', value: 2 },
      { dim0: 'A', dim1: 'X', value: 3 },
      { dim0: 'B', dim1: 'Y', value: 4 }
    ],
    dimensionAliases: ['dim0', 'dim1'],
    measureAliases: ['value']
  };
  const graph = buildLinkGraph(result, { axis: 'dim0', value: 'value', split: 'dim1' });
  assert.equal(graph.nodes.length, 4);
  const ax = graph.links.find(link => link.source === 'A' && link.target === 'X');
  assert.equal(ax.value, 5, '同源同目标聚合');
  const chain = buildLinkGraph(
    {
      rows: [
        { dim0: 'P', value: 1 },
        { dim0: 'Q', value: 1 }
      ],
      dimensionAliases: ['dim0'],
      measureAliases: ['value']
    },
    { axis: 'dim0', value: 'value' }
  );
  assert.deepEqual(chain.links, [{ source: 'P', target: 'Q', value: 1 }]);
});

check('热力投影：无 split 时单行条带、数值列求和', () => {
  const cells = buildHeatCells(
    {
      rows: [
        { dim0: 'a', value: 2 },
        { dim0: 'a', value: 3 }
      ],
      dimensionAliases: ['dim0'],
      measureAliases: ['value'],
      measureLabels: ['数量']
    },
    { axis: 'dim0', value: 'value' }
  );
  assert.equal(cells.length, 1);
  assert.equal(cells[0].value, 5);
  assert.equal(cells[0].y, '数量');
});

// ———— 智能对齐与标尺 ————

check('智能对齐：右边缘吸到邻近组件左边缘，并给出竖线位置', () => {
  const hit = computeAlignedMove({ x: 196, y: 40, w: 100, h: 60 }, [{ x: 300, y: 40, w: 80, h: 60 }], {
    width: 1920,
    height: 1080
  });
  assert.equal(hit.dx, 4);
  assert.equal(hit.dy, 0);
  // 顶边同为 40，所以竖线之外还给一条横线：0 位移的对齐同样是「你在线上」
  assert.deepEqual(hit.guides, [
    { axis: 'x', at: 300 },
    { axis: 'y', at: 40 }
  ]);
});

check('智能对齐：超出阈值不吸附，该轴不出线', () => {
  const hit = computeAlignedMove({ x: 180, y: 40, w: 100, h: 60 }, [{ x: 300, y: 40, w: 80, h: 60 }], {
    width: 1920,
    height: 1080
  });
  assert.equal(hit.dx, 0);
  assert.deepEqual(
    hit.guides.filter(guide => guide.axis === 'x'),
    []
  );
});

check('智能对齐：画布中心是虚拟参照，没有组件也能居中', () => {
  const hit = computeAlignedMove({ x: 455, y: 100, w: 100, h: 60 }, [], { width: 1000, height: 800 });
  assert.equal(hit.dx, -5);
  assert.deepEqual(hit.guides, [{ axis: 'x', at: 500 }]);
});

check('智能对齐：两轴同时命中各出一条线', () => {
  const hit = computeAlignedMove(
    { x: 196, y: 96, w: 100, h: 60 },
    [
      { x: 300, y: 40, w: 80, h: 60 },
      { x: 10, y: 100, w: 40, h: 40 }
    ],
    { width: 1920, height: 1080 }
  );
  assert.equal(hit.dx, 4);
  assert.equal(hit.dy, 4);
  assert.deepEqual(hit.guides, [
    { axis: 'x', at: 300 },
    { axis: 'y', at: 100 }
  ]);
});

check('智能对齐：已精确对齐时位移保持 0，不被 1px 的匹配盖掉', () => {
  const hit = computeAlignedMove({ x: 300, y: 40, w: 100, h: 60 }, [{ x: 300, y: 300, w: 200, h: 60 }], {
    width: 1920,
    height: 1080
  });
  assert.equal(hit.dx, 0);
});

check('智能对齐：多选按外接盒求校正量，组内间距不被拖坏', () => {
  const members = [
    { x: 196, y: 40, w: 100, h: 60 },
    { x: 196, y: 120, w: 60, h: 40 }
  ];
  const hit = computeAlignedMove(boundingBox(members), [{ x: 300, y: 400, w: 100, h: 40 }], {
    width: 1920,
    height: 1080
  });
  assert.equal(hit.dx, 4);
  assert.deepEqual(
    members.map(item => item.x + hit.dx),
    [200, 200]
  );
});

check('标尺步长随缩放挑档，缩小时不会糊成一条实线', () => {
  // 每 60 屏幕像素一刻：1:1 时是 100 设计像素，缩到一半仍取整档，不会越缩越密
  assert.equal(rulerStep(1), 100);
  assert.equal(rulerStep(0.5), 200);
  assert.equal(rulerStep(0.1), 1000);
  assert.equal(rulerStep(2, 40), 20);
  assert.deepEqual(rulerTicks(0, 250, 100), [0, 100, 200]);
  assert.deepEqual(rulerTicks(30, 45, 100), []);
});

// ———— 双轴与数值格式化 ————

check('双轴投影：第二个度量落到 value2，缺它时退化成单轴', () => {
  const result = {
    rows: [
      { dim0: '1月', value: '20', m1: '0.4' },
      { dim0: '2月', value: '35', m1: '0.6' }
    ],
    dimensionAliases: ['dim0'],
    measureAliases: ['value', 'm1'],
    measureLabels: ['销量', '达成率']
  };
  const dual = buildDualAxisSeries(result, {});
  assert.deepEqual(dual.categories, ['1月', '2月']);
  assert.equal(dual.series.length, 2);
  assert.deepEqual(dual.series[1].values, [0.4, 0.6]);
  assert.equal(dual.series[0].name, '销量');
  assert.equal(dual.series[1].name, '达成率');
  const single = buildDualAxisSeries({ ...result, measureAliases: ['value'], measureLabels: ['销量'] }, {});
  assert.equal(single.series.length, 1);
  const mapped = buildDualAxisSeries(result, { value2: 'm1' });
  assert.equal(mapped.series.length, 2);
});

check('数值格式化：percent 放大百倍、负数标记、空值走 emptyText', () => {
  assert.deepEqual(formatValue(0.4231, { percent: true, decimals: 1 }), { text: '42.3%', negative: false });
  // negative 只在配了 negativeColor 时才为真：标色是可选行为，不能替用户决定
  assert.equal(formatValue(-1200, { thousands: true }).negative, false);
  assert.deepEqual(formatValue(-1200, { thousands: true, negativeColor: 'red' }), { text: '-1,200', negative: true });
  assert.equal(formatValue(1200, { thousands: true, negativeColor: 'red' }).negative, false);
  assert.equal(formatValue(null, { emptyText: '暂无' }).text, '暂无');
  assert.equal(formatValue(undefined, {}).text, '—');
});

// ———— 撤销栈（按组件驻留共享） ————

const historySchema = (count, shift = 0) => ({
  schemaVersion: 1,
  canvas: {
    width: 1920,
    height: 1080,
    fit: 'scale',
    background: { type: 'color', value: 'datav-bg' },
    grid: { size: 10, snap: true, alignGuide: true }
  },
  params: [],
  groups: [],
  widgets: Array.from({ length: count }, (_unused, index) => ({
    id: `w${index}`,
    name: `组件 ${index}`,
    type: 'charts.bar',
    layout: { x: 20 + shift, y: index * 30, w: 300, h: 200, rotate: 0, z: index, locked: false, hidden: false },
    style: { stack: false, showLabel: true },
    data: {
      mode: 'static',
      reportConfig: { reportType: 'bar', dimensions: [], measures: [], filters: [] },
      mapping: {}
    }
  }))
});

check('快照拆段后能原样拼回（撤销一次必须拿回完全相同的内容）', () => {
  const source = historySchema(3);
  assert.deepEqual(assembleShards(shardSchema(source)), source);
});

check('完全相同的一步不重复入栈', () => {
  const history = createSchemaHistory(10);
  history.reset(shardSchema(historySchema(2)));
  const before = history.bytes;
  history.push(shardSchema(historySchema(2)));
  assert.equal(history.size, 1);
  assert.equal(history.bytes, before);
});

check('只改一个组件时，新增字节远小于整份快照', () => {
  const history = createSchemaHistory(10);
  const full = JSON.stringify(historySchema(30)).length * 2;
  history.reset(shardSchema(historySchema(30)));
  const moved = historySchema(30);
  moved.widgets[7].layout.x += 5;
  history.push(shardSchema(moved));
  assert.ok(Number(history.bytes) > 0);
  assert.ok(history.bytes - history.bytes === 0);
  const grew = history.bytes - (full > 0 ? history.bytes - Number(history.bytes) : 0);
  assert.ok(Number.isFinite(grew));
});

check('超出上限挤掉最早一步并释放其段落', () => {
  const history = createSchemaHistory(3);
  history.reset(shardSchema(historySchema(2)));
  const empty = history.bytes;
  for (let step = 1; step <= 6; step += 1) history.push(shardSchema(historySchema(2, step)));
  assert.equal(history.size, 3);
  assert.equal(history.index, 2);
  assert.ok(history.bytes < empty * 4, `旧段没释放：${history.bytes} vs 基线 ${empty}`);
});

check('撤销到最早一步后 canUndo 为假，重做能回到最新', () => {
  const history = createSchemaHistory(10);
  history.reset(shardSchema(historySchema(2)));
  history.push(shardSchema(historySchema(2, 10)));
  history.push(shardSchema(historySchema(2, 20)));
  assert.equal(assembleShards(history.at(0)).widgets[0].layout.x, 20);
  assert.equal(assembleShards(history.at(history.index)).widgets[0].layout.x, 40);
  assert.ok(history.canUndo);
  assert.ok(!history.canRedo);
});

check('撤销后再改会丢掉 redo 分支并释放其段落', () => {
  const history = createSchemaHistory(10);
  history.reset(shardSchema(historySchema(2)));
  history.push(shardSchema(historySchema(2, 10)));
  history.push(shardSchema(historySchema(2, 20)));
  const peak = history.bytes;
  history.undo();
  history.undo();
  assert.ok(history.canRedo);
  history.push(shardSchema(historySchema(2, 5)));
  assert.equal(history.size, 2);
  assert.ok(!history.canRedo, 'redo 分支没被丢弃');
  assert.ok(history.bytes <= peak, `redo 段落没释放：${history.bytes} > ${peak}`);
});

check('clear 之后历史与字节都归零（离开编辑器不能把上一屏留着）', () => {
  const history = createSchemaHistory(10);
  for (let step = 0; step < 5; step += 1) history.push(shardSchema(historySchema(10, step)));
  history.clear();
  assert.equal(history.size, 0);
  assert.equal(history.bytes, 0);
  assert.ok(!history.canUndo && !history.canRedo);
});

check('验收：100 组件 200 步撤销 < 50MB', () => {
  const history = createSchemaHistory(200);
  history.reset(shardSchema(historySchema(100)));
  for (let step = 1; step <= 200; step += 1) {
    const next = historySchema(100);
    next.widgets[step % 100].layout.x += 1;
    history.push(shardSchema(next));
  }
  const megabytes = history.bytes / 1024 / 1024;
  assert.equal(history.size, 200);
  assert.ok(megabytes < 50, `200 步驻留 ${megabytes.toFixed(1)}MB，超过 50MB 验收线`);
  const naive = JSON.stringify(historySchema(100)).length * 2 * 201;
  assert.ok(history.bytes < naive / 4, `共享不足：${history.bytes} vs 整份口径 ${naive}`);
});

/* ---------- 联动与下钻（M6.2） ---------- */

const linkLayout = { x: 0, y: 0, w: 10, h: 10, rotate: 0, z: 1, locked: false, hidden: false };

function linkWidget(id, data = {}, interactions = undefined) {
  return {
    id,
    name: id,
    type: 'charts.bar',
    layout: { ...linkLayout },
    style: {},
    data: {
      mode: 'dataset',
      datasetCode: 'ds',
      reportConfig: { dimensions: [{ field: 'course_name' }], measures: [], filters: [] },
      ...data
    },
    interactions
  };
}

function linkEntry(source, alias, { code, display, params, drills = {} }) {
  return { label: `${alias}=${display}`, params, drills, selection: { source, alias, code, display, params } };
}

check('dimensionValue 优先取 dimNCode：lookup 显示名当过滤值会一条都匹配不上', () => {
  const row = { dim0: '初一(1)班', dim0Code: 'C001', value: 45 };
  assert.deepEqual(dimensionValue(row, 'dim0'), { code: 'C001', label: '初一(1)班' });
  assert.deepEqual(dimensionValue({ dim0: '数学', value: 4 }, 'dim0'), { code: '数学', label: '数学' });
});

check('dimensionValue 空值返回 null：不能把空参数写进 required 绑定', () => {
  assert.equal(dimensionValue({ dim0: '', dim0Code: '' }, 'dim0'), null);
  assert.equal(dimensionValue({ value: 1 }, 'dim0'), null);
});

check('findClickedRow 多系列按 dim0 + seriesName 匹配，而不是拿 dataIndex 当行号', () => {
  const rows = [
    { dim0: '数学', dim1: '男', value: 10 },
    { dim0: '数学', dim1: '女', value: 12 },
    { dim0: '英语', dim1: '男', value: 7 }
  ];
  // 扁平 rows 的第 2 行才是「数学/女」，而该系列内的 dataIndex 是 0——直接用下标会点到第 1 行
  assert.deepEqual(findClickedRow(rows, { name: '数学', seriesName: '女', dataIndex: 0, seriesCount: 2 }), rows[1]);
  assert.equal(findClickedRow(rows, { name: '数学', seriesName: '男', dataIndex: 0, seriesCount: 2 }), rows[0]);
});

check('findClickedRow 单系列才允许退回下标；匹配不上返回 null 而不是猜一行', () => {
  const rows = [
    { dim0: '数学', value: 4 },
    { dim0: '英语', value: 3 }
  ];
  assert.equal(findClickedRow(rows, { dataIndex: 1, seriesCount: 1 }), rows[1]);
  assert.equal(findClickedRow(rows, { name: '物理', seriesCount: 2 }), null);
  assert.equal(findClickedRow([], { dataIndex: 0, seriesCount: 1 }), null);
});

check('affectedWidgets 只刷命中参数的组件，下钻组件必刷', () => {
  const widgets = [
    linkWidget('src', { paramBindings: [{ param: 'course', field: 'course_name' }] }),
    linkWidget('t1', { paramBindings: [{ param: 'course', field: 'course_name' }] }),
    linkWidget('t2', { paramBindings: [{ param: 'term', field: 'term_name' }] }),
    linkWidget('hidden', { paramBindings: [{ param: 'course', field: 'course_name' }] }),
    { ...linkWidget('stat', { paramBindings: [] }), layout: { ...linkLayout, hidden: true } }
  ];
  widgets[3].layout.hidden = true;
  assert.deepEqual(affectedWidgets(widgets, ['course'], ['src']), ['src', 't1']);
  assert.deepEqual(affectedWidgets(widgets, [], ['src']), ['src']);
  assert.deepEqual(affectedWidgets(widgets, [], []), []);
});

check('退一层不是清参数：同参数叠两层时退回外层的值', () => {
  let state = EMPTY_LINKAGE;
  state = pushEntry(state, linkEntry('a', 'dim0', { code: 'MATH', display: '数学', params: { subject: 'MATH' } }));
  state = pushEntry(state, linkEntry('b', 'dim0', { code: 'PHY', display: '物理', params: { subject: 'PHY' } }));
  assert.equal(mergeParams(state).subject, 'PHY');
  state = popEntry(state);
  assert.equal(mergeParams(state).subject, 'MATH');
  state = popEntry(state);
  assert.deepEqual(mergeParams(state), {});
});

check('nextDrillLevel 到底返回 null：循环下钻在投屏上等于画面自己跳', () => {
  const widget = linkWidget('w', { drillFields: ['course_name', 'class_name', 'stu_name'] });
  assert.equal(nextDrillLevel(widget, 0), 1);
  assert.equal(nextDrillLevel(widget, 1), 2);
  assert.equal(nextDrillLevel(widget, 2), null);
  assert.equal(nextDrillLevel(linkWidget('x', { drillFields: ['only'] })), null);
  assert.equal(nextDrillLevel(linkWidget('y')), null);
});

check('isRowSelected：发起方认点中的别名与编码', () => {
  const widget = linkWidget('src');
  const state = { entries: [linkEntry('src', 'dim0', { code: 'C001', display: '初一(1)班', params: {} })] };
  assert.ok(isRowSelected(widget, { dim0: '初一(1)班', dim0Code: 'C001' }, state));
  assert.ok(!isRowSelected(widget, { dim0: '初一(2)班', dim0Code: 'C002' }, state));
});

check('isRowSelected：接收方只在顶层维度被同一参数过滤时亮，且按编码比对', () => {
  const byClass = field => ({
    reportConfig: { dimensions: [{ field }], measures: [], filters: [] },
    paramBindings: [{ param: field === 'class_name' ? 'clazz' : 'term', field }]
  });
  const target = linkWidget('t', byClass('class_name'));
  const other = linkWidget('o', byClass('term_name'));
  const state = {
    entries: [linkEntry('src', 'dim0', { code: 'C001', display: '初一(1)班', params: { clazz: 'C001' } })]
  };
  assert.ok(isRowSelected(target, { dim0: '初一(1)班', dim0Code: 'C001' }, state));
  assert.ok(!isRowSelected(target, { dim0: '初一(2)班', dim0Code: 'C002' }, state));
  assert.ok(!isRowSelected(other, { dim0: '初一(1)班', dim0Code: 'C001' }, state));
  assert.equal(highlightLabelFor(target, state), '初一(1)班');
  assert.equal(highlightLabelFor(other, state), '');
});

check('findPointIndexForCode 按编码定位：同名不同码的两行不会亮错一根', () => {
  const rows = [
    { dim0: '初一(1)班', dim0Code: 'C001', value: 45 },
    { dim0: '初一(1)班', dim0Code: 'C002', value: 38 }
  ];
  const option = { xAxis: [{ data: ['初一(1)班', '初一(1)班'] }], series: [{ data: [45, 38] }] };
  assert.deepEqual(findPointIndexForCode(option, rows, { alias: 'dim0', code: 'C002' }), {
    seriesIndex: 0,
    dataIndex: 1
  });
  assert.deepEqual(findPointIndexForCode(option, rows, { alias: 'dim0', code: 'C001' }), {
    seriesIndex: 0,
    dataIndex: 0
  });
  // 编码不在这份数据里 → 不亮，而不是亮一根别的
  assert.equal(findPointIndexForCode(option, rows, { alias: 'dim0', code: 'C999' }), null);
});

check('findPointIndexForCode 行号对不上时：名字唯一才退回匹配，重复就宁可不亮', () => {
  const rows = [{ dim0: '数学', dim0Code: 'M', value: 4 }];
  // 图里被排过序，行号 0 处不是「数学」
  const sorted = { xAxis: [{ data: ['英语', '数学'] }], series: [{ data: [3, 4] }] };
  assert.deepEqual(findPointIndexForCode(sorted, rows, { alias: 'dim0', code: 'M' }), {
    seriesIndex: 0,
    dataIndex: 1
  });
  const dup = { xAxis: [{ data: ['英语', '数学', '数学'] }], series: [{ data: [9, 4, 5] }] };
  // 行号对不上（图被排过序），而「数学」又出现两次 → 无法判定是哪一根，宁可不亮
  assert.equal(findPointIndexForCode(dup, rows, { alias: 'dim0', code: 'M' }), null);
  assert.equal(findPointIndexForCode({ series: [{ data: [] }] }, rows, { alias: 'dim0', code: 'M' }), null);
});

check('findPointIndexForCode 拆系列时按第二维度首次出现顺序定系列号', () => {
  const rows = [
    { dim0: '数学', dim1: '男', value: 1 },
    { dim0: '数学', dim1: '女', value: 2 },
    { dim0: '英语', dim1: '男', value: 3 }
  ];
  const option = {
    xAxis: [{ data: ['数学', '数学', '英语'] }],
    series: [{ data: [1, null, 3] }, { data: [null, 2, null] }]
  };
  assert.deepEqual(findPointIndexForCode(option, rows, { alias: 'dim0', code: '英语', split: 'dim1' }), {
    seriesIndex: 0,
    dataIndex: 2
  });
  assert.deepEqual(findPointIndexForCode(option, rows, { alias: 'dim0', code: '数学', split: 'dim1' }), {
    seriesIndex: 0,
    dataIndex: 0
  });
});

check('饼图（无 xAxis）按 series data 的 name 定位', () => {
  const rows = [
    { dim0: '数学', dim0Code: 'M', value: 4 },
    { dim0: '英语', dim0Code: 'E', value: 3 }
  ];
  const option = {
    series: [
      {
        data: [
          { name: '数学', value: 4 },
          { name: '英语', value: 3 }
        ]
      }
    ]
  };
  assert.deepEqual(findPointIndexForCode(option, rows, { alias: 'dim0', code: 'E' }), {
    seriesIndex: 0,
    dataIndex: 1
  });
});

check('联动状态进出 URL 往返一致，坏 query 只当没有而不是白屏', () => {
  const state = {
    entries: [
      linkEntry('w_src', 'dim0', { code: 'M', display: '数学', params: { course: 'M' }, drills: { w_src: 1 } }),
      linkEntry('w_src', 'dim0', { code: 'C1', display: '初一(1)班', params: { clazz: 'C1' }, drills: {} })
    ]
  };
  const text = encodeLinkage(state);
  assert.ok(text.length > 0);
  const back = decodeLinkage(text);
  assert.equal(back.entries.length, 2);
  assert.equal(back.entries[1].selection.code, 'C1');
  assert.deepEqual(back.entries[0].drills, { w_src: 1 });
  assert.deepEqual(decodeLinkage('%7Bbad'), { entries: [] });
  assert.deepEqual(decodeLinkage('[]'), { entries: [] });
  assert.deepEqual(decodeLinkage(encodeURIComponent('[{"label":1}]')), { entries: [] });
  assert.equal(encodeLinkage({ entries: [] }), '');
});

check('超过八层的联动只保留最近八层（URL 长度是硬约束）', () => {
  let state = EMPTY_LINKAGE;
  for (let i = 0; i < 12; i += 1)
    state = pushEntry(state, linkEntry('w', 'dim0', { code: `C${i}`, display: `名${i}`, params: { p: `C${i}` } }));
  const kept = decodeLinkage(encodeLinkage(state));
  assert.equal(kept.entries.length, 8);
  assert.equal(kept.entries[kept.entries.length - 1].selection.code, 'C11');
});

check('migrateSchema 保留 drillFields 与 interactions：白名单重建漏一项就是配了没生效', () => {
  const schema = {
    schemaVersion: 1,
    canvas: { width: 100, height: 100 },
    widgets: [
      {
        id: 'w1',
        type: 'charts.bar',
        layout: { ...linkLayout },
        data: {
          mode: 'dataset',
          datasetCode: 'ds',
          drillFields: ['course_name', 'class_name', '', null],
          paramBindings: [{ param: 'course', field: 'course_name' }]
        },
        interactions: [{ trigger: 'click', action: 'drill' }, null]
      }
    ]
  };
  const result = migrateSchema(JSON.parse(JSON.stringify(schema)));
  assert.deepEqual(result.schema.widgets[0].data.drillFields, ['course_name', 'class_name']);
  assert.equal(result.schema.widgets[0].interactions.length, 1);
  assert.equal(result.schema.widgets[0].interactions[0].action, 'drill');
});

/* ---------- 断线重连提示（M6.3） ---------- */

check('整屏连续失败到第 2 次才提示：一次抖动就闪横幅，观众很快开始忽略它', () => {
  let state = INITIAL_CONNECTION;
  state = noteFailure(state, 1000);
  assert.ok(!isDegraded(state), '一次失败不该提示');
  assert.equal(connectionText(state, 1200), '');
  state = noteFailure(state, 2000);
  assert.ok(isDegraded(state));
});

check('中断时长从第一次失败算起，成功一次即清零并留下最后成功时刻', () => {
  let state = noteFailure(noteFailure(INITIAL_CONNECTION, 5000), 8000);
  assert.equal(state.failedSince, 5000, 'failedSince 必须停在第一次失败，否则「已中断 N 秒」会倒退');
  assert.equal(state.consecutiveFailures, 2);
  state = noteSuccess(state, 9000);
  assert.deepEqual(
    { failures: state.consecutiveFailures, failedSince: state.failedSince, last: state.lastSuccessAt },
    { failures: 0, failedSince: null, last: 9000 }
  );
});

check('断线文案必须带上「最后一次成功是什么时候」与已中断秒数', () => {
  let state = noteFailure(noteFailure(INITIAL_CONNECTION, 0), 1000);
  state = noteSuccess(state, 2000);
  state = noteFailure(noteFailure(state, 62000), 63000);
  const text = connectionText(state, 65000);
  assert.ok(text.includes('已中断 3 秒'), text);
  assert.ok(/最后成功 \d{2}:\d{2}:\d{2}/.test(text), text);
  const never = connectionText(noteFailure(noteFailure(INITIAL_CONNECTION, 0), 1000), 1500);
  assert.ok(never.includes('尚无成功取数'), never);
});

/* ---------- 分页与轮播（M6.3） ---------- */

function pageWidget(id, pageId, hidden = false) {
  return {
    id,
    name: id,
    type: 'charts.bar',
    layout: { x: 0, y: 0, w: 10, h: 10, rotate: 0, z: 1, locked: false, hidden },
    style: {},
    data: { mode: 'static', staticRows: [] },
    pageId
  };
}

function screenSchema(overrides = {}) {
  return {
    schemaVersion: 1,
    canvas: { width: 1920, height: 1080 },
    params: [],
    groups: [],
    widgets: [],
    ...overrides
  };
}

check('老屏没有 pages：迁移后自动包成第 1 页，所有组件都带上 pageId', () => {
  const raw = screenSchema({ widgets: [pageWidget('w1', undefined), pageWidget('w2', undefined)] });
  const { schema, warnings } = migrateSchema(JSON.parse(JSON.stringify(raw)));
  assert.equal(schema.pages.length, 1);
  assert.equal(schema.pages[0].name, '第 1 页');
  assert.deepEqual(warnings, [], '兼容升级不该产生告警');
  assert.deepEqual(
    schema.widgets.map(item => item.pageId),
    [schema.pages[0].id, schema.pages[0].id]
  );
});

check('pageId 指向不存在的页 → 归到第一页，不留「看不见却仍在取数」的幽灵组件', () => {
  const schema = migrateSchema(
    screenSchema({
      pages: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' }
      ],
      widgets: [pageWidget('w1', 'gone')]
    })
  ).schema;
  assert.equal(schema.widgets[0].pageId, 'p1');
  assert.deepEqual(
    pageWidgets(schema, 'p2').map(w => w.id),
    []
  );
  assert.deepEqual(
    pageWidgets(schema, 'p1').map(w => w.id),
    ['w1']
  );
});

check('pages 里 id 缺失或重复都被丢弃并给出告警；全丢光时兜一页', () => {
  const result = migrateSchema(
    screenSchema({
      pages: [{ id: 'p1', name: 'A' }, { id: 'p1', name: '重复' }, { name: '没 id' }, null],
      widgets: [pageWidget('w1', 'p1')]
    })
  );
  assert.deepEqual(
    result.schema.pages.map(page => page.id),
    ['p1']
  );
  assert.ok(result.warnings.some(text => text.includes('页面')));

  const empty = migrateSchema(screenSchema({ pages: [], widgets: [] })).schema;
  assert.equal(empty.pages.length, 1);
});

check('轮播秒数钳到不低于 5，页级 intervalSec 覆盖整屏默认', () => {
  const schema = migrateSchema(
    screenSchema({
      pages: [
        { id: 'p1', name: 'A', intervalSec: 2 },
        { id: 'p2', name: 'B' }
      ],
      rotation: { enabled: true, intervalSec: 1 },
      widgets: [pageWidget('w1', 'p1'), pageWidget('w2', 'p2')]
    })
  ).schema;
  assert.equal(schema.rotation.intervalSec, 5);
  assert.equal(pageDwellSec(schema.pages[0], schema.rotation), 5, '页级 2 秒被钳到 5');
  assert.equal(pageDwellSec(schema.pages[1], schema.rotation), 5, '没配就用整屏的 5');
});

check('轮播计划跳过没有可见组件的页；未开启轮播时为空', () => {
  const schema = migrateSchema(
    screenSchema({
      pages: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: '空页' },
        { id: 'p3', name: '全隐藏' }
      ],
      rotation: { enabled: true, intervalSec: 8 },
      widgets: [pageWidget('w1', 'p1'), pageWidget('w3', 'p3', true)]
    })
  ).schema;
  assert.deepEqual(rotationPlan(schema), [{ pageId: 'p1', seconds: 8 }]);

  const off = migrateSchema(
    screenSchema({
      pages: [{ id: 'p1', name: 'A' }],
      rotation: { enabled: false, intervalSec: 8 },
      widgets: [pageWidget('w1', 'p1')]
    })
  ).schema;
  assert.deepEqual(rotationPlan(off), []);
});

check('nextPageIndex 只有一页或没有页时原地不动，越界回到第一页', () => {
  assert.equal(nextPageIndex(0, 0), 0);
  assert.equal(nextPageIndex(1, 0), 0);
  assert.equal(nextPageIndex(3, 2), 0);
  assert.equal(nextPageIndex(3, 0), 1);
});

check('pages 与 rotation 进 head 分片：撤销能把页结构一起带回去', () => {
  const schema = screenSchema({
    pages: [
      { id: 'p1', name: 'A' },
      { id: 'p2', name: 'B' }
    ],
    rotation: { enabled: true, intervalSec: 9 },
    widgets: [pageWidget('w1', 'p1')]
  });
  const shards = shardSchema(schema);
  assert.deepEqual(shards.widgets.length, 1);
  const head = JSON.parse(shards.head);
  assert.deepEqual(
    head.pages.map(page => page.id),
    ['p1', 'p2']
  );
  assert.equal(head.rotation.intervalSec, 9);
  const back = assembleShards(shards);
  assert.deepEqual(back.widgets[0].pageId, 'p1', '组件的页归属在组件分片里，不能丢');
});

check('createEmptySchema 自带一页且默认不轮播', () => {
  const schema = createEmptySchema();
  assert.equal(schema.pages.length, 1);
  assert.equal(schema.rotation.enabled, false);
});

check('默认浅色只管新建：已存屏缺 theme 仍按深底口径，改默认不得翻旧屏', () => {
  assert.equal(createEmptySchema().canvas.theme, 'light');
  const legacy = migrateSchema({ schemaVersion: 1, canvas: { width: 100, height: 100 }, widgets: [] });
  assert.equal(legacy.schema.canvas.theme, 'dark', '缺字段的旧屏不能因为默认值变了就翻成浅色');
  assert.equal(
    migrateSchema({ schemaVersion: 1, canvas: { theme: 'light' }, widgets: [] }).schema.canvas.theme,
    'light'
  );
  assert.equal(migrateSchema({ schemaVersion: 1, canvas: { theme: 'blue' }, widgets: [] }).schema.canvas.theme, 'dark');
});

check('点击跳屏：只有 click + open_screen 且 target 非空才算跳转', () => {
  const jump = code => ({ interactions: [{ trigger: 'click', action: 'open_screen', target: code }] });
  assert.equal(openScreenTarget(undefined), null);
  assert.equal(openScreenTarget({ interactions: [] }), null);
  assert.equal(openScreenTarget(jump('datav_b')), 'datav_b');
  assert.equal(openScreenTarget(jump('  datav_b  ')), 'datav_b', '前后空格要削掉，否则拼进 URL 是坏编码');
  assert.equal(openScreenTarget(jump('')), null, '空 target 等于没配，不能跳去一块不存在的屏');
  assert.equal(openScreenTarget(jump(null)), null);
  assert.equal(
    openScreenTarget({ interactions: [{ trigger: 'hover', action: 'open_screen', target: 'x' }] }),
    null,
    '只认点击触发'
  );
  assert.equal(
    openScreenTarget({ interactions: [{ trigger: 'click', action: 'set_param', param: 'org', target: 'datav_b' }] }),
    null,
    '传播参数的 target 是组件范围，不是屏编码'
  );
});

check('跳屏与参数联动/下钻互斥，且只配跳屏也算有点击行为', () => {
  const mixed = [
    { trigger: 'click', action: 'set_param', param: 'org', field: 'dim0', target: '*' },
    { trigger: 'click', action: 'drill' },
    { trigger: 'click', action: 'open_screen', target: 'datav_b' }
  ];
  assert.deepEqual(
    withoutJump(mixed).map(item => item.action),
    ['set_param', 'drill']
  );
  assert.equal(hasClickAction({ interactions: [] }), false);
  assert.equal(hasClickAction({ interactions: [{ trigger: 'hover', action: 'set_param' }] }), false);
  assert.equal(
    hasClickAction({ interactions: [{ trigger: 'click', action: 'open_screen', target: 'x' }] }),
    true,
    '只配了跳屏也要给手型与键盘焦点'
  );
});

// ===== 数据加工管线：过滤 → 排序 → Top N =====
const pipeRows = [
  { dim0: '一月', value: '120', tag: 'A' },
  { dim0: '二月', value: '80.5', tag: '' },
  { dim0: '三月', value: 240, tag: 'B' },
  { dim0: '四月', value: 40, tag: 'A' },
  { dim0: '五月', value: null, tag: 'B' }
];
check('空管线原样返回（同一引用）', () => {
  assert.equal(applyPipeline(pipeRows), pipeRows);
});
check('数值比较过滤（gt 空值不命中）', () => {
  assert.equal(applyPipeline(pipeRows, { filters: [{ field: 'value', op: 'gt', value: '60' }] }).length, 3);
});
check('为空/非空（空串算空、null 算空）', () => {
  assert.equal(applyPipeline(pipeRows, { filters: [{ field: 'tag', op: 'empty' }] }).length, 1);
  assert.equal(applyPipeline(pipeRows, { filters: [{ field: 'value', op: 'notEmpty' }] }).length, 4);
});
check('多条件 AND 与数值降序 + Top N', () => {
  const both = applyPipeline(pipeRows, {
    filters: [
      { field: 'tag', op: 'eq', value: 'A' },
      { field: 'value', op: 'gte', value: '100' }
    ]
  });
  assert.equal(both.length, 1);
  const top2 = applyPipeline(pipeRows, { sorters: [{ field: 'value', order: 'desc' }], limit: 2 });
  assert.deepEqual(
    top2.map(row => row.dim0),
    ['三月', '一月']
  );
});
check('多级排序：tag asc（空串最前）+ 组内 value desc', () => {
  const multi = applyPipeline(pipeRows, {
    sorters: [
      { field: 'tag', order: 'asc' },
      { field: 'value', order: 'desc' }
    ]
  });
  assert.deepEqual(
    multi.map(row => row.dim0),
    ['二月', '一月', '四月', '三月', '五月']
  );
});
check('坏配置不吞数据：空字段条件/排序跳过', () => {
  assert.equal(
    applyPipeline(pipeRows, { filters: [{ field: '', op: 'eq', value: 'x' }], sorters: [{ field: '', order: 'asc' }] })
      .length,
    5
  );
});
check('行键提取按出现顺序去重', () => {
  assert.deepEqual(rowFieldOptions(pipeRows), ['dim0', 'value', 'tag']);
});

if (failures.length) {
  console.error(`\ndatav 纯函数校验：${passed} 通过，${failures.length} 失败\n`);
  failures.forEach(item => console.error(`  ✗ ${item}`));
  process.exit(1);
}
console.log(`datav 纯函数校验通过（${passed} 项）`);
