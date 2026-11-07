<script setup lang="ts">
import { ref } from 'vue';
import { request } from '@/service/request';
import { useAuthStore } from '@/store';
import { useRouterPush } from '@/hooks';

defineOptions({ name: 'OauthOidc' });

const { loginThird } = useAuthStore();
const { routerPushByKey } = useRouterPush();
const showLoading = ref(false);
const tipText = ref('正在完成单点登录...');

function getQueryString(name: string) {
  const matched = window.location.search.substr(1).match(new RegExp(`(^|&)${name}=([^&]*)(&|$)`, 'i'));
  return matched === null ? null : decodeURIComponent(matched[2]);
}

function callback() {
  // 渠道编码由后台在 IdP 里登记的回调地址带上，IdP 只在其后追加 code/state
  const config = getQueryString('config');
  const code = getQueryString('code');
  const state = getQueryString('state');
  if (!config || !code || !state) {
    showLoading.value = false;
    tipText.value = '回调参数不完整，请回到登录页重新发起单点登录';
    window.$message?.error('回调缺少 config/code/state');
    routerPushByKey('login');
    return;
  }
  showLoading.value = true;
  request
    .get<Api.Auth.LoginToken>(`/auth/auth/oidc/callback/${config}`, { params: { code, state } })
    .then(response => {
      if (response.error === null) {
        loginThird(response.data);
      } else {
        window.$message?.error(`单点登录失败:${response.error.message}`);
        routerPushByKey('login');
      }
    })
    .catch(e => {
      window.$message?.error(`单点登录失败:${e}`);
      routerPushByKey('login');
    })
    .finally(() => {
      showLoading.value = false;
    });
}

callback();
</script>

<template>
  <div id="loader-wrapper">
    <div class="loader">
      <div v-if="showLoading" v-loading="true" />
      <div>{{ tipText }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#loader-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #ffffff;
}

.loader {
  display: flex;
  position: relative;
  left: 40%;
  top: 30%;
  font-size: 20px;
  width: 20em;
  height: 20em;
  border-radius: 50%;
  background-color: #ffffff;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  color: black;
}
</style>
