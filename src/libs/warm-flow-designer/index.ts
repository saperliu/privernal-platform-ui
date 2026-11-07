import type { App } from 'vue';
// 设计器为纯 JS 产物，样式在独立 css 中，必须随组件一起加载，否则画布无布局渲染为空白
import './warm-flow-designer.css';

/**
 * warm-flow 设计器初始化工具
 *
 * 在应用入口 main.ts 中调用：
 *   import { registerWarmFlowDesigner } from '@/libs/warm-flow-designer'
 *   await registerWarmFlowDesigner(app)
 *
 * 或在组件中使用：
 *   const WF = await import('@/libs/warm-flow-designer')
 */

export interface FlowDesignerModule {
  FlowDesigner: any;
  WarmFlowDesigner: any;
  setUiAdapter: (adapter: any) => void;
  setDataProvider: (provider: any) => void;
  createMockProvider: () => any;
  useFlowDesigner: () => any;
  useFlowJson: (ref: any) => any;
}

let cachedModule: FlowDesignerModule | null = null;

export async function loadWarmFlowDesigner(): Promise<FlowDesignerModule> {
  if (cachedModule) return cachedModule;

  // @ts-expect-error - vendored .es.js file
  const designerMod = await import('./warm-flow-designer.es.js');
  // @ts-expect-error - vendored .es.js file
  const { elementPlusAdapter } = await import('./element-plus.es.js');
  const { createFlowDataProvider } = await import('./dataProvider');

  const { setUiAdapter, setDataProvider } = designerMod;

  if (setUiAdapter) {
    setUiAdapter(elementPlusAdapter);
  }
  if (setDataProvider) {
    setDataProvider(createFlowDataProvider());
  }

  cachedModule = designerMod as FlowDesignerModule;
  return cachedModule;
}

export async function registerWarmFlowDesigner(app: App): Promise<FlowDesignerModule> {
  const mod = await loadWarmFlowDesigner();
  if (mod.WarmFlowDesigner) {
    app.use(mod.WarmFlowDesigner);
  }
  return mod;
}

export { setCurrentFormCode, setCurrentDefinitionPublished } from './dataProvider';
