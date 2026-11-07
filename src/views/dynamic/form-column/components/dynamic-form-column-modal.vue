<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import {
  delDynamicFormColumn,
  findDynamicFormColumnDetail,
  saveDynamicFormColumnDetail,
  updateDynamicFormColumnDetail
} from '@/service';
import { useBodyLoading } from '@/hooks';
import { createRequiredFormRule, createRequiredMinMaxRule } from '@/utils';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: DynamicFormColumnNamespace.DynamicFormColumnForm | null;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'DynamicFormColumnModal' });

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
    add: '添加form的列的数据',
    view: 'form的列的数据信息',
    edit: '编辑form的列的数据'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = DynamicFormColumnNamespace.DynamicFormColumnDetail;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Partial<Record<keyof FormModel, FormItemRule | FormItemRule[]>> = reactive({
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

  formId: { required: false },

  filedCode: { required: false },

  filedName: { required: false },

  filedType: { required: false },

  length: { required: false },

  scale: { required: false },

  sort: { required: false },

  defaultValue: { required: false },

  showList: { required: false },

  showQuery: { required: false }
});

function createDefaultFormModel(): FormModel {
  return {
    id: '',

    departmentId: '',

    organizationId: '',

    title: '',

    status: 0,

    formId: '',

    filedCode: '',

    filedName: '',

    filedType: '',

    length: 0,

    scale: 0,

    sort: 0,

    defaultValue: '',

    queryDefaultValue: '',

    orderDir: '',

    showList: 0,

    showQuery: 0,
    sensitive: 'N',
    uniqueFlag: 'N'
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
        updateDynamicFormColumnDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
          endBodyLoading();
        });
      } else {
        saveDynamicFormColumnDetail(formModel).then(res => {
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
  delDynamicFormColumn([formModel.id]).then(res => {
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
  findDynamicFormColumnDetail(id).then(res => {
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
          permission-edit="dynamic:formColumn:edit"
          :show-edit="true"
          permission-remove="dynamic:formColumn:remove"
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
          <ElFormItem label="表单ID" prop="formId">
            <ElInput v-model="formModel.formId" placeholder="请输入表单ID" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label=" 字段编码,数据库表的列表" prop="filedCode">
            <ElInput
              v-model="formModel.filedCode"
              placeholder="请输入 字段编码,数据库表的列表"
              :disabled="formType === 'view'"
            />
          </ElFormItem>
          <ElFormItem label="字段名称" prop="filedName">
            <ElInput v-model="formModel.filedName" placeholder="请输入字段名称" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="长度" prop="length">
            <ElInput v-model="formModel.length" placeholder="请输入长度" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="小数点位数" prop="scale">
            <ElInput v-model="formModel.scale" placeholder="请输入小数点位数" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="排序" prop="sort">
            <ElInput v-model="formModel.sort" placeholder="数字越小越靠前" :disabled="formType === 'view'" />
            <div class="w-full text-12px text-gray-400 leading-18px">PC 列表列顺序与 APP 卡片字段顺序都按此值升序</div>
          </ElFormItem>
          <ElFormItem label="默认值" prop="defaultValue">
            <ElInput v-model="formModel.defaultValue" placeholder="请输入默认值" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="列表是否显示" prop="showList">
            <ElInput v-model="formModel.showList" placeholder="1 显示 / 0 不显示" :disabled="formType === 'view'" />
            <div class="w-full text-12px text-gray-400 leading-18px">
              同时控制 PC 列表列与 APP 卡片副字段（APP 卡片主标题恒为数据标题，不占用此项）
            </div>
          </ElFormItem>
          <ElFormItem label="敏感字段(Y/N)" prop="sensitive">
            <ElInput v-model="formModel.sensitive" placeholder="Y/N" size="small" />
          </ElFormItem>
          <ElFormItem label="不允许重复(镜像,只读)" prop="uniqueFlag">
            <ElInput v-model="formModel.uniqueFlag" disabled size="small" />
          </ElFormItem>
          <ElFormItem label="查询是否显示" prop="showQuery">
            <ElInput v-model="formModel.showQuery" placeholder="请输入查询是否显示" :disabled="formType === 'view'" />
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
