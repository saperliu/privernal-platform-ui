<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import {
  delSystemDictionaryData,
  findSystemDictionaryTypeList,
  saveSystemDictionaryDataDetail,
  updateSystemDictionaryDataDetail
} from '@/service';
import { createMaxLengthRule, createRequiredFormRule, createRequiredMinMaxRule } from '@/utils';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemDictionaryDataNamespace.SystemDictionaryDataForm | null;
}

export type ModalType = NonNullable<Props['type']>;

/** 下拉选项（原 naive-ui 全局 SelectOption，迁移后本地声明） */
interface SelectOption {
  label: string;
  value: string;
}

defineOptions({ name: 'SystemDictionaryDataModal' });

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
    add: '添加字典数据',
    view: '字典数据信息',
    edit: '编辑字典数据'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = SystemDictionaryDataNamespace.SystemDictionaryDataForm;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  id: { required: false },
  dictSort: { required: false },
  dictLabel: createRequiredMinMaxRule(1, 100),
  dictValue: createRequiredMinMaxRule(1, 100),
  dictType: createRequiredFormRule(),
  cssClass: { required: false },
  listClass: { required: false },
  isDefault: { required: false },
  status: { required: false },
  remark: createMaxLengthRule(255),
  tenantId: { required: false },
  revision: { required: false },
  createdBy: { required: false },
  createdTime: { required: false },
  updatedBy: { required: false },
  updatedTime: { required: false },
  deletedFlag: { required: false },
  deletedBy: { required: false },
  deletedTime: { required: false },
  organizationId: { required: false },
  departmentId: { required: false }
};

const options = ref<SelectOption[]>([]);
type FormFilterModel = SystemDictionaryTypeNamespace.SystemDictionaryTypeQuery;
const formFilter = reactive<FormFilterModel>({ pageNum: 1, pageSize: 900 });
function createDefaultFormModel(): FormModel {
  return {
    id: '',

    dictSort: 0,

    dictLabel: '',

    dictValue: '',

    dictType: '',

    cssClass: '',

    listClass: '',

    isDefault: '',

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
        updateSystemDictionaryDataDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
        });
      } else {
        saveSystemDictionaryDataDetail(formModel).then(res => {
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
  delSystemDictionaryData([formModel.id]).then(res => {
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

async function findDataTypeList(dataQuery: SystemDictionaryTypeNamespace.SystemDictionaryTypeQuery) {
  const { data } = await findSystemDictionaryTypeList(dataQuery);
  if (data && data.list.length > 0) {
    const dataList = data.list;

    const optionsList = dataList.map((item, index) => {
      const user = {
        label: item.dictName,
        value: item.dictType,
        index
      };
      return user;
    });
    options.value = optionsList;
  }
}

function handleSearch() {}

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      formType.value = props.type;
      handleUpdateFormModelByModalType();
    }
  }
);

findDataTypeList(formFilter);
</script>

<template>
  <ElDrawer v-model="modalVisible" :size="drawerWidth" :title="title" resizable class="privernal-drawer">
    <template #header>
      <FormOperation
        :title="title"
        permission-edit="system:dictionaryData:edit"
        :show-edit="true"
        permission-remove="system:dictionaryData:remove"
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
        <ElFormItem label="标签" prop="dictLabel">
          <ElInput v-model="formModel.dictLabel" placeholder="请输入标签" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="键值" prop="dictValue">
          <ElInput v-model="formModel.dictValue" placeholder="请输入键值" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="类型" prop="dictType">
          <ElSelect
            v-model="formModel.dictType"
            filterable
            placeholder="搜索类型"
            clearable
            remote
            :disabled="formType === 'view'"
            @search="handleSearch"
          >
            <ElOption v-for="opt in options" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="排序" prop="dictSort">
          <ElInputNumber v-model="formModel.dictSort" placeholder="请输入排序" :disabled="formType === 'view'" />
        </ElFormItem>

        <ElFormItem label="状态" prop="status">
          <PrivernalSwitch v-model:value="formModel.status" :disabled="formType === 'view'" />
        </ElFormItem>
        <!--          <el-form-item-grid-item :span="12" label="样式属性" prop="cssClass">-->
        <!--            <el-input v-model="formModel.cssClass" placeholder="请输入样式属性" :disabled="formType === 'view'" />-->
        <!--          </el-form-item-grid-item>-->
        <!--          <el-form-item-grid-item :span="12" label="表格回显样式" prop="listClass">-->
        <!--            <el-input-->
        <!--              v-model="formModel.listClass"-->
        <!--              placeholder="请输入表格回显样式"-->
        <!--              :disabled="formType === 'view'"-->
        <!--            />-->
        <!--          </el-form-item-grid-item>-->
        <!--          <el-form-item-grid-item :span="12" label="是否默认" prop="isDefault">-->
        <!--            <el-input v-model="formModel.isDefault" placeholder="请输入是否默认" :disabled="formType === 'view'" />-->
        <!--          </el-form-item-grid-item>-->
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
