<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { findDatavScreenDetail } from '@/service';
import { useCanvasFit } from '@/hooks/datav/useCanvasFit';
import { createDatavRuntime, provideDatavRuntime } from '@/hooks/datav/useDatavRuntime';
import { createDatavLinkage, linkageOverridesOf, provideDatavLinkage } from '@/hooks/datav/useDatavLinkage';
import { useDatavRealtime } from '@/hooks/datav/useDatavRealtime';
import type { DatavLinkage } from '@/hooks/datav/useDatavLinkage';
import { LINKAGE_QUERY_KEY, decodeLinkage, encodeLinkage } from '@/utils/datav-linkage';
import { resolvePages, pageWidgets as widgetsOfPage } from '@/utils/datav-pages';
import { connectionText } from '@/utils/datav-connection';
import { createEmptySchema, customPaletteVars, migrateSchema } from '@/utils/datav-schema';
import DatavCanvasStage from '@/components/datav/canvas-stage/index.vue';
import DatavParamBar from '@/components/datav/param-bar/index.vue';

defineOptions({ name: 'DatavPreview' });

const route = useRoute();
const router = useRouter();

const schema = ref<DatavNamespace.ScreenSchema>(createEmptySchema());
const screenCode = ref('');
const screenName = ref('');
const failed = ref(false);
const warnings = ref<string[]>([]);

const { containerRef, scale, renderedSize } = useCanvasFit(() => schema.value.canvas);

/* ---------- 分页与轮播（M6.3） ---------- */

const pages = computed(() => resolvePages(schema.value));

const pageIndex = ref(0);

const currentPage = computed(() => pages.value[Math.min(pageIndex.value, Math.max(0, pages.value.length - 1))] ?? null);

/** 只渲染当前页：投屏上观众不该看到别的页的组件，也不该为看不见的页付取数成本 */
const visibleWidgets = computed(() => (currentPage.value ? widgetsOfPage(schema.value, currentPage.value.id) : []));

/** 轮播计划由 utils/datav-pages 给出：空页会被跳过，停留秒数已钳过下限 */
const rotationEnabled = computed(() => schema.value.rotation?.enabled === true && pages.value.length > 1);

let rotationTimer: number | null = null;

function gotoPage(index: number) {
  const total = pages.value.length;
  if (!total) return;
  const next = ((index % total) + total) % total;
  if (next === pageIndex.value) {
    // 点当前页的指示点＝「就停在这一页」，所以也要重置计时；不重置的话
    // 观众点了没反应、几秒后还是被扫走，那比不给按钮更让人以为屏坏了
    restartRotation();
    return;
  }
  pageIndex.value = next;
  // 手动跳页必须重置停留计时：不重置的话观众刚点完指示点，下一轮 tick 就来把他扫走
  restartRotation();
  switchPage();
}

/**
 * 运行态参数 = 画布参数默认值 + URL 查询串覆盖。
 * 投放时同一张屏换组织、换日期只需要换查询串，不必再存一份大屏。
 */
/** 参数栏里用户改出来的值：优先级最高，且刻意不写回 URL（改一次历史栈就多一条，投屏时很难受） */
const paramOverrides = ref<Record<string, unknown>>({});

/**
 * 运行态参数 = 画布默认值 → URL 覆盖 → 参数栏覆盖，三层由低到高。
 * URL 排在参数栏之前：投放链接带参是「打开就是这个范围」的初始态，
 * 人在参数栏里改过之后应当压过它，否则链接一旦生成就再也改不动。
 */
const runtimeParams = computed<Record<string, unknown>>(() => {
  const params: Record<string, unknown> = {};
  (schema.value.params ?? []).forEach(item => {
    if (item.code && item.defaultValue !== null && item.defaultValue !== undefined && item.defaultValue !== '') {
      params[item.code] = item.defaultValue;
    }
  });
  Object.keys(route.query).forEach(key => {
    if (key !== 'code' && key !== LINKAGE_QUERY_KEY && route.query[key] !== undefined) params[key] = route.query[key];
  });
  Object.keys(paramOverrides.value).forEach(key => {
    const value = paramOverrides.value[key];
    if (value === null || value === undefined || value === '') Reflect.deleteProperty(params, key);
    else params[key] = value;
  });
  return params;
});

/**
 * 联动状态。用 ref 装而不是普通变量：runtime 的 overrides 是个惰性读的 computed，
 * 若这里用 `let`，首次求值时 linkage 还没赋值，computed 会因为**没有任何响应式依赖**
 * 而被永久缓存成 null——于是下钻点了但请求里永远不带层级。
 */
const linkageRef = ref<DatavLinkage | null>(null);

/**
 * 实时节拍是否在线。用普通 ref 而不是直接读 realtime.status：
 * runtime 要先建好，而 realtime 又要在 onTick 里调 runtime，先声明这个开关可以避开这个环。
 */
