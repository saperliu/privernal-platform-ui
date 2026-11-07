# NOTICE

本文件列明 春祈平台（Privernal Studio）前端（`privernal-platform-ui`）在分发时必须随附的第三方来源与许可声明。
请在每一份分发副本（含私有化部署包）中保留本文件。

## 1. 派生自开源项目

本仓库派生自开源项目 **soybean-admin-element-plus**（Copyright (c) 2021 Soybean，MIT License），
其上游仓库为 <https://github.com/soybeanjs/soybean-admin-element-plus>。

在此基础上的改造由 Privernal Studio 完成，包括：

- 品牌替换（产品名 春祈平台 / Privernal Studio、界面文案、页脚版权、图标与头像资产）
- 内部包命名空间重命名（`@sa/*` → `@privernal/*`，CLI `sa` → `privernal`，UnoCSS 预设重命名）
- 上游文档站、社群、赞助等身份信息移除，改为自有 README/CHANGELOG
- 后端服务地址从上游在线 mock 切换为产品后端

上游 MIT 许可证原文与版权声明完整保留在 [LICENSE](./LICENSE) 中。

**免责声明**：Soybean 及 soybean-admin 项目与本产品及产品所属公司之间不存在任何隶属、赞助、背书或认可关系。

## 2. 上游同源工具（保留其原始包名）

以下 npm 包由上游作者维护，本仓库仍作为开发依赖使用，包名无法替换：

| 包 | 用途 |
| --- | --- |
| `@soybeanjs/eslint-config` | ESLint 规则集（开发期） |
| `@soybeanjs/changelog` | CHANGELOG 生成（经工作区包 `@privernal/scripts` 引入，开发期） |
| `@elegant-router/vue` | 约定式路由生成（开发期） |

## 3. 第三方依赖许可

本前端的生产依赖共 492 个包，按许可证分布（2026-11-05 重锁 `phoenix-designer@1.3.14` 至 registry 后以 `pnpm licenses:dump` 实测）：

| 许可证 | 包数 |
| --- | --- |
| MIT | 382 |
| ISC | 50 |
| BSD-3-Clause | 30 |
| Apache-2.0（含表述为 "Apache 2.0"/"WITH LLVM-exception" 的变体） | 20 |
| BSD-2-Clause | 3 |
| Unlicense | 2 |
| MPL-2.0 | 1 |
| (MPL-2.0 OR Apache-2.0) | 1 |
| MIT AND ISC | 1 |
| (MIT AND Zlib) | 1 |
| 0BSD | 1 |
| **合计** | **492** |

生产依赖中**不含** GPL / LGPL / AGPL / SSPL 类组件（上表 13 种许可即全部实测取值）。
唯一的文件级 copyleft 组件见 4.1。本表只覆盖 npm 生产依赖，不含第 5 节的内嵌源码目录，
也不含图标、字体等非 npm 资产。

复现清单（本仓库已把输出落盘，重跑应无差异）：

```bash
pnpm install
pnpm licenses list --prod                 # 分组浏览
pnpm licenses:dump                        # 重新生成下面这份机读清单
```

已随仓库提交的机读清单：[docs/third-party-licenses/prod-licenses.json](./docs/third-party-licenses/prod-licenses.json)
（13 组许可 / 492 个包，含各包的 `versions`、`paths`、`author`、`homepage`）。
**必须用 `pnpm licenses:dump` 而不是直接重定向 `pnpm licenses list --prod --json`** —— 后者会把
`paths` 写成本机绝对路径（随开源仓库泄露本机用户名与目录结构）；该脚本把 `paths` 压成仓库相对路径
并按包名排序，见 `scripts/dump-prod-licenses.mjs`。
私有化交付时应把该清单与本文件一并附上。

## 4. 授权风险项与处置

### 4.1 文件级 copyleft（MPL-2.0）

| 包 | 风险点 | 处理方式 |
| --- | --- | --- |
| `@resvg/resvg-js`（MPL-2.0，经 `@visactor/vchart` 链传递引入） | 文件级 copyleft，未修改其源码时无开源义务 | 保持不修改，随包保留许可即可 |
| `dompurify`（MPL-2.0 OR Apache-2.0） | 双许可，可自行选择 | 按 Apache-2.0 使用 |

