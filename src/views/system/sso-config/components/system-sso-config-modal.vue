<script setup lang="tsx">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElButton as __forwarded_ElButton } from 'element-plus';
import { findSsoConfigDetail, saveSsoConfig, updateSsoConfig } from '@/service';
import { createRequiredFormRule } from '@/utils/form/rule';

export type ModalType = 'add' | 'edit' | 'view';

export interface Props {
  visible: boolean;

  type?: ModalType;

  editData?: SystemSsoNamespace.SsoOidcConfigForm | null;
}

defineOptions({ name: 'SystemSsoConfigModal' });

const props = withDefaults(defineProps<Props>(), { type: 'add', editData: null });

interface Emits {
  (e: 'update:visible', value: boolean): void;

  (e: 'closed'): void;
}

const emit = defineEmits<Emits>();
const formRef = ref<FormInstance | null>(null);
const submitting = ref(false);

const modalVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
});

const title = computed(() => {
  const titles: Record<ModalType, string> = { add: '新建 OIDC 渠道', edit: '编辑 OIDC 渠道', view: '渠道详情' };
  return titles[props.type];
});

const isView = computed(() => props.type === 'view');

/** 逻辑名与默认 claim，与后端 SsoOidcConfigService 的默认表一致 */
const claimFields = [
  { key: 'externalUserId', label: '用户标识', defaultClaim: 'sub' },
  { key: 'userName', label: '登录名', defaultClaim: 'preferred_username' },
  { key: 'nickName', label: '姓名', defaultClaim: 'name' },
  { key: 'email', label: '邮箱', defaultClaim: 'email' },
  { key: 'phone', label: '手机号', defaultClaim: 'phone_number' },
  { key: 'department', label: '部门', defaultClaim: 'department' }
];

function defaultModel(): SystemSsoNamespace.SsoOidcConfigForm {
  return {
    id: '',
    configCode: '',
    configName: '',
    icon: '',
    issuer: '',
    discoveryUrl: '',
    clientId: '',
    clientSecret: '',
    scopes: 'openid profile email',
    redirectUri: '',
    claimMapping: {},
    autoRegister: 0,
    defaultRoleIds: '',
    status: 1,
    remark: '',
    revision: 1,
    tenantId: '',
    createdBy: '',
    createdTime: '',
    updatedBy: '',
    updatedTime: '',
    deletedFlag: 'N'
  } as SystemSsoNamespace.SsoOidcConfigForm;
}

const formModel = reactive<SystemSsoNamespace.SsoOidcConfigForm>(defaultModel());

/** claim 映射用平铺的输入框绑定，提交前组装成对象 */
const claimValues = reactive<Record<string, string>>({});

const rules = {
  configCode: createRequiredFormRule('请填写渠道编码'),
  configName: createRequiredFormRule('请填写渠道名称'),
  clientId: createRequiredFormRule('请填写 client_id')
};

function fillModel(data: SystemSsoNamespace.SsoOidcConfigForm) {
  Object.assign(formModel, defaultModel(), data);
  // 后端从不回明文密钥，编辑时留空即保持原值
  formModel.clientSecret = '';
  claimFields.forEach(field => {
    claimValues[field.key] = data.claimMapping?.[field.key] || '';
  });
}

watch(
  () => props.visible,
  value => {
    if (!value) {
      return;
    }
    if (props.type === 'add') {
      Object.assign(formModel, defaultModel());
      claimFields.forEach(field => {
        claimValues[field.key] = '';
      });
      return;
    }
    if (props.editData?.id) {
      findSsoConfigDetail(props.editData.id).then(res => {
        if (res.error === null && res.data) {
          fillModel(res.data);
        }
      });
    }
  }
);

function handleSubmit() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) {
      window.$message?.error('请检查必填项');
      return;
    }
    if (props.type === 'add' && !formModel.clientSecret) {
      window.$message?.error('新建渠道必须填写 client_secret');
      return;
    }
    if (!formModel.issuer && !formModel.discoveryUrl) {
      window.$message?.error('issuer 与发现文档地址至少填一个');
      return;
    }
    const claimMapping: Record<string, string> = {};
    claimFields.forEach(field => {
      if (claimValues[field.key]) {
        claimMapping[field.key] = claimValues[field.key];
      }
    });
    const payload = { ...formModel, claimMapping };
    if (!payload.clientSecret) {
      delete payload.clientSecret;
    }
    submitting.value = true;
    const requestPromise = payload.id ? updateSsoConfig(payload) : saveSsoConfig(payload);
    requestPromise
      .then(res => {
        if (res.error === null) {
          window.$message?.success('保存成功');
          modalVisible.value = false;
          emit('closed');
        }
      })
      .finally(() => {
        submitting.value = false;
      });
  });
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
</script>

