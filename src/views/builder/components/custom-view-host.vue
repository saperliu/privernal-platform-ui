<script setup lang="ts">
/**
 * 自定义页面运行时宿主
 *
 * 职责：编译源码（compileCustomSfc）→ 渲染编译产物 → 错误兜底（编译错误/运行时错误都
 * 只落错误卡片，不白屏、不拖垮宿主页面）。
 *
 * 对外暴露 EBuilder 兼容子集（validate/getData/setData）：编辑弹窗的提交链
 * （handleSubmit）与数据回填（findFormOfData → setData）零改动适配自定义渲染页。
 * validate/getData 代理到自定义页 defineExpose 的同名方法（协议要求自定义编辑页暴露它们）。
 */
import { onErrorCaptured, ref, shallowRef, watch } from 'vue';
import { compileCustomSfc } from '@/utils/custom-view/compile';

export interface Props {
  /** 自定义页面 SFC 源码（metaData.customView.{list|edit}.source） */
  source: string;
  /** 透传给自定义页的上下文：data/mode/fields/columns/perm/tableCode/formName/pageApi */
  context?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  context: () => ({})
});

defineOptions({ name: 'CustomViewHost' });

const Comp = shallowRef<any>(null);
const state = ref<'loading' | 'ok' | 'error'>('loading');
const errors = ref<string[]>([]);
const innerRef = ref<any>(null);
/** setData 覆盖的数据行（优先于 context.data，供弹窗按类型回填当前行） */
const dataOverride = ref<Record<string, any> | null>(null);
/** 渲染 key：重编译后强制重建，获得干净的自定义页状态 */
const mountKey = ref(0);

async function load() {
  state.value = 'loading';
  errors.value = [];
  const result = await compileCustomSfc(props.source ?? '');
  if (result.errors.length || !result.component) {
    errors.value = result.errors.length ? result.errors : ['编译失败：未知错误'];
    state.value = 'error';
    return;
  }
  Comp.value = result.component;
  dataOverride.value = null;
  mountKey.value += 1;
  state.value = 'ok';
}

watch(() => props.source, load, { immediate: true });

function retry() {
  load();
}

onErrorCaptured((err: Error) => {
  state.value = 'error';
  errors.value = [`页面运行时错误：${err?.message ?? String(err)}`];
  // 就地拦截：自定义页崩溃不向上冒泡（保持宿主页面/弹窗可操作）
  return false;
});

// —— EBuilder 兼容子集（编辑弹窗依赖）——
async function validate(): Promise<boolean> {
  const inner = innerRef.value;
  if (inner && typeof inner.validate === 'function') {
    return await inner.validate();
  }
  return true;
}

async function getData(): Promise<Record<string, any>> {
  const inner = innerRef.value;
  if (inner && typeof inner.getData === 'function') {
    return await inner.getData();
  }
  return {};
}

function setData(data: Record<string, any>) {
  // 与 EBuilder 的合并语义一致：默认弹窗把表单定义（含 departmentId/organizationId 等种子键）
  // 作为 context.data 传入，add 时 setData({}) 不能把它们冲掉，否则动态表 NOT NULL 列报错
  dataOverride.value = { ...(props.context?.data ?? {}), ...(data ?? {}) };
  const inner = innerRef.value;
  if (inner && typeof inner.setData === 'function') {
    inner.setData(dataOverride.value);
  }
}

defineExpose({ validate, getData, setData });
</script>

<template>
  <div class="custom-view-host h-full">
    <div v-if="state === 'loading'" class="h-full flex items-center justify-center">
      <ElIcon class="is-loading text-24px"><icon-mdi-loading /></ElIcon>
    </div>
    <div v-else-if="state === 'error'" class="h-full flex items-center justify-center p-24px">
      <div class="custom-view-error">
        <div class="custom-view-error__title">自定义页面加载失败</div>
        <ul class="custom-view-error__list">
          <li v-for="(err, index) in errors" :key="index">{{ err }}</li>
        </ul>
        <ElButton size="small" @click="retry">重试</ElButton>
      </div>
    </div>
    <!-- dataOverride 优先：弹窗通过 setData 按类型回填当前行（add 为空对象） -->
    <component
      :is="Comp"
      v-else
      :key="mountKey"
      ref="innerRef"
      v-bind="{ ...context, data: dataOverride ?? context.data }"
    />
  </div>
</template>

<style lang="scss" scoped>
.custom-view-host {
  width: 100%;
}

.custom-view-error {
  max-width: 640px;
  padding: 16px 20px;
  border: 1px solid var(--el-color-danger-light-7, #fde2e2);
  border-radius: 6px;
  background: var(--el-color-danger-light-9, #fef0f0);

  &__title {
    margin-bottom: 8px;
    color: var(--el-color-danger, #f56c6c);
    font-weight: 600;
  }

  &__list {
    margin: 0 0 12px;
    padding-left: 18px;
    color: var(--el-text-color-regular, #606266);
    font-size: 13px;
    line-height: 1.7;
    word-break: break-all;
  }
}
</style>
