<script setup lang="tsx">
import { computed } from 'vue';
import moment from 'moment';

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

  // element-plus 的 DatePicker 没有 quarter 面板，去掉 naive 遗留的该取值
  type?: 'date' | 'datetime' | 'daterange' | 'datetimerange' | 'month' | 'monthrange' | 'year' | 'week';

  valueFormat?: string;
}

defineOptions({ name: 'PrivernalDatepicker' });
const props = withDefaults(defineProps<Props>(), {
  value: new Date().getTime(),
  size: 'medium',
  inputReadonly: false,
  disabled: false,
  type: 'date',
  placeholder: '',
  valueFormat: 'yyyy-MM-dd'
});

interface Emits {
  (e: 'update:value', data: any): void;
  (e: 'update', data: any): void;
}

const emit = defineEmits<Emits>();

const timestamp = computed({
  get() {
    if (props.type.indexOf('range') > 0) {
      if (Array.isArray(props.value)) {
        return [moment(props.value[0]).valueOf(), moment(props.value[1]).valueOf()];
      }
      return null;
    }
    if (props.value !== null && props.value.length > 0) {
      return moment(props.value).valueOf();
    }
    return null;
  },
  set(value) {
    emit('update:value', value);
  }
});

/**
 * 范围类型统一对外发 [起, 止] 数组或 null：后端动态查询对范围字段按 List 解析，
 * naive 的回调在不同交互路径下 value/formattedValue 可能是时间戳数组、字符串数组
 * 甚至拼接串，直接透传会把字符串发给后端导致 ClassCastException
 */
function resolveRangeValue(value: any, formattedValue: any): [string, string] | null {
  const candidates = [formattedValue, value];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length === 2) {
      const start = moment(candidate[0]);
      const end = moment(candidate[1]);
      if (start.isValid() && end.isValid()) {
        // 候选已是 value-format 格式的字符串则原样用，时间戳才需要格式化
        if (typeof candidate[0] === 'string' && typeof candidate[1] === 'string') {
          return [candidate[0], candidate[1]];
        }
        return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')];
      }
    }
    if (typeof candidate === 'string' && candidate.includes('~')) {
      const parts = candidate.split('~').map(s => s.trim());
      if (parts.length === 2 && parts[0] && parts[1]) return [parts[0], parts[1]] as [string, string];
    }
  }
  return null;
}

function updateValue(value: number | null, formattedValue: string | null) {
  if (props.type.indexOf('range') > 0) {
    const range = resolveRangeValue(value, formattedValue);
    emit('update:value', range);
    emit('update', range);
    return;
  }
  if (formattedValue === null) {
    emit('update:value', value);
    emit('update', value);
  } else {
    emit('update:value', formattedValue);
    emit('update', formattedValue);
  }
}
</script>

<template>
  <div class="privernal-main">
    <ElDatePicker
      v-model="timestamp"
      :disabled="disabled"
      :type="type"
      :input-readonly="inputReadonly"
      :value-format="valueFormat"
      clearable
      @update:value="updateValue"
    />
  </div>
</template>

<style lang="scss" scoped>
.privernal-main {
  width: 100%;
}
</style>
