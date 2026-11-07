<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { ElButton, ElSpace } from 'element-plus';
import type { FormInstance, FormRules, UploadFile } from 'element-plus';
import { EditOutlined } from '@vicons/antd';
import { FreeCancellationOutlined } from '@vicons/material';
import { SaveOutline } from '@vicons/ionicons5';
import { fetchUserInfo, updateAvatar, updateProfile } from '@/service';
import { useAuthStore } from '@/store';
import { useBodyLoading } from '@/hooks';
import { setUserInfo } from '@/utils';
const auth = useAuthStore();

type FormModel = SystemUserNamespace.SystemUserForm & {
  /** 所属部门名称（后端返回的展示字段） */
  departmentName?: string;
};

const formRef = ref<FormInstance>();

/** 邮箱格式校验 */
const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const formRules: FormRules = {
  email: [
    {
      pattern: emailPattern,
      message: '请输入正确的邮箱格式',
      trigger: ['blur', 'change']
    }
  ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/,
      message: '请输入正确的电话格式',
      trigger: ['blur', 'change']
    }
  ]
};

const formModel = reactive<FormModel>(createDefaultFormModel());
function createDefaultFormModel(): FormModel {
  return {
    id: '',
    loginName: '',
    nickName: '',
    email: '',
    phone: '',
    status: 0,
    gender: null,
    avatar: '',
    departmentId: '',
    password: null,
    userType: null,
    organizationId: null,
    dataScope: 0
  };
}

Object.assign(formModel, auth.userInfo);
const { startBodyLoading, endBodyLoading } = useBodyLoading();
const formType = ref('view');
function modify() {
  formType.value = 'edit';
}

function cancel() {
  formType.value = 'view';
}

async function saveInfo() {
  const valid = await formRef.value
    ?.validate()
    .then(() => true)
    .catch(() => false);
  if (!valid) return;
  startBodyLoading();
  updateProfile({
    gender: formModel.gender,
    nickName: formModel.nickName,
    email: formModel.email,
    phone: formModel.phone
  }).then(async res => {
    if (res.error === null) {
      formType.value = 'view';
      const { data } = await fetchUserInfo();
      if (data) {
        // 成功后把用户信息存储到缓存中
        setUserInfo(data);
      }
      auth.setNickName(formModel.nickName ?? '');
      window.$message?.success(`保存成功`);
    }
    endBodyLoading();
  });
}

const avatarUrl = ref('');
avatarUrl.value = auth.userInfo.avatar;

async function handleChange(uploadFile: UploadFile) {
  // uploadSystemFile(options.fileList, 'GLOBAL', auth.userInfo.userId, 'AVATAR', 'IMAGE', 'avatar').then(res => {
  //   if (res.error === null) {
  //     const file = res.data[0];
  //     avatarUrl.value = file.url;
  //     console.log('handleChange upload url', avatarUrl.value, file);
  //   }
  // });
  const file = uploadFile.raw;
  if (!file) return;
  updateAvatar(file).then(async res => {
    if (res.error === null) {
      avatarUrl.value = res.data;
      console.log('handleChange upload url', avatarUrl.value, res);
      const { data } = await fetchUserInfo();
      if (data) {
        // 成功后把用户信息存储到缓存中
        setUserInfo(data);
        auth.setAvatar(data.avatar);
      }
      window.$message?.success(`修改头像成功`);
    }
  });
  console.log('handleChange avatarUrl.value url', avatarUrl.value);
}
</script>

<template>
  <ElSpace direction="vertical" :size="16">
    <ElCard :bordered="false" class="rounded-8px shadow-sm" title="个人信息">
      <ElForm
        ref="formRef"
        label-position="left"
        label-align="left"
        :label-width="80"
        :model="formModel"
        :rules="formRules"
      >
        <div class="grid grid-cols-5 gap-18px">
          <div class="col-span-1">
            <div justify="center" align="center" class="h-full flex items-center">
              <div>
                <icon-local-avatar v-if="avatarUrl === ''" class="text-32px" />
                <ElAvatar v-if="avatarUrl !== ''" round :size="128" :src="avatarUrl" />

                <ElUpload
                  action="#"
                  :default-upload="false"
                  list-type="picture"
                  :show-file-list="false"
                  @change="handleChange"
                >
                  <div class="w-100% cursor-pointer text-center color-blue-500">修改头像</div>
                </ElUpload>
              </div>
            </div>
          </div>
          <div class="col-span-4">
            <div class="grid grid-cols-24 gap-18px">
              <ElFormItem label="姓名" prop="nickName">
                <ElInput v-model="formModel.nickName" placeholder="请输入姓名" :disabled="formType === 'view'" />
              </ElFormItem>
              <ElFormItem label="性别" prop="gender">
                <SelectDictionary
                  v-model:value="formModel.gender"
                  value-field="dictValue"
                  dict-type="SEX"
                  :disabled="formType === 'view'"
                ></SelectDictionary>
              </ElFormItem>
              <ElFormItem label=""></ElFormItem>
              <ElFormItem label="邮箱" prop="email">
                <ElInput v-model="formModel.email" placeholder="请输入邮箱" :disabled="formType === 'view'" />
              </ElFormItem>

              <ElFormItem label="电话" prop="phone">
                <ElInput v-model="formModel.phone" placeholder="请输入电话" :disabled="formType === 'view'" />
              </ElFormItem>
              <ElFormItem label=""></ElFormItem>
              <ElFormItem label="部门" prop="departmentName">
                <ElInput v-model="formModel.departmentName" disabled />
              </ElFormItem>
            </div>
          </div>
        </div>
        <div>
          <ElSpace class="justify-end">
            <ElButton v-if="formType === 'view'" type="primary" class="m-l-2" @click="modify">
              <ElIcon size="20" class="mr-4px text-20px"><component :is="EditOutlined" /></ElIcon>
              修改
            </ElButton>
            <ElButton v-if="formType === 'edit'" class="m-l-2" @click="cancel">
              <ElIcon size="20" class="mr-4px text-20px"><component :is="FreeCancellationOutlined" /></ElIcon>
              取消
            </ElButton>
            <ElButton v-if="formType === 'edit'" type="primary" class="m-l-2" @click="saveInfo">
              <ElIcon size="20" class="mr-4px text-20px"><component :is="SaveOutline" /></ElIcon>
              保存
            </ElButton>
          </ElSpace>
        </div>
      </ElForm>
    </ElCard>
  </ElSpace>
</template>

<style lang="scss" scoped>
:deep(.n-upload-trigger) {
  width: 100%;
}
</style>
