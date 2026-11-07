<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElButton as __forwarded_ElButton, ElIcon as __forwarded_ElIcon } from 'element-plus';
import type { ElTree } from 'element-plus';
import { cloneDeep } from 'lodash-es';
import {
  CloseOutline as __forwarded_CloseOutline,
  SearchOutline as __forwarded_SearchOutline
} from '@vicons/ionicons5';
import { ClearOutlined as __forwarded_ClearOutlined } from '@vicons/antd';
import { useLoading } from '@privernal/hooks';
import { findSystemDepartmentTree, findSystemUserList } from '@/service';

/** 带 key 的选项（原全局 Common.OptionWithKey，迁移后该命名空间已不存在，按本地用法补类型） */
interface OptionWithKey<K = any> {
  key: string;
  label: string;
  value: K;
}

/** 穿梭框确认后回传的选择结果（原全局 Common.SelectDataWithKey） */
interface SelectDataWithKey<T> {
  selected: T[];
  addList: T[];
  delList: T[];
}

const { startLoading, endLoading } = useLoading(false);

export interface Props {
  /** 标题 */
  title?: string;
  /** 显示弹出框 * */
  visible: boolean;
  /** 是否多选 */
  multiple?: boolean;
  /** 已选数据 * */
  selectedData: Array<OptionWithKey<object>>;
}

defineOptions({ name: 'TransferPerson' });

const props = withDefaults(defineProps<Props>(), {
  selectedData: () => [],
  title: '添加人员',
  visible: false,
  multiple: false
});
const departmentData = ref<SystemDepartmentNamespace.SystemDepartmentTable[]>([]);
const listData = ref<Array<OptionWithKey<any>>>([]);
const listRightData = ref<Array<any>>([]);
const listLeftDefaultSelectedData = ref<Array<any>>([]);

const pattern = ref<string>('');

const deptTreeRef = ref<InstanceType<typeof ElTree>>();
const userTreeRef = ref<InstanceType<typeof ElTree>>();
/** 当前点选的部门 id（再点一次取消） */
const selectedDeptId = ref<any>('');

type FormFilterModel = SystemUserNamespace.SystemUserQuery;
const formFilter = reactive<FormFilterModel>({ pageNum: 1, pageSize: 9999 });

/**
 * 删除右侧的已选数据
 *
 * @param key
 * @param index
 */
function deleteRow(key: string, index: number) {
  // 左侧如果存在此数据，则显示成未选中
  listLeftDefaultSelectedData.value = listLeftDefaultSelectedData.value.filter(item => item !== key);
  // 右侧删除
  listRightData.value.splice(index, 1);
  nextTick(() => userTreeRef.value?.setCheckedKeys([...listLeftDefaultSelectedData.value]));
}

/** 清空右侧的已选数据 */
function clearRightData() {
  listRightData.value = [];
  listLeftDefaultSelectedData.value = [];
  nextTick(() => userTreeRef.value?.setCheckedKeys([]));
}

/** 全选所有数据 */
function selectAll() {
  if (!props.multiple) {
    window.$message?.error('单选模式,无法全选！');
    return;
  }
  if (listData.value.length > 0) {
    const keys: string[] = [];
    listData.value.forEach(item => {
      // 判断listRightData里是否包含item.key
      if (!listRightData.value.some(item2 => item2.key === item.key)) {
        listRightData.value.push(item);
        keys.push(item.key);
      }
    });
    listLeftDefaultSelectedData.value = keys;
    nextTick(() => userTreeRef.value?.setCheckedKeys([...keys]));
  }
}

/**
 * 勾选左侧人员（EP @check：checkedKeys 已含当前全部勾选项）
 *
 * @param node 当前操作节点
 * @param checked 勾选状态
 */
function selectLeftData(node: OptionWithKey<any>, checked: { checkedKeys: Array<any> }) {
  if (!props.multiple) {
    // 单选：仅保留当前节点
    listLeftDefaultSelectedData.value = [node.key];
    listRightData.value = [node];
    nextTick(() => userTreeRef.value?.setCheckedKeys([node.key]));
    return;
  }
  listLeftDefaultSelectedData.value = checked.checkedKeys;
  listRightData.value = listData.value.filter(item => checked.checkedKeys.includes(item.key));
}

/**
 * 点选部门树节点（再点同一节点取消），联动查询该部门人员
 *
 * @param data 部门节点
 */
function selectTopTreeData(data: SystemDepartmentNamespace.SystemDepartmentTable) {
  if (selectedDeptId.value === data.id) {
    // 取消选择
    selectedDeptId.value = '';
    formFilter.departmentId = '';
    deptTreeRef.value?.setCurrentKey(null);
    listData.value = [];
    return;
  }
  selectedDeptId.value = data.id;
  formFilter.departmentId = `${data.id}`;
  findUserList();
}

