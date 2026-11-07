<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';
import { ActionTagAdd, ActionTagDelete, ActionTagEdit } from '@/constants';
import {
  fetchUserDataScope,
  findSystemAppListByOrg,
  findSystemMenuAppTree,
  findSystemMenuByRole,
  saveSystemRoleMenuBatch
} from '@/service';
import { useAuthStore } from '@/store';
import { useLoading } from '@/hooks';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 编辑的表格行数据 */
  editData: SystemRoleNamespace.SystemRoleForm | null;
}

defineOptions({ name: 'OrgFunctionModal' });
const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
}
const auth = useAuthStore();
const functionList = ref<Map<string, SystemMenuNamespace.SystemMenuForm>>(new Map());

// 操作的数据
const operationList = ref<SystemRoleMenuNamespace.SystemRoleMenuScopeDTO[]>([]);
// 当前角色，当前应用，已经授权的菜单
const roleMenuList = ref<SystemRoleMenuNamespace.SystemRoleMenuForm[]>([]);

// 当前的操作的情况
const currentType = ref<string>('');
const currentAppCode = ref<string>('');

const dataScopesOption = ref<Array<any>>([]);
const drawerWidth = ref('90%');
const checkedFunctionList = ref<string[]>([]);
/** 上一次同步给复选组的选中集合，用于 diff 出本次勾选/取消的项 */
let prevChecked: string[] = [];

const emit = defineEmits<Emits>();
const { loading, startLoading, endLoading } = useLoading(false);
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
const appList = computed(() => auth.getAppList());

/** 当前应用 tab */
const activeAppTab = ref('');

/** 应用列表可能尚未装载（未访问过首页），为空时主动拉取 */
async function ensureAppList() {
  if (appList.value.length === 0) {
    const res = await findSystemAppListByOrg();
    if (res.error === null && res.data) {
      auth.setAppList(res.data);
    }
  }
}

function syncChecked(list: string[]) {
  checkedFunctionList.value = list;
  prevChecked = [...list];
}

function processAction(value: string, type: 'check' | 'uncheck', menuForm: SystemMenuNamespace.SystemMenuForm | null) {
  currentType.value = type;
  processDataAction(value, menuForm);
}

/** 判断是否为功能的"列表/详情"展示子项（选中功能时自动带上、取消时自动回收） */
function isListOrDetailMenu(menu: SystemMenuNamespace.SystemMenuForm) {
  return menu.menuName.indexOf('列表') > 0 || menu.menuName.indexOf('详情') > 0;
}

/**
 * 复选组变化：diff 出勾选/取消的项，处理联动
 * 1. 勾选"全选"展开全部子项；子项被取消时回收"全选"标记；
 * 2. 勾选功能自动带上"列表/详情"，取消功能联动回收
 *
 * EP 的 ElCheckboxGroup change 回传 CheckboxValueType[]（string | number | boolean），
 * 本页选项值恒为菜单 id / `${id}all` 字符串，这里统一归一成 string[]
 */
