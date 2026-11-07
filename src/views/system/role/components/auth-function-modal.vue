<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';
import { ActionTagAdd } from '@/constants';
import { fetchUserDataScope, findSystemMenuByRole, findSystemMenuTree, saveSystemRoleMenuBatch } from '@/service';
import { useLoading } from '@/hooks';
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
const dataScopesOption = ref<Array<any>>([]);
const drawerWidth = ref('90%');
const checkedFunctionList = ref<string[]>([]);
const roleMenuList = ref<Array<any>>([]);
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

const functionData = ref<SystemMenuNamespace.SystemMenuForm[]>([]);

const allApp = ref(false);
/** 功能的单个选择，需要把这个“列表”和“详情”自动加进去 */
function handleUpdateChecked(val: string) {
  if (checkedFunctionList.value.includes(`${val}`)) {
    // 某功能全选了。
    const menu = functionList.value?.get(val);
    if (menu) {
      menu.children?.forEach(it => {
        if (
          !checkedFunctionList.value.includes(it.id) &&
          (it.menuName.indexOf('列表') > 0 || it.menuName.indexOf('详情') > 0)
        ) {
          checkedFunctionList.value.push(it.id);
        }
        it.checked = false;
      });
    }
  } else {
    const menu = functionList.value?.get(val);
    if (menu) {
      menu.children?.forEach(it => {
        if (
          checkedFunctionList.value.includes(it.id) &&
          (it.menuName.indexOf('列表') > 0 || it.menuName.indexOf('详情') > 0)
        ) {
          checkedFunctionList.value = checkedFunctionList.value.filter(item2 => item2 !== it.id);
        }
        it.checked = false;
      });
    }
  }
}

/** 全选 应用（模板 @click 触发，无需入参） */
function handleCheckedAllApp() {
  if (!allApp.value) {
    functionData.value.forEach(item => {
      checkedFunctionList.value = checkedFunctionList.value.filter(item2 => item2 !== item.id);
    });
  }
}

/**
 * 全选 功能
 *
 * @param val
 */
function handleCheckedAllFun(val: string) {
  if (checkedFunctionList.value.includes(`${val}all`)) {
    // 某功能全选了。
  } else {
    const menu = functionList.value?.get(val);
    if (menu) {
      menu.children?.forEach(it => {
        if (checkedFunctionList.value.includes(it.id)) {
          checkedFunctionList.value = checkedFunctionList.value.filter(item2 => item2 !== it.id);
        }
        it.checked = false;
      });
    }
  }
}

/**
 * 全选 权限
 *
 * @param val
 */
function handleCheckedAllPerm(val: string) {
  if (checkedFunctionList.value.includes(`${val}all`)) {
    // 某功能全选了。
  } else {
    const menu = functionList.value?.get(val);
    if (menu) {
      menu.children?.forEach(it => {
        if (checkedFunctionList.value.includes(it.id)) {
          checkedFunctionList.value = checkedFunctionList.value.filter(item2 => item2 !== it.id);
        }
        it.checked = false;
      });
    }
  }
}

/**
 * 全选后，某个功能取消了，需要把全选的ID去掉
 *
 * @param val
 */
function handleCheckedCancelPerm(val: string) {
  checkedFunctionList.value = checkedFunctionList.value.filter(item2 => item2 !== `${val}all`);
}

/**
 * 选择某功能后
 *
 * @param value
 */
function handleUpdateValue(value: string[]) {
  const children: string[] = [];
  // 处理应用的全选
  if (value.includes('allApp')) {
    allApp.value = true;
    // 选择的是应用的全选
    functionData.value.forEach(item2 => {
      children.push(item2.id);
    });
  } else {
    allApp.value = false;
  }

  if (value.length > checkedFunctionList.value.length) {
    // 增加了新的选择
    value.forEach(item => {
      if (item.indexOf('all') > 0) {
        // 说明是全选
        // 需要把此功能下的子功能全部选中
        const id = item.substring(0, item.length - 3);
        const menu = functionList.value?.get(id);
        if (menu) {
          menu.children?.forEach(it => {
            if (!value.includes(it.id)) {
              children.push(it.id);
            }
            it.checked = true;
          });
        }
      }
    });
    checkedFunctionList.value = value.concat(children);
  } else {
    // 减少了选择，看是否有全选的子集取消了。
    checkedFunctionList.value = value;
  }
}
/** 保存选择的功能 */
function handleSaveFunction() {
  // 本弹窗授权的是平台菜单（无应用上下文），应用维度按空串读写，与批量授权弹窗的入参口径一致
  const menuDTO: SystemRoleMenuNamespace.SystemRoleMenuForm = {
    roleId: props.editData?.id ? props.editData?.id : '',
    id: '',
    menuId: '',
    menuName: '',
    dataScope: 0,
    permission: '',
    appId: '',
    menuDTOList: []
  };
  const list: SystemRoleMenuNamespace.SystemRoleMenuScopeDTO[] = [];

  // 将选择的id转为对象，保存
  checkedFunctionList.value.forEach(item => {
    const menu = functionList.value?.get(item);

    if (menu !== null && menu !== undefined) {
      list.push({
        id: menu.id ? `${menu.id}` : '',
        menuId: menu.id ? `${menu.id}` : '',
        menuName: menu.menuName ? `${menu.menuName}` : '',
        dataScope: menu.dataScope || 20,
        permission: `${menu.permission}`,
        organizationId: '',
        appId: '',
        actionTag: ActionTagAdd
      });
    }
  });

  menuDTO.menuDTOList = list;
  saveSystemRoleMenuBatch(menuDTO).then(res => {
    if (res.error === null) {
      window.$message?.success('保存成功');
      closeModal();
    }
  });
}

