<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import {
  delDynamicForm,
  findDynamicFormDetail,
  findSystemAppListByOrg,
  saveDynamicFormDetail,
  updateDynamicFormDetail
} from '@/service';
import { useBodyLoading } from '@/hooks';
import { createRequiredFormRule, createRequiredMinMaxRule } from '@/utils';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: DynamicFormNamespace.DynamicFormForm | null;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'DynamicFormModal' });

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
    add: '添加表单配置',
    view: '表单配置信息',
    edit: '编辑表单配置'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = DynamicFormNamespace.DynamicFormDetail;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = reactive({
  id: { required: false },

  tenantId: { required: false },

  revision: { required: false },

  createdBy: { required: false },

  createdTime: { required: false },

  updatedBy: { required: false },

  updatedTime: { required: false },

  deletedFlag: { required: false },

  deletedBy: { required: false },

  deletedTime: { required: false },

  departmentId: { required: false },

  organizationId: { required: false },

  remark: { required: false },

  title: { required: false },

  status: { required: false },

  tableCode: createRequiredMinMaxRule(1, 100),

  tableName: createRequiredMinMaxRule(1, 100),

  metaData: { required: false },

  isWorkflow: { required: false },

  workflowCode: { required: false },

  appId: createRequiredFormRule('请选择所属应用')
});

function createDefaultFormModel(): FormModel {
  return {
    id: '',

    departmentId: '',

    organizationId: '',

    title: '',

    status: 0,

    tableCode: '',

    tableName: '',

    metaData: { selected: '' },

    isWorkflow: 0,

    workflowCode: '',

    appId: ''
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
        updateDynamicFormDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
          endBodyLoading();
        });
      } else {
        saveDynamicFormDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success(
              '保存成功，已自动生成应用菜单与权限标识。请到「列表设计」勾选要显示的列，否则列表页不显示任何列'
            );
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
  delDynamicForm([formModel.id]).then(res => {
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
  findDynamicFormDetail(id).then(res => {
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
      loadAppOptions();
    }
  }
);

const isWorkflowOptions = [
  { label: '否', value: 0 },
  { label: '是', value: 1 }
];

/** 组织内可选应用（保存后自动生成该应用的菜单与权限标识） */
const appOptions = ref<Array<{ label: string; value: string }>>([]);

async function loadAppOptions() {
  const { data, error } = await findSystemAppListByOrg();
  if (!error) {
    // 只放业务应用：系统应用（系统管理/平台管理）不是表单的归属载体，不进所属应用选项
    appOptions.value = (data || [])
      .filter(item => item.type !== 'SYSTEM')
      .map(item => ({
        label: item.appName,
        value: item.id
      }));
  }
}
</script>

<template>
  <div>
    <ElDrawer v-model="modalVisible" :size="drawerWidth" :title="title" resizable class="privernal-drawer">
      <template #header>
        <FormOperation
          :title="title"
          permission-edit="dynamic:form:edit"
          :show-edit="true"
          permission-remove="dynamic:form:remove"
          :show-remove="true"
          :type="formType"
          :workflow-control="false"
          :show-screen="true"
          @full-screen="fullScreen"
          @edit="editRow"
          @delete="deleteRow"
        ></FormOperation>
      </template>
      <ElForm ref="formRef" label-position="left" :label-width="120" :model="formModel" :rules="rules">
        <div class="grid grid-cols-24 gap-18px">
          <ElFormItem label="所属应用" prop="appId">
            <ElSelect
              v-model="formModel.appId"
              placeholder="请选择所属应用（保存后自动生成菜单）"
              filterable
              :disabled="formType !== 'add'"
            >
              <ElOption v-for="opt in appOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="表单名称" prop="tableName">
            <ElInput v-model="formModel.tableName" placeholder="请输入表单名称" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="表单编码" prop="tableCode">
            <ElInput
              v-model="formModel.tableCode"
              placeholder="请输入表单编码（保存时自动加上企业组织编码前缀）"
              :disabled="formType === 'view' || formType === 'edit'"
            />
          </ElFormItem>

          <!--
 所属部门/所属组织：服务端按会话自动注入，无需填写；
                 数据标题、关联流程定义：由表单设计器/流程设计页签维护，此处隐藏 
-->

          <ElFormItem label="启用工作流" prop="isWorkflow">
            <ElSelect v-model="formModel.isWorkflow" placeholder="是否启用工作流" :disabled="formType === 'view'">
              <ElOption v-for="opt in isWorkflowOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>
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
