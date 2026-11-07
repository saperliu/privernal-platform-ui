<script setup lang="ts">
import { computed } from 'vue';

export interface Props {
  /** 值 */
  value: any;
  /** 名称 */
  name?: string;
}
const props = withDefaults(defineProps<Props>(), {
  value: '',
  name: ''
});
defineOptions({ name: 'TableColumnLink' });
interface Emits {
  (e: 'click', data: string): void;
}
const emit = defineEmits<Emits>();

const name = computed(() => props.name);

function handleClick() {
  emit('click', props.value);
}
</script>

<template>
  <span class="table-cell-clickable" @click="handleClick">{{ name }}</span>
</template>

<style scoped lang="scss"></style>
