<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { findSystemMenuTree, findSystemOrganizationMenu, saveSystemOrganizationMenu } from '@/service';
import { useBodyLoading, useLoading } from '@/hooks';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 编辑的表格行数据 */
  editData: SystemOrganizationNamespace.SystemOrganizationForm | null;
}

defineOptions({ name: 'OrgFunctionModal' });
const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
}

const functionList = ref<Map<string, SystemMenuNamespace.SystemMenuForm>>(new Map());

const drawerWidth = ref('90%');
const checkedFunctionList = ref<string[]>([]);
/** 上一次同步给复选组的选中集合，用于 diff 出本次勾选/取消的项 */
let prevChecked: string[] = [];
const emit = defineEmits<Emits>();
const { loading, startLoading, endLoading } = useLoading(false);
const { startBodyLoading, endBodyLoading } = useBodyLoading();
const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});

const closeModal = () => {
  modalVisible.value = false;
};

const functionData = ref<any>([]);

function syncChecked(list: string[]) {
  checkedFunctionList.value = list;
  prevChecked = [...list];
}

/**
 * 复选组变化：diff 出勾选/取消的项，处理联动
 * 1. "全选"勾选时展开全部功能与子项；
 * 2. 勾选功能自动带上其子项，取消功能联动取消子项；
 * 3. 子项不全时回收"全选"标记
 */
function handleGroupChange(value: Array<string | number | boolean>) {
  // EP 的 ElCheckboxGroup change 回传 CheckboxValueType[]（string | number | boolean），
  // 本页选项值恒为菜单 id / `${id}all` 字符串，这里统一归一成 string[]
  const next = value.map(item => String(item));
  const added = next.filter(item => !prevChecked.includes(item));
  const removed = prevChecked.filter(item => !next.includes(item));

  added.forEach(id => {
    if (id.endsWith('all')) {
      // 某功能"全选"：展开其全部子项
      const menuId = id.slice(0, -3);
      const menu = functionList.value.get(menuId);
      menu?.children?.forEach(it => {
        if (!next.includes(it.id)) {
          next.push(it.id);
        }
        it.checked = true;
      });
      return;
    }
    // 勾选功能：联动勾选其子项
    const menu = functionList.value.get(id);
    menu?.children?.forEach(it => {
      if (!next.includes(it.id)) {
        next.push(it.id);
      }
      it.checked = true;
    });
  });

  removed.forEach(id => {
    if (id.endsWith('all')) {
      return;
    }
    // 取消功能：联动取消其子项
    const menu = functionList.value.get(id);
    menu?.children?.forEach(it => {
      const index = next.indexOf(it.id);
      if (index > -1) {
        next.splice(index, 1);
      }
      it.checked = false;
    });
  });

  // 子项不全时回收"全选"标记
  functionList.value.forEach(menu => {
    const allKey = `${menu.id}all`;
    if (next.includes(allKey) && menu.children?.some(it => !next.includes(it.id))) {
      const index = next.indexOf(allKey);
      if (index > -1) {
        next.splice(index, 1);
      }
    }
  });

  syncChecked(next);
}

/** 保存选择的功能 */
function handleSaveFunction() {
  startBodyLoading();
  const menuDTO: SystemOrganizationNamespace.SystemOrganizationMenuDTO = {
    organizationId: props.editData!.id,
    menuDTOList: []
  };
  const list: SystemMenuNamespace.SystemMenuForm[] = [];

  // 将选择的id转为对象，保存
  checkedFunctionList.value.forEach(item => {
    const menu = functionList.value?.get(item);
    if (menu !== null && menu !== undefined) {
      list.push(menu);
    }
  });

  menuDTO.menuDTOList = list;
  saveSystemOrganizationMenu(menuDTO).then(res => {
    if (res.error === null) {
      window.$message?.success('授权成功！');
      closeModal();
    }
    endBodyLoading();
  });
}

