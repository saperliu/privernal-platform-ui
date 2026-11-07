<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import {
  delSystemSocialAppConfig,
  saveSystemSocialAppConfigDetail,
  updateSystemSocialAppConfigDetail
} from '@/service';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemSocialAppConfigNamespace.SystemSocialAppConfigForm | null;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'SystemSocialAppConfigModal' });

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
    add: '添加第三方应用配置(小程序)',
    view: '第三方应用配置(小程序)信息',
    edit: '编辑第三方应用配置(小程序)'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

/** 表单中可编辑但实体声明里缺失的第三方应用字段 */
interface FormModelExtension {
  /** 来源 */
  source: string;
  /** 创建应用的 agentId */
  agentId: string;
  /** 创建应用的企业 ID */
  corpId: string;
  /** 创建应用的 scheme */
  scheme: string;
}

type FormModel = SystemSocialAppConfigNamespace.SystemSocialAppConfigForm & FormModelExtension;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: FormRules<FormModel> = {
  id: { required: false },

  appId: { required: false },

  secret: { required: false },

  appCode: { required: false },

  appName: { required: false },

  appUrl: { required: false },

  examineUser: { required: false },

  organizationId: { required: false },

  departmentId: { required: false },

  roleId: { required: false },

  deptId: { required: false },

  source: { required: false },

  agentId: { required: false },

  corpId: { required: false },

  scheme: { required: false }
};

function createDefaultFormModel(): FormModel {
  return {
    id: '',

    appId: '',

    secret: '',

    appCode: '',

    appName: '',

    appUrl: '',

    examineUser: '',

    organizationId: '',

    departmentId: '',

    roleId: '',

    deptId: '',

    source: '',

    agentId: '',

    corpId: '',

    scheme: ''
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
  formRef.value?.validate((valid: boolean, errors?: Record<string, unknown>) => {
    if (valid) {
      if (formModel.id !== '') {
        updateSystemSocialAppConfigDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
          }
        });
      } else {
        saveSystemSocialAppConfigDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
          }
        });
      }
      closeModal();
    } else {
      window.console.log(errors);
      window.$message?.error('验证失败');
    }
  });
}
/** 删除当前显示的数据 */
function deleteRow() {
  delSystemSocialAppConfig([formModel.id]).then(res => {
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
        permission-edit="system:appConfig:edit"
        :show-edit="true"
        permission-remove="system:appConfig:remove"
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
        <ElFormItem label="appId" prop="appId">
          <ElInput v-model="formModel.appId" placeholder="请输入appId" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="密钥" prop="secret">
          <ElInput v-model="formModel.secret" placeholder="请输入密钥" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="应用的编码;区分哪个应用登录" prop="appCode">
          <ElInput
            v-model="formModel.appCode"
            placeholder="请输入应用的编码;区分哪个应用登录"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="应用的名称;解绑时区分解绑哪一个" prop="appName">
          <ElInput
            v-model="formModel.appName"
            placeholder="请输入应用的名称;解绑时区分解绑哪一个"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="应用的url" prop="appUrl">
          <ElInput v-model="formModel.appUrl" placeholder="请输入应用的url" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="是否需要审核用户" prop="examineUser">
          <ElInput
            v-model="formModel.examineUser"
            placeholder="请输入是否需要审核用户"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="" prop="remark">
          <ElInput v-model="formModel.remark" placeholder="请输入" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="所属组织" prop="organizationId">
          <ElInput v-model="formModel.organizationId" placeholder="请输入所属组织" :disabled="formType === 'view'" />
        </ElFormItem>
        <!--          <el-form-item-grid-item :span="12" label="部门" prop="departmentId">-->
        <!--            <el-input v-model="formModel.departmentId" placeholder="请输入部门" :disabled="formType === 'view'" />-->
        <!--          </el-form-item-grid-item>-->
        <ElFormItem label="角色" prop="roleId">
          <ElInput v-model="formModel.roleId" placeholder="请输入角色" :disabled="formType === 'view'" />
        </ElFormItem>
        <!--          <el-form-item-grid-item :span="12" label="部门" prop="deptId">-->
        <!--            <el-input v-model="formModel.deptId" placeholder="请输入部门" :disabled="formType === 'view'" />-->
        <!--          </el-form-item-grid-item>-->
        <ElFormItem label="来源" prop="source">
          <ElInput v-model="formModel.source" placeholder="请输入来源" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="创建应用的agentId" prop="agentId">
          <ElInput v-model="formModel.agentId" placeholder="请输入创建应用的agentId" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="创建应用的企业ID" prop="corpId">
          <ElInput v-model="formModel.corpId" placeholder="请输入创建应用的企业ID" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="创建应用的scheme" prop="scheme">
          <ElInput v-model="formModel.scheme" placeholder="请输入创建应用的scheme" :disabled="formType === 'view'" />
        </ElFormItem>
      </div>
    </ElForm>
    <template #footer>
      <ElSpace v-if="formType !== 'view'" class="w-full justify-end pt-16px" :size="24">
        <ElButton class="w-72px" @click="closeModal">取消</ElButton>
        <ElButton class="w-72px" type="primary" @click="handleSubmit">确定</ElButton>
      </ElSpace>
      <div></div>
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
