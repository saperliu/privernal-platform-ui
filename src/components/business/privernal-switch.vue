<script setup lang="tsx">
import type { CSSProperties } from 'vue';
import { computed } from 'vue';
import { dataRelationLabels, dataStatusColors, dataStatusLabels } from '@/constants';

export interface Props {
  /** 组件的值 */
  value: any;
  /** 组件是否禁用 */
  disabled?: boolean;
  /** 组件的大小 */
  size?: string;
  /** 没有值时的占位信息 */
  placeholder?: string;
  // 设置输入框为只读（避免在移动设备上打开虚拟键盘）
  inputReadonly?: boolean;

  /** 选中和未选中的值 */
  checkedValue?: string | number;
  uncheckedValue?: string | number;
  /** 开关类型，是或否，数据状态 */
  switchType?: 'YES|NO' | 'STATUS';
}

defineOptions({ name: 'PrivernalSwitch' });
const props = withDefaults(defineProps<Props>(), {
  value: new Date().getTime(),
  size: 'medium',
  inputReadonly: false,
  disabled: false,
  placeholder: '',
  checkedValue: 1,
  uncheckedValue: 3,
  switchType: 'STATUS'
});

interface Emits {
  (e: 'update:value', data: any): void;
  (e: 'update', data: any): void;
}

const emit = defineEmits<Emits>();

const timestamp = computed({
  get() {
    // 后端把 Long 序列化为字符串（防雪花 ID 精度丢失），而 NSwitch 用严格等号比较 checkedValue/uncheckedValue，
    // 这里把命中同一字面量的字符串归一化成选中值本身的类型，避免开关初始状态显示错误
    if (props.value !== props.checkedValue && String(props.value) === String(props.checkedValue)) {
      return props.checkedValue;
    }
    if (props.value !== props.uncheckedValue && String(props.value) === String(props.uncheckedValue)) {
      return props.uncheckedValue;
    }
    return props.value;
  },
  set(value) {
    emit('update:value', value);
  }
});

const checkData = computed({
  get() {
    if (props.switchType === 'STATUS') {
      return dataStatusLabels[props.value];
    }
    return dataRelationLabels[props.value];
  },
  set(value) {
    emit('update:value', value);
  }
});

function updateValue(value: number | string) {
  emit('update:value', value);
  emit('update', value);
}

function railStyle(info: { focused: boolean; checked: boolean }) {
  const style: CSSProperties = {};
  if (info.checked) {
    style.background = dataStatusColors['1'];
  } else {
    style.background = dataStatusColors['3'];
  }
  return style;
}
</script>

<template>
  <div class="privernal-main">
    <ElSwitch
      v-model="timestamp"
      :disabled="disabled"
      :active-value="checkedValue"
      :inactive-value="uncheckedValue"
      :input-readonly="inputReadonly"
      :rail-style="railStyle"
      @update:value="updateValue"
    >
      <template #checked>
        {{ checkData }}
      </template>
      <template #unchecked>
        {{ checkData }}
      </template>
    </ElSwitch>
  </div>
</template>

<style lang="scss" scoped>
.privernal-main {
  width: 100%;
}
</style>