const realtimeLive = ref(false);

const runtime = createDatavRuntime({
  screenCode: () => screenCode.value,
  widgets: () => schema.value.widgets,
  params: () => runtimeParams.value,
  overrides: linkageOverridesOf(() => linkageRef.value),
  realtimeLive: () => realtimeLive.value
});
provideDatavRuntime(runtime);

const linkage = createDatavLinkage({
  widgets: () => schema.value.widgets,
  runtime,
  openScreen: code => {
    // 整页跳而不是 router.push：换一块屏要清的东西太多（页码、下钻栈、轮播计时、实时订阅），
    // 留在 SPA 里逐个重置，迟早漏一个就成了「切了屏还带着上一屏的状态」
    window.location.href = router.resolve({ path: '/datav-preview', query: { code } }).href;
  }
});
linkageRef.value = linkage;
provideDatavLinkage(linkage);

/**
 * 切页时清空联动下钻栈（人拍板）。
 *
 * 不清空的话，观众从第 2 页切回第 1 页会看到「数莫名少了一截」，而画布上没有任何东西
 * 解释为什么——与 stale 不显示、参数栏被联动压过是同一类缺陷。轮播本身就是切页，
 * 所以这条在自动轮播下每次都生效：下钻是「停在某一页细看」时的动作，不是跨屏状态。
 */
async function switchPage() {
  await linkageRef.value?.clear();
  await refreshCurrentPage();
}

async function refreshCurrentPage() {
  const ids = visibleWidgets.value
    .filter(item => item.data?.mode === 'dataset' && item.data.datasetCode)
    .map(item => item.id);
  if (ids.length) await runtime.refreshWidgets(ids);
}

function restartRotation() {
  if (rotationTimer !== null) {
    window.clearTimeout(rotationTimer);
    rotationTimer = null;
  }
  if (!rotationEnabled.value) return;
  const dwell = pageDwellSeconds();
  rotationTimer = window.setTimeout(() => {
    rotationTimer = null;
    // 由 gotoPage 负责重新计时，这里再调一次会出现两个并行的轮播计时器
    gotoPage(pageIndex.value + 1);
  }, dwell * 1000);
}

function pageDwellSeconds(): number {
  const rotation = schema.value.rotation;
  const page = currentPage.value;
  return Math.max(5, Math.round(page?.intervalSec ?? rotation?.intervalSec ?? 10));
}

/**
 * 处于降级状态的组件（后端回退到上次快照）。
 *
 * 这块横幅是必须的而不是装饰：投屏上摆的可能是很久以前的数字，而画面与一分钟前
 * 完全一样。没有这个提示，值班的人只会认为「数取错了」，然后去查一个健康的数据集——
 * 我自己就在熔断演练期间把这种降级误报成了取数缺陷。
 */
/** 只数当前页：把看不见的页的降级也算进横幅，观众会找不到到底是哪几个组件在吃旧数据 */
const staleCount = computed(() => visibleWidgets.value.filter(item => runtime.results[item.id]?.stale).length);

/** 「已中断 N 秒」要有秒级心跳才动得起来；runtime 自己也有 1s 定时器，这里同量级 */
const nowTick = ref(Date.now());

let tickTimer: number | null = null;

const connectionTip = computed(() => {
  // nowTick 在这里的作用是让本计算属性每秒重算一次；取 max 保证时间与原来的 Date.now() 完全一致
  return connectionText(runtime.connection.value, Math.max(nowTick.value, Date.now()));
});

function onParamUpdate(code: string, value: string | number | null | unknown) {
  paramOverrides.value = { ...paramOverrides.value, [code]: value };
  // 参数栏改了哪个参数，就把涉及它的联动层退掉：栏上写着「英语」而画面还在按点击过滤「数学」，
  // 就是又一处没人看得出来的旧状态——与 stale 不显示同一类缺陷
  linkageRef.value?.dropParams([code]);
}

function resetParams() {
  paramOverrides.value = {};
}

/** 哪些组件走实时：strategy=realtime 且真的绑了数据集 */
const realtimeWidgetIds = computed(() =>
  schema.value.widgets
    .filter(
      item => item.data?.mode === 'dataset' && item.data.datasetCode && item.data.refresh?.strategy === 'realtime'
    )
    .map(item => item.id)
);

/** 实时组件配置的节拍（取最快），作为订阅请求值 */
const realtimeRequestedSec = computed(() => {
  const seconds = realtimeWidgetIds.value
    .map(id => schema.value.widgets.find(item => item.id === id)?.data?.refresh?.intervalSec)
    .filter((value): value is number => typeof value === 'number' && value > 0);
  return seconds.length ? Math.max(5, Math.min(...seconds)) : 10;
});

