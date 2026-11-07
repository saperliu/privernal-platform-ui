<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import { messageTypeOptions as __forwarded_messageTypeOptions } from '@/constants';
import {
  delSystemMessage,
  findSystemMessageDetail,
  saveSystemMessageDetail,
  updateSystemMessageDetail
} from '@/service';
import { useBodyLoading } from '@/hooks';
import { createRequiredFormRule, createRequiredMinMaxRule } from '@/utils';
import PrivernalEditor from '@/components/business/privernal-editor.vue';
import SelectPerson from '@/components/business/select-person.vue';
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const messageTypeOptions = __forwarded_messageTypeOptions;

/** 接收范围选项：ALL=全员（当前组织内全部用户，同步展示在首页公告栏） / SEL=指定人员 */
const messagePersonOptions = [
  { label: '全员', value: 'ALL' },
  { label: '指定人员', value: 'SEL' }
];

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: SystemMessageNamespace.SystemMessageForm | null;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'SystemMessageModal' });

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
    add: '添加系统消息',
    view: '系统消息信息',
    edit: '编辑系统消息'
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInstance>();

/** 表单模型用 SystemMessageForm：详情类型没有接收人字段，而保存/更新接口收的就是 Form */
type FormModel = SystemMessageNamespace.SystemMessageForm;

const formModel = reactive<FormModel>(createDefaultFormModel());

/** 指定人员时必选接收人 */
const userIdsRule: FormItemRule[] = [
  {
    required: true,
    trigger: ['change', 'blur'],
    validator: () => {
      if (formModel.messagePerson !== 'SEL') return true;
      return Array.isArray(formModel.userIds) && formModel.userIds.length > 0 ? true : new Error('请选择接收人员');
    }
  }
];

const rules: Partial<Record<keyof FormModel, FormItemRule | FormItemRule[]>> = reactive({
  id: { required: false },

  mainTitle: createRequiredMinMaxRule(1, 100),

  subTitle: { required: false },

  messageType: createRequiredMinMaxRule(1, 10),

  messagePerson: createRequiredFormRule(),

  detailUrl: { required: false },

  content: { required: false },

  remark: { required: false },

  organizationId: { required: false },

  departmentId: { required: false },

  updatedBy: { required: false },

  updatedTime: { required: false },

  createdName: { required: false }
});

function createDefaultFormModel(): FormModel {
  return {
    id: '',

    mainTitle: '',

    subTitle: '',

    messageType: 'NOTICE',

    messagePerson: 'SEL',

    detailUrl: '',

    content: '',

    status: 1,

    organizationId: '',

    departmentId: '',

    createdName: '',

    userIds: [],

    userList: []
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
        updateSystemMessageDetail(formModel).then(res => {
          if (res.error === null) {
            window.$message?.success('保存成功');
            emit('update:visible', false);
            emit('closed', true);
            closeModal();
          }
          endBodyLoading();
        });
      } else {
        saveSystemMessageDetail(formModel).then(res => {
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
  delSystemMessage([formModel.id]).then(res => {
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
  findSystemMessageDetail(id).then(res => {
    if (res.error === null) {
      handleUpdateFormModel(res.data);
    }
  });
}

function handleSelectPerson(list: any[]) {
  formModel.userIds = [];
  formModel.userList = [];
  list.forEach(item => {
    formModel.userIds.push(item.id);
    // 后端（SystemMessageUserDTO）只读 userId/nickName，id/messageId/status 由服务端补齐，
    // 而生成的 SystemMessageUserForm 把这三者标成必填，所以这里只按契约提交两个字段
    formModel.userList.push({
      userId: item.id,
      nickName: item.nickName
    } as SystemMessageUserNamespace.SystemMessageUserForm);
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
          permission-edit="message:systemMessage:edit"
          :show-edit="true"
          permission-remove="message:systemMessage:remove"
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
          <ElFormItem label="标题" prop="mainTitle">
            <ElInput v-model="formModel.mainTitle" placeholder="请输入标题" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="副标题" prop="subTitle">
            <ElInput v-model="formModel.subTitle" placeholder="请输入副标题" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="详情链接" prop="detailUrl">
            <ElInput v-model="formModel.detailUrl" placeholder="请输入详情链接" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="消息类型" prop="messageType">
            <ElSelect v-model="formModel.messageType" placeholder="消息类型" clearable :disabled="formType === 'view'">
              <ElOption v-for="opt in messageTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="接收范围" prop="messagePerson">
            <ElRadioGroup v-model="formModel.messagePerson" :disabled="formType === 'view'">
              <ElSpace>
                <ElRadio v-for="item in messagePersonOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </ElRadio>
              </ElSpace>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem v-if="formModel.messagePerson === 'SEL'" label="接收人员" prop="userIds" :rule="userIdsRule">
            <SelectPerson
              v-model:value="formModel.userIds"
              :multiple="true"
              :disabled="formType === 'view'"
              @person-selected="handleSelectPerson"
            />
          </ElFormItem>
          <ElFormItem v-else label="接收人员">
            <ElInput value="当前组织内全部用户" disabled />
          </ElFormItem>

          <ElFormItem label="内容简介">
            <PrivernalEditor v-model:value="formModel.content" :show="true" :disabled="formType === 'view'" />
          </ElFormItem>
          <ElFormItem label="备注" prop="remark">
            <ElInput v-model="formModel.remark" placeholder="请输入备注" :disabled="formType === 'view'" />
          </ElFormItem>
          <!--            <el-form-item-grid-item :span="12" label="组织" prop="organizationId">-->
          <!--              <el-input-->
          <!--                v-model="formModel.organizationId"-->
          <!--                placeholder="请输入组织"-->
          <!--                :disabled="formType === 'view'"-->
          <!--              />-->
          <!--            </el-form-item-grid-item>-->
          <!--            <el-form-item-grid-item :span="12" label="部门" prop="departmentId">-->
          <!--              <el-input-->
          <!--                v-model="formModel.departmentId"-->
          <!--                placeholder="请输入部门"-->
          <!--                :disabled="formType === 'view'"-->
          <!--              />-->
          <!--            </el-form-item-grid-item>-->
          <!--            <el-form-item-grid-item :span="12" label="${comment}" prop="createdName">-->
          <!--              <el-input-->
          <!--                v-model="formModel.createdName"-->
          <!--                placeholder="请输入${comment}"-->
          <!--                :disabled="formType === 'view'"-->
          <!--              />-->
          <!--            </el-form-item-grid-item>-->
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
