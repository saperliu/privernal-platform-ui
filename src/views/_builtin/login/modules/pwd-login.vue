<script setup lang="ts">
import { computed, ref } from 'vue';
import { loginModuleRecord as __forwarded_loginModuleRecord } from '@/constants/app';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useForm, useFormRules } from '@/hooks/common/form';

defineOptions({ name: 'PwdLogin' });

const authStore = useAuthStore();
const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useForm();

interface FormModel {
  userName: string;
  password: string;
}

const model = ref<FormModel>({
  userName: 'admin',
  password: ''
});

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules();

  return {
    userName: formRules.userName,
    password: formRules.pwd
  };
});

async function handleSubmit() {
  await validate();
  // 图形验证码已下线（后端校验同步关闭），登录不再携带 id/code
  const login: Api.Auth.LoginDTO = {
    loginName: model.value.userName,
    password: model.value.password
  };
  await authStore.login(login);
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const loginModuleRecord = __forwarded_loginModuleRecord;
</script>

<template>
  <ElForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" @keyup.enter="handleSubmit">
    <ElFormItem prop="userName">
      <ElInput v-model="model.userName" :placeholder="$t('page.login.common.userNamePlaceholder')" />
    </ElFormItem>
    <ElFormItem prop="password">
      <ElInput
        v-model="model.password"
        type="password"
        show-password
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      />
    </ElFormItem>
    <ElSpace direction="vertical" :size="24" class="w-full" fill>
      <ElCheckbox>{{ $t('page.login.pwdLogin.rememberMe') }}</ElCheckbox>
      <ElButton type="primary" size="large" round block :loading="authStore.loginLoading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </ElButton>
      <!--
 验证码登录/注册/忘记密码三入口已摘除（F10：原页面是只弹 success 的假实现）。
           恢复时需连同 modules/ 下对应页面、router 的 module 白名单与 UnionKey.LoginModule 一起做实。 
-->
    </ElSpace>
  </ElForm>
</template>

<style scoped></style>
