<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import { delSystemRole, saveSystemRoleDetail, updateSystemRoleDetail } from '@/service';
import { createRequiredFormRule } from '@/utils';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemRoleNamespace.SystemRoleForm | null;
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
    add: '添加角色',
    edit: '编辑角色',
    view: '角色信息'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = SystemRoleNamespace.SystemRoleForm;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  id: { required: false },
  remark: { required: false },
  dataScope: { required: false },
  roleKey: { required: false },
  status: { required: false },
  orderNum: { required: false },
  roleName: createRequiredFormRule('请输入名称'),
  systemType: { required: false },
  organizationId: { required: false },
  classificationId: { required: false },
  departmentId: { required: false },
  tenantId: { required: false },
  revision: { required: false },
  createdTime: { required: false },
  createdBy: { required: false },
  updatedTime: { required: false },
  updatedBy: { required: false },
  deletedTime: { required: false },
  deletedBy: { required: false },
  deletedFlag: { required: false },
  deptName: { required: false }
};

function createDefaultFormModel(): FormModel {
  return {
    id: '',
    remark: '',
    dataScope: 20,
    roleKey: 'normal',
    status: 1,
    orderNum: 0,
    roleName: '',
    systemType: 'NORMAL',
    organizationId: '',
    classificationId: '',
    departmentId: ''
  };
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  Object.assign(formModel, model);
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
        updateSystemRoleDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
        });
      } else {
        saveSystemRoleDetail(formModel).then(res => {
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

/** 删除当前显示的数据 */
function deleteRow() {
  delSystemRole([formModel.id]).then(res => {
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
      handleUpdateFormModelByModalType();
    }
  }
);
</script>

<template>
  <ElDrawer v-model="modalVisible" :size="drawerWidth" :title="title" resizable class="privernal-drawer">
    <template #header>
      <FormOperation
        :title="title"
        permission-edit="system:role:edit"
        :show-edit="true"
        permission-remove="system:role:remove"
        :show-remove="true"
        :type="formType"
        :workflow-control="false"
        :show-screen="true"
        @full-screen="fullScreen"
        @edit="editRow"
        @delete="deleteRow"
      ></FormOperation>
    </template>
    <ElForm ref="formRef" label-position="left" :label-width="80" :model="formModel" :rules="rules">
      <div class="grid grid-cols-24 gap-18px">
        <ElFormItem label="角色名称" prop="roleName">
          <ElInput v-model="formModel.roleName" placeholder="请输入角色名称" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <PrivernalSwitch v-model:value="formModel.status" :disabled="formType === 'view'"></PrivernalSwitch>
        </ElFormItem>
        <ElFormItem label="部门" prop="departmentId">
          <SelectDepartment
            v-model:value="formModel.departmentId"
            title="选择部门"
            :multiple="false"
            :disabled="formType === 'view'"
          ></SelectDepartment>
        </ElFormItem>
        <ElFormItem label="排序值" prop="orderNum">
          <ElInputNumber v-model="formModel.orderNum" placeholder="请输入排序值" :disabled="formType === 'view'" />
        </ElFormItem>
        <!--        <el-form-item-grid-item :span="12" label="角色分类ID" prop="classificationId">-->
        <!--          <el-input v-model="formModel.classificationId" placeholder="请输入角色分类ID" />-->
        <!--        </el-form-item-grid-item>-->
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