const realtime = useDatavRealtime({
  channel: () => (screenCode.value ? `datav:${screenCode.value}` : ''),
  // 订阅间隔跟着组件自己配的节拍走（取最快的那个），不写死：
  // 写死会让「配了 3 秒的组件实际 10 秒才刷一次」这种错在界面上完全看不出来
  intervalSec: () => realtimeRequestedSec.value,
  enabled: () => realtimeWidgetIds.value.length > 0,
  onTick: () => {
    const ids = realtimeWidgetIds.value;
    if (ids.length) runtime.refreshWidgets(ids);
  }
});

watch(realtime.status, value => {
  realtimeLive.value = value === 'live';
});

/** 兜底轮询周期：与 useDatavRuntime 里 realtime 的排期口径一致（取各组件的最小值） */
const realtimePollSec = computed(() => {
  const seconds = realtimeWidgetIds.value
    .map(id => schema.value.widgets.find(item => item.id === id)?.data?.refresh?.intervalSec)
    .filter((value): value is number => typeof value === 'number' && value > 0);
  return seconds.length ? Math.max(5, Math.min(...seconds)) : 30;
});

/** 实时状态要不要给观众看：只有配了实时组件的屏才需要 */
const realtimeTip = computed(() => {
  if (!realtimeWidgetIds.value.length) return '';
  if (realtime.status.value === 'live') return `实时 · 每 ${realtime.grantedIntervalSec.value || 10} 秒`;
  return `实时通道未就绪 · 正按 ${realtimePollSec.value} 秒轮询`;
});

const crumbs = computed(() => linkageRef.value?.crumbs ?? []);

/** 面包屑的最后一层是「当前所在层」，只列前面的即可，否则与标题重复 */
const trailCrumbs = computed(() => crumbs.value.slice(0, -1));

/**
 * 联动状态写进 URL，但用 replace 而不是 push。
 *
 * push 等于每点一次就往浏览器历史里塞一条，投屏场景没人按后退，后退键会变成地雷
 * （M6.1 参数栏刻意不写 URL 就是这个理由）。replace 兼顾两件事：刷新与转发链接后
 * 下钻态还在（值班的人重启浏览器不该丢掉刚点出来的那一层），历史仍然干净。
 */
watch(
  () => (linkageRef.value ? encodeLinkage(linkageRef.value.state) : ''),
  encoded => {
    const query = { ...route.query } as Record<string, string>;
    if (encoded) query[LINKAGE_QUERY_KEY] = encoded;
    else Reflect.deleteProperty(query, LINKAGE_QUERY_KEY);
    router.replace({ path: route.path, query });
  }
);

function readCode(): string {
  const fromQuery = route.query.code;
  if (typeof fromQuery === 'string' && fromQuery !== '') return fromQuery;
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments[0] === 'datav-preview' && segments.length >= 2) return segments[1];
  return '';
}

async function load() {
  const code = readCode();
  if (!code) {
    failed.value = true;
    return;
  }
  // 预览/投放读发布快照：已发布的屏不再跟随草稿编辑变化（M2.11）
  const res = await findDatavScreenDetail(code, true);
  if (res.error === null && res.data) {
    const result = migrateSchema(res.data.schemaJson);
    schema.value = result.schema;
    warnings.value = result.warnings;
    screenCode.value = code;
    screenName.value = res.data.screenName;
    document.title = `${res.data.screenName} - 数据大屏`;
    // 先恢复下钻态再取数：否则刷新一次就先看一层全量数据、再被点回来的状态盖掉，
    // 中间那一屏是错的
    const restored = decodeLinkage(route.query[LINKAGE_QUERY_KEY]);
    if (restored.entries.length) linkage.restore(restored);
    // 首屏只取当前页；参数变更仍走整屏重取（其它页也得跟着新参数走，否则切过去是旧口径）
    await refreshCurrentPage();
    restartRotation();
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
  load();
});

onBeforeUnmount(() => {
  if (tickTimer !== null) {
    window.clearInterval(tickTimer);
    tickTimer = null;
  }
  if (rotationTimer !== null) {
    window.clearTimeout(rotationTimer);
    rotationTimer = null;
  }
});

