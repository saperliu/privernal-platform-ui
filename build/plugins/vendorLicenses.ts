import path from 'node:path';
import { cp, mkdir } from 'node:fs/promises';
import type { Plugin, ResolvedConfig } from 'vite';

/** 交付包需要随附的第三方许可文件：目标相对 dist 根，值相对仓库根 */
const LICENSE_FILES: Record<string, string[]> = {
  '': ['LICENSE', 'NOTICE.md'],
  'third-party-licenses': ['docs/third-party-licenses/prod-licenses.json'],
  'third-party-licenses/warm-flow-designer': [
    'src/libs/warm-flow-designer/LICENSE',
    'src/libs/warm-flow-designer/NOTICE',
    'src/libs/warm-flow-designer/SOURCE.md'
  ]
};

/**
 * 把第三方许可随附文件复制进构建产物。
 *
 * vite 只会输出被模块图引用的资源，LICENSE / NOTICE 这类文档不会自动进 dist；
 * 而 Apache-2.0 第 4 条与 MIT 的「随附许可声明」义务在以 dist 形态交付（含私有化部署包）时
 * 必须落到交付物里，因此在此显式复制。缺文件时直接让构建失败，避免义务静默落空。
 */
export function setupVendorLicensePlugin(): Plugin {
  let outDir = '';
  let root = '';

  return {
    name: 'privernal-vendor-licenses',
    apply: 'build',
    configResolved(config: ResolvedConfig) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await Promise.all(
        Object.entries(LICENSE_FILES).map(async ([target, files]) => {
          const destDir = path.join(outDir, target);
          await mkdir(destDir, { recursive: true });
          await Promise.all(files.map(file => cp(path.resolve(root, file), path.join(destDir, path.basename(file)))));
        })
      );
    }
  };
}
