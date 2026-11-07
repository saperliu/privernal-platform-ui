<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { pluginManager, usePageManager } from 'phoenix-designer';
import { getJson } from '../shared/http';

/**
 * 流水号（phoenix-designer EP 适配，补齐 naiveUi 版的 serial-number）。
 * 打开表单时（非设计模式且值为空）调用取号接口自动生成，
 * 接口：pluginManager.global.serialNumberUrl，GET 返回 data=号码。
 */
export interface Props {
  /** 组件的值 */
  modelValue?: string;
  /** 取号接口，不传时用全局 serialNumberUrl */
  apiUrl?: string;
  /** 流水号前缀 */
  prefix?: string;
  /** 日期部分格式（Java 风格） */
  pattern?: string;
  /** 序列位数，不足左补 0 */
  digits?: number;
  /** 重置周期：day / month / never */
  cycle?: string;
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  apiUrl: '',
  prefix: 'SN',
  pattern: 'yyyyMMdd',
  digits: 4,
  cycle: 'day',
  placeholder: '打开表单时自动生成流水号',
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}>();

const { isDesignMode } = usePageManager();
const generating = ref(false);

function resolveUrl() {
  return props.apiUrl || pluginManager.global.serialNumberUrl || '/back/system/serialNumber/generate';
}

async function generateSerialNumber() {
  if (generating.value) return;
  generating.value = true;
  try {
    const query =
      `?prefix=${encodeURIComponent(props.prefix || 'SN')}` +
      `&pattern=${encodeURIComponent(props.pattern || 'yyyyMMdd')}` +
      `&digits=${props.digits ?? 4}&cycle=${props.cycle || 'day'}`;
    const res = await getJson(resolveUrl() + query);
    const number = res?.data ?? '';
    if (number) {
      emit('update:modelValue', number);
      emit('change', number);
    }
  } catch (error) {
    console.error('[phoenix]生成流水号失败：', error);
  } finally {
    generating.value = false;
  }
}

onMounted(() => {
  if (!isDesignMode.value && !props.modelValue) {
    generateSerialNumber();
  }
});
</script>

<template>
  <ElInput :model-value="props.modelValue" :placeholder="props.placeholder" readonly :disabled="props.disabled">
    <template v-if="generating" #suffix>
      <ElIcon class="is-loading">
        <Loading />
      </ElIcon>
    </template>
  </ElInput>
</template>
