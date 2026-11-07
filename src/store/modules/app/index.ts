import { effectScope, nextTick, onScopeDispose, ref, watch } from 'vue';
import { breakpointsTailwind, useBreakpoints, useEventListener, useTitle } from '@vueuse/core';
import { defineStore } from 'pinia';
import { useBoolean } from '@privernal/hooks';
import type { Socket } from 'socket.io-client';
import { router } from '@/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { $t, setLocale } from '@/locales';
import { setDayjsLocale } from '@/locales/dayjs';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { useThemeStore } from '../theme';

export const useAppStore = defineStore(SetupStoreId.App, () => {
  const themeStore = useThemeStore();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const scope = effectScope();
  const breakpoints = useBreakpoints(breakpointsTailwind);
  const { bool: themeDrawerVisible, setTrue: openThemeDrawer, setFalse: closeThemeDrawer } = useBoolean();
  const { bool: reloadFlag, setBool: setReloadFlag } = useBoolean(true);
  const { bool: fullContent, toggle: toggleFullContent } = useBoolean();
  const { bool: contentXScrollable, setBool: setContentXScrollable } = useBoolean();
  const { bool: siderCollapse, setBool: setSiderCollapse, toggle: toggleSiderCollapse } = useBoolean();
  const {
    bool: mixSiderFixed,
    setBool: setMixSiderFixed,
    toggle: toggleMixSiderFixed
  } = useBoolean(localStg.get('mixSiderFixed') === 'Y');

  /** Is mobile layout */
  const isMobile = breakpoints.smaller('sm');

  /** socket.io 实例 */
  const socket = ref<Socket | null>(null);
  /** 全局遮罩 */
  const bodyLoading = ref<boolean>(false);
  /** 是否首页 */
  const workbench = ref<boolean>(false);
  /** 是否显示应用选择的下拉框 */
  const appSelectShow = ref<boolean>(false);
  /**
   * Reload page
   *
   * @param duration Duration time
   */
  async function reloadPage(duration = 300) {
    setReloadFlag(false);

    const d = themeStore.page.animate ? duration : 40;

    await new Promise(resolve => {
      setTimeout(resolve, d);
    });

    setReloadFlag(true);

    // 原 soybean 在这里按 themeStore.resetCacheStrategy === 'refresh' 清 keep-alive 路由缓存，
    // 但本项目主题设置（App.Theme.ThemeSetting / src/theme/settings.ts）没有 resetCacheStrategy 字段，
    // 主题抽屉也没有该项开关，该条件恒为 false（routeStore.resetRouteCache 从未被触发），故移除死分支。
    // 需要恢复「刷新时重置路由缓存」时，应先给主题设置补上该开关
  }

  const locale = ref<App.I18n.LangType>(localStg.get('lang') || 'zh-CN');

  const localeOptions: App.I18n.LangOption[] = [
    {
      label: '中文',
      key: 'zh-CN'
    },
    {
      label: 'English',
      key: 'en-US'
    }
  ];

  function changeLocale(lang: App.I18n.LangType) {
    locale.value = lang;
    setLocale(lang);
    localStg.set('lang', lang);
  }

  /** Update document title by locale */
  function updateDocumentTitleByLocale() {
    const { i18nKey, title } = router.currentRoute.value.meta;

    const documentTitle = i18nKey ? $t(i18nKey) : title;

    useTitle(documentTitle);
  }

  function init() {
    setDayjsLocale(locale.value);
  }

  // watch store
  scope.run(() => {
    // watch isMobile, if is mobile, collapse sider
    watch(
      isMobile,
      newValue => {
        if (newValue) {
          // backup theme setting before is mobile
          localStg.set('backupThemeSettingBeforeIsMobile', {
            layout: themeStore.layout.mode,
            siderCollapse: siderCollapse.value
          });

          themeStore.setThemeLayout('vertical');
          setSiderCollapse(true);
        } else {
          // when is not mobile, recover the backup theme setting
          const backup = localStg.get('backupThemeSettingBeforeIsMobile');

          if (backup) {
            nextTick(() => {
              themeStore.setThemeLayout(backup.layout);
              setSiderCollapse(backup.siderCollapse);

              localStg.remove('backupThemeSettingBeforeIsMobile');
            });
          }
        }
      },
      { immediate: true }
    );

    // watch locale
    watch(locale, () => {
      // update document title by locale
      updateDocumentTitleByLocale();

      // update global menus by locale
      routeStore.updateGlobalMenusByLocale();

      // update tabs by locale
      tabStore.updateTabsByLocale();

      // set dayjs locale
      setDayjsLocale(locale.value);
    });
  });

  // cache mixSiderFixed
  useEventListener(window, 'beforeunload', () => {
    localStg.set('mixSiderFixed', mixSiderFixed.value ? 'Y' : 'N');
  });

  /** On scope dispose */
  onScopeDispose(() => {
    scope.stop();
  });
  /** 设置socket实例 */
  function setSocket<T extends Socket = Socket>(socket1: T) {
    socket.value = socket1;
  }
  /** 打开全屏遮罩 */
  function openBodyLoading() {
    bodyLoading.value = true;
  }
  /** 关闭全屏遮罩 */
  function closeBodyLoading() {
    bodyLoading.value = false;
  }
  /** 设置是否是首页，需要去掉菜单的隐藏图标，否则无法判断 */
  function isWorkbench(is: boolean) {
    workbench.value = is;
    localStg.set('workbench', is);
  }
  function getWorkbench() {
    const workbench1 = localStg.get('workbench');
    if (workbench1 !== null) {
      workbench.value = workbench1;
    }
    return workbench.value;
  }
  function setAppSelectShow(show: boolean) {
    appSelectShow.value = show;
    localStg.set('appSelectShow', show);
  }
  function getAppSelectShow() {
    const appSelectShow1 = localStg.get('appSelectShow');
    if (appSelectShow1 !== null) {
      appSelectShow.value = appSelectShow1;
    }
    const app = localStg.get('selectApp');
    if (app !== null && app !== 'PLATFORM' && app !== 'SYSTEM') {
      return appSelectShow.value;
    }
    return false;
  }

  // init
  init();

  return {
    isMobile,
    reloadFlag,
    reloadPage,
    fullContent,
    locale,
    localeOptions,
    changeLocale,
    themeDrawerVisible,
    openThemeDrawer,
    closeThemeDrawer,
    toggleFullContent,
    contentXScrollable,
    setContentXScrollable,
    siderCollapse,
    setSiderCollapse,
    toggleSiderCollapse,
    mixSiderFixed,
    setMixSiderFixed,
    toggleMixSiderFixed,
    isWorkbench,
    getWorkbench,
    setAppSelectShow,
    getAppSelectShow,
    socket,
    setSocket,
    bodyLoading,
    openBodyLoading,
    closeBodyLoading
  };
});
