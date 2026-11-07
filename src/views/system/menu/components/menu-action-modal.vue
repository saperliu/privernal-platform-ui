<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import {
  componentTypeOptions as __forwarded_componentTypeOptions,
  menuTypeOptions as __forwarded_menuTypeOptions
} from '@/constants';
import { delSystemMenu, findSystemMenuTree, saveSystemMenuDetail, updateSystemMenuDetail } from '@/service';
import { createRequiredFormRule } from '@/utils';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemMenuNamespace.SystemMenuForm | null;

  showOperation?: boolean;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'closed', data: boolean): void;
}
const drawerWidth = ref('90%');
const formType = ref<ModalType>('add');
const menuTree = ref();
const emit = defineEmits<Emits>();
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

const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: '添加菜单',
    edit: '编辑菜单',
    view: '菜单信息'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = SystemMenuNamespace.SystemMenuForm;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  component: { required: false },
  icon: { required: false },
  isCache: { required: false },
  isFrame: { required: false },
  parentId: createRequiredFormRule('请选择父级菜单'),
  menuCode: createRequiredFormRule('请输入编码'),
  menuName: createRequiredFormRule('请输入名称'),
  menuType: { required: false },
  orderNum: { required: false },
  params: { required: false },
  path: { required: false },
  permission: { required: false },
  visible: { required: false },
  appMenu: { required: false },
  id: { required: false },
  status: { required: false },
  organizationId: { required: false },
  remark: { required: false },
  tenantId: { required: false },
  revision: { required: false },
  createdTime: { required: false },
  createdBy: { required: false },
  updatedTime: { required: false },
  updatedBy: { required: false },
  deletedTime: { required: false },
  deletedBy: { required: false },
  deletedFlag: { required: false },
  mustMenu: { required: false },
  children: { required: false },
  checked: { required: false },
  dataScope: { required: false },
  appId: { required: false }
};

function createDefaultFormModel(): FormModel {
  return {
    children: [],
    dataScope: 0,
    component: 'basic',
    icon: '',
    isCache: 0,
    isFrame: 0,
    appMenu: 0,
    menuCode: '',
    menuName: '',
    menuType: 'C',
    mustMenu: 0,
    orderNum: 0,
    params: '',
    parentId: '0',
    path: '',
    permission: '',
    visible: 1,
    id: '',
    organizationId: '',
    status: 1
  };
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  // 后端把 Long 序列化为字符串（防雪花 ID 精度丢失），数值字段装载时归一化，保证开关和数字输入框状态正确
  const normalized: Partial<FormModel> = { ...model };
  (['status', 'isFrame', 'isCache', 'visible', 'mustMenu', 'appMenu', 'orderNum', 'dataScope'] as const).forEach(
    field => {
      const value = normalized[field];
      if (value !== null && value !== undefined) {
        (normalized as Record<string, unknown>)[field] = Number(value);
      }
    }
  );
  Object.assign(formModel, normalized);
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<ModalType, () => void> = {
    add: () => {
      const defaultFormModel = createDefaultFormModel();
      handleUpdateFormModel(defaultFormModel);
    },
    edit: () => {
      if (props.editData) {
        handleUpdateFormModel(props.editData);
      }
    },
    view: () => {
      if (props.editData) {
        handleUpdateFormModel(props.editData);
      }
    }
  };

  handlers[props.type]();
}

async function handleSubmit() {
  formRef.value?.validate((valid: boolean, errors?: unknown) => {
    if (valid) {
      if (formModel.id !== '') {
        updateSystemMenuDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
        });
      } else {
        saveSystemMenuDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
        });
      }
    } else {
      window.console.log(errors);
      window.$message?.error('验证失败');
    }
  });
}

type FormFilterModel = SystemMenuNamespace.SystemMenuQuery;
const formFilter = reactive<FormFilterModel>({ pageNum: 1, pageSize: 10 });
async function findMenuTree() {
  const { data } = await findSystemMenuTree(formFilter);
  menuTree.value = data;
  menuTree.value.push({ id: '0', menuName: '顶级菜单' });
}
/** 删除当前显示的数据 */
function deleteRow() {
  delSystemMenu([formModel.id]).then(res => {
    if (res.error === null) {
      window.$message?.success('删除成功');
      emit('update:visible', false);
      emit('closed', true);
    }
  });
}