/** 查询所有功能 */
function findAllMenu() {
  const query: SystemMenuNamespace.SystemMenuQuery = {
    pageSize: 999999,
    pageNum: 1
  };
  findSystemMenuTree(query).then(res => {
    functionData.value = res.data;
    // 处理树型数据为列表
    functionData.value?.forEach((item: SystemMenuNamespace.SystemMenuForm) => {
      item.checked = false;
      functionList.value?.set(item.id, item);
      if (item.children !== undefined && item.children.length > 0) {
        getChildren(item);
      }
    });
  });
}

function getChildren(menu: SystemMenuNamespace.SystemMenuForm) {
  menu.children.forEach(item => {
    item.checked = false;
    functionList.value?.set(item.id, item);
    if (item.children !== undefined && item.children.length > 0) {
      getChildren(item);
    }
  });
}
/**
 * 已经授权的功能
 *
 * @param organizationId
 */
function findAuthMenu(organizationId: string) {
  startLoading();
  findSystemOrganizationMenu({ organizationId }).then(res => {
    const menus = res.data;
    const list: string[] = [];
    if (menus !== null && menus !== undefined) {
      menus.forEach(menu => {
        list.push(menu.menuId);
      });
    }
    syncChecked(list);
    endLoading();
  });
}

function fullScreen(value: boolean) {
  if (value) {
    drawerWidth.value = '100%';
  } else {
    drawerWidth.value = '90%';
  }
}
watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      findAuthMenu(props.editData!.id);
    }
  }
);
findAllMenu();
</script>

<template>
  <ElDrawer v-model="modalVisible" :size="drawerWidth" title="企业功能列表" class="privernal-drawer">
    <template #header>
      <div class="w-full flex flex-row items-center justify-between">
        <div>企业功能列表</div>
        <FullScreen @full-screen="fullScreen"></FullScreen>
      </div>
    </template>
    <div v-loading="loading">
      <ElCheckboxGroup v-model="checkedFunctionList" class="block" @change="handleGroupChange">
        <!-- 原实现把 thead/tbody 塞进 ElTable（EP 不识别会被整块丢弃导致空白），这里用普通表格渲染 -->
        <table class="authorize-table">
          <thead>
            <tr>
              <th>功能</th>
              <th>子功能</th>
              <th>操作权限</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="item in functionData" :key="item.id">
              <tr>
                <!-- 父功能单元格独占一行，rowspan 覆盖其后的 N 个子行 -->
                <td class="middle" :rowspan="item.children ? item.children.length + 1 : 1">
                  <ElCheckbox size="large" :value="`${item.id}`" :label="`${item.menuName}`" />
                </td>
              </tr>

              <tr v-for="it2 in item.children || []" :key="it2.id">
                <td class="middle">
                  <div>
                    <ElCheckbox size="large" :value="it2.id" :label="`${it2.menuName}`" />
                  </div>
                </td>
                <td>
                  <div class="flex flex-wrap items-center gap-x-16px gap-y-4px">
                    <div v-if="it2.children !== null && it2.children.length > 0">
                      <ElCheckbox size="large" label="全选" :value="`${it2.id}all`" />
                    </div>
                    <template v-for="it3 in it2.children">
                      <div v-if="!it3.menuName.includes('列表') && !it3.menuName.includes('详情')" :key="it3.id">
                        <ElCheckbox
                          size="large"
                          :value="it3.id"
                          :label="it3.menuName.substring(it3.menuName.length - 2)"
                        />
                      </div>
                    </template>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </ElCheckboxGroup>
    </div>
    <template #footer>
      <div class="footer">
        <ElButton style="margin-right: 10px" @click="modalVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSaveFunction">保存</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<style lang="scss" scoped>
.footer {
  display: flex;
  flex-direction: row;
  justify-content: end;
  margin-top: 10px;
  padding-right: 10px;
}
.middle {
  vertical-align: middle;
}
.authorize-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    border: 1px solid var(--el-border-color-light);
    padding: 8px 12px;
    text-align: left;
    vertical-align: middle;
  }

  th {
    background-color: var(--el-fill-color-light);
    font-weight: 500;
  }
}
</style>
