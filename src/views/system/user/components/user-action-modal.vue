<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import {
  genderOptions as __forwarded_genderOptions,
  userStatusOptions as __forwarded_userStatusOptions
} from '@/constants';
import { delSystemUser, fetchUserDataScope, saveSystemUserDetail, updateSystemUserDetail } from '@/service';
import { createRequiredFormRule, createRequiredMinMaxRule, formRules } from '@/utils';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemUserNamespace.SystemUserForm | null;

  /** 部门列表 */
  deptOptions?: SystemDepartmentNamespace.SystemDepartmentForm | null;
  /** 选中的部门 */
  departmentId?: string;
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
    add: '添加用户',
    edit: '编辑用户',
    view: '用户信息'
  };
  return titles[props.type];
});

const scopeList = ref();
const formRef = ref<HTMLElement & FormInstance>();

type FormModel = SystemUserNamespace.SystemUserForm;

const formModel = reactive<FormModel>(createDefaultFormModel());
const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  dataScope: { required: false },
  id: { required: false },
  loginName: formRules.loginName,
  nickName: createRequiredMinMaxRule(2, 100),
  gender: createRequiredFormRule('请选择性别'),
  phone: formRules.phone,
  email: formRules.email,
  status: createRequiredFormRule('请选择用户状态'),
  userType: { required: false },
  avatar: { required: false },
  identityNum: { required: false },
  password: { required: false },
  organizationId: { required: false },
  departmentId: createRequiredFormRule('请选择所属部门')
};

function createDefaultFormModel(): FormModel {
  return {
    id: '',
    departmentId: props.departmentId,
    organizationId: '',
    userType: null,
    loginName: '',
    nickName: null,
    gender: '0',
    phone: '',
    email: null,
    password: null,
    status: 1,
    dataScope: 20
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
        updateSystemUserDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
        });
      } else {
        saveSystemUserDetail(formModel).then(res => {
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
  delSystemUser([formModel.id]).then(res => {
    if (res.error === null) {
      window.$message?.success('删除成功');
      emit('closed', true);
      emit('update:visible', false);
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

function handleGenderChange(value: string | number | boolean | undefined) {
  formModel.gender = String(value) as SystemUserNamespace.SystemUserForm['gender'];
}
watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      formType.value = props.type;
      handleUpdateFormModelByModalType();
      fetchUserDataScope().then(res => {
        if (res.data !== null) {
          scopeList.value = res.data;
        }
      });
    }
  }
);

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const genderOptions = __forwarded_genderOptions;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const userStatusOptions = __forwarded_userStatusOptions;
</script>

<template>
  <ElDrawer v-model="modalVisible" :size="drawerWidth" :title="title" resizable class="privernal-drawer">
    <template #header>
      <FormOperation
        :title="title"
        permission-edit="system:user:edit"
        :show-edit="true"
        permission-remove="system:user:remove"
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
        <ElFormItem label="登录名" prop="loginName">
          <ElInput v-model="formModel.loginName" :disabled="formType !== 'add'" />
        </ElFormItem>
        <ElFormItem label="姓名" prop="nickName">
          <ElInput v-model="formModel.nickName" clearable :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <ElSelect v-model="formModel.status" :disabled="formType === 'view'">
            <ElOption v-for="opt in userStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="性别" prop="gender">
          <ElRadioGroup :model-value="formModel.gender ?? undefined" @update:model-value="handleGenderChange">
            <ElRadio
              v-for="item in genderOptions"
              :key="item.value"
              :value="item.value"
              :disabled="formType === 'view'"
            >
              {{ item.label }}
            </ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="手机号" prop="phone">
          <ElInput v-model="formModel.phone" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="邮箱" prop="email">
          <ElInput v-model="formModel.email" :disabled="formType === 'view'" />
        </ElFormItem>

        <ElFormItem label="身份证号" prop="identityNum">
          <ElInput v-model="formModel.identityNum" :disabled="formType === 'view'" />
        </ElFormItem>
        <!--        <el-form-item-grid-item :span="12" label="密码" prop="password">-->
        <!--          <el-input v-model="formModel.password" />-->
        <!--        </el-form-item-grid-item>-->

        <!--          <el-form-item-grid-item :span="24">-->
        <!--            <el-divider>数据权限</el-divider>-->
        <!--          </el-form-item-grid-item>-->

        <ElFormItem label="部门" prop="departmentId">
          <SelectDepartment
            v-model:value="formModel.departmentId"
            title="选择部门"
            :multiple="false"
            :disabled="formType === 'view'"
          ></SelectDepartment>
        </ElFormItem>
        <!--          <el-form-item-grid-item :span="12" label="权限范围" prop="dataScope">-->
        <!--            <el-select v-model="formModel.dataScope" :options="scopeList" :disabled="formType === 'view'" />-->
        <!--          </el-form-item-grid-item>-->
        <ElFormItem label="  ">
          <ElAlert type="warning">用户默认密码为手机号后6位</ElAlert>
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
