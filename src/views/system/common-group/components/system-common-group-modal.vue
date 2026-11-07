<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import {
  commonGroupOptions as __forwarded_commonGroupOptions,
  commonGroupTypeRole as __forwarded_commonGroupTypeRole
} from '@/constants';
import {
  delSystemCommonGroup,
  findSystemCommonGroupDetail,
  saveSystemCommonGroupDetail,
  updateSystemCommonGroupDetail
} from '@/service';
import { useBodyLoading } from '@/hooks';
import { createRequiredFormRule, createRequiredMinMaxRule } from '@/utils';
import SystemCommonGroupMenuList from '@/views/system/common-group-menu/components/system-common-group-menu-list.vue';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemCommonGroupNamespace.SystemCommonGroupForm | null;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'SystemCommonGroupModal' });

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
const showOperation = ref(false);

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
    add: '添加公共组',
    view: '公共组信息',
    edit: '编辑公共组'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = SystemCommonGroupNamespace.SystemCommonGroupDetail;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = reactive({
  tenantId: { required: false },

  revision: { required: false },

  createdBy: { required: false },

  createdTime: { required: false },

  updatedBy: { required: false },

  updatedTime: { required: false },

  deletedBy: { required: false },

  deletedTime: { required: false },

  deletedFlag: { required: false },

  id: { required: false },

  remark: { required: false },

  name: createRequiredMinMaxRule(1, 100),

  code: createRequiredMinMaxRule(1, 100),

  moduleType: { required: false },

  description: { required: false },

  groupType: createRequiredFormRule('请选择分组类型'),

  organizationId: { required: false },

  departmentId: { required: false },

  menuList: { required: false }
});

function createDefaultFormModel(): FormModel {
  return {
    id: '',

    name: '',

    code: '',

    moduleType: 'SYSTEM',

    description: '',

    groupType: 'ROLE',

    organizationId: '',

    departmentId: '',
    menuList: []
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
      showOperation.value = true;
      const defaultFormModel = createDefaultFormModel();
      handleUpdateFormModel(defaultFormModel);
    },
    edit: () => {
      showOperation.value = true;
      if (props.editData) {
        formModel.id = props.editData.id;
        findDetail(props.editData?.id);
      }
    },
    view: () => {
      showOperation.value = false;
      if (props.editData) {
        formModel.id = props.editData.id;
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
        updateSystemCommonGroupDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
          endBodyLoading();
        });
      } else {
        saveSystemCommonGroupDetail(formModel).then(res => {
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
  delSystemCommonGroup([formModel.id]).then(res => {
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

function findDetail(id: string) {
  findSystemCommonGroupDetail(id).then(res => {
    if (res.error === null) {
      handleUpdateFormModel(res.data);
    }
  });
}

/**
 * 添加的子表数据
 *
 * @param rows
 */
function handleSubAddTable(rows: SystemCommonGroupMenuNamespace.SystemCommonGroupMenuForm[]) {
  console.log('---main save------', rows);
  formModel.menuList = rows;
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

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const commonGroupOptions = __forwarded_commonGroupOptions;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const commonGroupTypeRole = __forwarded_commonGroupTypeRole;
</script>

<template>
  <div>
    <ElDrawer v-model="modalVisible" :size="drawerWidth" :title="title" resizable class="privernal-drawer">
      <template #header>
        <FormOperation
          :title="title"
          permission-edit="system:commonGroup:edit"
          :show-edit="true"
          permission-remove="system:commonGroup:remove"
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
          <ElFormItem label="组名" prop="name">
            <ElInput v-model="formModel.name" placeholder="请输入组名" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="组编码" prop="code">
            <ElInput v-model="formModel.code" placeholder="请输入组编码" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="类型" prop="groupType">
            <ElRadioGroup v-model="formModel.groupType">
              <ElRadio
                v-for="item in commonGroupOptions"
                :key="item.value"
                :value="item.value"
                :disabled="formType === 'view'"
              >
                {{ item.label }}
              </ElRadio>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem label="描述" prop="description">
            <ElInput v-model="formModel.description" placeholder="请输入描述" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="备注" prop="remark">
            <ElInput v-model="formModel.remark" placeholder="请输入备注" :disabled="formType === 'view'" />
          </ElFormItem>
          <!--            <el-form-item-grid-item :span="12" label="组织ID" prop="organizationId">-->
          <!--              <el-input-->
          <!--                v-model="formModel.organizationId"-->
          <!--                placeholder="请输入组织ID"-->
          <!--                :disabled="formType === 'view'"-->
          <!--              />-->
          <!--            </el-form-item-grid-item>-->
          <!--            <el-form-item-grid-item :span="12" label="部门ID" prop="departmentId">-->
          <!--              <el-input-->
          <!--                v-model="formModel.departmentId"-->
          <!--                placeholder="请输入部门ID"-->
          <!--                :disabled="formType === 'view'"-->
          <!--              />-->
          <!--            </el-form-item-grid-item>-->
        </div>
      </ElForm>

      <div v-show="formModel.groupType === commonGroupTypeRole" class="h-full">
        <SystemCommonGroupMenuList
          :parent-id="formModel.id"
          :show-operation="showOperation"
          @change="handleSubAddTable"
        ></SystemCommonGroupMenuList>
      </div>

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
