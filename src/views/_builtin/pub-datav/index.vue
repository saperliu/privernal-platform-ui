<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { findDatavShareSchema, queryDatavShareBatch } from '@/service';
import { useCanvasFit } from '@/hooks/datav/useCanvasFit';
import { createDatavRuntime, provideDatavRuntime } from '@/hooks/datav/useDatavRuntime';
import { createEmptySchema, customPaletteVars, migrateSchema } from '@/utils/datav-schema';
import { connectionText } from '@/utils/datav-connection';
import DatavCanvasStage from '@/components/datav/canvas-stage/index.vue';

/**
 * 外链免登投放页（M7.6）。链接形态：/datav-share?sc={shareCode}&sign={sign}。
 *
 * 与登录态预览页（datav-preview）的差别全部来自「没有登录用户」：
 * schema 与取数都走 /pub/datav/**（校验链在后端 resolveShare），
 * 参数只认画布默认值 + URL 覆盖（没有参数栏：外链观众不该有改参数的能力，
 * 要换范围就生成新链接）；联动/下钻不启用（局部刷新依赖 single 通道，
 * 外链场景刻意只开 batch，攻击面与实现都更小）。
 */
defineOptions({ name: 'DatavShare' });

const route = useRoute();

const schema = ref<DatavNamespace.ScreenSchema>(createEmptySchema());
const screenName = ref('');
const failed = ref(false);

const { containerRef, scale, renderedSize } = useCanvasFit(() => schema.value.canvas);

const visibleWidgets = computed(() => schema.value.widgets.filter(item => !item.layout.hidden));

const shareCode = computed(() => String(route.query.sc ?? ''));
const sign = computed(() => String(route.query.sign ?? ''));

const runtimeParams = computed<Record<string, unknown>>(() => {
  const params: Record<string, unknown> = {};
  (schema.value.params ?? []).forEach(item => {
    if (item.code && item.defaultValue !== null && item.defaultValue !== undefined && item.defaultValue !== '') {
      params[item.code] = item.defaultValue;
    }
  });
  Object.keys(route.query).forEach(key => {
    if (!['sc', 'sign'].includes(key) && route.query[key] !== undefined) params[key] = route.query[key];
  });
  return params;
});

const runtime = createDatavRuntime({
  screenCode: () => shareCode.value,
  widgets: () => schema.value.widgets,
  params: () => runtimeParams.value,
  transport: {
    batch: queryDatavShareBatch(shareCode.value, sign.value),
    // 外链刻意不开单组件通道（联动/局部刷新没启用）：显式拒绝比静默回落登录态接口诚实
    // ——后者会在免登环境悄悄 401，表现成「组件一直报错」
    single: async () => ({ error: { message: '外链大屏不支持单组件取数' }, data: null })
  }
});
provideDatavRuntime(runtime);

/** 外链同样要有断线提示与降级可见性（口径与登录态投放页一致） */
const staleCount = computed(() => Object.values(runtime.results).filter(item => item?.stale).length);
const nowTick = ref(Date.now());
let tickTimer: number | null = null;
const connectionTip = computed(() => {
  // 依赖 nowTick：每秒的重算由下面的 interval 驱动，取数时刻也用它，等价于 Date.now()
  return connectionText(runtime.connection.value, nowTick.value);
});

async function load() {
  if (!shareCode.value || !sign.value) {
    failed.value = true;
    return;
  }
  const res = await findDatavShareSchema(shareCode.value, sign.value);
  if (res.error === null && res.data?.schemaJson) {
    const result = migrateSchema(res.data.schemaJson);
    schema.value = result.schema;
    screenName.value = res.data.screenName;
    document.title = `${res.data.screenName} - 大屏分享`;
    await runtime.refreshAll();
    return;
  }
  failed.value = true;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) containerRef.value?.requestFullscreen?.();
  else document.exitFullscreen?.();
}

onMounted(() => {
  tickTimer = window.setInterval(() => {
    nowTick.value = Date.now();
  }, 1000);
  load().catch(() => {});
});

onBeforeUnmount(() => {
  if (tickTimer !== null) {
    window.clearInterval(tickTimer);
    tickTimer = null;
  }
});
</script>

<template>
  <div
    ref="containerRef"
    class="datav-scope relative h-full w-full flex items-center justify-center overflow-hidden"
    :data-datav-theme="schema.canvas.theme"
    :data-datav-palette="schema.canvas.palette"
    :style="customPaletteVars(schema.canvas)"
  >
    <div v-if="failed" class="flex items-center justify-center">
      <ElEmpty description="分享链接不存在或已失效" />
    </div>

    <template v-else>
      <div class="relative" :style="renderedSize">
        <DatavCanvasStage :widgets="visibleWidgets" :canvas="schema.canvas" :scale="scale" :interactive="false" />
      </div>

      <div class="absolute right-12px top-10px z-10 opacity-0 transition-opacity duration-200 hover:opacity-100">
        <ElButton size="small" @click="runtime.refreshAll()">刷新数据</ElButton>
        <ElButton size="small" @click="toggleFullscreen">全屏</ElButton>
      </div>

      <div
        v-if="connectionTip"
        class="datav-offline-tip absolute left-50% top-10px z-30 rounded-[var(--datav-radius-sm)] px-12px py-6px text-12px"
      >
        {{ connectionTip }}
      </div>

      <div
        v-if="staleCount"
        class="datav-stale-tip absolute bottom-10px right-12px z-20 rounded-[var(--datav-radius-sm)] px-10px py-4px text-12px"
      >
        {{ staleCount }} 个组件显示的是上一次成功取数的快照，数据未更新
      </div>

      <div class="sr-only">{{ screenName }}</div>
    </template>
  </div>
</template>

<style scoped>
.datav-stale-tip {
  color: var(--datav-warning);
  background: var(--datav-panel);
  border: 1px solid var(--datav-warning);
}

.datav-offline-tip {
  color: var(--datav-error);
  background: var(--datav-panel);
  border: 1px solid var(--datav-error);
  transform: translateX(-50%);
}
</style>
