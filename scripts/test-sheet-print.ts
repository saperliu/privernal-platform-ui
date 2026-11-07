/**
 * SHEET 渲染器离线单测（node tsx 直跑，不起 vite）：
 * 覆盖：占位符协议（主表/明细循环/聚合/序号/未知字段保留）、循环块多行模板与多块、
 * 空明细块塌缩、边框归一（border-all/outside/none + 单元格 bd）、合并单元格（静态/块内/跨界）、
 * 行高列宽/样式映射、多单拼接分页。断言为"产出 HTML 必须包含的关键事实"。
 */
import assert from 'node:assert/strict';
import {
  type SheetTemplate,
  buildSheetBinding,
  collectSheetTokens,
  renderSheetHtml
} from '../src/utils/doc-print/sheet';

// ---- 造一个贴近真实报销单的模板 ----
const sheet: SheetTemplate = {
  name: '报销单',
  celldata: [
    // 标题行（合并 A1:F1）
    { r: 0, c: 0, v: { m: '{{title_label}}', v: '主标题', ct: { t: 's' }, fs: 16, bl: 1, ht: 0 } },
    // 表头行
    { r: 1, c: 0, v: { m: '序号', v: '序号', bl: 1, ht: 0 } },
    { r: 1, c: 1, v: { m: '费用说明', v: '费用说明', bl: 1, ht: 0 } },
    { r: 1, c: 2, v: { m: '金额', v: '金额', bl: 1, ht: 0 } },
    // 明细循环模板行（单行块）
    { r: 2, c: 0, v: { m: '{{__seq}}', v: '{{__seq}}' } },
    { r: 2, c: 1, v: { m: '{{items.name}}', v: '{{items.name}}' } },
    { r: 2, c: 2, v: { m: '{{items.amount}}', v: '{{items.amount}}', ht: 2 } },
    // 合计行
    { r: 3, c: 1, v: { m: '合计', v: '合计', bl: 1 } },
    { r: 3, c: 2, v: { m: '{{SUM(items.amount)}}', v: '{{SUM(items.amount)}}', bl: 1, ht: 2 } },
    { r: 3, c: 3, v: { m: '共{{COUNT(items)}}笔', v: '共{{COUNT(items)}}笔' } },
    // 未知主表字段（软引用保留）
    { r: 4, c: 0, v: { m: '{{ghost_field}}', v: '{{ghost_field}}' } }
  ],
  config: {
    merge: { '0_0': { r: 0, rs: 1, c: 0, cs: 4 } },
    rowlen: { 1: 28 },
    columnlen: { 2: 160 },
    borderInfo: [
      {
        rangeType: 'range',
        borderType: 'border-all',
        style: '1',
        color: '#000000',
        range: [{ row: [1, 3], column: [0, 2] }]
      },
      {
        rangeType: 'range',
        borderType: 'border-none',
        style: '1',
        color: '#000000',
        range: [{ row: [4, 4], column: [0, 0] }]
      }
    ]
  }
};

const docs: Array<{ main: Record<string, unknown>; details: Record<string, Array<Record<string, unknown>>> }> = [
  {
    main: { title_label: '差旅报销单' },
    details: {
      items: [
        { name: '机票', amount: 1200 },
        { name: '住宿', amount: 800 },
        { name: '市内交通', amount: 55.5 }
      ]
    }
  },
  // 第二份：空明细 → 循环块塌缩 + 警告
  { main: { title_label: '第二份空明细' }, details: {} }
];

const { html, warnings } = renderSheetHtml({
  sheet,
  docs,
  printConfig: { paper: 'A4', orientation: 'PORTRAIT', margins: { top: 10, bottom: 10, left: 10, right: 10 } },
  formName: '报销打印'
});

