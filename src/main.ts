import { createApp } from 'vue';
import './plugins/assets';
import './plugins/ui';
import { setupElementPlus } from 'phoenix-designer/dist/ui/elementPlus';
import ElOptions from 'element-plus/es/components/select/src/options.mjs';
import { setupAppVersionNotification, setupDayjs, setupIconifyOffline, setupLoading, setupNProgress } from './plugins';
import { setupStore } from './store';
import { setupRouter } from './router';
import { setupI18n } from './locales';
import { setupDirectives } from './directives';
import App from './App.vue';
import { registerWarmFlowDesigner } from './libs/warm-flow-designer';
import { setupPhoenixDesignerConfig } from './libs/phoenix-designer-config';
import { setupPhoenixDesignerEpComponents } from './libs/phoenix-designer-ep-components';

// 引入 phoenix-designer 样式
import 'phoenix-designer/dist/style.css';
// 设计器令牌与平台主题色/暗色模式对齐，必须晚于设计器样式引入
import '@/styles/css/phoenix-theme.css';
import '@/styles/css/datav-theme.css';
// phoenix-designer 的 Element Plus 适配层（naiveUi 版换成 elementPlus 版）
// EP 按需导入漏注册：ElSelect 的 options prop 内部运行时 resolveComponent('el-options')，
// 但包未导出 ElOptions，必须手动注册否则 :options 渲染不出选项

async function setupApp() {
  setupLoading();

  setupNProgress();

  setupIconifyOffline();

  setupDayjs();

  const app = createApp(App);

  app.component('ElOptions', ElOptions);

  setupStore(app);

  await setupRouter(app);

  await setupDirectives(app);

  setupI18n(app);

  setupAppVersionNotification();

  // 配置 phoenix-designer 人员/部门组件的数据接口与鉴权
  setupPhoenixDesignerConfig();

  // 注册 Element Plus 适配（phoenix-designer 内部组件用）
  setupElementPlus();

  // 注册 EP 适配缺失的业务扩展组件（人员/部门选择、关联表单、子表等）
  setupPhoenixDesignerEpComponents();

  // 注册 warm-flow 流程设计器内部组件（wf-drawer 等），否则设计器渲染崩溃
  await registerWarmFlowDesigner(app);

  app.mount('#app');
}

setupApp();
