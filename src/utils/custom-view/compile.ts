/**
 * 自定义页面（受限 SFC）运行时编译器
 *
 * 协议（与 docs/tech-design/custom-view-plan.md 一致）：
 *  - 仅支持 <template> + <script setup>/<script> + <style scoped>（style 一律按 scoped 编译）
 *  - 禁止导入外部模块；`from 'vue'` 的导入会被剥离，名字直接由注入作用域提供
 *    （即不写 import，ref/computed/watch 等全量 vue 导出在作用域内开箱可用）
 *  - 未识别的组件标签经 component-registry 解析（Element Plus 全量 + 应用全局注册兜底），
 *    解析不到时按普通 HTML 标签输出
 *  - 编译产物按源码 hash 缓存；编译器本体（vue/compiler-sfc）与组件注册表均动态加载，
 *    不进主包
 *
 * 信任模型：自定义页面由表单管理员编写（与 backScript Groovy 同权限级别），不做沙箱隔离；
 * 编译失败只影响该页面（宿主渲染错误卡片），不影响平台其余页面。
 */
import * as vue from 'vue';

/** 单页源码上限，与后端 DynamicFormValidateService 的 CUSTOM_VIEW 校验同值 */
export const CUSTOM_VIEW_SOURCE_MAX_LENGTH = 128 * 1024;

export interface CustomViewCompileResult {
  /** 编译产物；errors 非空时为 null */
  component: vue.Component | null;
  /** 全部错误（parse/script/template/style 汇总），空数组=成功 */
  errors: string[];
}

const compileCache = new Map<string, CustomViewCompileResult>();

/** 未声明 props 时注入的默认 props 清单：自定义页不写 defineProps 也能拿到宿主上下文 */
export const CUSTOM_VIEW_DEFAULT_PROPS = [
  'data',
  'mode',
  'fields',
  'columns',
  'perm',
  'tableCode',
  'formName',
  'queryCode',
  'pageApi'
];

