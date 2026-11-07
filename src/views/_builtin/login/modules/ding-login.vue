<script setup lang="ts">
import { request } from '@/service/request';
import { useRouterPush } from '@/hooks';
import Dingtalk from '@/utils/auth/dingtalk';
const login = () => {
  Dingtalk.init();
  request
    .get('/auth/auth/render/dingtalk/perfect_app')
    .then(response => {
      console.log('------response-------', response.data);
      if (response.error === null) {
        const appid = getQueryString(response.data !== null ? `${response.data}` : '', 'appid');
        const state = getQueryString(response.data !== null ? `${response.data}` : '', 'state');
        const redirect_uri = getQueryString(response.data !== null ? `${response.data}` : '', 'redirect_uri');
        Dingtalk.processUrl(appid, state, redirect_uri);
        Dingtalk.showCode('login_container');
      } else {
        window.$message?.error(`钉钉登录错误:${response.error.message}`);
      }
    })
    .catch(e => {
      console.log('-----response 2 catch--------', e);
      const { routerPush } = useRouterPush(false);
      routerPush({ name: 'login' });
    });
};
function getQueryString(url: string, name: string) {
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`, 'i');
  const r = url.substr(1).match(reg);
  if (r !== null) {
    return unescape(r[2]);
  }
  return '';
}
login();
</script>

<template>
  <div id="login_container"></div>
</template>

<style scoped></style>
