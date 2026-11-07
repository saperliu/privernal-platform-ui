<script setup lang="ts">
import * as dd from 'dingtalk-jsapi';
import { fetchDingLogin } from '@/service';
import { useAuthStore } from '@/store';
const { loginByDingDing } = useAuthStore();
// 3.编写相关登录逻辑
async function initDD() {
  const code = getQueryString(window.location.search, 'corpId');

  // 判断是不是通过钉钉内打开的应用；url 上没有 corpId 时换不到登录凭证，不进钉钉分支
  if (code !== null && dd.env.platform !== 'notInDingTalk') {
    // 进行钉钉登录操作
    dd.ready(() => {
      // 获取登录一次性凭证
      dd.runtime.permission
        .requestAuthCode({
          corpId: code // 企业id
        })
        .then(ddRes => {
          // 凭证获取成功后调用后端登录接口完成相关自动登录逻辑
          fetchDingLogin(ddRes.code, code).then(res => {
            // 记录应用登录凭证到本地
            // userStore.updateToken(res.data.data.token);
            // nextTick(() => {
            //   // 跳转到主页
            //   router.push(PageEnum.BASE_HOME);
            // });
            if (res.error === null && res.data !== null) {
              console.log('----fetchDingLogin------', JSON.stringify(res.data));
              loginByDingDing(res.data);
            } else {
              window.$message?.error(`钉钉登录错误:${res.error?.message ?? '未返回登录凭证'}`);
            }
          });
        })
        .catch(err => {
          window.$message?.error(`钉钉登录错误:${err}`);
        });
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

initDD();
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
