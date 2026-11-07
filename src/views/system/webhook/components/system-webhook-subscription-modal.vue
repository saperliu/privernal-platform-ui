<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElButton as __forwarded_ElButton } from 'element-plus';
import {
  findSystemAppListByOrg,
  findWebhookEventTypes,
  findWebhookSubscriptionDetail,
  saveWebhookSubscription,
  updateWebhookSubscription
} from '@/service';
import { createRequiredFormRule } from '@/utils/form/rule';

export type ModalType = 'add' | 'edit' | 'view';

export interface Props {
  visible: boolean;

  type?: ModalType;

  editData?: SystemWebhookNamespace.WebhookSubscriptionForm | null;
}

defineOptions({ name: 'SystemWebhookSubscriptionModal' });

const props = withDefaults(defineProps<Props>(), { type: 'add', editData: null });

interface Emits {
  (e: 'update:visible', value: boolean): void;

  (e: 'closed'): void;

  (e: 'secret', data: SystemWebhookNamespace.WebhookSubscriptionForm): void;
}

const emit = defineEmits<Emits>();
const formRef = ref<FormInstance | null>(null);
const submitting = ref(false);
const eventOptions = ref<{ label: string; value: string }[]>([]);
const appOptions = ref<{ label: string; value: string }[]>([]);

/** headers 是 JSON 对象，编辑时拆成键值行，提交前再合回去 */
const headerRows = ref<{ key: string; value: string }[]>([]);

const modalVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
});

const title = computed(() => {
  const titles: Record<ModalType, string> = { add: '新建订阅', edit: '编辑订阅', view: '订阅详情' };
  return titles[props.type];
});

const isView = computed(() => props.type === 'view');

function defaultModel(): SystemWebhookNamespace.WebhookSubscriptionForm {
  return {
    id: '',
    appId: '',
    subscriptionName: '',
    url: '',
    httpMethod: 'POST',
    events: [],
    tableCode: '',
    headers: {},
    sslVerify: 1,
    timeoutMs: 5000,
    maxRetry: 5,
    status: 1,
    remark: '',
    revision: 1,
    tenantId: '',
    createdBy: '',
    createdTime: '',
    updatedBy: '',
    updatedTime: '',
    deletedFlag: 'N'
  } as SystemWebhookNamespace.WebhookSubscriptionForm;
}

const formModel = reactive<SystemWebhookNamespace.WebhookSubscriptionForm>(defaultModel());

const rules = {
  subscriptionName: createRequiredFormRule('请填写订阅名称'),
  url: createRequiredFormRule('请填写回调地址'),
  events: createRequiredFormRule('请至少选择一个事件')
};

/** 事件类型码的中文说明（后端 WebhookEventTypes 只返回编码） */
const EVENT_LABELS: Record<string, string> = {
  'dynamic.data.created': '数据新增',
  'dynamic.data.updated': '数据更新',
  'dynamic.data.deleted': '数据删除',
  'flow.instance.started': '流程发起',
  'flow.instance.finished': '流程完成',
  'flow.instance.rejected': '流程驳回'
};

function loadEventTypes() {
  findWebhookEventTypes().then(res => {
    if (res.error === null && res.data) {
      eventOptions.value = res.data.map(item => ({ label: EVENT_LABELS[item] || item, value: item }));
    }
  });
}

function loadApps() {
  findSystemAppListByOrg().then(res => {
    if (res.error === null && res.data) {
      appOptions.value = res.data.map((item: any) => ({ label: item.appName, value: item.id }));
    }
  });
}

function fillModel(data: SystemWebhookNamespace.WebhookSubscriptionForm) {
  Object.assign(formModel, defaultModel(), data);
  if (!formModel.events) {
    formModel.events = [];
  }
  headerRows.value = Object.entries(data.headers || {}).map(([key, value]) => ({
    key,
    value: String(value)
  }));
}

watch(
  () => props.visible,
  value => {
    if (!value) {
      return;
    }
    loadEventTypes();
    loadApps();
    if (props.type === 'add') {
      Object.assign(formModel, defaultModel());
      headerRows.value = [];
      return;
    }
    if (props.editData?.id) {
      findWebhookSubscriptionDetail(props.editData.id).then(res => {
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
    const headers: Record<string, any> = {};
    headerRows.value.forEach(row => {
      if (row.key) {
        headers[row.key] = row.value;
      }
    });
    const payload = { ...formModel, headers };
    if (!payload.tableCode) {
      delete payload.tableCode;
    }
    submitting.value = true;
    const requestPromise = payload.id ? updateWebhookSubscription(payload) : saveWebhookSubscription(payload);
    requestPromise
      .then(res => {
        if (res.error === null) {
          window.$message?.success('保存成功');
          const created = res.data as SystemWebhookNamespace.WebhookSubscriptionForm;
          if (!payload.id && created?.secret) {
            emit('secret', created);
          }
          modalVisible.value = false;
          emit('closed');
        } else {
          window.$message?.error(res.error?.message || '保存失败');
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
  <ElDrawer v-model="modalVisible" :size="640" placement="right" :title="title">
    <ElForm ref="formRef" :model="formModel" :rules="rules" label-position="left" label-width="110" :disabled="isView">
      <ElFormItem label="订阅名称" path="subscriptionName">
        <ElInput v-model="formModel.subscriptionName" placeholder="如：推给 MES 的工单变更" />
      </ElFormItem>

      <ElFormItem label="归属应用" path="appId">
        <ElSelect v-model="formModel.appId" filterable clearable placeholder="可留空">
          <ElOption v-for="opt in appOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="回调地址" path="url">
        <ElInput v-model="formModel.url" placeholder="https://example.com/hooks/dynamic" />
      </ElFormItem>

      <ElFormItem label="请求方法" path="httpMethod">
        <ElSelect v-model="formModel.httpMethod">
          <ElOption
            v-for="opt in [
              { label: 'POST', value: 'POST' },
              { label: 'PUT', value: 'PUT' }
            ]"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="订阅事件" path="events">
        <ElSelect v-model="formModel.events" multiple placeholder="选择要接收的事件">
          <ElOption v-for="opt in eventOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="限定表编码" path="tableCode">
        <ElInput v-model="formModel.tableCode" placeholder="留空表示收本组织全部表的事件" />
      </ElFormItem>

      <ElFormItem label="超时(毫秒)" path="timeoutMs">
        <ElInputNumber v-model="formModel.timeoutMs" :min="500" :max="30000" class="w-200px" />
      </ElFormItem>

      <ElFormItem label="重试次数" path="maxRetry">
        <ElInputNumber v-model="formModel.maxRetry" :min="0" :max="10" class="w-200px" />
        <span class="ml-8px text-12px opacity-70">退避递增，超过后置为 DEAD，可手动重发</span>
      </ElFormItem>

      <ElFormItem label="校验证书" path="sslVerify">
        <ElRadioGroup v-model="formModel.sslVerify">
          <ElRadio :value="1">校验（默认）</ElRadio>
          <ElRadio :value="0">不校验（内网自签证书）</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem label="附加请求头">
        <div class="w-full">
          <div v-for="(row, index) in headerRows" :key="index" class="mb-8px flex items-center gap-8px">
            <ElInput v-model="row.key" placeholder="如 X-Tenant" class="flex-1" />
            <ElInput v-model="row.value" placeholder="值" class="flex-1" />
            <ElButton size="small" tertiary type="danger" @click="headerRows.splice(index, 1)">删除</ElButton>
          </div>
          <ElButton size="small" dashed block @click="headerRows.push({ key: '', value: '' })">添加请求头</ElButton>
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
