<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import {
  delDynamicDatabase,
  findDynamicDatabaseDetail,
  saveDynamicDatabaseDetail,
  updateDynamicDatabaseDetail
} from '@/service';
import { useBodyLoading } from '@/hooks';
import { createRequiredFormRule, createRequiredMinMaxRule } from '@/utils';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: DynamicDatabaseNamespace.DynamicDatabaseForm | null;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'DynamicDatabaseModal' });

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
    add: '添加动态数据库',
    view: '动态数据库信息',
    edit: '编辑动态数据库'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = DynamicDatabaseNamespace.DynamicDatabaseDetail;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = reactive({
  id: { required: false },

  tenantId: createRequiredMinMaxRule(1, 255),

  revision: createRequiredFormRule('请填写乐观锁'),

  createdBy: createRequiredMinMaxRule(1, 36),

  createdTime: createRequiredFormRule('请填写创建时间'),

  updatedBy: { required: false },

  updatedTime: { required: false },

  deletedFlag: createRequiredMinMaxRule(1, 1),

  deletedBy: { required: false },

  deletedTime: { required: false },

  departmentId: createRequiredMinMaxRule(1, 36),

  organizationId: createRequiredMinMaxRule(1, 36),

  remark: { required: false },

  title: { required: false },

  status: { required: false },

  databaseName: { required: false },

  databaseType: { required: false },

  driver: { required: false },

  password: { required: false },

  url: { required: false },

  userName: { required: false }
});

function createDefaultFormModel(): FormModel {
  return {
    id: '',

    departmentId: '',

    organizationId: '',

    title: '',

    status: 0,

    databaseName: '',

    databaseType: '',

    driver: '',

    password: '',

    url: '',

    userName: ''
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
        updateDynamicDatabaseDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
          endBodyLoading();
        });
      } else {
        saveDynamicDatabaseDetail(formModel).then(res => {
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
  delDynamicDatabase([formModel.id]).then(res => {
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
  findDynamicDatabaseDetail(id).then(res => {
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
          permission-edit="dynamic:database:edit"
          :show-edit="true"
          permission-remove="dynamic:database:remove"
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
          <ElFormItem label="所属部门" prop="departmentId">
            <ElInput v-model="formModel.departmentId" placeholder="请输入所属部门" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="所属组织" prop="organizationId">
            <ElInput v-model="formModel.organizationId" placeholder="请输入所属组织" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="备注" prop="remark">
            <ElInput
              v-model="formModel.remark"
              type="textarea"
              placeholder="请输入备注"
              :disabled="formType === 'view'"
            />
          </ElFormItem>

          <ElFormItem label="数据标题" prop="title">
            <ElInput v-model="formModel.title" placeholder="请输入数据标题" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="数据库名称" prop="databaseName">
            <ElInput v-model="formModel.databaseName" placeholder="请输入数据库名称" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="数据库使用的驱动" prop="driver">
            <ElInput v-model="formModel.driver" placeholder="请输入数据库使用的驱动" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="数据库的密码" prop="password">
            <ElInput v-model="formModel.password" placeholder="请输入数据库的密码" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="使用的URL连接" prop="url">
            <ElInput v-model="formModel.url" placeholder="请输入使用的URL连接" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="数据库的用户名" prop="userName">
            <ElInput v-model="formModel.userName" placeholder="请输入数据库的用户名" :disabled="formType === 'view'" />
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
