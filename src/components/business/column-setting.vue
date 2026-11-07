<script setup lang="ts">
import { ref, watch } from 'vue';
import { EyeOutlined as __forwarded_EyeOutlined } from '@vicons/antd';
import VueDraggable from 'vuedraggable';

type Column = DataTable.Column<any>;

interface Props {
  columns: Column[];
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:columns', columns: Column[]): void;
}

const emit = defineEmits<Emits>();

type List = Column & { checked?: boolean };

const list = ref<List[]>(initList());

function initList(): List[] {
  return props.columns.map(item => ({ ...item, checked: true }));
}

/**
 * 父组件列集合变化时重建选项列表（动态列表的列是接口返回后异步追加的，
 * 仅初始化快照会与表格脱节）。以旧列表顺序为基准：保留用户勾选状态与拖拽排序；
 * 被本组件过滤掉的列（checked=false）继续保留在列表中以便重新勾选；
 * 父组件新增的列追加到末尾且默认勾选。
 */
watch(
  () => props.columns,
  () => {
    const prevByKey = new Map<PropertyKey, List>();
    list.value.forEach(item => {
      if (item.key !== undefined) prevByKey.set(item.key as PropertyKey, item);
    });
    const nextKeys = new Set<PropertyKey>();
    const next: List[] = [];
    list.value.forEach(item => {
      if (item.key === undefined) {
        next.push(item);
        return;
      }
      const key = item.key as PropertyKey;
      nextKeys.add(key);
      const fresh = props.columns.find(col => col.key === item.key);
      next.push(fresh ? { ...fresh, checked: item.checked } : item);
    });
    props.columns.forEach(col => {
      if (col.key !== undefined && !nextKeys.has(col.key as PropertyKey)) {
        next.push({ ...col, checked: true });
      }
    });
    list.value = next;
  },
  { deep: true }
);

/** 仅在用户勾选/拖拽时向外同步，避免「重建 → emit → 父级替换 → 再重建」的回环 */
function emitColumns() {
  const columns = list.value
    .filter(item => item.checked !== false)
    .map(item => {
      const column = { ...item };
      delete column.checked;
      return column;
    }) as Column[];
  emit('update:columns', columns);
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const EyeOutlined = __forwarded_EyeOutlined;
</script>

<template>
  <ElPopover placement="bottom" trigger="click">
    <template #reference>
      <ElButton size="small" quaternary>
        <ElIcon size="16" class="list-top-font mr-4px"><component :is="EyeOutlined" /></ElIcon>
        <div class="list-top-font">显示</div>
      </ElButton>
    </template>
    <div class="w-180px">
      <VueDraggable v-model="list" item-key="key" @end="emitColumns">
        <template #item="{ element }">
          <div v-if="element.key" class="hover:bg-primary_active h-36px flex-y-center px-12px">
            <icon-mdi-drag class="mr-8px cursor-move text-20px" />
            <ElCheckbox
              :model-value="element.checked !== false"
              @update:model-value="
                (v: string | number | boolean) => {
                  element.checked = Boolean(v);
                  emitColumns();
                }
              "
            >
              {{ element.title }}
            </ElCheckbox>
          </div>
        </template>
      </VueDraggable>
    </div>
  </ElPopover>
</template>

<style scoped></style>
