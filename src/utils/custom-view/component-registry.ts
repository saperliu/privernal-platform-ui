/**
 * 自定义页面运行时组件注册表
 *
 * 平台 EP 组件是构建期 unplugin-vue-components 按需注入的（非全局注册），运行时编译的
 * 模板解析不到，因此这里自带一份组件注册表：
 *  - Element Plus 全量组件（PascalCase 与 kebab-case 双键），并一次性引入全量样式
 *    （按需样式只覆盖构建期用到的组件，运行时编译页面用到的组件必须自带样式）
 *  - 应用全局注册组件（app.component）兜底（ElOptions、wf-* 等）
 *  - 都解析不到时返回原名字符串，Vue 按 Web Component/普通标签处理，不抛错
 *
 * 本模块只被 compile.ts 动态 import（与 vue/compiler-sfc 同批懒加载），不进主包。
 */
import type { Component } from 'vue';
import { getCurrentInstance } from 'vue';
import * as ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

function toKebabCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

const registry = new Map<string, Component>();

Object.keys(ElementPlus).forEach(key => {
  const comp = (ElementPlus as Record<string, unknown>)[key];
  // 过滤出组件（El 开头大驼峰、对象/函数定义），排除 ElMessage/ElMessageBox 等服务出口
  if (/^El[A-Z]/.test(key) && (typeof comp === 'object' || typeof comp === 'function')) {
    const candidate = comp as Component;
    // ElLoading/ElInfiniteScroll 这类带 install 的指令式服务也保留（模板里 :is 引用无害）
    registry.set(key, candidate);
    registry.set(toKebabCase(key), candidate);
  }
});

/**
 * 运行时编译模板的组件解析入口（compileTemplate 生成的 _resolveComponent 调到这里）。
 * 顺序：注册表（EP 全量）→ 应用全局注册 → 原名输出。
 */
export function resolveCustomComponent(name: string): Component | string {
  const hit = registry.get(name);
  if (hit) return hit;
  // resolveComponent 在渲染期间调用，此时能取到当前实例的应用上下文
  const instance = getCurrentInstance();
  const globalComponents = instance?.appContext.components as Record<string, Component> | undefined;
  if (globalComponents && name in globalComponents) {
    return globalComponents[name];
  }
  return name;
}