/** 查询可选人员 */
async function findUserList() {
  startLoading();
  listData.value = [];
  const { data } = await findSystemUserList(formFilter);
  if (data && data.list.length > 0) {
    const dataList = data.list;

    listData.value = dataList.map(item => {
      const user: OptionWithKey<SystemUserNamespace.SystemUserForm> = {
        label: item.nickName!,
        key: item.id,
        value: item
      };
      return user;
    });
    // 已选回显（数据异步到达，setCheckedKeys 需在渲染后调用）
    nextTick(() => {
      if (listLeftDefaultSelectedData.value.length) {
        userTreeRef.value?.setCheckedKeys([...listLeftDefaultSelectedData.value]);
      }
    });
  }
  endLoading();
}

/** 查询组织树 */
async function findDepartmentTree() {
  const { data } = await findSystemDepartmentTree({ deptName: '', pageSize: 10, pageNum: 1 });
  if (data !== null) {
    departmentData.value = (data.children || []) as SystemDepartmentNamespace.SystemDepartmentTable[];
  }
}

/** 人员关键字过滤（按显示名或登录名） */
// ElTree 的 filter-node-method 传入的是 TreeNodeData（Record<string, any>），
// 这里不能收窄成 OptionWithKey，否则回调参数逆变导致类型不兼容
function filterUser(value: string, data: Record<string, any>) {
  if (!value) return true;
  const v = String(value).toLowerCase();
  return (
    String(data.label || '')
      .toLowerCase()
      .includes(v) ||
    String(data.value?.loginName || '')
      .toLowerCase()
      .includes(v)
  );
}

watch(pattern, value => {
  userTreeRef.value?.filter(value);
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'closed', data: SelectDataWithKey<OptionWithKey<any>>): void;
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
  // 得到原始数组与新的选择后的数组相同的数据。
  if (props.selectedData.length > 0) {
    if (listRightData.value.length > 0) {
      const sameList = listRightData.value.filter(i => props.selectedData.some(j => j.key === i.key));
      // 得到删除的数据
      const delList = props.selectedData.filter(i => !sameList.some(j => j.key === i.key));
      // 得到新增的数据
      const addList = listRightData.value.filter(i => !sameList.some(j => j.key === i.key));
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

onMounted(() => {
  if (props.selectedData.length > 0) {
    listRightData.value = cloneDeep(props.selectedData);
    listLeftDefaultSelectedData.value = props.selectedData.map(item => item.key);
  }
  findDepartmentTree();
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
          <div class="sel-tip">点选部门后查询该部门人员</div>

          <div class="sel-left-tree">
            <!-- EP 的 ElTree：部门单选走 node-click + highlight-current -->
            <ElTree
              ref="deptTreeRef"
              node-key="id"
              :props="{ label: 'deptName', children: 'children' }"
              :data="departmentData"
              default-expand-all
              highlight-current
              @node-click="selectTopTreeData"
            />
          </div>

          <ElDivider></ElDivider>
          <div class="sel-left-filter">
            <div class="mb-10px">
              <ElButton size="small" plain @click="selectAll">全选</ElButton>
            </div>

            <ElInput v-model="pattern" placeholder="筛选" clearable>
              <template #prefix>
                <ElIcon><component :is="SearchOutline" /></ElIcon>
              </template>
            </ElInput>
          </div>
          <div class="sel-left-list">
            <ElTree
              ref="userTreeRef"
              node-key="key"
              :props="{ label: 'label' }"
              :data="listData"
              default-expand-all
              show-checkbox
              :check-on-click-node="true"
              :filter-node-method="filterUser"
              @check="selectLeftData"
            >
              <template #default="{ data }">
                <span class="text-13px">
                  {{ data.label }}
                  <span v-if="data.value && data.value.loginName" class="text-12px text-gray-400">
                    （{{ data.value.loginName }}）
                  </span>
                </span>
              </template>
            </ElTree>
            <div v-if="!listData.length" class="sel-empty">请先选择部门</div>
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
              <div v-for="(item, index) in listRightData" :key="item.key" class="sel-right-row">
                <div>{{ item.label }}</div>
                <div class="sel-right-row-icon" @click="deleteRow(item.key, index)">
                  <ElIcon size="22"><component :is="CloseOutline" /></ElIcon>
                </div>
              </div>
              <div v-if="!listRightData.length" class="sel-empty">暂未选择人员</div>
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
.sel-tip {
  font-size: 12px;
  color: #909399;
}
.sel-left {
  flex: 1;
  padding-right: 10px;
  height: 100%;
}
.sel-left-tree {
  margin-top: 10px;
  height: 34%;
  width: 100%;
  overflow: auto;
}
.sel-left-list {
  height: 32%;
  overflow: auto;
}
.sel-left-filter {
  margin-bottom: 10px;
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
.sel-empty {
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