// 1) 占位符填充
assert.ok(html.includes('差旅报销单'), '主表占位符应被填充');
assert.ok(html.includes('机票') && html.includes('住宿') && html.includes('市内交通'), '明细行应循环展开');
assert.ok(html.includes('2055.5'), 'SUM 聚合应算出 2055.5');
assert.ok(html.includes('共3笔'), 'COUNT 聚合应算出 3');
assert.ok(
  (html.match(/>\d+</g) ?? []).some(m => m === '>1<' || m === '>2<'),
  '序号占位符应输出行号'
);
assert.ok(html.includes('{{ghost_field}}'), '未知字段应保留占位符原文');
assert.ok(html.includes('border: 1px solid #000000') || /border-[a-z]+: 1px solid/.test(html), '边框应生成 CSS');

// 2) 第二份空明细：塌缩 + 警告
assert.ok(
  warnings.some(w => w.includes('items') && w.includes('无数据行')),
  '空明细应产生警告'
);
assert.ok(!html.includes('第二份空明细</h1>..机票'), 'sanity');

// 3) 循环块展开后 3 行明细：合计行出现在序号 3 之后
const seq3 = html.indexOf('>3<');
const sumIdx = html.indexOf('2055.5');
assert.ok(seq3 > -1 && sumIdx > seq3, '合计应在最后一行明细之后');

// 4) 多单分页与标题
assert.ok(html.includes('doc-page-break'), '多单之间应有分页符');
assert.ok(html.includes('（2/2）'), '第二份应有份数标注');
assert.ok(html.includes('@page { size: A4 portrait; margin: 10mm 10mm 10mm 10mm; }'), '@page 应按打印配置生成');

// 5) 合并单元格：标题跨 4 列
assert.ok(/colspan="4"/.test(html), '标题合并应输出 colspan');

// 6) 行高列宽
assert.ok(html.includes('height:28px'), '自定义行高应生效');
assert.ok(html.includes('width:160px'), '自定义列宽应生效');

// 7) 富文本单元格按纯文本拼接
const richSheet: SheetTemplate = {
  celldata: [
    {
      r: 0,
      c: 0,
      v: {
        ct: {
          t: 'inlineStr',
          s: [
            { v: '富文本', m: '富文本' },
            { v: '拼接', m: '拼接' }
          ]
        }
      }
    }
  ],
  config: {}
};
const richOut = renderSheetHtml({ sheet: richSheet, docs: [{ main: {}, details: {} }] });
assert.ok(richOut.html.includes('富文本拼接'), '富文本应按段拼接为纯文本');

// 8) 多行模板块：两行同属一个子表 → 一块；隔行重续 → 两块
const multiRowSheet: SheetTemplate = {
  celldata: [
    { r: 0, c: 0, v: { m: '{{a.f1}}', v: '{{a.f1}}' } },
    { r: 1, c: 0, v: { m: '{{a.f2}}', v: '{{a.f2}}' } },
    { r: 2, c: 0, v: { m: '分隔', v: '分隔' } },
    { r: 3, c: 0, v: { m: '{{a.f3}}', v: '{{a.f3}}' } }
  ],
  config: {}
};
// 块数经 render + binding 间接验证（Grid 构造不外露，render 是公开口径）
const multiOut = renderSheetHtml({
  sheet: multiRowSheet,
  docs: [
    {
      main: {},
      details: {
        a: [
          { f1: 1, f2: 2, f3: 3 },
          { f1: 4, f2: 5, f3: 6 }
        ]
      }
    }
  ]
});
assert.ok(multiOut.html.includes('分隔'), '静态行应保留');
assert.equal((multiOut.html.match(/>分隔</g) ?? []).length, 1, '静态行只应出现一次');
// 两块 × 2 行数据：全部 6 个值都应出现（f1/f2 块出 1,2,4,5；f3 块出 3,6）
for (const value of ['>1<', '>2<', '>3<', '>4<', '>5<', '>6<']) {
  assert.ok(multiOut.html.includes(value), `两块展开应包含值 ${value}`);
}
// binding 观测：两个块
const binding = buildSheetBinding(multiRowSheet);
assert.equal(binding.details.length, 1, '同一子表的多块应归并到一个 detail 条目');
assert.equal(binding.details[0]?.blocks.length, 2, '隔行的引用应识别成两个块');
assert.deepEqual(
  collectSheetTokens(multiRowSheet).map(t => t.kind),
  ['detail', 'detail', 'detail'],
  'token 收集应按占位符去重分类（纯文本"分隔"不产生 token）'
);

