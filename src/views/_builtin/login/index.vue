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

/**
 * 登录框标题配色：背景图左侧为插画、右侧留白浅色——浅色模式标题用深海军蓝直接可读，
 * 暗色模式压暗蒙层后保持白色。
 */
const titleStyle = computed(() =>
  themeStore.darkMode
    ? { color: '#fff', textShadow: '0 2px 12px rgba(15, 30, 70, 0.45)' }
    : { color: '#1d3a6d', textShadow: '0 1px 10px rgba(255, 255, 255, 0.65)' }
);
</script>

<template>
  <div class="relative size-full flex items-center justify-center overflow-auto bg-layout lg:justify-end lg:pr-[10vw]">
    <!-- 背景图：左侧等距插画（数据/流程/春祈 logo 卡片）+ 右侧留白——登录框落在留白区。
         浅色模式只加极淡白纱保持插画通透，暗色模式加深蒙层保证对比 -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{
        backgroundImage: `url(${loginBg})`,
        boxShadow: `inset 0 0 0 100vmax ${themeStore.darkMode ? 'rgba(10, 16, 32, 0.55)' : 'rgba(255, 255, 255, 0.08)'}`
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
    <div
      class="absolute bottom-15px z-10 text-14px"
      :class="themeStore.darkMode ? 'text-#cbd5e1/80' : 'text-#475569/75'"
    >
      {{ $t('system.title') }}
    </div>
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
