<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import { delSystemFileInfo, saveSystemFileInfoDetail, updateSystemFileInfoDetail } from '@/service';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemFileInfoNamespace.SystemFileInfoForm | null;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'SystemFileInfoModal' });

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
    add: '添加文件信息',
    view: '文件信息信息',
    edit: '编辑文件信息'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = SystemFileInfoNamespace.SystemFileInfoForm;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  id: { required: false },

  departmentId: { required: false },

  organizationId: { required: false },

  sourceId: { required: false },

  sourceStage: { required: false },

  module: { required: false },

  type: { required: false },

  newName: { required: false },

  originalName: { required: false },

  imageUrl: { required: false },

  imagePath: { required: false },

  fileSize: { required: false },

  fileStoreType: { required: false },

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

    departmentId: '',

    organizationId: '',

    sourceId: '',

    sourceStage: '',

    module: '',

    type: '',

    newName: '',

    originalName: '',

    imageUrl: '',

    imagePath: '',

    fileSize: 0,

    fileStoreType: ''
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
        updateSystemFileInfoDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
        });
      } else {
        saveSystemFileInfoDetail(formModel).then(res => {
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
  delSystemFileInfo([formModel.id]).then(res => {
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
        permission-edit="system:fileInfo:edit"
        :show-edit="true"
        permission-remove="system:fileInfo:remove"
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
        <ElFormItem label="工单ID" prop="sourceId">
          <ElInput v-model="formModel.sourceId" placeholder="请输入工单ID" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="工单内不同阶段的图片，如申请、审批、验收" prop="sourceStage">
          <ElInput
            v-model="formModel.sourceStage"
            placeholder="请输入工单内不同阶段的图片，如申请、审批、验收"
            :disabled="formType === 'view'"
          />
        </ElFormItem>
        <ElFormItem label="文件所属模块" prop="module">
          <ElInput v-model="formModel.module" placeholder="请输入文件所属模块" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="新名称" prop="newName">
          <ElInput v-model="formModel.newName" placeholder="请输入新名称" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="原名称" prop="originalName">
          <ElInput v-model="formModel.originalName" placeholder="请输入原名称" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="图片访问地址" prop="imageUrl">
          <ElInput v-model="formModel.imageUrl" placeholder="请输入图片访问地址" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="图片存储地址" prop="imagePath">
          <ElInput v-model="formModel.imagePath" placeholder="请输入图片存储地址" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="文件大小(字节数)" prop="fileSize">
          <ElInput v-model="formModel.fileSize" placeholder="请输入文件大小(字节数)" :disabled="formType === 'view'" />
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
