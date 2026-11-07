<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import { delSystemFileConfig, saveSystemFileConfigDetail, updateSystemFileConfigDetail } from '@/service';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemFileConfigNamespace.SystemFileConfigForm | null;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'SystemFileConfigModal' });

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
    add: '添加文件配置',
    view: '文件配置信息',
    edit: '编辑文件配置'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

/**
 * 后端 SystemFileConfig 实体/DTO 的存储密钥字段是驼峰（accessId、accessKey），
 * `src/typings/system/system-file-config.d.ts` 里写成小写的 accessid/accesskey 是历史笔误。
 * 分片约定不改 typings，这里用本地交叉类型补上真实字段；小写键只为兼容既有 service 签名，值恒为空串。
 */
type FormModel = SystemFileConfigNamespace.SystemFileConfigForm & { accessId: string; accessKey: string };

const formModel = reactive<FormModel>(createDefaultFormModel());

/** 表单校验规则：审计类字段不在表单内，用 Partial 表达「只声明用到的键」 */
const rules: Partial<Record<keyof FormModel, FormItemRule | FormItemRule[]>> = {
  id: { required: false },

  departmentId: { required: false },

  organizationId: { required: false },

  title: { required: false },

  name: { required: false },

  type: { required: false },

  endpoint: { required: false },

  accessId: { required: false },

  accessKey: { required: false },

  bucket: { required: false },

  storePath: { required: false },

  netPath: { required: false }
};

function createDefaultFormModel(): FormModel {
  return {
    id: '',

    departmentId: '',

    organizationId: '',

    title: '',

    name: '',

    type: '',

    endpoint: '',

    // typings 笔误的小写字段：后端不消费，仅用于满足 SystemFileConfigForm 的必填约束
    accessid: '',

    accesskey: '',

    accessId: '',

    accessKey: '',

    bucket: '',

    storePath: '',

    netPath: ''
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
  formRef.value?.validate((valid: boolean, errors) => {
    if (valid) {
      if (formModel.id !== '') {
        updateSystemFileConfigDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
        });
      } else {
        saveSystemFileConfigDetail(formModel).then(res => {
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
  delSystemFileConfig([formModel.id]).then(res => {
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
        permission-edit="system:fileConfig:edit"
        :show-edit="true"
        permission-remove="system:fileConfig:remove"
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
        <ElFormItem label="部门ID" prop="departmentId">
          <ElInput v-model="formModel.departmentId" placeholder="请输入部门ID" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="所属组织" prop="organizationId">
          <ElInput v-model="formModel.organizationId" placeholder="请输入所属组织" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="备注" prop="remark">
          <ElInput v-model="formModel.remark" placeholder="请输入备注" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="标题" prop="title">
          <ElInput v-model="formModel.title" placeholder="请输入标题" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="formModel.name" placeholder="请输入名称" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="存储地址" prop="endpoint">
          <ElInput v-model="formModel.endpoint" placeholder="请输入存储地址" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="存储的ID" prop="accessId">
          <ElInput v-model="formModel.accessId" placeholder="请输入存储的ID" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="存储的KEY" prop="accessKey">
          <ElInput v-model="formModel.accessKey" placeholder="请输入存储的KEY" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="桶" prop="bucket">
          <ElInput v-model="formModel.bucket" placeholder="请输入桶" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="存储的目录" prop="storePath">
          <ElInput v-model="formModel.storePath" placeholder="请输入存储的目录" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="网络访问的地址" prop="netPath">
          <ElInput v-model="formModel.netPath" placeholder="请输入网络访问的地址" :disabled="formType === 'view'" />
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
