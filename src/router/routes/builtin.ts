import type { ElegantConstRoute } from '@elegant-router/vue';
import type { CustomRoute } from '@elegant-router/types';
import { layouts, views } from '../elegant/imports';
import { getRoutePath, transformElegantRoutesToVueRoutes } from '../elegant/transform';

export const ROOT_ROUTE: CustomRoute = {
  name: 'root',
  path: '/',
  redirect: getRoutePath(import.meta.env.VITE_ROUTE_HOME) || '/home',
  meta: {
    title: 'root',
    constant: true
  }
};

const NOT_FOUND_ROUTE: CustomRoute = {
  name: 'not-found',
  path: '/:pathMatch(.*)*',
  component: 'layout.blank$view.404',
  meta: {
    title: 'not-found',
    constant: true
  }
};

/** 登录后首页（对应后端 home=workbench 的语义，首页视图为 views/home） */
export const homeRoute: ElegantConstRoute = {
  name: 'home',
  path: '/home',
  component: 'layout.base$view.home',
  meta: {
    hideInMenu: true,
    title: '首页',
    i18nKey: 'route.home',
    constant: false,
    keepAlive: true,
    icon: 'fluent:book-information-24-regular',
    order: 10
  }
};

export const personInfo: ElegantConstRoute = {
  name: 'person-info',
  path: '/person-info',
  component: 'layout.base$view.person-info',
  meta: {
    hideInMenu: true,
    title: '个人信息',
    i18nKey: 'route.person-info',
    constant: false,
    keepAlive: true,
    icon: 'fluent:book-information-24-regular',
    order: 10
  }
};

export const oauthPage: ElegantConstRoute = {
  name: 'oauth',
  path: '/oauth',
  component: 'layout.blank',
  meta: {
    title: 'oauth',
    constant: true,
    i18nKey: 'route.oauth'
  },
  children: [
    {
      name: 'oauth_ding',
      path: '/oauth/ding',
      meta: {
        title: 'oauth_ding',
        constant: true,
        i18nKey: 'route.oauth_ding'
      },
      children: [
        {
          name: 'oauth_ding_app',
          path: '/oauth/ding/app',
          component: 'view.oauth_ding_app',
          meta: {
            title: 'oauth_ding_app',
            constant: true,
            i18nKey: 'route.oauth_ding_app'
          }
        },
        {
          name: 'oauth_ding_pc',
          path: '/oauth/ding/pc',
          component: 'view.oauth_ding_pc',
          meta: {
            title: 'oauth_ding_pc',
            constant: true,
            i18nKey: 'route.oauth_ding_pc'
          }
        }
      ]
    },
    {
      name: 'oauth_oidc',
      path: '/oauth/oidc',
      component: 'view.oauth_oidc',
      meta: {
        title: 'oauth_oidc',
        constant: true,
        i18nKey: 'route.oauth_oidc'
      }
    }
  ]
};

/** 表单设计器（后端菜单不含的功能页，表单列表"设计"按钮新开页直达） */
export const designerRoute: CustomRoute = {
  name: 'designer',
  path: '/designer',
  component: 'layout.base$view.designer',
  meta: {
    title: '表单设计器',
    i18nKey: 'route.designer',
    constant: true,
    hideInMenu: true,
    keepAlive: true
  }
} as unknown as CustomRoute;

/** 仪表盘运行时页：/report/{dashboardCode}，常量路由兜底（未选应用/未登录菜单路由时也能直达）。
 *  path 带参数段，超出生成器的 RoutePath 字面量类型，这里断言绕过。 */
export const reportRuntime: CustomRoute = {
  name: 'report',
  path: '/report/:code?',
  component: 'layout.base$view.report',
  meta: {
    title: 'report',
    i18nKey: 'route.report',
    constant: true,
    hideInMenu: true,
    keepAlive: true
  }
} as unknown as CustomRoute;

/** 大屏编辑器与投放页：后端菜单里没有这两个入口，必须由列表页直达。
 *
 * 为什么走常量路由而不是菜单：动态菜单的子项名必须含 `_`（elegant 的单级路由判定
 * `isSingleLevelRoute` 按名字里有没有 `_` 决定要不要给它单独配 layout），
 * 而 `/datav-designer`、`/datav-preview` 是单级名，做成 `/dynamic` 的子菜单会被
 * transform 抛 `Layout component "view.datav-designer" not found` 整条丢弃。
 * 与 designerRoute / reportRuntime 同一个套路。
 *
 * constant 只影响路由可达性：所有取数与保存接口仍按后端权限校验，
 * 真正的免登投放要等 M7 的分享令牌。 */
export const datavDesignerRoute: CustomRoute = {
  name: 'datav-designer',
  path: '/datav-designer',
  component: 'layout.base$view.datav-designer',
  meta: {
    title: '大屏设计器',
    i18nKey: 'route.datav-designer',
    constant: true,
    hideInMenu: true,
    keepAlive: false
  }
} as unknown as CustomRoute;

export const datavPreviewRoute: CustomRoute = {
  name: 'datav-preview',
  path: '/datav-preview',
  // 预览/投放是整屏页面：不套 base 布局（无菜单/页签/顶部栏），与登录页同为 blank 单页形态；
  // 常量路由只影响可达性，取数接口仍按登录态鉴权
  component: 'layout.blank$view.datav-preview',
  meta: {
    title: '大屏预览',
    i18nKey: 'route.datav-preview',
    constant: true,
    hideInMenu: true,
    keepAlive: false
  }
} as unknown as CustomRoute;

/** 表单外链填写页（免登，high-setting.md §5）：constant 绕过登录守卫，页面自身无菜单无用户信息 */
export const publicFormRoute: CustomRoute = {
  name: 'pub-form-fill',
  path: '/pub/form/:token',
  component: 'layout.blank$view.pub-form',
  meta: {
    title: 'pub-form',
    constant: true,
    hideInMenu: true
  }
} as unknown as CustomRoute;

/** 表单外链查看页（免登/登录共享，scope 鉴权在后端） */
export const publicViewRoute: CustomRoute = {
  name: 'pub-view-page',
  path: '/pub/view/:token',
  component: 'layout.blank$view.pub-view',
  meta: {
    title: 'pub-view',
    constant: true,
    hideInMenu: true
  }
} as unknown as CustomRoute;

/** 大屏外链免登投放页（M7.6）：/pub/datav?sc={shareCode}&sign={sign}。
 *  与表单外链同一个套路：constant 绕过登录守卫、blank 布局、鉴权全在后端
 *  resolveShare 的校验链（不透明 shareCode + HMAC + 有效期 + referer 白名单）。 */
export const publicDatavRoute: CustomRoute = {
  name: 'pub-datav-screen',
  path: '/pub/datav',
  component: 'layout.blank$view.pub-datav',
  meta: {
    title: '大屏分享',
    constant: true,
    hideInMenu: true
  }
} as unknown as CustomRoute;

/** builtin routes, it must be constant and setup in vue-router */
const builtinRoutes: ElegantConstRoute[] = [
  ROOT_ROUTE,
  NOT_FOUND_ROUTE,
  homeRoute,
  designerRoute,
  personInfo,
  oauthPage,
  reportRuntime,
  datavDesignerRoute,
  datavPreviewRoute,
  publicFormRoute,
  publicViewRoute,
  publicDatavRoute
];

/** create builtin vue routes */
export function createBuiltinVueRoutes() {
  return transformElegantRoutesToVueRoutes(builtinRoutes, layouts, views);
}
