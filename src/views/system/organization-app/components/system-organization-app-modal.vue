<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import {
  delSystemOrganizationApp,
  findSystemOrganizationAppDetail,
  saveSystemOrganizationAppDetail,
  updateSystemOrganizationAppDetail
} from '@/service';
import { useBodyLoading } from '@/hooks';
import { createRequiredFormRule, createRequiredMinMaxRule } from '@/utils';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemOrganizationAppNamespace.SystemOrganizationAppForm | null;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'SystemOrganizationAppModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null,
  parentId: undefined
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'closed', data: any): void;
}

const { startBodyLoading, endBodyLoading } = useBodyLoading();
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
    add: '添加组织授权的应用',
    view: '组织授权的应用信息',
    edit: '编辑组织授权的应用'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = SystemOrganizationAppNamespace.SystemOrganizationAppForm;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = reactive({
  id: { required: false },

  appId: createRequiredMinMaxRule(1, 36),

  status: { required: false },

  organizationId: createRequiredMinMaxRule(1, 36),

  actionTag: { required: false },

  tenantId: createRequiredMinMaxRule(1, 36),

  revision: createRequiredFormRule('请填写乐观锁'),

  createdBy: createRequiredMinMaxRule(1, 36),

  createdTime: createRequiredFormRule('请填写创建时间'),

  updatedBy: { required: false },

  updatedTime: { required: false },

  deletedTime: { required: false },

  deletedBy: { required: false },

  deletedFlag: createRequiredMinMaxRule(1, 1),

  remark: { required: false }
});

function createDefaultFormModel(): FormModel {
  return {
    id: '',

    appId: '',

    status: 1,

    organizationId: '',

    actionTag: ''
  };
}

// 如果存在图片上传，需要使用下面代码上传及查询
// const fileList = ref([]);
// //上传
// uploadSystemFile(fileList.value, 'GLOBAL', formModel.id, 'LOGO', 'IMAGE');
// //查询
// findSystemFileInfoArray('GLOBAL', formModel.id, 'LOGO').then(res => {
//   fileList.value = res;
// });

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
        findDetail(props.editData?.id);
      }
    },
    view: () => {
      if (props.editData) {
        findDetail(props.editData?.id);
      }
    }
  };

  handlers[props.type]();
}

async function handleSubmit() {
  startBodyLoading();
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (formModel.id !== '') {
        updateSystemOrganizationAppDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
          endBodyLoading();
        });
      } else {
        saveSystemOrganizationAppDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
          endBodyLoading();
        });
      }
    } else {
      endBodyLoading();
      window.$message?.error('验证失败');
    }
  });
}
/** 删除当前显示的数据 */
function deleteRow() {
  delSystemOrganizationApp([formModel.id]).then(res => {
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

function findDetail(id: string) {
  findSystemOrganizationAppDetail(id).then(res => {
    if (res.error === null) {
      handleUpdateFormModel(res.data);
    }
  });
}

watch(
  () => props.visible,
  async newValue => {
    if (newValue) {
      formType.value = props.type;

      handleUpdateFormModelByModalType();
    }
  }
);
</script>

<template>
  <div>
    <ElDrawer v-model="modalVisible" :size="drawerWidth" :title="title" resizable class="privernal-drawer">
      <template #header>
        <FormOperation
          :title="title"
          permission-edit="system:organizationApp:edit"
          :show-edit="true"
          permission-remove="system:organizationApp:remove"
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
          <ElFormItem label="应用的ID" prop="appId">
            <ElInput v-model="formModel.appId" placeholder="请输入应用的ID" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="组织ID" prop="organizationId">
            <ElInput v-model="formModel.organizationId" placeholder="请输入组织ID" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="备注" prop="remark">
            <ElInput v-model="formModel.remark" placeholder="请输入备注" :disabled="formType === 'view'" />
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
  </div>
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
