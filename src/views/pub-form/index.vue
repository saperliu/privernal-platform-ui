<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  ElButton as __forwarded_ElButton,
  ElCard as __forwarded_ElCard,
  ElDatePicker as __forwarded_ElDatePicker,
  ElForm as __forwarded_ElForm,
  ElFormItem as __forwarded_ElFormItem,
  ElInput as __forwarded_ElInput,
  ElInputNumber as __forwarded_ElInputNumber,
  ElResult as __forwarded_ElResult,
  ElSelect as __forwarded_ElSelect
} from 'element-plus';
import { fetchPublicFormMeta, submitPublicForm } from '@/service/api/dynamic/advanced';

const route = useRoute();
const token = computed(() => String(route.params.token ?? ''));

const loading = ref(true);
const notFound = ref(false);
const meta = ref<AdvancedNamespace.PublicFormMeta | null>(null);
const model = ref<Record<string, any>>({});
const password = ref('');
const submitting = ref(false);
const submitted = ref(false);
const submitResult = ref<AdvancedNamespace.PublicSubmitResult | null>(null);
const errorMsg = ref('');

async function load() {
  loading.value = true;
  try {
    const { data, error } = await fetchPublicFormMeta(token.value);
    if (!error && data) {
      meta.value = data;
    } else {
      notFound.value = true;
    }
  } finally {
    loading.value = false;
  }
}

function isSelect(field: AdvancedNamespace.PublicFormField) {
  return Array.isArray(field.options) && field.options.length > 0;
}

async function submit() {
  if (!meta.value) return;
  errorMsg.value = '';
  for (const field of meta.value.fields) {
    if (
      field.required &&
      (model.value[field.field] === undefined || model.value[field.field] === null || model.value[field.field] === '')
    ) {
      errorMsg.value = `请填写「${field.label}」`;
      return;
    }
  }
  submitting.value = true;
  try {
    const payload = { ...model.value };
    if (meta.value.passwordRequired) {
      // 后端约定的密码字段名固定为 __password，用 assign 写入避免下划线成员访问
      Object.assign(payload, { __password: password.value });
    }
    const { data, error } = await submitPublicForm(token.value, payload);
    if (!error && data) {
      submitted.value = true;
      submitResult.value = data;
    } else {
      errorMsg.value = error?.message || '提交失败，请稍后重试';
    }
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  model.value = {};
  submitted.value = false;
  submitResult.value = null;
}

onMounted(load);

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElCard = __forwarded_ElCard;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDatePicker = __forwarded_ElDatePicker;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElForm = __forwarded_ElForm;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElFormItem = __forwarded_ElFormItem;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInput = __forwarded_ElInput;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInputNumber = __forwarded_ElInputNumber;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElResult = __forwarded_ElResult;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;
</script>

<template>
  <div class="public-page">
    <div v-loading="loading">
      <ElResult v-if="notFound" status="404" title="链接不存在或已失效" description="请联系表单管理员获取新链接" />
      <ElResult v-else-if="submitted" status="success" title="提交成功">
        <template #footer>
          <div v-if="submitResult?.receiptCode" class="receipt-box">
            <div class="receipt-title">您的回执码（用于后续修改本次提交，请截图保存，仅展示这一次）</div>
            <div class="receipt-code">{{ submitResult.receiptCode }}</div>
          </div>
          <ElButton @click="resetForm">再填一份</ElButton>
        </template>
      </ElResult>
      <ElCard v-else-if="meta" :title="meta.formName" class="form-card">
        <div v-if="meta.passwordRequired" class="pwd-row">
          <ElInput v-model="password" type="password" show-password placeholder="访问密码" class="pwd-input" />
        </div>
        <ElForm label-position="top">
          <ElFormItem
            v-for="field in meta.fields"
            :key="field.field"
            :label="field.label + (field.required ? ' *' : '')"
          >
            <ElInputNumber
              v-if="field.type === 'number' || field.type === 'input-number'"
              v-model="model[field.field]"
              class="full"
            />
            <ElDatePicker
              v-else-if="field.type === 'date-picker' || field.type === 'date'"
              v-model="model[field.field]"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="full"
            />
            <ElSelect v-else-if="isSelect(field)" v-model="model[field.field]" clearable class="full">
              <ElOption
                v-for="opt in (field.options ?? []).map(option => ({ label: option.label, value: option.value }))"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            <ElInput
              v-else-if="field.type === 'textarea'"
              v-model="model[field.field]"
              type="textarea"
              :rows="3"
              class="full"
            />
            <ElInput v-else v-model="model[field.field]" class="full" />
          </ElFormItem>
        </ElForm>
        <div v-if="errorMsg" class="error-bar">{{ errorMsg }}</div>
        <div class="submit-row">
          <ElButton type="primary" size="large" block :loading="submitting" @click="submit">提交</ElButton>
        </div>
      </ElCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.public-page {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 16px;
  background: #f4f6f9;
}

.form-card {
  width: 640px;
}

.full {
  width: 100%;
}

.pwd-row {
  margin-bottom: 16px;
}

.pwd-input {
  width: 280px;
}

.submit-row {
  margin-top: 8px;
}

.error-bar {
  padding: 8px 12px;
  margin-bottom: 12px;
  color: #b3261e;
  background: #fdeceb;
  border-radius: 4px;
}

.receipt-box {
  padding: 16px 24px;
  margin-bottom: 16px;
  background: #f0f9eb;
  border: 1px solid #c2e7b0;
  border-radius: 6px;
}

.receipt-title {
  margin-bottom: 8px;
  font-size: 13px;
  color: #555;
}

.receipt-code {
  font-family: monospace;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
}
</style>