/** 改为编辑状态 */
function editRow() {
  formType.value = 'edit';
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
      formType.value = props.type;
      findMenuTree();
      handleUpdateFormModelByModalType();
    }
  }
);

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const componentTypeOptions = __forwarded_componentTypeOptions;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const menuTypeOptions = __forwarded_menuTypeOptions;
</script>

<template>
  <ElDrawer v-model="modalVisible" :size="drawerWidth" :title="title" resizable class="privernal-drawer">
    <template #header>
      <FormOperation
        :title="title"
        permission-edit="system:menu:edit"
        :show-edit="true"
        permission-remove="system:menu:remove"
        :show-remove="true"
        :type="formType"
        :workflow-control="false"
        :show-screen="true"
        @full-screen="fullScreen"
        @edit="editRow"
        @delete="deleteRow"
      ></FormOperation>
    </template>
    <ElForm ref="formRef" label-position="left" :label-width="120" :model="formModel" :rules="rules">
      <div class="grid grid-cols-24 gap-18px">
        <ElFormItem label="父级菜单" prop="parentId">
          <!--            <el-input v-model="formModel.parentId" placeholder="请输入父级菜单" :disabled="formType === 'view'" />-->
          <ElTreeSelect
            v-model="formModel.parentId"
            :data="menuTree"
            :props="{ label: 'menuName', children: 'children' }"
            node-key="id"
            value-key="id"
            check-strictly
            :render-after-expand="false"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="菜单名称" prop="menuName">
          <ElInput v-model="formModel.menuName" placeholder="请输入菜单名称" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="菜单编码" prop="menuCode">
          <ElInput v-model="formModel.menuCode" placeholder="请输入菜单编码" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="类型" prop="menuType">
          <ElSelect v-model="formModel.menuType" :disabled="formType === 'view'">
            <ElOption v-for="opt in menuTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="组件类型" prop="component">
          <ElSelect v-model="formModel.component" :disabled="formType === 'view'">
            <ElOption v-for="opt in componentTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="路由地址" prop="path">
          <ElInput v-model="formModel.path" placeholder="请输入路由地址" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="路由参数" prop="params">
          <ElInput v-model="formModel.params" placeholder="请输入路由参数" :disabled="formType === 'view'" />
        </ElFormItem>

        <ElFormItem label="状态" prop="status">
          <PrivernalSwitch
            v-model:value="formModel.status"
            :checked-value="1"
            :unchecked-value="3"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="是否为外链" prop="isFrame">
          <PrivernalSwitch
            v-model:value="formModel.isFrame"
            :checked-value="1"
            :unchecked-value="0"
            switch-type="YES|NO"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="菜单是否显示" prop="visible">
          <PrivernalSwitch
            v-model:value="formModel.visible"
            :checked-value="1"
            :unchecked-value="0"
            switch-type="YES|NO"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="是否缓存" prop="isCache">
          <PrivernalSwitch
            v-model:value="formModel.isCache"
            :checked-value="1"
            :unchecked-value="0"
            switch-type="YES|NO"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="APP是否显示" prop="appMenu">
          <PrivernalSwitch
            v-model:value="formModel.appMenu"
            :checked-value="1"
            :unchecked-value="0"
            switch-type="YES|NO"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="显示顺序" prop="orderNum">
          <ElInputNumber v-model="formModel.orderNum" placeholder="请输入显示顺序" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="权限标识" prop="permission">
          <ElInput v-model="formModel.permission" placeholder="请输入权限标识" :disabled="formType === 'view'" />
        </ElFormItem>

        <ElFormItem label="菜单图标" prop="icon">
          <ElInput v-model="formModel.icon" placeholder="请输入菜单图标" :disabled="formType === 'view'" />
        </ElFormItem>

        <ElFormItem label="备注" prop="remark">
          <ElInput
            v-model="formModel.remark"
            type="textarea"
            placeholder="请输入备注"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
      </div>
    </ElForm>
    <template #footer>
      <ElSpace v-if="formType !== 'view'" class="w-full pt-16px" :size="24" justify="end">
        <ElButton class="w-72px" @click="closeModal">取消</ElButton>
        <ElButton class="w-72px" type="primary" @click="handleSubmit">确定</ElButton>
      </ElSpace>
    </template>
  </ElDrawer>
</template>

<style lang="scss" scoped>
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
