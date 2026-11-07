import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * 生成生产依赖许可清单 docs/third-party-licenses/prod-licenses.json。
 *
 * pnpm 的 --json 输出里 paths 是执行机器的绝对路径，直接入库会把本机用户名与目录结构
 * 随开源仓库分发出去，因此这里统一压成仓库相对路径，并按包名排序保证重跑可 diff。
 */
const root = process.cwd();
const target = 'docs/third-party-licenses/prod-licenses.json';

const raw = execFileSync('pnpm', ['licenses', 'list', '--prod', '--json'], {
  cwd: root,
  maxBuffer: 64 * 1024 * 1024
}).toString();

const grouped = JSON.parse(raw);
const output = {};

for (const [license, rows] of Object.entries(grouped)) {
  output[license] = rows
    .map(row => ({
      ...row,
      paths: (row.paths ?? []).map(item => path.relative(root, item).split(path.sep).join('/'))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const packageCount = Object.values(output).reduce((sum, rows) => sum + rows.length, 0);

writeFileSync(path.join(root, target), `${JSON.stringify(output, null, 2)}\n`);
console.log(`${target}：${Object.keys(output).length} 组许可证 / ${packageCount} 个包`);
