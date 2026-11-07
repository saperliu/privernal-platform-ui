<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { ElTree, TreeNodeData } from 'element-plus';
import { ElButton as __forwarded_ElButton, ElIcon as __forwarded_ElIcon } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import {
  CloseOutline as __forwarded_CloseOutline,
  SearchOutline as __forwarded_SearchOutline
} from '@vicons/ionicons5';
import { ClearOutlined as __forwarded_ClearOutlined } from '@vicons/antd';
import { findSystemDepartmentTree } from '@/service';

/** 穿梭框确认后回传的选择结果（原全局 Common.SelectDataWithKey，迁移后该命名空间已不存在） */
interface SelectDataWithKey<T> {
  selected: T[];
  addList: T[];
  delList: T[];
}

export interface Props {
  /** 标题 */
  title?: string;
  /** 显示弹出框 * */
  visible: boolean;
  /** 是否多选 */
  multiple?: boolean;
  /** 已选数据 * */
  selectedData: Array<SystemDepartmentNamespace.SystemDepartmentForm>;
}

defineOptions({ name: 'TransferDepartment' });

const props = withDefaults(defineProps<Props>(), {
  selectedData: () => [],
  title: '添加部门',
  visible: false,
  multiple: false
});

const departmentData = ref<SystemDepartmentNamespace.SystemDepartmentTable[]>([]);
const listRightData = ref<SystemDepartmentNamespace.SystemDepartmentForm[]>([]);
const listLeftDeptData = ref<Array<any>>([]);

const pattern = ref<string>('');
const treeRef = ref<InstanceType<typeof ElTree>>();

/**
 * 删除右侧的已选数据
 *
 * @param key
 * @param index
 */
function deleteRow(key: string, index: number) {
  // 左侧如果存在此数据，则显示成未选中
  listLeftDeptData.value = listLeftDeptData.value.filter(item => item !== key);
  // 右侧删除
  listRightData.value.splice(index, 1);
  nextTick(() => treeRef.value?.setCheckedKeys([...listLeftDeptData.value]));
}

/** 清空右侧的已选数据 */
function clearRightData() {
  listRightData.value = [];
  listLeftDeptData.value = [];
  nextTick(() => treeRef.value?.setCheckedKeys([]));
}

/**
 * 按树的先序遍历收集命中的节点（保持与树一致的顺序）
 *
 * @param nodes 树节点
 * @param keys 命中的节点 id
 * @param acc 累积数组
 */
function collectNodes(
  nodes: SystemDepartmentNamespace.SystemDepartmentTable[] | undefined,
  keys: Set<any>,
  acc: Array<SystemDepartmentNamespace.SystemDepartmentTable> = []
) {
  (nodes || []).forEach(node => {
    if (keys.has(node.id)) {
      acc.push(node);
    }
    collectNodes(node.children as SystemDepartmentNamespace.SystemDepartmentTable[] | undefined, keys, acc);
  });
  return acc;
}

/**
 * 勾选部门树节点（EP @check：勾选状态级联，checkedKeys 已含全部子节点）
 *
 * @param node 当前操作节点
 * @param checked 勾选状态
 */
function handleTreeCheck(node: SystemDepartmentNamespace.SystemDepartmentTable, checked: { checkedKeys: Array<any> }) {
  if (!props.multiple) {
    // 单选：仅保留当前节点
    listLeftDeptData.value = [node.id];
    listRightData.value = [node];
    nextTick(() => treeRef.value?.setCheckedKeys([node.id]));
    return;
  }
  listLeftDeptData.value = checked.checkedKeys;
  listRightData.value = collectNodes(departmentData.value, new Set<any>(checked.checkedKeys));
}

/** 关键字过滤（EP 树走 filter-node-method + filter()） */
function filterNode(value: string, data: TreeNodeData) {
  if (!value) return true;
  return String(data.deptName || '').includes(value);
}

watch(pattern, value => {
  treeRef.value?.filter(value);
});

/** 查询组织树 */
async function findDepartmentTree() {
  const { data } = await findSystemDepartmentTree({ deptName: '', pageSize: 10, pageNum: 1 });
  if (data !== null) {
    departmentData.value = (data.children || []) as SystemDepartmentNamespace.SystemDepartmentTable[];
    // 数据异步到达后回填勾选（EP 的 default-checked-keys 只在初始渲染时生效）
    nextTick(() => {
      if (listLeftDeptData.value.length) {
        treeRef.value?.setCheckedKeys([...listLeftDeptData.value]);
      }
    });
  }
}

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'closed', data: SelectDataWithKey<SystemDepartmentNamespace.SystemDepartmentForm>): void;
}

const emit = defineEmits<Emits>();
const show = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});

const closeModal = () => {
  show.value = false;
};

