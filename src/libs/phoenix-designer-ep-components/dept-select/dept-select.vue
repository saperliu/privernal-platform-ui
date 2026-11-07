<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { pluginManager } from 'phoenix-designer';
import { getJson } from '../shared/http';

/**
 * 部门选择（phoenix-designer EP 适配，补齐 naiveUi 版的 dept-select）。
 * 数据来自 pluginManager.global.departmentTreeUrl（部门树），
 * 用 ElTreeSelect 渲染；multiple 多选 + checkStrategy 可选节点过滤。
 */
export interface Props {
  /** 组件的值（单选为字符串，多选为数组） */
  modelValue?: any;
  /** 部门树接口，不传时用全局 departmentTreeUrl */
  apiUrl?: string;
  /** 节点显示字段，默认 deptName */
  labelField?: string;
  /** 节点取值字段，默认 id */
  valueField?: string;
  /** 子节点列表字段，默认 children */
  childrenField?: string;
  placeholder?: string;
  /** 是否多选 */
  multiple?: boolean;
  /** 多选时超出折叠的 tag 数量 */
  maxTagCount?: number;
  /** 可选节点策略：all 全部 / parent 仅父 / child 仅子 */
  checkStrategy?: 'all' | 'parent' | 'child';
  clearable?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  apiUrl: '',
  labelField: 'deptName',
  valueField: 'id',
  childrenField: 'children',
  placeholder: '请选择部门',
  multiple: false,
  maxTagCount: undefined,
  checkStrategy: 'all',
  clearable: true,
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
}>();

const treeData = ref<Array<TreeNode>>([]);
const loading = ref(false);

interface TreeNode {
  value: string;
  label: string;
  children?: TreeNode[];
}

function resolveUrl() {
  return props.apiUrl || pluginManager.global.departmentTreeUrl || '/back/system/department/tree';
}

/** 把后端部门树映射为 ElTreeSelect 需要的 {value,label,children} 结构 */
function mapTree(list: any[]): TreeNode[] {
  return list.map(item => ({
    value: String(item[props.valueField]),
    label: item[props.labelField],
    children: item[props.childrenField]?.length ? mapTree(item[props.childrenField]) : undefined
  }));
}

async function queryDepartmentTree() {
  loading.value = true;
  try {
    const res = await getJson(resolveUrl());
    const data = res?.data;
    let list: any[] = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data !== null && data !== undefined) {
      list = [data];
    }
    treeData.value = mapTree(list);
  } catch (error) {
    console.error('[phoenix]加载部门树失败：', error);
    treeData.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  queryDepartmentTree();
});

watch(
  () => [props.apiUrl, props.labelField, props.valueField, props.childrenField],
  () => {
    queryDepartmentTree();
  }
);

/** 收集树中所有节点 id 与叶子 id，用于 checkStrategy 过滤 */
function collectIds(list: TreeNode[], allIds: Set<string>, leafIds: Set<string>) {
  list.forEach(node => {
    allIds.add(node.value);
    if (node.children?.length) {
      collectIds(node.children, allIds, leafIds);
    } else {
      leafIds.add(node.value);
    }
  });
}

/**
 * 按 checkStrategy 过滤多选值：
 * parent 仅保留有子节点的 id，child 仅保留叶子 id
 */
function filterByStrategy(value: string[]) {
  if (props.checkStrategy === 'all' || !treeData.value.length) {
    return value;
  }
  const allIds = new Set<string>();
  const leafIds = new Set<string>();
  collectIds(treeData.value, allIds, leafIds);
  const parentIds = new Set([...allIds].filter(id => !leafIds.has(id)));
  const allowed = props.checkStrategy === 'parent' ? parentIds : leafIds;
  return value.filter(id => allowed.has(id));
}

const selectValue = computed({
  get() {
    return props.modelValue;
  },
  set(value: any) {
    handleChange(value);
  }
});

function handleChange(value: any) {
  if (props.multiple && Array.isArray(value)) {
    const filtered = filterByStrategy(value);
    if (filtered.length !== value.length) {
      // 超出策略范围的节点回写为过滤后的值（如勾选了父节点但策略是仅子节点）
      selectValue.value = filtered;
      return;
    }
  }
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<template>
  <ElTreeSelect
    v-model="selectValue"
    :data="treeData"
    node-key="value"
    :multiple="props.multiple"
    :max-collapse-tags="props.multiple ? (props.maxTagCount ?? 1) : undefined"
    collapse-tags-tooltip
    :show-checkbox="props.multiple"
    :check-strictly="props.checkStrategy === 'parent'"
    default-expand-all
    :placeholder="props.placeholder"
    :loading="loading"
    :clearable="props.clearable"
    :disabled="props.disabled"
    filterable
  />
</template>
