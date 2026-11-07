import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@privernal/hooks';
import { encrypt512 } from '@privernal/utils';
import {
  fetchChangeOrganization,
  fetchLogin,
  fetchLoginChallenge,
  fetchOrganization,
  fetchUserInfo
} from '@/service/api';
import { useAppStore } from '@/store';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { setUserInfo } from '@/utils/auth';
import { SetupStoreId } from '@/enum';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  const userInfo: Api.Auth.UserInfo = reactive({
    userId: '',
    /** 用户名 */
    loginName: '',
    /** 昵称 */
    nickName: '',
    /** 用户角色类型 */
    userRole: '',
    /** 授权的功能 */
    permissions: [],
    /** 授权的角色的key */
    roleKeys: [],
    /** 授权的角色 */
    roles: [],
    initPassword: true,
    avatar: '',
    organizationId: ''
  });

  /** is super role in static route */
  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    const userRoles: string[] = userInfo.roles ?? [];

    return VITE_AUTH_ROUTE_MODE === 'static' && userRoles.includes(VITE_STATIC_SUPER_ROLE);
  });

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** 登录的加载状态 */
  // const loginLoading = ref(false);
  /** 是否初始化密码 */
  const initPassword = ref(false);
  /** 用户拥有的组织 */
  const organizationList = ref<SystemUserServiceOrgNamespace.SystemUserServiceOrgForm[] | undefined>(undefined);
  /** 是否处于选择登录组织的阶段（此时缓存的是临时令牌，不能用来请求业务接口） */
  const isSelectingOrganization = ref(false);
  /** 用户的应用 */
  const appList = ref<SystemAppInfoNamespace.SystemAppInfoForm[]>([]);
  /** 用户选择的应用 */
  const selectApp = ref('');
  /** 重置auth状态 */
  async function resetStore() {
    const authStore = useAuthStore();

    clearAuthStorage();

    authStore.$reset();

    if (!route.meta.constant) {
      await toLogin();
    }

    tabStore.cacheTabs();
    routeStore.resetStore();

    clearOrganizationCache();
  }

  /** 清掉按组织缓存的数据（应用列表、当前应用、工作台状态） */
  function clearOrganizationCache() {
    appList.value = [];
    selectApp.value = '';
    localStg.remove('appList');
    localStg.remove('selectApp');
    localStg.remove('workbench');
    localStg.remove('appSelectShow');
  }

  /**
   * 多组织账号登录后进入选择组织的流程
   *
   * 登录接口此时返回的是选组织用的临时令牌，拿它请求用户信息会失败，必须先选出组织
   *
   * @param loginToken 登录返回的令牌
   * @returns 是否需要先选择组织
   */
  async function startSelectOrganization(loginToken: Api.Auth.LoginToken) {
    const { organizations } = loginToken;
    if (!organizations || organizations.length === 0) {
      return false;
    }

    // 只写缓存，令牌用于选择组织的接口；isLogin 保持未登录，避免页面用临时令牌请求业务接口
    localStg.set('token', loginToken.token);
    organizationList.value = uniqueOrganizations(organizations);
    isSelectingOrganization.value = true;

    const { routerPushByKey } = useRouterPush(false);
    await routerPushByKey('select-organization');
    return true;
  }

  /**
   * 应用选出/切换的组织返回的令牌
   *
   * 组织编码和业务库名由后端写在会话里，前端换令牌后重新取用户信息，并清掉上一个组织缓存的应用
   *
   * @param data 组织接口的返回值
   */
  async function applyOrganizationToken(data?: Api.Auth.LoginToken) {
    if (!data || !data.token) {
      return false;
    }

    localStg.set('token', data.token);
    if (data.refreshToken) {
      localStg.set('refreshToken', data.refreshToken);
    }
    token.value = data.token;
    isSelectingOrganization.value = false;

    const pass = await getUserInfo();
    if (!pass) {
      return false;
    }

    organizationList.value = undefined;
    clearOrganizationCache();
    return true;
  }

  /** 重新加载当前组织的路由和标签页 */
  async function reloadAuthRoute() {
    localStg.remove('globalTabs');
    tabStore.$reset();
    await routeStore.resetStore();
    await routeStore.initAuthRoute();
  }

  /** 登录成功后初始化路由并跳转 */
  async function finishLogin(redirect = true) {
    // 登录页的 redirect 可能是带 ?app= 的深链（首页工单卡片新窗口在未登录态打开）：
    // 先从 redirect 里取出应用编码再初始化路由，否则只按 selectApp 装载，跳过去就是 403
    const redirectTarget = route.query?.redirect;
    let deepLinkApp = '';
    if (typeof redirectTarget === 'string' && redirectTarget.includes('app=')) {
      deepLinkApp = new URLSearchParams(redirectTarget.split('?')[1] ?? '').get('app') ?? '';
    }
    await routeStore.initAuthRoute(deepLinkApp);

    await redirectFromLogin(redirect);

    if (routeStore.isInitAuthRoute) {
      window.$notification?.success({
        title: $t('page.login.common.loginSuccess'),
        message: $t('page.login.common.welcomeBack', { userName: userInfo.nickName }),
        duration: 4500
      });
    }
  }

  /**
   * F4 挑战-应答提交：成功返回 LoginToken，失败返回 null（错误提示由请求层统一弹出）。
   * 流程：取挑战 → 已迁移传 SHA512(nonce+X)（X=SHA512(明文)，截获值换 nonce 即失效）；
   * 未迁移先静默提交一次 X 引导服务端封存，再取新 nonce 重试；
   * 挑战关闭（服务端未配主密钥或旧版本）直接传 X 走 bcrypt 口径。
   */
  async function submitWithDigestProtocol(loginDTO: Api.Auth.LoginDTO): Promise<Api.Auth.LoginToken | null> {
    const wireDigest = encrypt512(loginDTO.password as string);
    const name = loginDTO.loginName ?? '';

    async function submitOnce(password: string, nonceId?: string | null) {
      const { data, error } = await fetchLogin({ ...loginDTO, password, nonceId });
      return error ? null : data;
    }

    const { data: challenge, error: challengeError } = await fetchLoginChallenge(name);
    if (challengeError || !challenge?.enabled || !challenge.nonce || !challenge.nonceId) {
      return submitOnce(wireDigest);
    }
    if (!challenge.migrated) {
      const bootstrapped = await submitOnce(wireDigest);
      if (!bootstrapped) {
        return null;
      }
      const retry = await fetchLoginChallenge(name);
      if (retry.error || !retry.data?.enabled || !retry.data.nonce || !retry.data.nonceId) {
        return submitOnce(wireDigest);
      }
      challenge.nonceId = retry.data.nonceId;
      challenge.nonce = retry.data.nonce;
    }
    return submitOnce(encrypt512(`${challenge.nonce}${wireDigest}`), challenge.nonceId);
  }

  /**
   * Login
   *
   * @param loginDTO User name
   * @param [redirect=true] Whether to redirect after login. Default is `true`
   */
  async function login(loginDTO: Api.Auth.LoginDTO, redirect = true) {
    startLoading();

    // F4：密码非空走挑战-应答提交；空密码（验证码等链路）维持原样直发
    let loginToken: Api.Auth.LoginToken | null = null;
    if (loginDTO.password !== null && loginDTO.password !== undefined) {
      loginToken = await submitWithDigestProtocol(loginDTO);
    } else {
      const { data, error } = await fetchLogin(loginDTO);
      loginToken = error ? null : data;
    }

    if (loginToken) {
      if (await startSelectOrganization(loginToken)) {
        endLoading();
        return;
      }

      const pass = await loginByToken(loginToken);

      if (pass) {
        await finishLogin(redirect);
      }
    } else {
      resetStore();
    }

    endLoading();
  }

  /**
   * Login
   *
   * @param loginDTO User name
   * @param [redirect=true] Whether to redirect after login. Default is `true`
   */
  async function loginByDingDing(loginToken: Api.Auth.LoginToken, redirect = true) {
    startLoading();

    if (await startSelectOrganization(loginToken)) {
      endLoading();
      return;
    }

    const pass = await loginByToken(loginToken);
    if (pass) {
      await finishLogin(redirect);
    }

    endLoading();
  }

  async function loginByToken(loginToken: Api.Auth.LoginToken) {
    // 1. stored in the localStorage, the later requests need it in headers
    localStg.set('token', loginToken.token);
    localStg.set('refreshToken', loginToken.refreshToken);

    // 2. get user info
    const pass = await getUserInfo();

    if (pass) {
      token.value = loginToken.token;

      return true;
    }

    return false;
  }

  async function getUserInfo() {
    const { data: info, error } = await fetchUserInfo();

    if (!error) {
      // update store
      Object.assign(userInfo, info);
      initPassword.value = info.initPassword;
      setUserInfo(userInfo);
      return true;
    }

    return false;
  }

  async function initUserInfo() {
    const hasToken = getToken();

    if (hasToken) {
      const pass = await getUserInfo();

      if (!pass) {
        resetStore();
      }
    }
  }

  /**
   * 设置是否初始化密码登录
   *
   * @param isInit
   */
  function setInitialPassword(isInit: boolean) {
    initPassword.value = isInit;
  }

  /**
   * 设置头像
   *
   * @param url
   */
  function setAvatar(url: string) {
    userInfo.avatar = url;
  }
  /**
   * 设置昵称
   *
   * @param name
   */
  function setNickName(name: string) {
    userInfo.nickName = name;
  }
  /**
   * 设置应用列表
   *
   * @param list
   */
  function setAppList(list: SystemAppInfoNamespace.SystemAppInfoForm[]) {
    appList.value = list;
    localStg.set('appList', list);
  }
  /** 获取应用列表 */
  function getAppList() {
    if (appList.value.length === 0) {
      const list = localStg.get('appList');
      if (list !== null) {
        appList.value = list;
      }
    }
    return appList.value;
  }
  /**
   * 设置选择的APP
   *
   * @param appId
   */
  function setApp(appId: string) {
    selectApp.value = appId;
    localStg.set('selectApp', appId);
  }
  /**
   * 获取选择的APP
   *
   * @param appId
   */
  function getSelectApp() {
    if (selectApp.value === '') {
      const app = localStg.get('selectApp');
      if (app !== null) {
        selectApp.value = app;
      }
    }
    return selectApp.value;
  }

  /**
   * 第三方登录
   *
   * @param data
   */
  async function loginThird(data: Api.Auth.LoginToken) {
    if (!data) {
      return;
    }

    if (await startSelectOrganization(data)) {
      return;
    }

    const pass = await loginByToken(data);
    if (pass) {
      await finishLogin();
    }
  }

  /**
   * 登录时选择组织
   *
   * @param orgId 组织ID
   */
  async function selectOrganization(orgId: string) {
    const { data, error } = await fetchOrganization(orgId);

    if (!error && (await applyOrganizationToken(data))) {
      await finishLogin();
      return;
    }

    window.$message?.error('选择组织失败，请重新登录');
    await resetStore();
    // 选择组织的页面是常量路由，resetStore 不会把它跳走，这里要显式回登录页
    await toLogin();
  }

  /**
   * 登录后切换组织
   *
   * @param orgId 组织ID
   */
  async function changeOrganization(orgId: string) {
    if (!orgId || orgId === userInfo.organizationId) {
      return;
    }

    const { data, error } = await fetchChangeOrganization(orgId);

    if (!error && (await applyOrganizationToken(data))) {
      await reloadAuthRoute();
      const { routerPushByKey } = useRouterPush(false);
      await routerPushByKey('home');
      window.$message?.success('切换组织成功');
      return;
    }

    window.$message?.error('切换组织失败，请重新登录');
    await resetStore();
  }

  /** 处理应用的跳转 */
  async function handleAppJump(appCode: string, path: string) {
    const app = useAppStore();
    const routeStore1 = useRouteStore();
    app.setSiderCollapse(false);
    setApp(appCode);
    routeStore1.initDynamicAppRoute(appCode, path);
  }
  return {
    token,
    userInfo,
    initPassword,
    organizationList,
    isSelectingOrganization,
    setApp,
    getAppList,
    getSelectApp,
    setAppList,
    setNickName,
    setAvatar,
    setInitialPassword,
    loginThird,
    handleAppJump,
    selectOrganization,
    changeOrganization,
    isStaticSuper,
    isLogin,
    loginLoading,
    resetStore,
    login,
    loginByDingDing,
    initUserInfo
  };
});

/** 同一组织可能有多条服务记录（同一用户在多个部门任职），切换组织按组织去重 */
function uniqueOrganizations(list: SystemUserServiceOrgNamespace.SystemUserServiceOrgForm[]) {
  const organizationIds = new Set<string>();
  return list.filter(item => {
    if (organizationIds.has(item.organizationId)) {
      return false;
    }
    organizationIds.add(item.organizationId);
    return true;
  });
}
