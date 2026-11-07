<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule, FormValidateCallback } from 'element-plus';
import { delSystemSocialUser, saveSystemSocialUserDetail, updateSystemSocialUserDetail } from '@/service';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemSocialUserNamespace.SystemSocialUserForm | null;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'SystemSocialUserModal' });

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
    add: '添加社交账号',
    view: '社交账号信息',
    edit: '编辑社交账号'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = SystemSocialUserNamespace.SystemSocialUserForm;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  id: { required: false },

  uuid: { required: false },

  source: { required: false },

  appCode: { required: false },

  accessToken: { required: false },

  expireIn: { required: false },

  refreshToken: { required: false },

  openId: { required: false },

  uid: { required: false },

  accessCode: { required: false },

  unionId: { required: false },

  scope: { required: false },

  tokenType: { required: false },

  idToken: { required: false },

  macAlgorithm: { required: false },

  macKey: { required: false },

  code: { required: false },

  oauthToken: { required: false },

  oauthTokenSecret: { required: false },

  organizationId: { required: false },

  departmentId: { required: false },

  remark: { required: false },

  tenantId: { required: false },

  revision: { required: false },

  createdTime: { required: false },

  createdBy: { required: false },

  updatedTime: { required: false },

  updatedBy: { required: false },

  deletedTime: { required: false },

  deletedBy: { required: false },

  deletedFlag: { required: false }
};

function createDefaultFormModel(): FormModel {
  return {
    id: '',

    uuid: '',

    source: '',

    appCode: '',

    accessToken: '',

    expireIn: 0,

    refreshToken: '',

    openId: '',

    uid: '',

    accessCode: '',

    unionId: '',

    scope: '',

    tokenType: '',

    idToken: '',

    macAlgorithm: '',

    macKey: '',

    code: '',

    oauthToken: '',

    oauthTokenSecret: '',

    organizationId: '',

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
  // 用 EP 的 FormValidateCallback 标注，第二个入参（校验失败字段）才有类型
  const onValidate: FormValidateCallback = (valid, errors) => {
    if (valid) {
      if (formModel.id !== '') {
        updateSystemSocialUserDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
          }
        });
      } else {
        saveSystemSocialUserDetail(formModel).then(res => {
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
  };
  formRef.value?.validate(onValidate);
}
/** 删除当前显示的数据 */
function deleteRow() {
  delSystemSocialUser([formModel.id]).then(res => {
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
        permission-edit="system:socialUser:edit"
        :show-edit="true"
        permission-remove="system:socialUser:remove"
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
        <ElFormItem label="第三方系统的唯一ID" prop="uuid">
          <ElInput v-model="formModel.uuid" placeholder="请输入第三方系统的唯一ID" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="第三方用户来源;GITHUB、GITEE、QQ" prop="source">
          <ElInput
            v-model="formModel.source"
            placeholder="请输入第三方用户来源;GITHUB、GITEE、QQ"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="应用的编码;区分哪个应用登录" prop="appCode">
          <ElInput
            v-model="formModel.appCode"
            placeholder="请输入应用的编码;区分哪个应用登录"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="用户的授权令牌" prop="accessToken">
          <ElInput v-model="formModel.accessToken" placeholder="请输入用户的授权令牌" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="第三方用户的授权令牌的有效期" prop="expireIn">
          <ElInput
            v-model="formModel.expireIn"
            placeholder="请输入第三方用户的授权令牌的有效期"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="刷新令牌" prop="refreshToken">
          <ElInput v-model="formModel.refreshToken" placeholder="请输入刷新令牌" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="第三方用户的;open;id" prop="openId">
          <ElInput
            v-model="formModel.openId"
            placeholder="请输入第三方用户的;open;id"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="第三方用户的;ID" prop="uid">
          <ElInput v-model="formModel.uid" placeholder="请输入第三方用户的;ID" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="个别平台的授权信息" prop="accessCode">
          <ElInput
            v-model="formModel.accessCode"
            placeholder="请输入个别平台的授权信息"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="第三方用户的;union;id" prop="unionId">
          <ElInput
            v-model="formModel.unionId"
            placeholder="请输入第三方用户的;union;id"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="第三方用户授予的权限" prop="scope">
          <ElInput v-model="formModel.scope" placeholder="请输入第三方用户授予的权限" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="id;token" prop="idToken">
          <ElInput v-model="formModel.idToken" placeholder="请输入id;token" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="小米平台用户的附带属性" prop="macAlgorithm">
          <ElInput
            v-model="formModel.macAlgorithm"
            placeholder="请输入小米平台用户的附带属性"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="小米平台用户的附带属性" prop="macKey">
          <ElInput
            v-model="formModel.macKey"
            placeholder="请输入小米平台用户的附带属性"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="用户的授权code" prop="code">
          <ElInput v-model="formModel.code" placeholder="请输入用户的授权code" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="Twitter平台用户的附带属性" prop="oauthToken">
          <ElInput
            v-model="formModel.oauthToken"
            placeholder="请输入Twitter平台用户的附带属性"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="Twitter平台用户的附带属性" prop="oauthTokenSecret">
          <ElInput
            v-model="formModel.oauthTokenSecret"
            placeholder="请输入Twitter平台用户的附带属性"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="" prop="remark">
          <ElInput v-model="formModel.remark" placeholder="请输入" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="所属组织" prop="organizationId">
          <ElInput v-model="formModel.organizationId" placeholder="请输入所属组织" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="所属部门" prop="departmentId">
          <ElInput v-model="formModel.departmentId" placeholder="请输入所属部门" :disabled="formType === 'view'" />
        </ElFormItem>
      </div>
    </ElForm>
    <template #footer>
      <ElSpace v-if="formType !== 'view'" class="w-full pt-16px" :size="24" justify="end">
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