// 轮播开关、页停留秒数、页数都会改变计划；重建计时器而不是逐帧判断，避免「改了秒数要等下一轮才生效」
watch(
  () => [rotationEnabled.value, pages.value.length, currentPage.value?.intervalSec, schema.value.rotation?.intervalSec],
  () => restartRotation()
);
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
      <ElEmpty description="大屏不存在、未发布或无权访问" />
    </div>

    <template v-else>
      <!-- 外层盒子用缩放后的实际尺寸：transform: scale 不改布局占位，否则居中会算错 -->
      <div class="relative" :style="renderedSize">
        <DatavCanvasStage :widgets="visibleWidgets" :canvas="schema.canvas" :scale="scale" :interactive="false" />
      </div>

      <div
        v-if="schema.params?.length"
        class="datav-param-bar-wrap absolute left-12px top-8px z-20 rounded-[var(--datav-radius-sm)] px-12px py-6px"
      >
        <DatavParamBar :params="schema.params" :values="runtimeParams" @update="onParamUpdate" />
        <ElButton v-if="Object.keys(paramOverrides).length" size="small" text @click="resetParams">重置</ElButton>
      </div>

      <div class="absolute right-12px top-10px z-10 opacity-0 transition-opacity duration-200 hover:opacity-100">
        <ElButton size="small" @click="refreshCurrentPage()">刷新数据</ElButton>
        <ElButton size="small" @click="toggleFullscreen">全屏</ElButton>
      </div>

      <!-- 断线提示放顶部居中：它要压住画面本身，观众不该对着一个不再更新的屏讨论数字 -->
      <!--
        实时状态常驻可见（不放进 hover 才显示的那排按钮里）：投屏是无人值守的，
        「以为在实时、其实早就退回轮询了」正是最不该没人知道的一件事。
      -->
      <div
        v-if="realtimeTip"
        class="datav-realtime-tip absolute left-12px top-56px z-20 rounded-[var(--datav-radius-sm)] px-10px py-4px text-12px"
        :class="{ 'is-offline': realtime.status.value !== 'live' }"
      >
        {{ realtimeTip }}
      </div>

      <!-- 页指示点：轮播时观众需要知道这是一组屏里的第几块，也要能手动跳页 -->
      <div v-if="pages.length > 1" class="datav-page-dots absolute bottom-10px left-50% z-20">
        <button
          v-for="(page, index) in pages"
          :key="page.id"
          type="button"
          class="datav-page-dot"
          :class="{ 'is-active': index === pageIndex }"
          :title="page.name"
          :aria-label="page.name"
          @click="gotoPage(index)"
        />
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

      <div class="absolute bottom-10px left-12px z-20 flex flex-col items-start gap-6px">
        <!-- 联动面包屑：观众点出来的过滤必须显式可见并可退，否则投屏上的人只会认为「数怎么这么小」 -->
        <div v-if="crumbs.length" class="datav-crumb rounded-[var(--datav-radius-sm)] px-10px py-4px text-12px">
          <span v-for="(trail, index) in trailCrumbs" :key="`crumb-${index}`" class="datav-crumb__item">
            {{ trail }}
            <span class="datav-crumb__sep">/</span>
          </span>
          <span class="datav-crumb__current">{{ crumbs[crumbs.length - 1] }}</span>
          <button type="button" class="datav-crumb__btn" @click="linkage.back()">返回上级</button>
          <button type="button" class="datav-crumb__btn" @click="linkage.clear()">清除联动</button>
        </div>

        <div v-if="warnings.length" class="max-w-50% text-12px opacity-60">{{ warnings[0] }}</div>
      </div>

      <div class="sr-only">{{ screenName }}</div>
    </template>
  </div>
</template>

<style scoped>
/* 投屏时参数栏要一直看得见，但不能抢画布组件的点击：只在栏本身接收事件 */
.datav-param-bar-wrap {
  background: var(--datav-panel);
  border: 1px solid var(--datav-border);
}

/* 降级提示用告警色而不是强调色：它要的是被看见，不是好看 */
.datav-stale-tip {
  color: var(--datav-warning);
  background: var(--datav-panel);
  border: 1px solid var(--datav-warning);
}

/* 断线比降级更严重：用错误色 + 不透明底，保证在任意画布背景上都读得清 */
.datav-offline-tip {
  color: var(--datav-error);
  background: var(--datav-panel);
  border: 1px solid var(--datav-error);
  transform: translateX(-50%);
}

.datav-realtime-tip {
  color: var(--datav-text-secondary);
  background: var(--datav-panel);
  border: 1px solid var(--datav-border);
}

/* 实时状态没在线时换成告警色：常驻的小灰块容易被当成装饰 */
.datav-realtime-tip.is-offline {
  color: var(--datav-warning);
  border-color: var(--datav-warning);
}

/* 联动面包屑：用强调色，它标的是「观众自己的操作」，与告警色要区分开 */
.datav-crumb {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--datav-text-primary);
  background: var(--datav-panel);
  border: 1px solid var(--datav-accent);
}

.datav-crumb__item {
  color: var(--datav-text-secondary);
}

.datav-crumb__sep {
  margin: 0 2px;
  color: var(--datav-text-tertiary);
}

.datav-crumb__current {
  font-weight: 600;
  color: var(--datav-accent);
}

.datav-crumb__btn {
  padding: 0 6px;
  color: var(--datav-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--datav-border);
  border-radius: var(--datav-radius-sm);
}

.datav-crumb__btn:hover {
  color: var(--datav-accent);
  border-color: var(--datav-accent);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>
