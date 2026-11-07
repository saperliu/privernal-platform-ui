warm-flow 设计器前端 — 来源与许可说明
==========================================

核对于：2026-10-02（来源核对）／2026-11-01（来源判定，见第三节）

一、本目录内容

  - `warm-flow-designer.es.js` / `antdv.es.js` / `element-plus.es.js` / `naive.es.js` /
    `warm-flow-designer.css`：已构建的设计器产物（按 UI 适配器分入口）。
  - `src/`：上游设计器构建时随产物发出的类型声明树（api、components、composables、config、
    data、designer、i18n、icons、plugins、store、ui、utils），共 64 个 `.d.ts` 文件，无 `.vue`
    或可执行 `.ts` 源码。
  - `index.ts`、`dataProvider.ts`、`global.d.ts`：Privernal Studio 侧的接入封装，
    负责 `registerWarmFlowDesigner(app)` 初始化、数据接口适配与类型声明。
  - `LICENSE`、`NOTICE`：随本目录分发的 Apache-2.0 许可证原文与第三方来源声明（义务落实见第五节）。

  接入位置：`src/main.ts:12` 注册（`registerWarmFlowDesigner(app)`），另有三处按需动态加载
  （`src/views/designer/components/flow-design-panel.vue`、`src/views/flow/components/flow-graph-panel.vue`、
  `src/components/business/workflow-detail-modal.vue`）。产物落点：`warm-flow-designer.css` 由
  `index.ts:3` 静态引入（随入口 chunk），`*.es.js` 经 `index.ts` 内的动态 `import()` 单独成 chunk
  按需加载 —— 两者都会进入构建交付物。

二、与上游 warm-flow 的关系（事实）

  上游项目：Warm-Flow，https://github.com/dromara/warm-flow，许可证 Apache-2.0。
  后端依赖版本：1.8.9（`org.dromara.warm:warm-flow-mybatis-plus-sb3-starter`
  `warm-flow-plugin-ui-sb-web`、`warm-flow-plugin-vue3-ui`，见 privernal-platform/pom.xml）。
  许可证据：上游发布 POM
  <https://repo1.maven.org/maven2/org/dromara/warm/warm-flow/1.8.9/warm-flow-1.8.9.pom>
  的 `<licenses>` 段声明 "The Apache Software License, Version 2.0"，`<scm>` 指向上述仓库（2026-11-01 实测）。

  核对结果（供判定来源时参考）：

  1. 官方 `warm-flow-plugin-vue3-ui:1.8.9` jar 内的设计器形态是
     `META-INF/resources/warm-flow-ui/js/index-*.js` + `css/index-*.css`（服务端渲染的独立 SPA），
     与本目录的 ESM 库形态（`*.es.js` + 多 UI 适配器子入口）不一致。
  2. 本目录 `.d.ts` 注释中的导入路径写作 `@dromara/warm-flow-designer`
     （含 `/element-plus`、`/antdv`、`/naive`、`/style` 子路径），
     而 npm 上 `@dromara/warm-flow-designer` 与 `warm-flow-designer` 均不存在（registry 返回 Not found）。
  3. npm 上也未发布过与本目录产物同名同形态的设计器包。

三、来源判定（负责人已拍板）

  判定结论：**情形 B**。本目录代码译自/改写自 warm-flow 官方前端设计器（Apache-2.0）。

  - [ ] 情形 A：本目录为 Privernal Studio 团队自研实现，仅遵循 warm-flow 的流程 JSON 协议
        → 已排除。本目录 `.d.ts` 与产物内保留 `@dromara/warm-flow-designer` 的导入路径与
          warm-flow 标识，`src/utils/ruoyi.d.ts` 保留 `Copyright (c) 2019 ruoyi` 上游署名，
          与"完全自研"不符，任何场合均不得声明该设计器为本项目自研。
  - [x] 情形 B：本目录代码译自/改写自 warm-flow 官方前端设计器（Apache-2.0）
        → 适用。按 Apache-2.0 第 4 条随附许可证副本、声明来源与变更、保留上游署名，
          落实清单见第五节。
  - [ ] 情形 C：本目录取自第三方发布的 `@dromara/warm-flow-designer` 构建产物
        → 不适用。npm registry 对 `@dromara/warm-flow-designer` 返回 404（2026-11-01 实测），
          该发布名无公开包可作来源锚点，故按 B 的上游项目口径登记，不虚构版本号。

四、外部依赖提示

  设计器产物中保留了 `@iconify` 的运行时图标接口地址
  （`api.iconify.design`、`api.simplesvg.com`、`api.unisvg.com`）。
  内网/私有化部署需改为本地图标集或内网图标服务，否则图标会加载失败。

五、Apache-2.0 义务落实清单（情形 B，2026-11-01）

  1. 第 4(a)／4(b) 条 —— 许可证副本与变更声明：
     - 本目录新增 `LICENSE`（Apache-2.0 原文，sha256 与官方文本一致）与 `NOTICE`。
     - 上游产物在本目录内**未被修改**，因此不触发"逐文件注明变更"：目录内容与导入上游时一致，
       仅 `SOURCE.md`（本说明）、`index.ts`、`dataProvider.ts`、`global.d.ts` 四件为本项目文件，
       后三者是 Privernal Studio 自写的接入封装，不属于对上游文件的修改。
       （原导入提交 hash 已随仓库历史压平不再保留，故本说明不引用提交号。）
     - 由此，变更声明落在目录级：`NOTICE` 第三节与本节共同构成对"哪些文件是本项目的、
       哪些来自上游、上游文件未作修改"的完整说明。
  2. 第 4(c) 条 —— 保留上游版权与许可声明：
     - 上游产物自身不带文件头声明，可保留的署名载体为 `@dromara/warm-flow-designer` 导入路径、
       warm-flow 标识与 `src/utils/ruoyi.d.ts` 的 `Copyright (c) 2019 ruoyi` 一行；
       上述内容**一律不得删除或改写**。
     - 本项目的品牌替换仅作用于自身接入封装与其显示名，不得据此主张设计器为本项目原创。
  3. 第 4(d) 条 —— NOTICE：见本目录 `NOTICE`，已在仓库根 `NOTICE.md` 的内嵌第三方章节登记。
  4. 同步基线（待补项）：本目录产物的**上游确切 commit／tag 未曾记录**，现登记口径为
     "对应后端 warm-flow 1.8.9 同期的官方前端设计器产物，2026-09 引入、2026-10-12 入库"。
     后续若重新拉取上游设计器，必须在本节补记确切 commit／tag 与差异说明。
  5. 分发物随附（已自动化，2026-11-01）：`build/plugins/vendorLicenses.ts` 在 `vite build` 结束时
     把本目录的 `LICENSE`、`NOTICE`、`SOURCE.md` 复制为
     `dist/third-party-licenses/warm-flow-designer/`，并一并复制仓库 `LICENSE`、`NOTICE.md`
     与 `docs/third-party-licenses/prod-licenses.json`；源文件缺失时构建直接失败，义务不会静默落空。
     因此以 `dist/` 或私有化部署包形态交付时，三件已随包存在，无需手工拷贝。
     核对方式：`pnpm build` 后执行
     `ls dist/third-party-licenses/warm-flow-designer`，应见 `LICENSE  NOTICE  SOURCE.md`。
