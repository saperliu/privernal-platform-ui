import { App, Plugin } from 'vue';
import { default as FlowDesigner } from '../components/design/FlowDesigner.vue';
import { default as SvgIcon } from '../components/SvgIcon/index.vue';
import { default as BaseInfo } from '../components/design/common/vue/baseInfo.vue';
import { default as PropertySetting } from '../components/design/common/vue/propertySetting.vue';
import { default as DiagramSidebar } from '../components/design/common/vue/DiagramSidebar.vue';
import { setupDataProvider, setDataProvider, getDataProvider, createHttpProvider, createMockProvider, isMockEnabled, DataProvider } from '../data';
import { setUiAdapter, getUiAdapter, UiAdapter, UiFeedbackType, UiFeedbackOptions, UiLoadingHandle, UiComponents } from '../ui/uiAdapter';
import { setComponentSize, getComponentSize, ComponentSize } from '../ui/designerOptions';
import { useFlowDesigner, UseFlowDesignerReturn } from '../composables/useFlowDesigner';
import { useFlowJson, UseFlowJsonReturn } from '../composables/useFlowJson';
import { useDark } from '../composables/useDark';
import { setLocale, getLocale, useI18n, setMessages, translate, WfLocale, WfMessageTree, UseI18nReturn } from '../i18n';
import { FlowDesignerProps, FlowDesignerInstance, FlowDesignerSavedPayload, FlowDesignerReadyPayload, FlowDesignerBeforeSavePayload, FlowDesignerChangePayload, FlowDesignerValidateErrorPayload, FlowDesignerNodeClickPayload, FlowStructureValidateResult, PaletteNode, FlowDesignerPaletteNodes } from './types';
/** WarmFlowDesigner 插件安装选项。 */
export interface WarmFlowDesignerOptions {
    /** 全局组件尺寸（small / default / large）；等价于安装前调用 setComponentSize(size)。 */
    size?: ComponentSize;
}
/**
 * Warm-Flow 设计器「可复用层」统一出口（组件库 / npm 包入口）。
 *
 * 主入口 UI 库无关：不静态引入任何 UI 组件库（element-plus / ant-design-vue），
 * 消费方须显式注册一个 UI 适配器后再渲染设计器：
 *   import { WarmFlowDesigner, FlowDesigner, setUiAdapter, setDataProvider, createMockProvider } from '@dromara/warm-flow-designer'
 *   import { elementPlusAdapter } from '@dromara/warm-flow-designer/element-plus'  // 或 import { antdvAdapter } from '@dromara/warm-flow-designer/antdv'
 *   import '@dromara/warm-flow-designer/style'
 *   setUiAdapter(elementPlusAdapter)  // 选择 UI 库适配器，须在渲染 FlowDesigner 前调用
 *   app.use(WarmFlowDesigner)         // 注册 svg-icon + 中性组件 wf-*，图标零配置可用
 *   setDataProvider(myProvider)       // 注入自定义后端 / mock，实现数据层与具体后端解耦
 *
 * 该入口对外只暴露这一稳定门面，内部目录结构调整不影响下游 import 路径。
 *
 * @author warm
 */
/**
 * 安装为 Vue 插件：注册全局 svg-icon 组件与中性组件 wf-*。
 *
 * 主入口 UI 库无关，不在此注册任何 UI 适配器；消费方须在渲染前显式 setUiAdapter(...)
 * 选择 element-plus（@dromara/warm-flow-designer/element-plus）或 antdv（/antdv）适配器。
 * 图标走离线 iconify 集（ep + wf，见 src/icons），已在本模块加载时注册，零配置渲染，不依赖具体 UI 库图标。
 */
declare const install: (app: App, options?: WarmFlowDesignerOptions) => void;
declare const WarmFlowDesigner: Plugin;
export { FlowDesigner, SvgIcon, WarmFlowDesigner, install, setupDataProvider, setDataProvider, getDataProvider, createHttpProvider, createMockProvider, isMockEnabled, setUiAdapter, getUiAdapter, setComponentSize, getComponentSize, useFlowDesigner, useFlowJson, useDark, setLocale, getLocale, useI18n, setMessages, translate, BaseInfo, PropertySetting, DiagramSidebar };
export type { DataProvider };
export type { UiAdapter, UiFeedbackType, UiFeedbackOptions, UiLoadingHandle, UiComponents };
export type { ComponentSize };
export type { WfLocale, WfMessageTree, UseI18nReturn };
export type { FlowDesignerProps, FlowDesignerInstance, FlowDesignerSavedPayload, FlowDesignerReadyPayload, FlowDesignerBeforeSavePayload, FlowDesignerChangePayload, FlowDesignerValidateErrorPayload, FlowDesignerNodeClickPayload, FlowStructureValidateResult, PaletteNode, FlowDesignerPaletteNodes, UseFlowDesignerReturn, UseFlowJsonReturn };
export default WarmFlowDesigner;
