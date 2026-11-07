<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import {
  delSystemAppInfo,
  findSystemAppInfoDetail,
  findSystemAppInfoList,
  saveSystemAppInfoDetail,
  updateSystemAppInfoDetail
} from '@/service';
import { useBodyLoading } from '@/hooks';
import { createRequiredFormRule, createRequiredMinMaxRule } from '@/utils';
import SystemAppMenuList from '@/views/system/app-menu/components/system-app-menu-list.vue';
import SystemAppCommonGroupList from '@/views/system/app-common-group/components/system-app-common-group-list.vue';
import SystemAppWorkflowList from '@/views/system/app-workflow/components/system-app-workflow-list.vue';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemAppInfoNamespace.SystemAppInfoForm | null;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'SystemAppInfoModal' });

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
const showOperation = ref(false);

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
    add: '添加应用',
    view: '应用信息',
    edit: '编辑应用'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

type FormModel = SystemAppInfoNamespace.SystemAppInfoDetail;

const formModel = reactive<FormModel>(createDefaultFormModel());

/** 应用编码唯一校验：编辑时排除自身；查询异常不阻塞提交，由后端保存兜底 */
function validateCodeUnique(_rule: unknown, value: string, callback: (error?: string | Error) => void) {
  const code = (value || '').trim();
  if (!code) {
    callback();
    return;
  }
  findSystemAppInfoList({ pageNum: 1, pageSize: 50, code } as any)
    .then(res => {
      if (res.error !== null) {
        callback();
        return;
      }
      const rows = ((res.data as any)?.list || (res.data as any)?.rows || []) as Array<any>;
      const dup = rows.find(item => String(item.code) === code && String(item.id ?? '') !== String(formModel.id ?? ''));
      if (dup) {
        callback(new Error(`应用编码「${code}」已存在${dup.appName ? `（应用：${dup.appName}）` : ''}，请更换编码`));
        return;
      }
      callback();
    })
    .catch(() => callback());
}

const rules: Partial<Record<keyof FormModel, FormItemRule | FormItemRule[]>> = reactive({
  id: { required: false },

  appKey: { required: false },

  appSecret: { required: false },

  icon: { required: false },

  appName: createRequiredMinMaxRule(1, 100),

  code: [...createRequiredMinMaxRule(1, 100), { trigger: ['blur', 'input'], validator: validateCodeUnique }],

  type: createRequiredMinMaxRule(1, 100),

  userId: { required: false },

  status: createRequiredFormRule('请填写状态'),

  remark: { required: false },

  tenantId: { required: false },

  revision: { required: false },

  createdBy: { required: false },

  createdTime: { required: false },

  updatedBy: { required: false },

  updatedTime: { required: false },

  deletedFlag: { required: false },

  deletedBy: { required: false },

  deletedTime: { required: false },

  organizationId: { required: false }
});

function createDefaultFormModel(): FormModel {
  return {
    id: '',

    appKey: '',

    appSecret: '',

    icon: '',

    appName: '',

    code: '',

    type: '',

    userId: '',

    status: 1,

    organizationId: '',

    menuList: [],

    groupList: [],

    workflowList: []
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
        updateSystemAppInfoDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
          endBodyLoading();
        });
      } else {
        saveSystemAppInfoDetail(formModel).then(res => {
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
  delSystemAppInfo([formModel.id]).then(res => {
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
  findSystemAppInfoDetail(id).then(res => {
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
function handleSubAddTable(rows: SystemAppMenuNamespace.SystemAppMenuForm[]) {
  formModel.menuList = rows;
}

/**
 * 添加的子表数据
 *
 * @param rows
 */
function handleSubAddGroupTable(rows: SystemAppCommonGroupNamespace.SystemAppCommonGroupForm[]) {
  formModel.groupList = rows;
}

/**
 * 添加的工作流的数据
 *
 * @param rows
 */
function handleSubAddWorkflowTable(rows: SystemAppWorkflowNamespace.SystemAppWorkflowForm[]) {
  formModel.workflowList = rows;
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
          permission-edit="system:appInfo:edit"
          :show-edit="true"
          permission-remove="system:appInfo:remove"
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
          <ElFormItem label="应用KEY" prop="appKey">
            <ElInput v-model="formModel.appKey" placeholder="请输入应用KEY" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="应用密钥" prop="appSecret">
            <ElInput v-model="formModel.appSecret" placeholder="请输入应用密钥" :disabled="formType === 'view'" />
          </ElFormItem>

          <ElFormItem label="名称" prop="appName">
            <ElInput v-model="formModel.appName" placeholder="请输入名称" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="图标" prop="icon">
            <ElInput v-model="formModel.icon" placeholder="请输入图标" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="编码" prop="code">
            <ElInput v-model="formModel.code" placeholder="请输入编码（组织内唯一）" :disabled="formType === 'view'" />
          </ElFormItem>
          <!--            <el-form-item-grid-item :span="12" label="用户" prop="userId">-->
          <!--              <select-person-->
          <!--                v-model="formModel.userId"-->
          <!--                placeholder="请选择用户"-->
          <!--                :disabled="formType === 'view'"-->
          <!--              ></select-person>-->
          <!--            </el-form-item-grid-item>-->

          <ElFormItem label="状态">
            <PrivernalSwitch v-model:value="formModel.status" :disabled="formType === 'view'" />
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
        </div>
      </ElForm>

      <ElTabs animated pane-wrapper-class="h-full">
        <ElTabPane name="menu" label="默认菜单" class="h-full">
          <SystemAppMenuList
            :parent-id="formModel.id"
            :show-operation="showOperation"
            :status="formModel.status"
            @change="handleSubAddTable"
          ></SystemAppMenuList>
        </ElTabPane>
        <ElTabPane name="group" label="默认公共组" class="h-full">
          <SystemAppCommonGroupList
            :parent-id="formModel.id"
            :show-operation="showOperation"
            :status="formModel.status"
            @change="handleSubAddGroupTable"
          ></SystemAppCommonGroupList>
        </ElTabPane>
        <ElTabPane name="workflow" label="表单流程" class="h-full">
          <SystemAppWorkflowList
            :parent-id="formModel.id"
            :show-operation="showOperation"
            :status="formModel.status"
            @change="handleSubAddWorkflowTable"
          ></SystemAppWorkflowList>
        </ElTabPane>
      </ElTabs>

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
:deep(.n-tabs) {
  height: 100%;
}
</style>
