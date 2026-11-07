<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { enableAiConfig, fetchAiConfigCurrent, saveAiConfig } from '@/service';

defineOptions({ name: 'AiConfig' });
const formRef = ref<FormInstance | null>(null);
const loading = ref(false);
const saving = ref(false);
const enabled = ref(false);
const notice = ref('');
const keyMask = ref('');

const formModel = reactive({
  provider: 'ZHIPU',
  baseUrl: '',
  model: '',
  temperature: 0.3,
  sessionTokenLimit: null as number | null,
  intranetFlag: 'N',
  apiKey: ''
});

const rules: FormRules = {
  baseUrl: [
    { required: true, message: '请输入模型 API 地址', trigger: 'blur' },
    {
      validator: (_rule, value: string) => value.startsWith('http://') || value.startsWith('https://'),
      message: '必须以 http:// 或 https:// 开头',
      trigger: 'blur'
    }
  ],
  model: [{ required: true, message: '请输入模型名（如 glm-4.6）', trigger: 'blur' }]
};

async function loadConfig() {
  loading.value = true;
  const { error, data } = await fetchAiConfigCurrent();
  loading.value = false;
  if (error) {
    window.$message?.error('读取模型配置失败');
    return;
  }
  notice.value = data?.dataFlowNotice || '';
  const config = data?.config;
  if (config) {
    formModel.provider = config.provider || 'ZHIPU';
    formModel.baseUrl = config.baseUrl || '';
    formModel.model = config.model || '';
    formModel.temperature = config.temperature ?? 0.3;
    formModel.sessionTokenLimit = config.sessionTokenLimit ?? null;
    formModel.intranetFlag = config.intranetFlag || 'N';
    enabled.value = config.enabled === 'Y';
    keyMask.value =
      config.apiKeyPrefix || config.apiKeyLast4 ? `${config.apiKeyPrefix || ''}****${config.apiKeyLast4 || ''}` : '';
  }
}

async function handleSave() {
  await formRef.value?.validate();
  saving.value = true;
  const { error } = await saveAiConfig({
    provider: formModel.provider,
    baseUrl: formModel.baseUrl,
    model: formModel.model,
    temperature: formModel.temperature,
    sessionTokenLimit: formModel.sessionTokenLimit ?? '',
    intranetFlag: formModel.intranetFlag,
    enabled: enabled.value ? 'Y' : 'N',
    apiKey: formModel.apiKey || undefined
  });
  saving.value = false;
  if (error) {
    return;
  }
  window.$message?.success('模型配置已保存');
  formModel.apiKey = '';
  await loadConfig();
}

async function handleEnable(value: string | number | boolean) {
  const nextEnabled = Boolean(value);
  const { error } = await enableAiConfig(nextEnabled ? 'Y' : 'N');
  if (error) {
    enabled.value = !nextEnabled;
    return;
  }
  enabled.value = nextEnabled;
  window.$message?.success(nextEnabled ? 'AI 能力已启用' : 'AI 能力已停用');
}

onMounted(() => {
  loadConfig();
});
</script>

<template>
  <div class="h-full overflow-hidden p-16px">
    <div v-loading="loading">
      <ElCard title="AI 模型配置" class="min-h-full" size="small">
        <template #header-extra>
          <ElSpace align="center">
            <span class="text-12px">本组织 AI 能力</span>
            <ElSwitch :model-value="enabled" active-text="已启用" inactive-text="已停用" @change="handleEnable" />
          </ElSpace>
        </template>

        <ElAlert v-if="notice" type="info" :show-icon="true" class="mb-16px">
          {{ notice }}
        </ElAlert>

        <ElForm
          ref="formRef"
          :model="formModel"
          :rules="rules"
          label-position="left"
          label-width="140"
          class="max-w-720px"
        >
          <ElFormItem label="服务商" path="provider">
            <ElSelect v-model="formModel.provider" class="w-240px">
              <ElOption
                v-for="opt in [
                  { label: '智谱（ZHIPU）', value: 'ZHIPU' },
                  { label: 'OpenAI 兼容（OPENAI）', value: 'OPENAI' },
                  { label: '自定义（CUSTOM）', value: 'CUSTOM' }
                ]"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="模型 API 地址" path="baseUrl">
            <ElInput
              v-model="formModel.baseUrl"
              placeholder="如 https://open.bigmodel.cn/api/paas/v4（内网模型填内网推理地址）"
            />
          </ElFormItem>
          <ElFormItem label="模型名" path="model">
            <ElInput v-model="formModel.model" placeholder="如 glm-4.6" class="w-320px" />
          </ElFormItem>
          <ElFormItem label="API Key" path="apiKey">
            <ElInput
              v-model="formModel.apiKey"
              type="password"
              show-password
              :placeholder="keyMask ? `已配置（${keyMask}），留空保持不变` : '未配置（公网模型必填，加密存储）'"
            />
          </ElFormItem>
          <ElFormItem label="温度" path="temperature">
            <ElInputNumber v-model="formModel.temperature" :min="0" :max="2" :step="0.1" class="w-180px" />
          </ElFormItem>
          <ElFormItem label="单会话 token 上限" path="sessionTokenLimit">
            <ElInputNumber
              v-model="formModel.sessionTokenLimit"
              :min="10000"
              :step="10000"
              placeholder="留空不限"
              class="w-180px"
            />
          </ElFormItem>
          <ElFormItem label="内网模型" path="intranetFlag">
            <ElRadioGroup v-model="formModel.intranetFlag">
              <ElRadio value="N">公网模型（数据将传输至所配服务商）</ElRadio>
              <ElRadio value="Y">内网模型（数据不出内网，免 apiKey）</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
          <ElSpace class="ml-140px">
            <ElButton type="primary" :loading="saving" @click="handleSave">保存配置</ElButton>
          </ElSpace>
        </ElForm>
      </ElCard>
    </div>
  </div>
</template>