/** FNV-1a 变体：仅用于缓存键与 scope id，非加密用途 */
function hashSource(source: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < source.length; i += 1) {
    h ^= source.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/**
 * 剥离代码中的 import 语句，返回可直接 eval 的代码与注入名映射。
 * 仅允许来自 'vue' 的导入（名字从 vue 命名空间取，支持 as 别名）；其余模块一律报错。
 */
function stripVueImports(code: string, errors: string[]): { code: string; aliases: Record<string, unknown> } {
  const aliases: Record<string, unknown> = {};
  let out = code;

  // 副作用导入 import 'x'：协议直接禁止（无法判定来源）
  out = out.replace(/import\s*(['"][^'"]+['"])\s*;?/g, (_m, mod: string) => {
    errors.push(`自定义页面不允许导入模块：${mod}（平台 API 经 props.pageApi 注入，vue API 免导入直接可用）`);
    return '';
  });

  out = out.replace(
    /import\s+([^;'"]+?)\s+from\s+(['"])([^'"]+)\2\s*;?/g,
    (full, spec: string, _q: string, mod: string) => {
      if (mod !== 'vue') {
        errors.push(`自定义页面不允许导入外部模块：'${mod}'（vue 免导入，业务能力走 props.pageApi）`);
        return '';
      }
      const trimmed = spec.trim();
      if (trimmed.startsWith('*')) {
        // import * as utils from 'vue' → 整个命名空间注入
        const local = trimmed.split(/\s+as\s+/)[1]?.trim();
        if (local) aliases[local] = vue;
        return '';
      }
      const inner = trimmed.replace(/^\{/, '').replace(/\}$/, '');
      inner
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
        .forEach(part => {
          const [origin, alias] = part.split(/\s+as\s+/).map(s => s.trim());
          if (origin === 'default') {
            aliases[alias || origin] = (vue as any).default;
            return;
          }
          const value = (vue as any)[origin];
          if (value === undefined) {
            errors.push(`从 'vue' 导入了不存在的导出：${origin}`);
            return;
          }
          aliases[alias || origin] = value;
        });
      return '';
    }
  );

  return { code: out, aliases };
}

/** 在给定作用域内 eval 代码（严格模式），scope 键即函数形参 */
function evalWithScope(scope: Record<string, unknown>, code: string, epilogue: string): unknown {
  const keys = Object.keys(scope);
  const factory = new Function(...keys, `"use strict";\n${code}\n${epilogue}`);
  return factory(...keys.map(key => scope[key]));
}

/** 共享求值作用域：全量 vue 导出 + 运行时组件解析器（懒加载一次） */
let evalScopePromise: Promise<Record<string, unknown>> | null = null;
function getEvalScope(): Promise<Record<string, unknown>> {
  if (!evalScopePromise) {
    evalScopePromise = import('./component-registry').then(mod => {
      const scope: Record<string, unknown> = { ...(vue as object) } as Record<string, unknown>;
      scope.resolveComponent = mod.resolveCustomComponent;
      return scope;
    });
  }
  return evalScopePromise;
}

/** 合并别名映射并强制组件解析走注册表（编译器固定以 _resolveComponent 别名调用） */
function mergeScope(baseScope: Record<string, unknown>, aliases: Record<string, unknown>): Record<string, unknown> {
  const scope = { ...baseScope, ...aliases };
  scope.resolveComponent = baseScope.resolveComponent;
  scope._resolveComponent = baseScope.resolveComponent;
  return scope;
}

const injectedStyles = new Set<string>();

/** scoped 样式产物注入 <head>（按 scope id 去重，重编译不重复插入） */
function injectStyle(scopeId: string, css: string) {
  if (!css.trim() || injectedStyles.has(scopeId)) return;
  const el = document.createElement('style');
  el.dataset.customView = scopeId;
  el.textContent = css;
  document.head.appendChild(el);
  injectedStyles.add(scopeId);
}

async function doCompile(source: string, key: string): Promise<CustomViewCompileResult> {
  const errors: string[] = [];
  let sfc: typeof import('vue/compiler-sfc');
  try {
    sfc = await import('vue/compiler-sfc');
  } catch (e) {
    return { component: null, errors: [`编译器加载失败：${(e as Error)?.message ?? e}`] };
  }

  const filename = `CustomView_${key}.vue`;
  const scopeId = `data-v-custom-${key}`;
  const { descriptor, errors: parseErrors } = sfc.parse(source, { filename });
  parseErrors.forEach(err => errors.push(err.message ?? String(err)));
  if (!descriptor.template?.content) {
    errors.push('缺少 <template> 块：自定义页面必须包含一个 <template> 根块');
    return { component: null, errors };
  }

  // 1. script：compileScript 处理 <script setup> 宏（defineProps/defineExpose 等）
  // bindings 的形状取自 compiler-sfc 返回类型，避免手写 Record<string, number> 与 BindingMetadata 漂移
  let bindingMetadata:
    | NonNullable<ReturnType<(typeof import('vue/compiler-sfc'))['compileScript']>>['bindings']
    | undefined;
  let scriptStripped = { code: '', aliases: {} as Record<string, unknown> };
  if (descriptor.script || descriptor.scriptSetup) {
    try {
      const script = sfc.compileScript(descriptor, { id: scopeId });
      bindingMetadata = script.bindings ?? undefined;
      scriptStripped = stripVueImports(script.content, errors);
    } catch (e) {
      errors.push(`script 编译失败：${(e as Error)?.message ?? e}`);
      return { component: null, errors };
    }
  }

  // 2. template：与 script 的 bindingMetadata 关联，setup 响应式绑定自动 _unref
  const tpl = sfc.compileTemplate({
    source: descriptor.template.content,
    filename,
    id: scopeId,
    compilerOptions: { bindingMetadata }
  });
  tpl.errors.forEach(err => errors.push(typeof err === 'string' ? err : (err.message ?? String(err))));
  const tplStripped = stripVueImports(tpl.code, errors);

  // 3. style：一律按 scoped 编译，避免用户样式污染平台其它页面
  const styleCss: string[] = [];
  descriptor.styles.forEach(style => {
    const compiled = sfc.compileStyle({
      source: style.content,
      filename,
      id: scopeId,
      scoped: true
    });
    (compiled.errors ?? []).forEach(err => errors.push(String(err)));
    if (compiled.code) styleCss.push(compiled.code);
  });

  if (errors.length) return { component: null, errors };

  // 4. 求值：script 产物取组件定义（export default → return），template 产物取 render
  const baseScope = await getEvalScope();
  let component: Record<string, unknown>;
  try {
    if (scriptStripped.code.trim()) {
      component = (evalWithScope(
        mergeScope(baseScope, scriptStripped.aliases),
        scriptStripped.code.replace(/^export\s+default/m, 'return '),
        ''
      ) ?? {}) as Record<string, unknown>;
    } else {
      component = {};
    }
  } catch (e) {
    return { component: null, errors: [`script 执行失败：${(e as Error)?.message ?? e}`] };
  }

  try {
    // compileTemplate 产物是 `export function render(...)` 模块代码，剥掉 export 后 eval 取 render
    const render = evalWithScope(
      mergeScope(baseScope, tplStripped.aliases),
      tplStripped.code.replace(/^export\s+/m, ''),
      'return render;'
    ) as vue.RenderFunction;
    (component as { render?: vue.RenderFunction }).render = render;
  } catch (e) {
    return { component: null, errors: [`template 执行失败：${(e as Error)?.message ?? e}`] };
  }

  // 5. 收尾：scoped 样式注入、props 兜底、scopeId 绑定
  injectStyle(scopeId, styleCss.join('\n'));
  if (!component.props) {
    component.props = [...CUSTOM_VIEW_DEFAULT_PROPS];
  }
  (component as { __scopeId?: string; __name?: string }).__scopeId = scopeId;
  (component as { __name?: string }).__name = `CustomView_${key}`;

  return { component: component as vue.Component, errors: [] };
}

/**
 * 编译自定义页面源码。
 *
 * @param source SFC 源码（<template> + <script setup> + <style scoped>）
 * @returns 编译产物或全部错误；成功结果与失败结果均按源码 hash 缓存
 */
export async function compileCustomSfc(source: string): Promise<CustomViewCompileResult> {
  if (!source || !source.trim()) {
    return { component: null, errors: ['未填写自定义页面代码'] };
  }
  if (source.length > CUSTOM_VIEW_SOURCE_MAX_LENGTH) {
    return {
      component: null,
      errors: [
        `源码超过 ${Math.floor(CUSTOM_VIEW_SOURCE_MAX_LENGTH / 1024)}KB 上限（当前 ${Math.ceil(source.length / 1024)}KB）`
      ]
    };
  }
  const key = hashSource(source);
  const cached = compileCache.get(key);
  if (cached) return cached;
  const result = await doCompile(source, key);
  compileCache.set(key, result);
  return result;
}
