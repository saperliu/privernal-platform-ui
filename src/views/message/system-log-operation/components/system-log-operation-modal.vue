<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import {
  delSystemLogOperation,
  findSystemLogOperationDetail,
  saveSystemLogOperationDetail,
  updateSystemLogOperationDetail
} from '@/service';
import { useBodyLoading } from '@/hooks';
import { createRequiredFormRule, createRequiredMinMaxRule } from '@/utils';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemLogOperationNamespace.SystemLogOperationForm | null;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'SystemLogOperationModal' });

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
    add: '添加系统操作日志',
    view: '系统操作日志信息',
    edit: '编辑系统操作日志'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = SystemLogOperationNamespace.SystemLogOperationDetail;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = reactive({
  tenantId: createRequiredMinMaxRule(1, 36),

  revision: createRequiredFormRule('请填写乐观锁'),

  createdBy: createRequiredMinMaxRule(1, 36),

  createdTime: createRequiredFormRule('请填写创建时间;操作时间'),

  updatedBy: { required: false },

  updatedTime: { required: false },

  deletedBy: { required: false },

  deletedTime: { required: false },

  deletedFlag: createRequiredMinMaxRule(1, 1),

  id: { required: false },

  remark: { required: false },

  name: createRequiredMinMaxRule(1, 100),

  operationType: createRequiredMinMaxRule(1, 10),

  method: { required: false },

  requestMethod: { required: false },

  businessType: { required: false },

  operationUrl: { required: false },

  operationIp: { required: false },

  operationLocation: { required: false },

  operationParam: { required: false },

  operationResult: { required: false },

  status: createRequiredFormRule('请填写操作状态;操作状态'),

  operationPerson: { required: false },

  message: { required: false },

  organizationId: { required: false },

  departmentId: { required: false }
});

function createDefaultFormModel(): FormModel {
  return {
    id: '',

    name: '',

    operationType: '',

    method: '',

    requestMethod: '',

    businessType: '',

    operationUrl: '',

    operationIp: '',

    operationLocation: '',

    operationParam: '',

    operationResult: '',

    status: 1,

    operationPerson: '',

    message: '',

    organizationId: '',

    departmentId: ''
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
        updateSystemLogOperationDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
          endBodyLoading();
        });
      } else {
        saveSystemLogOperationDetail(formModel).then(res => {
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
  delSystemLogOperation([formModel.id]).then(res => {
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
  findSystemLogOperationDetail(id).then(res => {
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
          permission-edit="message:systemLogOperation:edit"
          :show-edit="true"
          permission-remove="message:systemLogOperation:remove"
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
          <ElFormItem label="备注" prop="remark">
            <ElInput v-model="formModel.remark" placeholder="请输入备注" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="模块名称" prop="name">
            <ElInput v-model="formModel.name" placeholder="请输入模块名称" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="方法名称" prop="method">
            <ElInput v-model="formModel.method" placeholder="请输入方法名称" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="请求方式" prop="requestMethod">
            <ElInput v-model="formModel.requestMethod" placeholder="请输入请求方式" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="请求URL" prop="operationUrl">
            <ElInput v-model="formModel.operationUrl" placeholder="请输入请求URL" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="主机地址" prop="operationIp">
            <ElInput v-model="formModel.operationIp" placeholder="请输入主机地址" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="操作地点" prop="operationLocation">
            <ElInput
              v-model="formModel.operationLocation"
              placeholder="请输入操作地点"
              :disabled="formType === 'view'"
            />
          </ElFormItem>
          <ElFormItem label="请求参数" prop="operationParam">
            <ElInput
              v-model="formModel.operationParam"
              type="textarea"
              placeholder="请输入请求参数"
              :disabled="formType === 'view'"
            />
          </ElFormItem>

          <ElFormItem label="返回参数" prop="operationResult">
            <ElInput
              v-model="formModel.operationResult"
              type="textarea"
              placeholder="请输入返回参数"
              :disabled="formType === 'view'"
            />
          </ElFormItem>

          <ElFormItem label="操作人员;操作人名称" prop="operationPerson">
            <ElInput
              v-model="formModel.operationPerson"
              placeholder="请输入操作人员;操作人名称"
              :disabled="formType === 'view'"
            />
          </ElFormItem>
          <ElFormItem label="操作消息" prop="message">
            <ElInput v-model="formModel.message" placeholder="请输入操作消息" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="组织ID" prop="organizationId">
            <ElInput v-model="formModel.organizationId" placeholder="请输入组织ID" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="部门" prop="departmentId">
            <ElInput v-model="formModel.departmentId" placeholder="请输入部门" :disabled="formType === 'view'" />
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
