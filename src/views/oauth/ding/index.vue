<script setup lang="ts">
import { ref } from 'vue';
import { request } from '@/service/request';
import { useAuthStore } from '@/store';
import { useRouterPush } from '@/hooks';
const { loginThird } = useAuthStore();
const showLoading = ref(false);
function getUser() {
  showLoading.value = true;
  const code = getQueryString(window.location.search, 'code');
  const state = getQueryString(window.location.search, 'state');
  const { routerPushByKey } = useRouterPush();
  if (code !== null && state !== null) {
    const query = { code, state };
    request
      .get<Api.Auth.LoginToken>('/auth/auth/callback/dingtalk/perfect-app', { params: query })
      .then(response => {
        console.log('------response-------', response);
        if (response.error === null) {
          loginThird(response.data);
        } else {
          window.$message?.error(`钉钉登录错误:${response.error.message}`);
          routerPushByKey('login');
        }
      })
      .catch(e => {
        console.log('-----response 2 catch--------', e);
        window.$message?.error(`钉钉登录错误:${e}`);
        routerPushByKey('login');
      });
  }
}
function getQueryString(url: string, name: string) {
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`, 'i');
  const r = url.substr(1).match(reg);
  if (r !== null) {
    return unescape(r[2]);
  }
  return null;
}

getUser();
</script>

<template>
  <div id="loader-wrapper">
    <div class="loader">
      <div v-loading="true" />
      <div>加载中.......</div>
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