const handleSubmit = () => {
  // 处理数据，现有数据，删除数据，新增数据
  if (props.selectedData.length > 0) {
    if (listRightData.value.length > 0) {
      const sameList = listRightData.value.filter(i => props.selectedData.some(j => j.id === i.id));
      // 得到删除的数据
      const delList = props.selectedData.filter(i => !sameList.some(j => j.id === i.id));
      // 得到新增的数据
      const addList = listRightData.value.filter(i => !sameList.some(j => j.id === i.id));
      emit('closed', { selected: cloneDeep(listRightData.value), addList, delList });
    } else {
      // 清空了，没有选择任何数据
      emit('closed', { selected: [], addList: [], delList: cloneDeep(props.selectedData) });
    }
  } else {
    emit('closed', { selected: cloneDeep(listRightData.value), addList: cloneDeep(listRightData.value), delList: [] });
  }
  closeModal();
};

onMounted(async () => {
  await findDepartmentTree();
  if (props.selectedData.length > 0) {
    listRightData.value = cloneDeep(props.selectedData);
    listLeftDeptData.value = props.selectedData.map(item => item.id);
    nextTick(() => treeRef.value?.setCheckedKeys([...listLeftDeptData.value]));
  }
});

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElIcon = __forwarded_ElIcon;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const CloseOutline = __forwarded_CloseOutline;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const SearchOutline = __forwarded_SearchOutline;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ClearOutlined = __forwarded_ClearOutlined;
</script>

<template>
  <ElDialog v-model="show" :title="props.title" width="50%">
    <ElCard shadow="never">
      <div class="sel-main">
        <div class="sel-left">
          <div class="flex items-center gap-8px">
            <ElInput v-model="pattern" placeholder="筛选" clearable>
              <template #prefix>
                <ElIcon><component :is="SearchOutline" /></ElIcon>
              </template>
            </ElInput>
          </div>

          <div class="sel-left-tree">
            <!-- EP 的 ElTree：label/children 映射走 props，勾选走 show-checkbox + @check -->
            <ElTree
              ref="treeRef"
              node-key="id"
              :props="{ label: 'deptName', children: 'children' }"
              :data="departmentData"
              default-expand-all
              show-checkbox
              :check-on-click-node="true"
              :default-checked-keys="[]"
              :filter-node-method="filterNode"
              @check="handleTreeCheck"
            />
          </div>
        </div>
        <div class="sel-right">
          <div class="sel-right-head">
            <span class="sel-right-title">已选中</span>
            <ElButton size="small" plain @click="clearRightData">
              <template #icon>
                <ElIcon><component :is="ClearOutlined" /></ElIcon>
              </template>
              清空
            </ElButton>
          </div>
          <ElCard shadow="never" class="mt-10px">
            <div class="sel-right-list">
              <div v-for="(item, index) in listRightData" :key="item.id" class="sel-right-row">
                <div>{{ item.deptName }}</div>
                <div class="sel-right-row-icon" @click="deleteRow(item.id, index)">
                  <ElIcon size="22"><component :is="CloseOutline" /></ElIcon>
                </div>
              </div>
              <div v-if="!listRightData.length" class="sel-right-empty">暂未选择部门</div>
            </div>
          </ElCard>
        </div>
      </div>
    </ElCard>
    <div class="footer">
      <ElButton style="margin-right: 10px" @click="show = false">取消</ElButton>
      <ElButton type="primary" @click="handleSubmit">确定</ElButton>
    </div>
  </ElDialog>
</template>

<style lang="scss" scoped>
.sel-main {
  height: 515px;
  display: flex;
  flex-direction: row;
  justify-content: start;
}
.sel-left {
  flex: 1;
  padding-right: 10px;
  height: 100%;
}
.sel-left-tree {
  margin-top: 10px;
  height: 90%;
  width: 100%;
  overflow: auto;
}
.sel-right {
  flex: 1;
  border-left: solid 1px #e4e7ed;
  display: flex;
  flex-direction: column;
  justify-content: start;
  padding-left: 20px;
  :deep(.el-card__body) {
    padding: 5px;
  }
}
.sel-right-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.sel-right-title {
  font-weight: 600;
  font-size: 14px;
  color: #1d2129;
}
.sel-right-list {
  margin-top: 10px;
  height: 415px;
  overflow: auto;
}
.sel-right-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  padding-right: 10px;
  padding-left: 24px;
  height: 30px;
  line-height: 30px;
  border-radius: 4px;
}
.sel-right-row:hover {
  background-color: #f5f7fa;
  .sel-right-row-icon {
    display: flex;
  }
}
.sel-right-row-icon {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 22px;
  height: 22px;
  cursor: pointer;
  &:hover {
    background-color: #ebeef5;
  }
}
.sel-right-empty {
  padding: 24px 0;
  text-align: center;
  color: #909399;
  font-size: 13px;
}
.footer {
  display: flex;
  flex-direction: row;
  justify-content: end;
  margin-top: 10px;
  padding-right: 10px;
}
</style>