<template>
  <ElDrawer v-model="modalVisible" :size="700" placement="right" :title="title">
    <ElForm ref="formRef" :model="formModel" :rules="rules" label-position="left" label-width="130" :disabled="isView">
      <ElAlert type="info" class="mb-16px" :bordered="false">
        一个渠道对应一个外部身份提供者（Keycloak / 企业 IdP / 钉钉 OIDC 等），并绑死一个组织。
        端点留空即可，保存后点「发现文档测试」会自动从 issuer 拉取并回填。
      </ElAlert>

      <ElFormItem label="渠道编码" path="configCode">
        <ElInput
          v-model="formModel.configCode"
          placeholder="如 keycloak，登录页跳转用"
          :disabled="props.type !== 'add'"
        />
      </ElFormItem>

      <ElFormItem label="渠道名称" path="configName">
        <ElInput v-model="formModel.configName" placeholder="登录页按钮上显示的名字" />
      </ElFormItem>

      <ElFormItem label="图标" path="icon">
        <ElInput v-model="formModel.icon" placeholder="iconify 名称，如 mdi:shield-account" />
      </ElFormItem>

      <ElFormItem label="Issuer" path="issuer">
        <ElInput v-model="formModel.issuer" placeholder="https://keycloak.example.com/realms/myorg" />
      </ElFormItem>

      <ElFormItem label="发现文档地址" path="discoveryUrl">
        <ElInput v-model="formModel.discoveryUrl" placeholder="留空则由 issuer 拼 /.well-known/openid-configuration" />
      </ElFormItem>

      <ElFormItem label="client_id" path="clientId">
        <ElInput v-model="formModel.clientId" />
      </ElFormItem>

      <ElFormItem label="client_secret" path="clientSecret">
        <ElInput
          v-model="formModel.clientSecret"
          type="password"
          show-password
          :placeholder="props.type === 'add' ? '必填' : '留空表示不修改'"
        />
        <div class="mt-4px text-12px opacity-70">
          {{
            props.type === 'add'
              ? '密钥会加密存储，保存后不再回显明文'
              : `当前 ${formModel.clientSecretPrefix || ''}••••${formModel.clientSecretLast4 || ''}`
          }}
        </div>
      </ElFormItem>

      <ElFormItem label="回调地址" path="redirectUri">
        <ElInput
          v-model="formModel.redirectUri"
          placeholder="填前端落地页地址，如 https://platform.example.com/oauth/oidc"
        />
      </ElFormItem>

      <ElFormItem label="scope" path="scopes">
        <ElInput v-model="formModel.scopes" placeholder="openid profile email" />
      </ElFormItem>

      <ElFormItem label="首次登录自动建号" path="autoRegister">
        <ElRadioGroup v-model="formModel.autoRegister">
          <ElRadio :value="1">自动建号</ElRadio>
          <ElRadio :value="0">仅允许已绑定</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem label="默认角色ID" path="defaultRoleIds">
        <ElInput v-model="formModel.defaultRoleIds" placeholder="自动建号时授予的角色，多个用逗号分隔" />
      </ElFormItem>

      <ElFormItem label="端点（可留空）">
        <ElSpace class="w-full">
          <ElInput v-model="formModel.authorizeUrl" placeholder="authorization_endpoint" size="small" />
          <ElInput v-model="formModel.tokenUrl" placeholder="token_endpoint" size="small" />
          <ElInput v-model="formModel.userinfoUrl" placeholder="userinfo_endpoint" size="small" />
          <ElInput v-model="formModel.jwksUri" placeholder="jwks_uri" size="small" />
        </ElSpace>
      </ElFormItem>

      <ElFormItem label="claim 映射">
        <div class="w-full">
          <div v-for="field in claimFields" :key="field.key" class="mb-6px flex items-center gap-8px">
            <span class="w-80px text-12px">{{ field.label }}</span>
            <ElInput
              v-model="claimValues[field.key]"
              size="small"
              :placeholder="`默认 ${field.defaultClaim}`"
              class="flex-1"
            />
          </div>
          <div class="mt-4px text-12px opacity-70">留空即用默认 claim 名；只有 IdP 用了非标准 claim 时才需要填。</div>
        </div>
      </ElFormItem>

      <ElFormItem label="状态" path="status">
        <ElRadioGroup v-model="formModel.status">
          <ElRadio :value="1">启用</ElRadio>
          <ElRadio :value="0">停用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem label="备注" path="remark">
        <ElInput v-model="formModel.remark" type="textarea" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElSpace v-if="!isView">
        <ElButton @click="modalVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
      </ElSpace>
    </template>
  </ElDrawer>
</template>
