<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule, FormValidateCallback } from 'element-plus';
import {
  delSystemOrganization,
  findSystemUserList,
  saveSystemOrganizationDetail,
  updateSystemOrganizationDetail
} from '@/service';
import { useBodyLoading } from '@/hooks';
import { createRequiredFormRule, createRequiredMinMaxRule, formRules } from '@/utils';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemOrganizationNamespace.SystemOrganizationForm | null;
}

export type ModalType = NonNullable<Props['type']>;

/** 下拉选项（原 naive-ui 全局 SelectOption，迁移后本地声明） */
interface SelectOption {
  label: string;
  value: string;
}

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'closed', data: boolean): void;
}
const loadingRef = ref(false);
const refPersonSel = ref(false);
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
    add: '添加企业',
    view: '企业信息',
    edit: '编辑企业'
  };
  return titles[props.type];
});
const { startBodyLoading, endBodyLoading } = useBodyLoading();
const formRef = ref<HTMLElement & FormInstance>();
type FormModel = SystemOrganizationNamespace.SystemOrganizationForm;
const formModel = reactive<FormModel>(createDefaultFormModel());
const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  email: { required: false },
  gender: { required: false },
  identityNum: { required: false },
  loginName: formRules.loginName,
  nickName: createRequiredMinMaxRule(2, 100),
  phone: formRules.phone,
  id: { required: false },
  remark: { required: false },
  organizationName: createRequiredFormRule('请输入企业名称'),
  orderNum: { required: false },
  leaderId: { required: false },
  status: { required: false },
  organizationCode: createRequiredFormRule('请输入企业编码'),
  tenantId: { required: false },
  revision: { required: false },
  createdTime: { required: false },
  createdBy: { required: false },
  updatedTime: { required: false },
  updatedBy: { required: false },
  deletedTime: { required: false },
  deletedBy: { required: false },
  deletedFlag: { required: false },
  userStatus: { required: false }
};
const options = ref<SelectOption[]>([]);

