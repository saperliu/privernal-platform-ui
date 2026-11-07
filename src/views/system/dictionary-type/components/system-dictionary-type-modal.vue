<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule, FormValidateCallback } from 'element-plus';
import { delSystemDictionaryType, saveSystemDictionaryTypeDetail, updateSystemDictionaryTypeDetail } from '@/service';
import { createMaxLengthRule, createRequiredMinMaxRule } from '@/utils';
import SystemDictionaryDataList from '@/views/system/dictionary-data/components/system-dictionary-data-list.vue';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemDictionaryTypeNamespace.SystemDictionaryTypeForm | null;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'SystemDictionaryTypeModal' });

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
    add: '添加字典类型',
    view: '字典类型信息',
    edit: '编辑字典类型'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = SystemDictionaryTypeNamespace.SystemDictionaryTypeForm;

const formModel = reactive<FormModel>(createDefaultFormModel());
const showOperation = ref<boolean>(false);
const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  id: { required: false },
  dictName: createRequiredMinMaxRule(2, 100),
  dictType: createRequiredMinMaxRule(2, 100),
  status: { required: false },
  remark: createMaxLengthRule(255),
  organizationId: { required: false },
  departmentId: { required: false },
  tenantId: { required: false },
  revision: { required: false },
  createdBy: { required: false },
  createdTime: { required: false },
  updatedBy: { required: false },
  updatedTime: { required: false },
  deletedBy: { required: false },
  deletedTime: { required: false },
  deletedFlag: { required: false }
};

function createDefaultFormModel(): FormModel {
  return {
    id: '',

    dictName: '',

    dictType: '',

    status: 1,

    remark: '',

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
      showOperation.value = true;
      handleUpdateFormModel(defaultFormModel);
    },
    edit: () => {
      if (props.editData) {
        showOperation.value = true;
        handleUpdateFormModel(props.editData);
      }
    },
    view: () => {
      showOperation.value = false;
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
        updateSystemDictionaryTypeDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
        });
      } else {
        saveSystemDictionaryTypeDetail(formModel).then(res => {
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
  };
  formRef.value?.validate(onValidate);
}
/** 删除当前显示的数据 */
function deleteRow() {
  delSystemDictionaryType([formModel.id]).then(res => {
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
  showOperation.value = true;
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
        permission-edit="system:dictionaryType:edit"
        :show-edit="true"
        permission-remove="system:dictionaryType:remove"
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
        <ElFormItem label="名称" prop="dictName">
          <ElInput v-model="formModel.dictName" placeholder="请输入名称" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="类型编码" prop="dictType">
          <ElInput v-model="formModel.dictType" placeholder="请输入编码" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <PrivernalSwitch v-model:value="formModel.status" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="备注" prop="remark">
          <ElInput v-model="formModel.remark" placeholder="请输入备注" :disabled="formType === 'view'" />
        </ElFormItem>
      </div>
    </ElForm>
    <SystemDictionaryDataList
      :parent-id="formModel.dictType"
      :show-operation="showOperation"
      :ref-com="true"
    ></SystemDictionaryDataList>
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