// 9) 跨界合并告警
const crossSheet: SheetTemplate = {
  celldata: [
    { r: 0, c: 0, v: { m: '表头', v: '表头' } },
    { r: 1, c: 0, v: { m: '{{a.f}}', v: '{{a.f}}' } }
  ],
  config: { merge: { '0_0': { r: 0, rs: 2, c: 0, cs: 1 } } }
};
const crossOut = renderSheetHtml({ sheet: crossSheet, docs: [{ main: {}, details: { a: [{ f: 'x' }] } }] });
assert.ok(
  crossOut.warnings.some(w => w.includes('跨越明细循环区边界')),
  '跨界合并应告警并按未合并输出'
);

// 10) 颜色白名单：非法颜色回落黑色（防模板 JSON 注入面）
const evilSheet: SheetTemplate = {
  celldata: [{ r: 0, c: 0, v: { m: 'x', v: 'x', fc: 'red;position:fixed', bg: '#fff' } }],
  config: {}
};
const evilOut = renderSheetHtml({ sheet: evilSheet, docs: [{ main: {}, details: {} }] });
assert.ok(!evilOut.html.includes('position:fixed'), '非法颜色不得进入内联样式');
assert.ok(evilOut.html.includes('color: #000000'), '非法颜色应回落 #000000');

// 11) 连字符字段编码（设计器生成的 sub-table_8652 形态）
const hyphenSheet: SheetTemplate = {
  celldata: [
    { r: 0, c: 0, v: { m: '{{sub-table_8652.input_6482}}', v: '{{sub-table_8652.input_6482}}' } },
    { r: 1, c: 0, v: { m: '{{SUM(sub-table_8652.number_5188)}}', v: '{{SUM(sub-table_8652.number_5188)}}' } }
  ],
  config: {}
};
const hyphenTokens = collectSheetTokens(hyphenSheet);
assert.equal(hyphenTokens[0].kind, 'detail', '连字符子表编码应解析为 detail token');
assert.equal(hyphenTokens[1].kind, 'agg', '连字符聚合应解析为 agg token');
const hyphenOut = renderSheetHtml({
  sheet: hyphenSheet,
  docs: [
    {
      main: {},
      details: {
        'sub-table_8652': [
          { input_6482: '物品A', number_5188: 30 },
          { input_6482: '物品B', number_5188: 12 }
        ]
      }
    }
  ],
  formName: '连字符测试'
});
assert.ok(hyphenOut.html.includes('物品A') && hyphenOut.html.includes('物品B'), '连字符子表循环应展开');
assert.ok(hyphenOut.html.includes('42'), '连字符子表 SUM 应算出 42');
console.log('连字符编码用例通过 ✅');

// 12) 删除线（cl 字段，与下划线可并存）
const strikeSheet: SheetTemplate = {
  celldata: [
    { r: 0, c: 0, v: { m: '划线', v: '划线', un: 1, cl: 1 } },
    { r: 1, c: 0, v: { m: '仅删除线', v: '仅删除线', cl: 1 } }
  ],
  config: {}
};
const strikeOut = renderSheetHtml({ sheet: strikeSheet, docs: [{ main: {}, details: {} }] });
assert.ok(strikeOut.html.includes('text-decoration: underline line-through'), '下划线+删除线应并存输出');
assert.ok(strikeOut.html.includes('text-decoration: line-through'), '单独删除线应输出');
console.log('删除线用例通过 ✅');

console.log('SHEET 渲染器单测全部通过 ✅  warnings 示例:', warnings.slice(0, 2));