### 4.2 需要留意

| 包 | 风险点 | 处理方式 |
| --- | --- | --- |
| `xlsx@0.18.5`（Apache-2.0） | npm 上的 0.18.5 为 Apache-2.0；官方此后不再通过 npm 发布，升级会改用专有许可 | 锁定版本；需要新特性时评估替代方案 |
| `@amap/amap-jsapi-types`、`@types/bmapgl` | 高德/百度地图类型声明（仅编译期引用），实际接入地图服务需遵守其服务条款与 Key 归属 | 接入前确认服务条款与企业 Key |
| `wangeditor`（MIT） | 社区已停止维护 | 富文本选型时评估替代方案 |

### 4.3 打印模板组件

| 包 | 许可证 | 用途与义务 |
| --- | --- | --- |
| `luckysheet@2.1.13` | MIT（项目已停止维护，社区延续为 Univer） | 单据打印 SHEET 模板设计器画布。未修改其源码；经 `utils/luckysheet-loader.ts` 动态 import UMD 产物隔离为独立 chunk，只在打开表格模板编辑器时加载；随包保留其 MIT 许可即可，无额外交付义务 |

## 5. 内嵌第三方源码目录：warm-flow 流程设计器

`src/libs/warm-flow-designer/` 内嵌 **Warm-Flow 官方前端设计器**（dromara 开源项目
**Warm-Flow**，<https://github.com/dromara/warm-flow>，Apache License 2.0）的构建产物与类型声明，
属**译自/改写自上游**（来源判定见该目录 `SOURCE.md` 第三节）。该目录**不是本项目的原创代码**，
任何场合（README、宣传材料、交付文档）均不得声明为自研。

| 项 | 内容 |
| --- | --- |
| 上游项目 | Warm-Flow（dromara），Apache-2.0；许可证据为其发布 POM `org.dromara.warm:warm-flow:1.8.9` 的 `<licenses>` 段 |
| 内嵌内容 | `warm-flow-designer.es.js`、`antdv.es.js`、`element-plus.es.js`、`naive.es.js`、`warm-flow-designer.css`、`src/**`（64 个上游类型声明） |
| 本项目自有部分 | 仅 `index.ts`、`dataProvider.ts`、`global.d.ts` 三个接入封装文件 |
| 上游文件是否修改 | **未修改**（目录内容与导入上游时一致，非上游文件仅为接入封装三件与 `SOURCE.md`；原导入提交 hash 已不随发布历史保留，基线登记见 `SOURCE.md` 第五节） |
| 随附义务落实 | 目录内 `LICENSE`（Apache-2.0 原文）+ 目录内 `NOTICE`（来源、权利归属、变更声明）+ `SOURCE.md`（判定依据与逐项清单） |
| 保留的上游署名 | `@dromara/warm-flow-designer` 导入路径、warm-flow 标识、`src/utils/ruoyi.d.ts` 的 `Copyright (c) 2019 ruoyi` —— 均不得移除 |
| 外部运行时 | 产物内置 `@iconify` 远程图标接口（`api.iconify.design` 等），内网部署需换本地图标集 |
| 待补 | 上游确切 commit/tag 基线未记录（见 `SOURCE.md` 第五节第 4 条），后续同步上游时必须补记 |

**免责声明**：Warm-Flow、dromara 及其贡献者与本产品（春祈平台 / Privernal Studio）及本仓库之间
不存在任何隶属、赞助、背书或认可关系。

分发时须把 `src/libs/warm-flow-designer/` 下的 `LICENSE`、`NOTICE`、`SOURCE.md` 与本文件一并交付。
以构建产物形态交付时这一步已由构建自动完成：`build/plugins/vendorLicenses.ts` 在 `vite build`
结束时把上述三件复制到 `dist/third-party-licenses/warm-flow-designer/`，同时复制仓库 `LICENSE`、
`NOTICE.md` 与上面的机读许可清单；缺文件会让构建失败。

## 6. 不构成本项目权利主张的内容

本仓库中的界面图形资产（favicon、logo）为项目自绘；`src/assets/svg-icon/` 中的 `alova.svg`、`visactor.svg`、
`wind.svg`、`chrome.svg` 等技术标识仅用于示例页面的技术栈指代，其商标权利归各自所有方。