function handleGroupChange(value: Array<string | number | boolean>) {
  const next = value.map(item => String(item));
  const added = next.filter(item => !prevChecked.includes(item));
  const removed = prevChecked.filter(item => !next.includes(item));

  added.forEach(id => {
    if (id.endsWith('all')) {
      const menuId = id.slice(0, -3);
      const menu = functionList.value.get(currentAppCode.value + menuId);
      menu?.children?.forEach(it => {
        if (!next.includes(it.id)) {
          next.push(it.id);
          processAction(it.id, 'check', it);
        }
        it.checked = true;
      });
      return;
    }
    const menu = functionList.value.get(currentAppCode.value + id);
    menu?.children?.forEach(it => {
      if (!next.includes(it.id) && isListOrDetailMenu(it)) {
        next.push(it.id);
        processAction(it.id, 'check', it);
      }
    });
    processAction(id, 'check', menu ?? null);
  });

  removed.forEach(id => {
    if (id.endsWith('all')) {
      return;
    }
    const menu = functionList.value.get(currentAppCode.value + id);
    menu?.children?.forEach(it => {
      if (next.includes(it.id) && isListOrDetailMenu(it)) {
        next.splice(next.indexOf(it.id), 1);
        processAction(it.id, 'uncheck', it);
      }
    });
    processAction(id, 'uncheck', menu ?? null);
  });

  // 有子项不在选中集合时，"全选"标记不再成立，回收掉
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

/**
 * 由菜单节点构造一条授权操作记录
 *
 * @param menu 菜单节点
 * @param roleMenuId 已存在授权记录的主键（新增时传空串）
 * @param actionTag ADD / DELETE / EDIT
 */
function buildRoleMenuOperation(
  menu: SystemMenuNamespace.SystemMenuForm,
  roleMenuId: string,
  actionTag: string
): SystemRoleMenuNamespace.SystemRoleMenuScopeDTO {
  return {
    id: roleMenuId ? `${roleMenuId}` : '',
    menuId: menu.id ? `${menu.id}` : '',
    menuName: menu.menuName ? `${menu.menuName}` : '',
    dataScope: menu.dataScope || 20,
    permission: `${menu.permission}`,
    organizationId: '',
    appId: menu.appId ? `${menu.appId}` : '',
    actionTag
  };
}

function processDataAction(value: string, menuForm: SystemMenuNamespace.SystemMenuForm | null) {
  let flag = false;
  let roleMenu: SystemRoleMenuNamespace.SystemRoleMenuForm = {
    appId: '',
    menuName: '',
    dataScope: 0,
    id: '',
    menuDTOList: [],
    menuId: '',
    permission: '',
    roleId: ''
  };
  roleMenuList.value.forEach(item => {
    if (item.menuId === value) {
      flag = true;
      roleMenu = item;
    }
  });

  if (currentType.value === 'uncheck') {
    // 判断是否是已经存在的权限 roleMenuList.value
    if (flag) {
      const menu = functionList.value?.get(currentAppCode.value + value);

      if (menu !== null && menu !== undefined) {
        // 已经存在的，去掉，则是删除操作
        operationList.value.push(buildRoleMenuOperation(menu, roleMenu.id, ActionTagDelete));
      }
    } else {
      // 不存在，还取消了。则是不操作。由新增变为不新增。
      operationList.value = operationList.value.filter(item => item.menuId !== value);
    }
  }
  if (currentType.value === 'check') {
    if (flag) {
      // 已前存在，再次选中。则是原先删除了，由删除变为不删除。
      operationList.value = operationList.value.filter(item => item.menuId !== value);
    } else {
      let menu: SystemMenuNamespace.SystemMenuForm | null | undefined = functionList.value?.get(
        currentAppCode.value + value
      );
      if (menu === null || menu === undefined) {
        menu = menuForm;
      }

      // 已经存在的，去掉，则是删除操作
      if (menu !== null && menu !== undefined) {
        operationList.value.push(buildRoleMenuOperation(menu, '', ActionTagAdd));
      }
    }
  }
}

function processDataScopeAction(value: string, dataScope: number) {
  let flag = false;
  let roleMenu: SystemRoleMenuNamespace.SystemRoleMenuForm = {
    appId: '',
    menuName: '',
    dataScope: 0,
    id: '',
    menuDTOList: [],
    menuId: '',
    permission: '',
    roleId: ''
  };
  roleMenuList.value.forEach(item => {
    if (item.menuId === value) {
      flag = true;
      roleMenu = item;
    }
  });

  // 判断是否是已经存在的权限 roleMenuList.value
  if (flag) {
    let operSelect = false;
    operationList.value.forEach(item => {
      if (item.menuId === value) {
        operSelect = true;
        item.dataScope = dataScope;
      }
    });

    if (!operSelect) {
      // 原先有，现在没有操作。需要增加进去，进行更新操作
      const menu = functionList.value?.get(currentAppCode.value + value);

      if (menu !== null && menu !== undefined) {
        // 已经存在的，去掉，则是删除操作
        operationList.value.push({
          id: roleMenu.id ? `${roleMenu.id}` : '',
          menuId: menu.id ? `${menu.id}` : '',
          menuName: menu.menuName ? `${menu.menuName}` : '',
          dataScope,
          permission: `${menu.permission}`,
          organizationId: '',
          appId: menu.appId ? `${menu.appId}` : '',
          actionTag: ActionTagEdit
        });
      }
    }
  } else {
    // 以前不存在，现在是新增。直接更新数据即可

    operationList.value.forEach(item => {
      if (item.menuId === value) {
        item.dataScope = dataScope;
      }
    });
  }
}

/**
 * 选择了数据范围
 *
 * @param value 菜单（v-model 已把新的 dataScope 写进节点）
 */
function handleUpdateDataScope(value: SystemMenuNamespace.SystemMenuForm) {
  // 更新所有选中的项目为新的数据范围。
  value.children?.forEach(it => {
    if (it.checked) {
      it.dataScope = value.dataScope;
      // 将已经选择的数据更新数据范围。
      processDataScopeAction(it.id, value.dataScope);
    }
  });
  processDataScopeAction(value.id, value.dataScope);
}
/** 保存选择的功能 */
function handleSaveFunction() {
  const menuDTO: SystemRoleMenuNamespace.SystemRoleMenuForm = {
    roleId: props.editData?.id ? props.editData?.id : '',
    id: '',
    menuId: '',
    menuName: '',
    appId: '',
    permission: '',
    dataScope: 10,
    menuDTOList: []
  };
  // 过滤掉重复的数据 checkedFunctionList
  operationList.value = operationList.value.filter((item, index) => {
    const findIndex = operationList.value.findIndex(it => it.menuId === item.menuId && it.appId === item.appId);
    if (findIndex !== -1 && findIndex !== index) {
      return false;
    }
    return true;
  });

  menuDTO.menuDTOList = operationList.value;

  if (operationList.value.length === 0) {
    window.$message?.error('未更改任何授权!');
    return;
  }

  startLoading();
  saveSystemRoleMenuBatch(menuDTO).then(res => {
    if (res.error === null) {
      window.$message?.success('保存成功');
      closeModal();
    }
    endLoading();
  });
}

/**
 * 切换TAB应用
 *
 * @param value 应用编码（ElTabs 的 tab-change 回传 TabPaneName，本页恒为字符串）
 */
function handleChangeTabApp(value: string | number) {
  findAuthMenu(props.editData!.id, String(value));
}
/** 查询所有功能 */
function findAllMenu(appCode: string) {
  currentAppCode.value = appCode;
  startLoading();
  const query: SystemMenuNamespace.SystemMenuQuery = {
    pageSize: 999999,
    pageNum: 1,
    appCode
  };
  // 根据appCode 找到应用的ID，appList里
  const app = appList.value.filter(item => item.code === appCode);
  findSystemMenuAppTree(query).then(res => {
    functionData.value = res.data;
    // 处理树型数据为列表
    functionData.value?.forEach((item: SystemMenuNamespace.SystemMenuForm) => {
      item.checked = false;
      item.appId = app[0]?.id;
      functionList.value?.set(currentAppCode.value + item.id, item);

      if (item.children !== undefined && item.children !== null && item.children.length > 0) {
        getChildren(item, app[0]);
      }

      const temp = roleMenuList.value.filter(item2 => item2.menuId === item.id);
      if (temp.length > 0) {
        item.checked = true;
      } else if (Number(item.mustMenu) === 1) {
        // 当前功能是必选功能
        item.checked = true;
        item.dataScope = 20;
        checkedFunctionList.value.push(item.id);
        processAction(item.id, 'check', item);
      }

      if (item.menuType === 'C') {
        // 直接是功能（后端 C 类型菜单的 children 可能为 null）
        const childList = item.children || [];
        childList.forEach(item2 => {
          // 是必选功能，初始化
          const tempChild = roleMenuList.value.filter(item3 => item3.menuId === item2.id);
          if (tempChild.length > 0) {
            item.dataScope = tempChild[0].dataScope;
            item2.checked = true;
            item2.dataScope = tempChild[0].dataScope;
          }
        });
      }
    });

    syncChecked([...checkedFunctionList.value]);
    endLoading();
  });
}

function getChildren(menu: SystemMenuNamespace.SystemMenuForm, app: SystemAppInfoNamespace.SystemAppInfoForm) {
  menu.children.forEach(item => {
    item.appId = app?.id;
    item.checked = false;

    const temp = roleMenuList.value.filter(item2 => item2.menuId === item.id);
    if (temp.length > 0) {
      item.dataScope = menu.dataScope;
      item.appId = app?.id;
      item.checked = true;
    } else if (Number(item.mustMenu) === 1) {
      item.checked = true;
      item.dataScope = 20;
      menu.dataScope = 20;
      checkedFunctionList.value.push(item.id);
      processAction(item.id, 'check', item);
    }

    functionList.value?.set(currentAppCode.value + item.id, item);
    if (item.children !== undefined && item.children !== null && item.children.length > 0) {
      getChildren(item, app);
    }
    if (item.menuType === 'C') {
      const temp2 = roleMenuList.value.filter(item2 => item2.menuId === item.id);
      if (temp2.length > 0) {
        item.dataScope = temp2[0].dataScope;
        item.appId = app?.id;
        item.checked = true;
      } else {
        // 存在选了列表功能，而没有选择此功能。这情况是有此功能的数据查询接口权限，没有菜单显示的权限。
        // 后端 C 类型菜单的 children 可能为 null
        const childList = item.children || [];
        childList.forEach(item2 => {
          const tempChild = roleMenuList.value.filter(item3 => item3.menuId === item2.id);
          if (tempChild.length > 0) {
            item.dataScope = tempChild[0].dataScope;
            item.appId = app?.id;
          }
        });
      }
    }
  });
}
/**
 * 已经授权的功能
 *
 * @param roleId
 * @param appCode
 */
function findAuthMenu(roleId: string, appCode: string) {
  startLoading();
  const app = appList.value.filter(item => item.code === appCode);
  if (app.length === 0) {
    window.$message?.error('未找到应用，无法加载授权功能');
    endLoading();
    return;
  }
  findSystemMenuByRole(roleId, app[0].id).then(res => {
    const list: any[] = [];
    if (res !== null && res.data !== null) {
      for (const menu of res.data) {
        list.push(menu.menuId);
      }
      roleMenuList.value = res.data;
    }
    syncChecked(list);
    if (appList.value.length > 0) {
      findAllMenu(appCode);
    } else {
      endLoading();
    }
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
  async newValue => {
    if (newValue) {
      await ensureAppList();
      if (appList.value.length === 0) {
        window.$message?.error('未获取到应用列表，无法授权');
        return;
      }
      activeAppTab.value = appList.value[0].code;
      findAuthMenu(props.editData!.id, appList.value[0].code);
    }
  }
);

onMounted(() => {
  fetchUserDataScope().then(res => {
    if (res.data !== null) {
      dataScopesOption.value = res.data;
    }
  });
});

function handleAfterLeave() {
  functionList.value.clear();
  checkedFunctionList.value = [];
  prevChecked = [];
  operationList.value = [];
  roleMenuList.value = [];
  functionData.value = [];
}
</script>

<template>
  <ElDrawer
    v-model="modalVisible"
    :size="drawerWidth"
    title="应用授权"
    class="privernal-drawer"
    @closed="handleAfterLeave"
  >
    <template #header>
      <div class="w-full flex flex-row items-center justify-between">
        <div>应用授权列表</div>
        <FullScreen @full-screen="fullScreen"></FullScreen>
      </div>
    </template>
    <ElTabs v-model="activeAppTab" @tab-change="handleChangeTabApp">
      <ElTabPane v-for="panel in appList" :key="panel.id" :label="panel.appName" :name="panel.code">
        <div v-loading="loading" :delay="0">
          <ElCheckboxGroup v-model="checkedFunctionList" class="mt-4 block" @change="handleGroupChange">
            <table class="authorize-table">
              <thead>
                <tr>
                  <th>功能</th>
                  <th>操作权限</th>
                  <th>数据权限</th>
                </tr>
              </thead>

              <tbody>
                <template v-for="item in functionData" :key="item.id">
                  <tr v-if="item.menuType !== 'M' && Number(item.visibleMenu) === 1">
                    <td class="middle">
                      <div>
                        <ElCheckbox size="large" :value="item.id" :label="item.menuName" />
                      </div>
                    </td>
                    <td>
                      <div class="flex flex-wrap items-center gap-x-16px gap-y-4px">
                        <div v-if="item.children !== null && item.children.length > 0">
                          <ElCheckbox size="large" label="全选" :value="`${item.id}all`" />
                        </div>
                        <template v-for="it3 in item.children">
                          <div v-if="!it3.menuName.includes('详情')" :key="it3.id">
                            <ElCheckbox
                              size="large"
                              :value="it3.id"
                              :label="it3.menuName.substring(it3.menuName.length - 2)"
                            />
                          </div>
                        </template>
                      </div>
                    </td>
                    <td class="middle">
                      <ElRadioGroup v-model="item.dataScope" @change="handleUpdateDataScope(item)">
                        <ElRadio v-for="data in dataScopesOption" :key="data.value" :value="data.value">
                          {{ data.label }}
                        </ElRadio>
                      </ElRadioGroup>
                    </td>
                  </tr>
                  <!-- 目录型菜单渲染其子功能行（沿用原 v-else+v-for 分支语义） -->
                  <!-- eslint-disable-next-line vue/no-use-v-else-with-v-for -->
                  <template v-for="it2 in item.children" v-else>
                    <tr v-if="Number(it2.visibleMenu) === 1" :key="it2.id">
                      <td class="middle">
                        <div>
                          <ElCheckbox size="large" :value="it2.id" :label="it2.menuName" />
                        </div>
                      </td>
                      <td>
                        <div class="flex flex-wrap items-center gap-x-16px gap-y-4px">
                          <div v-if="it2.children !== null && it2.children.length > 0">
                            <ElCheckbox size="large" label="全选" :value="`${it2.id}all`" />
                          </div>
                          <template v-for="it3 in it2.children">
                            <div v-if="!it3.menuName.includes('详情')" :key="it3.id">
                              <ElCheckbox
                                size="large"
                                :value="it3.id"
                                :label="it3.menuName.substring(it3.menuName.length - 2)"
                              />
                            </div>
                          </template>
                        </div>
                      </td>
                      <td class="middle">
                        <ElRadioGroup v-model="it2.dataScope" @change="handleUpdateDataScope(it2)">
                          <ElRadio v-for="data in dataScopesOption" :key="data.value" :value="data.value">
                            {{ data.label }}
                          </ElRadio>
                        </ElRadioGroup>
                      </td>
                    </tr>
                  </template>
                </template>
              </tbody>
            </table>
          </ElCheckboxGroup>
        </div>
      </ElTabPane>
    </ElTabs>

    <template #footer>
      <div class="footer">
        <ElButton style="margin-right: 10px" @click="modalVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="loading" @click="handleSaveFunction">保存</ElButton>
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
/* 原实现把 thead/tbody 塞进 ElTable（EP 不识别会被整块丢弃导致空白），这里用普通表格渲染 */
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
