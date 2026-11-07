/**
 * 大屏（datav）色值管控
 *
 * 大屏与平台共用同一套主题 token，靠约定守不住：一旦有人开始写 #2d8cf0，
 * 平台改主色、切暗色时那块大屏就不会跟随。这里把字面色值挡在提交前。
 *
 * 唯一的例外是 src/styles/css/datav-theme.css —— 配色板本身就是集中定义色值的地方。
 *
 * 用法：pnpm lint:datav
 */
import process from 'node:process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

/** 受管范围：大屏相关的目录与文件 */
const SCAN_TARGETS = [
  'src/views/datav',
  'src/views/datav-designer',
  'src/views/datav-preview',
  'src/components/datav',
  'src/packages/components',
  'src/hooks/datav',
  'src/store/modules/datav',
  'src/utils/datav-schema.ts',
  'src/typings/datav'
];

const EXTENSIONS = ['.vue', '.ts', '.tsx', '.js', '.css', '.scss'];

/** 字面色值：十六进制、rgb()/rgba()、hsl()/hsla() */
const PATTERNS = [
  { name: 'HEX 色值', re: /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g },
  { name: 'rgb()/rgba()', re: /\brgba?\s*\(/g },
  { name: 'hsl()/hsla()', re: /\bhsla?\s*\(/g }
];

/** 明显的注释与 token 定义位置放过 */
function isExcludedLine(line) {
  const t = line.trim();
  if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('<!--')) return true;
  // var(--datav-xxx) 这种引用不算字面色值
  if (
    /var\(--[\w-]+/.test(line) &&
    !PATTERNS.some(p => {
      p.re.lastIndex = 0;
      return p.re.test(line);
    })
  )
    return true;
  return false;
}

function* walk(path) {
  let entries;
  try {
    entries = readdirSync(path);
  } catch {
    return;
  }
  const visible = entries.filter(entry => entry !== 'node_modules' && !entry.startsWith('.'));
  for (const entry of visible) {
    const full = join(path, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (EXTENSIONS.some(ext => entry.endsWith(ext))) yield full;
  }
}

const findings = [];

function scanTarget(target) {
  const abs = join(ROOT, target);
  let st;
  try {
    st = statSync(abs);
  } catch {
    return; // 目录尚未创建
  }
  const files = st.isDirectory() ? [...walk(abs)] : [abs];
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (isExcludedLine(line)) return;
      for (const { name, re } of PATTERNS) {
        re.lastIndex = 0;
        if (re.test(line)) {
          findings.push({
            file: relative(ROOT, file),
            line: index + 1,
            rule: name,
            text: line.trim().slice(0, 100)
          });
        }
      }
    });
  }
}

SCAN_TARGETS.forEach(scanTarget);

if (findings.length > 0) {
  console.error(`\n发现 ${findings.length} 处硬编码色值，请改为引用 --datav-* token：\n`);
  for (const item of findings) {
    console.error(`  ${item.file}:${item.line}  [${item.rule}]  ${item.text}`);
  }
  console.error(
    '\n原因：大屏颜色必须来自主题 token，否则平台改主色或切暗色时大屏不跟随。' +
      '\n确需新增固定色值，请写进 src/styles/css/datav-theme.css 的配色板。\n'
  );
  process.exit(1);
}

console.log(`datav 色值检查通过（扫描 ${SCAN_TARGETS.length} 个受管位置）`);