/** 查询所有功能 */
function findAllMenu() {
  const query: SystemMenuNamespace.SystemMenuQuery = {
    pageSize: 900,
    pageNum: 1
  };
  findSystemMenuTree(query).then(res => {
    functionData.value = res.data || [];
    // 处理树型数据为列表
    functionData.value?.forEach(item => {
      functionList.value?.set(item.id, item);
      if (item.children !== undefined && item.children.length > 0) {
        getChildren(item);
      }
    });
  });
}

function getChildren(menu: SystemMenuNamespace.SystemMenuForm) {
  menu.children.forEach(item => {
    functionList.value?.set(item.id, item);
    if (item.children !== undefined && item.children.length > 0) {
      getChildren(item);
    }
    if (item.menuType === 'C') {
      const temp = roleMenuList.value.filter(item2 => item2.menuId === item.id);
      if (temp.length > 0) {
        item.dataScope = temp[0].dataScope;
      }
    }
  });
}
/**
 * 已经授权的功能
 *
 * @param roleId
 */
function findAuthMenu(roleId: string) {
  startLoading();

  // 平台功能授权不区分应用，应用维度传空串（与后端 /role/menu/list/{roleId}/{appId} 的等值过滤口径一致）
  findSystemMenuByRole(roleId, '').then(res => {
    const list: string[] = [];
    const { data } = res;
    if (data) {
      data.forEach(menu => list.push(menu.menuId));
      roleMenuList.value = data;
    }
    checkedFunctionList.value = list;
    findAllMenu();
    endLoading();
  });
}

function fullScreen(value: boolean) {
  window.console.log('--fullScreen---', value);
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
onMounted(() => {
  fetchUserDataScope().then(res => {
    if (res.data !== null) {
      dataScopesOption.value = res.data;
    }
  });
});
</script>

<template>
  <ElDrawer v-model="modalVisible" :size="drawerWidth" resizable title="角色功能列表" class="privernal-drawer">
    <template #header>
      <ElSpace :size="24" justify="space-between" align="center">
        <div>角色功能列表</div>
        <div class="privernal-header-left">
          <FormFullScreen @full-screen="fullScreen"></FormFullScreen>
        </div>
      </ElSpace>
    </template>
    <ElSpace justify="start" :loading="loading">
      <ElCheckboxGroup :value="checkedFunctionList" @update:value="handleUpdateValue">
        <ElTable :single-line="false">
          <thead>
            <tr>
              <th>
                <ElCheckbox size="large" label="全选" value="allApp" :checked="allApp" @click="handleCheckedAllApp" />
              </th>
              <th>功能</th>
              <th>表单权限</th>
              <th>数据权限</th>
            </tr>
          </thead>

          <tbody class="h-full">
            <template v-for="item in functionData" :key="item.id">
              <template v-for="(_, index) in item.children" :key="index">
                <tr v-if="index === 0">
                  <td class="middle" :rowspan="item.children.length + 1">
                    <ElCheckbox size="large" :value="item.id" :label="item.menuName" />
                  </td>
                  <td class="middle bg-col-all">
                    <div>
                      <ElCheckbox
                        size="large"
                        label="全选"
                        :value="`${item.id}all`"
                        @click="handleCheckedAllFun(item.id)"
                      />
                    </div>
                  </td>
                  <td class="middle"></td>
                </tr>
              </template>

              <tr v-for="it2 in item.children" :key="it2.id">
                <!--                  <td v-if="index === 0" class="middle" :rowspan="item.children.length">-->
                <!--                    <el-checkbox-->
                <!--                      size="large"-->
                <!--                      :value="item.id"-->
                <!--                      :label="item.menuName"-->
                <!--                      @update:checked="handleUpdateChecked"-->
                <!--                    />-->
                <!--                  </td>-->
                <td class="middle">
                  <div>
                    <ElCheckbox
                      size="large"
                      :value="it2.id"
                      :label="it2.menuName"
                      @click="handleUpdateChecked(it2.id)"
                    />
                  </div>
                </td>
                <td>
                  <ElSpace item-style="display: flex;" size="large">
                    <div v-if="it2.children !== null && it2.children.length > 0">
                      <ElCheckbox
                        size="large"
                        label="全选"
                        :value="`${it2.id}all`"
                        @click="handleCheckedAllPerm(it2.id)"
                      />
                    </div>
                    <template v-for="it3 in it2.children">
                      <div v-if="!it3.menuName.includes('列表') && !it3.menuName.includes('详情')" :key="it3.id">
                        <ElCheckbox
                          size="large"
                          :value="it3.id"
                          :label="it3.menuName.substring(it3.menuName.length - 2)"
                          @click="handleCheckedCancelPerm(it2.id)"
                        />
                      </div>
                    </template>
                  </ElSpace>
                </td>
                <td class="middle">
                  <ElRadioGroup v-model="it2.dataScope" name="scopeGroup">
                    <ElSpace size="large">
                      <ElRadio v-for="data in dataScopesOption" :key="data.value" :value="data.value">
                        {{ data.label }}
                      </ElRadio>
                    </ElSpace>
                  </ElRadioGroup>
                </td>
              </tr>
            </template>
          </tbody>
        </ElTable>
      </ElCheckboxGroup>
    </ElSpace>
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
.privernal-header-left {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: end;
  align-items: center;
}
:deep(.n-drawer-header__main) {
  width: 100%;
}
</style>
