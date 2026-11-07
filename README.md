# 春祈平台前端（Privernal Studio） · privernal-platform-ui

[English](./README.en.md) | 简体中文

春祈平台（Privernal Studio）的管理端前端，承载低代码平台的全部搭建与运营界面：**表单设计器**（集成开源 PhoenixDesigner）、**流程编排**（warm-flow 设计器）、报表与仪表盘、**数据大屏设计器**、单据打印模板、AI 对话式搭建与 AI 问数，以及组织、权限、字典等系统管理。技术栈 Vue 3 + TypeScript + Vite + Element Plus + UnoCSS + Pinia，pnpm workspace 组织内部共享包；elegant-router 约定式路由与后端动态路由双模式；vue-i18n 中英双语；图表覆盖 ECharts / AntV G2·G6 / VisActor VChart·VTable。

仓库：<https://github.com/saperliu/privernal-platform-ui>
后端服务：`privernal-platform`（privernal-server）
移动端：`privernal-app`

## 技术栈

| 领域 | 选型 |
| --- | --- |
| 框架 | Vue 3、`<script setup>`、TypeScript |
| 构建 | Vite（rolldown-vite）、pnpm workspace |
| UI | Element Plus、UnoCSS、自绘 SVG 图标 |
| 状态 | Pinia |
| 路由 | Vue Router + elegant-router 约定式路由（自动生成 `src/router/elegant/*`） |
| 请求 | `@privernal/axios`（axios）、`@privernal/alova`（alova，含本地 mock） |
| 图表 | ECharts、AntV G2/G6、VisActor VChart/VTable |
| 国际化 | vue-i18n（`zh-cn` / `en-us`） |

## 环境要求

- Node.js >= 20.19.0
- pnpm >= 8.7.0

## 快速开始

```bash
pnpm install

pnpm dev          # 本地开发，加载 .env.test 配置
pnpm dev:prod     # 以 .env.prod 配置启动
pnpm build        # 生产构建，产物在 dist/
pnpm build:test   # 测试环境构建
pnpm preview      # 预览构建产物
pnpm typecheck    # vue-tsc 类型检查
pnpm lint         # ESLint 自动修复
```

提交信息使用约定式提交，可由内置 CLI 生成：

```bash
pnpm commit        # 交互式生成 commit message（英文）
pnpm commit:zh     # 交互式生成 commit message（中文）
pnpm gen-route     # 重新生成约定式路由
```

## 环境变量

`.env` 为公共配置，`.env.test` / `.env.prod` 覆盖后端地址。

| 变量 | 说明 |
| --- | --- |
| `VITE_APP_TITLE` | 浏览器标题，页内标题由 i18n `system.title` 覆盖 |
| `VITE_STORAGE_PREFIX` | localStorage 键前缀，当前为 `PRIVERNAL_` |
| `VITE_AUTH_ROUTE_MODE` | `static` 静态路由 / `dynamic` 后端下发路由 |
| `VITE_SERVICE_BASE_URL` | 后端地址。test 为 `http://localhost:7700/test`；prod 为 `/api`，由部署机 nginx 剥掉前缀后转发到后端 `8600` |
| `VITE_SERVICE_SUCCESS_CODE` | 业务成功码，需与后端返回体一致 |

若接入独立域名的后端，把 `VITE_SERVICE_BASE_URL` 改为完整地址并处理跨域。

## 目录结构

```
├── build/                 # Vite 插件与代理配置
├── packages/              # workspace 内部包（@privernal/*）
│   ├── alova/  axios/  color/  hooks/  materials/  utils/
│   ├── scripts/           # 仓库内 CLI（bin: privernal）
│   └── uno-preset/        # UnoCSS shortcuts 预设
├── src/
│   ├── assets/            # 图标与静态资源
│   ├── components/        # 全局组件
│   ├── layouts/           # 布局与主题抽屉
│   ├── locales/           # 中英文文案
│   ├── router/            # 路由（elegant/ 为自动生成，勿手改）
│   ├── service/           # 接口层
│   ├── service-alova/     # alova 接口层与本地 mock
│   ├── store/             # Pinia 状态
│   ├── theme/             # 主题与布局默认配置
│   ├── typings/           # 类型声明（部分为自动生成）
│   └── views/             # 页面
└── index.html
```

## 开发说明

- `src/router/elegant/*`、`src/typings/components.d.ts`、`src/typings/elegant-router.d.ts` 由构建插件生成，不要手工编辑。
- 界面文案一律走 `src/locales/langs/*`，不要在组件里硬编码中文。
- 演示页面（`src/views/plugin/*`、`src/views/function/*`、`src/views/alova/*`、`src/views/home/*`）保留自模板，仅作为组件能力示例，产品化时按需删除。
- 接口层目前仍是模板示例的契约，与 `privernal-platform` 后端的登录、动态路由、权限码对接属于独立工作项。

## 许可与来源

- 本项目以 MIT 许可发布，见 [LICENSE](./LICENSE)。
- 本项目派生自开源项目 `soybean-admin-element-plus`（Copyright (c) 2021 Soybean，MIT），在其基础上完成品牌化、内部包重命名与后端对接改造。上游项目与本产品及产品所属公司无隶属、赞助或背书关系。
- 随包分发的第三方依赖许可与需特别注意的授权项，见 [NOTICE](./NOTICE.md)。
