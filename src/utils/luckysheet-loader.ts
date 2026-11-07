/**
 * Luckysheet 按需加载器（单据打印 SHEET 模板设计器用）。
 * Luckysheet 2.1.13 是 UMD + 运行时依赖全局 jQuery（`$`）——UMD 产物不内联 jQuery，
 * 官方 demo 页也是先引 jQuery 再引 Luckysheet；这里先装 window.$/jQuery 再加载主包
 * （jquery 2.x 经 luckysheet 依赖树引入，CJS 互操作取 default）。
 * 走 vite 动态 import 把 Luckysheet 隔离成独立 chunk，
 * 真正的消费方式是 window.luckysheet 全局。CSS 三条按官方 demo 清单，iconfont.css
 * （工具栏 76 个 luckysheet-iconfont-* 图标类 + 内嵌 base64 woff2 字体，漏引则工具栏
 * 图标全部无字形）必须最后导入——见下方行内注释。
 * 幂等：重复调用复用同一个 Promise；加载失败置空允许重试。
 */
let loading: Promise<NonNullable<Window['luckysheet']>> | null = null;

export async function ensureLuckysheet(): Promise<NonNullable<Window['luckysheet']>> {
  if (window.luckysheet) {
    return window.luckysheet;
  }
  loading ??= (async () => {
    const jquery = (await import('jquery')).default as unknown as typeof window.jQuery;
    if (jquery) {
      window.jQuery = jquery;
      window.$ = jquery;
    }
    // Luckysheet 只使用不内置 jquery-mousewheel（画布缩放/滚动），必须先挂到 $.fn 上。
    // 该包 UMD 是 `module.exports = factory` 形态：vite 的 CJS 互操作只导出工厂函数，
    // 不会自己执行，需手动喂 jQuery 实例
    const mousewheel = (await import('jquery-mousewheel')).default as unknown as (jq: unknown) => void;
    if (typeof mousewheel === 'function' && jquery) {
      mousewheel(jquery);
    }
    const mod: any = await import('luckysheet/dist/luckysheet.umd.js');
    // vite 预打包把 UMD 的 CJS 分支执行成模块导出，window.luckysheet 不会被挂上——
    // 取模块导出兜底（default 或具名 luckysheet），再补挂全局供 Luckysheet 内部自引用
    const api = (mod?.default ?? mod?.luckysheet ?? mod) as NonNullable<Window['luckysheet']> | undefined;
    if (api && typeof api.create === 'function') {
      window.luckysheet = api;
    }
    await import('luckysheet/dist/plugins/css/pluginsCss.css');
    await import('luckysheet/dist/css/luckysheet.css');
    // iconfont.css 必须最后导入：pluginsCss.css 里有同名 iconfont 的 @font-face（旧图表
    // 图标集，字形子集不含工具栏码点），同名同描述符时后声明者胜出——放前面会被覆盖成豆腐块
    await import('luckysheet/dist/assets/iconfont/iconfont.css');
    if (!window.luckysheet) {
      throw new Error('Luckysheet 加载异常（window.luckysheet 未注册）');
    }
    return window.luckysheet;
  })();
  try {
    return await loading;
  } catch (e) {
    loading = null; // 失败可重试，不把坏 Promise 缓存住
    throw e;
  }
}
