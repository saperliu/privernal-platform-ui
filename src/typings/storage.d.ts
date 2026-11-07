/** The storage namespace */
declare namespace StorageType {
  interface Session {
    /** The theme color */
    themeColor: string;
    // /**
    //  * the theme settings
    //  */
    // themeSettings: App.Theme.ThemeSetting;
  }

  interface Local {
    /** The i18n language */
    lang: App.I18n.LangType;
    /** The token */
    token: string;
    /** Fixed sider with mix-menu */
    mixSiderFixed: CommonType.YesOrNo;
    /** The refresh token */
    refreshToken: string;
    /** The theme color */
    themeColor: string;
    /** The dark mode */
    darkMode: boolean;
    /** The theme settings */
    themeSettings: App.Theme.ThemeSetting;
    /**
     * The override theme flags
     *
     * The value is the build time of the project
     */
    overrideThemeFlag: string;
    /** The global tabs */
    globalTabs: App.Global.Tab[];
    /** The backup theme setting before is mobile */
    backupThemeSettingBeforeIsMobile: {
      layout: UnionKey.ThemeLayoutMode;
      siderCollapse: boolean;
    };

    /** The last login user id */
    lastLoginUserId: string;

    /** 用户的应用列表（按组织缓存） */
    appList: import('@/typings/system/system-app-info').SystemAppInfoNamespace.SystemAppInfoForm[];
    /** 用户选择的应用编码 */
    selectApp: string;
    /** 是否处于首页（去掉菜单隐藏图标判断用） */
    workbench: boolean;
    /** 应用切换入口显示标记 */
    appSelectShow: boolean;
  }
}
