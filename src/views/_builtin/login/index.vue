<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import { loginModuleRecord } from '@/constants/app';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import loginBg from '@/assets/img/login-bg.jpg';
import PwdLogin from './modules/pwd-login.vue';
import BindWechat from './modules/bind-wechat.vue';

defineOptions({ name: 'LoginPage' });

interface Props {
  /** The login module */
  module?: UnionKey.LoginModule;
}

const props = defineProps<Props>();

const appStore = useAppStore();
const themeStore = useThemeStore();

interface LoginModule {
  label: string;
  component: Component;
}

const moduleMap: Record<UnionKey.LoginModule, LoginModule> = {
  'pwd-login': { label: loginModuleRecord['pwd-login'], component: PwdLogin },
  'bind-wechat': { label: loginModuleRecord['bind-wechat'], component: BindWechat }
};

const activeModule = computed(() => moduleMap[props.module || 'pwd-login']);

/** 登录框标题：背景图上用白色（暗色模式不变），不再用主题色渐变（图上不可读） */
const titleStyle = computed(() => ({ color: '#fff', textShadow: '0 2px 12px rgba(15, 30, 70, 0.45)' }));
</script>

<template>
  <div class="relative size-full flex-center overflow-auto bg-layout">
    <!-- 背景图：AI 生成的抽象科技风插画（淡雅晨曦光 + 神经网络/数据流线条），中央留白保证登录卡片可读 -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{
        backgroundImage: `url(${loginBg})`,
        boxShadow: `inset 0 0 0 100vmax ${themeStore.darkMode ? 'rgba(10, 16, 32, 0.55)' : 'rgba(30, 45, 90, 0.28)'}`
      }"
    ></div>
    <div class="absolute right-15px top-15px z-20 flex-col gap-8px">
      <ThemeSchemaSwitch
        :theme-schema="themeStore.themeScheme"
        :show-tooltip="false"
        class="text-20px lt-sm:text-18px"
        @switch="themeStore.toggleThemeScheme"
      />
      <LangSwitch
        :lang="appStore.locale"
        :lang-options="appStore.localeOptions"
        :show-tooltip="false"
        @change-lang="appStore.changeLocale"
      />
    </div>
    <div class="relative z-10 flex-col items-center gap-28px">
      <header class="flex-col items-center gap-12px sm:flex-row sm:gap-16px">
        <SystemLogo class="size-64px shrink-0 drop-shadow-md lt-sm:size-48px" />
        <h3 class="login-title text-30px font-600 lt-sm:text-22px" :style="titleStyle">
          {{ $t('system.title') }}
        </h3>
      </header>
      <main class="w-full">
        <div
          class="login-card w-440px px-32px py-36px lt-sm:(w-330px px-24px py-28px)"
          :class="{ 'is-dark': themeStore.darkMode }"
        >
          <h3 class="text-22px font-500">{{ $t(activeModule.label) }}</h3>
          <div class="pt-24px">
            <Transition :name="themeStore.page.animateMode" mode="out-in" appear>
              <component :is="activeModule.component" />
            </Transition>
          </div>
        </div>
      </main>
    </div>
    <div class="absolute bottom-15px z-10 text-14px text-#f8fafc/85 dark:text-#cbd5e1/80">{{ $t('system.title') }}</div>
  </div>
</template>

<style scoped>
.login-title {
  letter-spacing: 1px;
}

.login-card {
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.6));
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow:
    0 20px 60px -18px rgba(15, 30, 70, 0.35),
    0 4px 14px rgba(15, 30, 70, 0.12);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
}

.login-card.is-dark {
  background: linear-gradient(160deg, rgba(20, 30, 54, 0.78), rgba(13, 21, 40, 0.62));
  border-color: rgba(148, 180, 255, 0.16);
  box-shadow: 0 20px 60px -18px rgba(0, 0, 0, 0.6);
}
</style>