function createDefaultFormModel(): FormModel {
  return {
    email: '',
    gender: '0',
    loginName: '',
    nickName: '',
    phone: '',
    userStatus: 1,
    id: '',
    remark: '',
    organizationName: '',
    orderNum: 0,
    leaderId: '',
    status: 1,
    organizationCode: '',
    identityNum: ''
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

function handleValueUpdate(value: Array<string | number> | string | number | null) {
  if (value !== null) {
    refPersonSel.value = true;
  } else {
    refPersonSel.value = false;
  }
}
async function handleSubmit() {
  startBodyLoading();
  // 用 EP 的 FormValidateCallback 标注，第二个入参（校验失败字段）才有类型
  const onValidate: FormValidateCallback = (valid, errors) => {
    if (valid) {
      if (formModel.id !== '') {
        updateSystemOrganizationDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
          endBodyLoading();
        });
      } else {
        saveSystemOrganizationDetail(formModel).then(res => {
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
      window.console.log(errors);
      window.$message?.error('验证失败');
    }
  };
  formRef.value?.validate(onValidate);
}

type FormFilterModel = SystemUserNamespace.SystemUserQuery;
const formFilter = reactive<FormFilterModel>({ pageNum: 1, pageSize: 900 });
function setOptions(data: any[]) {
  options.value = data;
}

async function findPersonList(dataQuery: SystemUserNamespace.SystemUserQuery) {
  const { data } = await findSystemUserList(dataQuery);
  if (data && data.list.length > 0) {
    const dataList = data.list;

    const optionsList = dataList.map((item, index) => {
      const user = {
        label: item.nickName,
        value: item.id,
        index
      };
      return user;
    });
    setOptions(optionsList);
    loadingRef.value = false;
  }
}

/** 删除当前显示的数据 */
function deleteRow() {
  delSystemOrganization([formModel.id]).then(res => {
    if (res.error === null) {
      window.$message?.success('删除成功');
      emit('closed', true);
      emit('update:visible', false);
    }
  });
}

/** 改为编辑状态 */
function editRow() {
  formType.value = 'edit';
}

function fullScreen(value: boolean) {
  window.console.log('--fullScreen---', value);
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
      refPersonSel.value = false;
      handleUpdateFormModelByModalType();
    }
  }
);

watch(
  () => refPersonSel.value,
  newValue => {
    if (newValue) {
      rules.loginName = { required: false };
      rules.nickName = { required: false };
      rules.phone = { required: false };
    } else {
      rules.loginName = createRequiredMinMaxRule(6, 100);
      rules.nickName = createRequiredMinMaxRule(2, 100);
      rules.phone = formRules.phone;
    }
  }
);

findPersonList(formFilter);
</script>

<template>
  <ElDrawer v-model="modalVisible" :size="drawerWidth" :title="title" resizable class="privernal-drawer">
    <template #header>
      <FormOperation
        :title="title"
        permission-edit="system:organization:edit"
        :show-edit="true"
        permission-remove="system:organization:remove"
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
        <ElFormItem label="企业名称" prop="organizationName">
          <ElInput v-model="formModel.organizationName" placeholder="请输入企业名称" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="企业编码" prop="organizationCode">
          <ElInput v-model="formModel.organizationCode" placeholder="请输入企业的编码" :disabled="formType !== 'add'" />
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <PrivernalSwitch v-model:value="formModel.status" :disabled="formType === 'view'"></PrivernalSwitch>
        </ElFormItem>
        <ElFormItem label="排序" prop="orderNum">
          <ElInputNumber v-model="formModel.orderNum" placeholder="请输入排序" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="管理员" prop="leaderId">
          <SelectPerson
            v-model:value="formModel.leaderId"
            title="选择人员"
            :disabled="formType === 'view'"
            :organization-id="formModel.id"
            @update:value="handleValueUpdate"
          ></SelectPerson>
        </ElFormItem>

        <ElFormItem label="备注" prop="remark">
          <ElInput
            v-model="formModel.remark"
            type="textarea"
            placeholder="请输入备注"
            :disabled="formType === 'view'"
          />
        </ElFormItem>

        <ElFormItem v-if="type === 'add' && !refPersonSel">
          <ElDivider>企业管理员[选择管理员后,可以不填写以下信息]</ElDivider>
        </ElFormItem>
        <ElFormItem v-if="type === 'add' && !refPersonSel" label="用户名" prop="loginName">
          <ElInput v-model="formModel.loginName" />
        </ElFormItem>
        <ElFormItem v-if="type === 'add' && !refPersonSel" label="昵称" prop="nickName">
          <ElInput v-model="formModel.nickName" clearable />
        </ElFormItem>
        <!--          <el-form-item-grid-item v-if="type === 'add'" :span="24" label="性别" prop="gender">-->
        <!--            <el-radio-group v-model="formModel.gender">-->
        <!--              <el-radio v-for="item in genderOptions" :key="item.value" :value="item.value">{{ item.label }}</el-radio>-->
        <!--            </el-radio-group>-->
        <!--          </el-form-item-grid-item>-->

        <!--				<el-form-item-grid-item v-if="type === 'add'" :span="24" label="人员" prop="phone">-->
        <!--					<select-person v-model="formModel.phone" multiple></select-person>-->
        <!--				</el-form-item-grid-item>-->
        <!--				<el-form-item-grid-item v-if="type === 'add'" :span="24" label="字曲" prop="phone">-->
        <!--					<select-dictionary v-model="formModel.phone" dict-type="SEX"></select-dictionary>-->
        <!--				</el-form-item-grid-item>-->
        <ElFormItem v-if="type === 'add' && !refPersonSel" label="手机号" prop="phone">
          <ElInput v-model="formModel.phone" />
        </ElFormItem>
        <ElFormItem v-if="type === 'add' && !refPersonSel" label="邮箱" prop="email">
          <ElInput v-model="formModel.email" />
        </ElFormItem>
        <!--          <el-form-item-grid-item v-if="type === 'add'" :span="12" label="状态" prop="userStatus">-->
        <!--            <el-select v-model="formModel.userStatus" :options="userStatusOptions" />-->
        <!--          </el-form-item-grid-item>-->
        <ElFormItem v-if="type === 'add' && !refPersonSel" label="身份证号" prop="identityNum">
          <ElInput v-model="formModel.identityNum" />
        </ElFormItem>
        <ElFormItem v-if="type === 'add' && !refPersonSel" label="  ">
          <ElAlert type="warning">用户默认密码为手机号后6位</ElAlert>
        </ElFormItem>
      </div>
    </ElForm>
    <template #footer>
      <ElSpace v-if="formType !== 'view'" class="w-full pt-16px" :size="24" justify="end">
        <ElButton class="w-72px" @click="closeModal">取消</ElButton>
        <ElButton class="w-72px" type="primary" @click="handleSubmit">确定</ElButton>
      </ElSpace>
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
