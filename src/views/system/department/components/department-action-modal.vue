<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import {
  delSystemDepartment,
  findSystemUserList,
  saveSystemDepartmentDetail,
  updateSystemDepartmentDetail
} from '@/service';
import { useBodyLoading } from '@/hooks';
import { createRequiredFormRule } from '@/utils';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemDepartmentNamespace.SystemDepartmentForm | null;
  deptData?: SystemDepartmentNamespace.SystemDepartmentTable | null;
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
  editData: null,
  deptData: null
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
const { startBodyLoading, endBodyLoading } = useBodyLoading();
const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: '添加组织',
    edit: '编辑组织',
    view: '组织信息'
  };
  return titles[props.type];
});
const options = ref<SelectOption[]>([]);
const deptTree = ref<SystemDepartmentNamespace.SystemDepartmentTable[]>([]);

/** 顶级部门的 parentId：后端 TreeUtils 把"父节点不在集合里"的节点视为顶层，"0" 既不是任何部门也能写入 dept_relation */
const TOP_LEVEL_PARENT_ID = '0';

const loadingRef = ref(false);
const formRef = ref<HTMLElement & FormInstance>();

type FormModel = SystemDepartmentNamespace.SystemDepartmentForm;

const formModel = reactive<FormModel>(createDefaultFormModel());

/** 上级组织可选项：顶级部门 + 全量组织树，编辑时剔除当前节点自身及其子树 */
const parentTreeOptions = computed(() => {
  const removeSubtree = (
    nodes: SystemDepartmentNamespace.SystemDepartmentTable[]
  ): SystemDepartmentNamespace.SystemDepartmentTable[] =>
    (nodes || [])
      .filter(node => node.id !== formModel.id)
      .map(node => ({ ...node, children: removeSubtree(node.children || []) }));
  const topLevel = {
    id: TOP_LEVEL_PARENT_ID,
    deptName: '顶级部门（与根部门同级）',
    children: []
  } as unknown as SystemDepartmentNamespace.SystemDepartmentTable;
  return [topLevel, ...removeSubtree(deptTree.value)];
});

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  systemType: { required: false },
  leaderName: { required: false },
  parentId: { required: false },
  parentName: { required: false },
  id: { required: false },
  remark: { required: false },
  deptCode: { required: false },
  deptName: createRequiredFormRule('请输入组织名称'),
  orderNum: { required: false },
  leaderId: { required: false },
  status: { required: false },
  organizationId: { required: false },
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
    systemType: 'NORMAL',
    id: '',
    remark: '',
    deptCode: '',
    deptName: '',
    orderNum: 0,
    leaderId: '',
    status: 1,
    organizationId: '',
    parentName: props.editData?.deptName,
    parentId: props.editData?.id
  };
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  Object.assign(formModel, model);
  if (props.deptData !== null) {
    deptTree.value = props.deptData.children ?? [];
  }
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
  startBodyLoading();
  formRef.value?.validate((valid: boolean, errors?: unknown) => {
    if (valid) {
      if (formModel.id !== '') {
        updateSystemDepartmentDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
          endBodyLoading();
        });
      } else {
        saveSystemDepartmentDetail(formModel).then(res => {
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
  });
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
  delSystemDepartment([formModel.id]).then(res => {
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
      handleUpdateFormModelByModalType();
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
        permission-edit="system:department:edit"
        :show-edit="true"
        permission-remove="system:department:remove"
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
        <!-- 组织根部门（id 即组织 id，系统创建）不允许改上级；其余部门编辑/新增都可选，含"顶级部门" -->
        <ElFormItem
          v-show="formModel.id !== formModel.organizationId || formModel.id === ''"
          label="上级组织"
          prop="parentId"
        >
          <!--
 EP 的 ElTreeSelect：树数据走 data + props 映射（naive 的 options/label-field/key-field 在 EP 无效，
                 会退化成空下拉并直接显示 parentId 裸值）；编辑时剔除自身子树，避免把自己挂到自己下面 
-->
          <ElTreeSelect
            v-model="formModel.parentId"
            :data="parentTreeOptions"
            :props="{ label: 'deptName', children: 'children' }"
            node-key="id"
            check-strictly
            :render-after-expand="false"
            default-expand-all
            clearable
            :disabled="formType === 'view'"
            placeholder="请选择上级组织"
          />
        </ElFormItem>
        <ElFormItem label="组织名称" prop="deptName">
          <ElInput v-model="formModel.deptName" placeholder="请输入组织名称" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="排序" prop="orderNum">
          <ElInputNumber v-model="formModel.orderNum" placeholder="请输入排序" :disabled="formType === 'view'" />
        </ElFormItem>
        <ElFormItem label="主管" prop="leaderId">
          <SelectPerson
            v-model:value="formModel.leaderId"
            title="选择人员"
            :disabled="formType === 'view'"
          ></SelectPerson>
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <PrivernalSwitch v-model:value="formModel.status" :disabled="formType === 'view'" />
        </ElFormItem>

        <ElFormItem label="备注" prop="remark">
          <ElInput v-model="formModel.remark" placeholder="请输入备注" :disabled="formType === 'view'" />
        </ElFormItem>
      </div>
    </ElForm>
    <template #footer>
      <div v-if="formType !== 'view'">
        <ElSpace class="w-full pt-16px" :size="24" justify="end">
          <ElButton class="w-72px" @click="closeModal">取消</ElButton>
          <ElButton class="w-72px" type="primary" @click="handleSubmit">确定</ElButton>
        </ElSpace>
      </div>
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
