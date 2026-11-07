import { Ref } from 'vue';
/**
 * Warm-Flow 设计器轻量 i18n（零依赖，与 setUiAdapter/setDataProvider 等 set* 插件风格一致）。
 *
 * 设计目标：
 * - **向后兼容**：默认语言 zh，不调用任何 i18n API 时行为与历史一致（仍显示中文）。
 * - **零依赖**：内置响应式 locale + 点分 key catalog + `{name}` 占位插值，不引 vue-i18n。
 * - **可扩展**：业务方可经 setMessages 覆盖 / 扩展任意语言包。
 *
 * 用法：
 *   import { setLocale, useI18n } from '@dromara/warm-flow-designer'
 *   setLocale('en')                       // 切换语言（全局响应式，模板内 t() 自动更新）
 *   const { t, locale } = useI18n()
 *   t('common.save')                      // -> 'Save'
 *   t('common.deleteConfirm', { name })   // 占位插值
 *
 * 说明：组件文案正在分批从硬编码中文迁移到本 catalog；未迁移的文案暂仍为中文，迁移完成后即随 setLocale 生效。
 *
 * @author warm
 */
/** 支持的语言。默认 zh。 */
export type WfLocale = 'zh' | 'en';
/** 文案树：值为字符串或下一层子树（点分 key 访问）。 */
export interface WfMessageTree {
    [key: string]: string | WfMessageTree;
}
/** 切换当前语言（未注册的语言忽略）。 */
export declare function setLocale(locale: WfLocale): void;
/** 获取当前语言。 */
export declare function getLocale(): WfLocale;
/**
 * 覆盖 / 扩展指定语言的文案（深合并）。业务方可补全英文、新增语言或改写默认文案。
 */
export declare function setMessages(locale: WfLocale, patch: WfMessageTree): void;
/**
 * 翻译：按当前语言解析点分 path，缺失回落中文、再回落 path 原样；支持 `{name}` 占位插值。
 *
 * 读取响应式 currentLocale，因此在模板 / computed 中使用时，setLocale 会触发刷新。
 */
export declare function translate(path: string, params?: Record<string, unknown>): string;
/** useI18n 返回值。 */
export interface UseI18nReturn {
    /** 响应式当前语言 */
    locale: Ref<WfLocale>;
    /** 翻译函数（点分 key + 可选占位插值） */
    t: (path: string, params?: Record<string, unknown>) => string;
    /** 切换语言 */
    setLocale: (locale: WfLocale) => void;
    /** 获取当前语言 */
    getLocale: () => WfLocale;
}
/**
 * 组合式 API：返回响应式 locale、翻译函数 t、切换 setLocale。
 */
export declare function useI18n(): UseI18nReturn;
