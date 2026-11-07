<script setup lang="tsx">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElButton as __forwarded_ElButton } from 'element-plus';
import {
  findOpenApiCredentialDetail,
  findSystemAppListByOrg,
  saveOpenApiCredentialDetail,
  updateOpenApiCredentialDetail
} from '@/service';
import { createRequiredFormRule } from '@/utils/form/rule';

export type ModalType = 'add' | 'edit' | 'view';

export interface Props {
  visible: boolean;

  type?: ModalType;

  editData?: SystemOpenapiNamespace.OpenApiCredentialForm | null;
}

defineOptions({ name: 'SystemOpenapiCredentialModal' });

const props = withDefaults(defineProps<Props>(), { type: 'add', editData: null });

interface Emits {
  (e: 'update:visible', value: boolean): void;

  (e: 'closed'): void;

  /** 明文密钥只在这里出现一次，交由列表页弹窗展示 */
  (e: 'secret', data: SystemOpenapiNamespace.OpenApiCredentialForm): void;
}

const emit = defineEmits<Emits>();
const formRef = ref<FormInstance | null>(null);
const submitting = ref(false);

const modalVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
});

const title = computed(() => {
  const titles: Record<ModalType, string> = { add: '新建凭证', edit: '编辑凭证', view: '凭证详情' };
  return titles[props.type];
});

const isView = computed(() => props.type === 'view');

/**
 * NDatePicker 只吃时间戳，而后端读写 Date 分别要 epoch millis / 回的是 ISO 串，
 * 所以这里单独用一个 number ref 做转换，不污染表单模型的类型
 */
const expireTs = ref<number | null>(null);

const scopeOptions = [
  { label: 'data:read 读数据', value: 'data:read' },
  { label: 'data:write 写数据', value: 'data:write' },
  { label: 'flow:start 发起流程', value: 'flow:start' },
  { label: 'meta:read 读元数据', value: 'meta:read' },
  { label: 'schedule:write 定时任务写入', value: 'schedule:write' },
  { label: 'schedule:read 定时任务查询', value: 'schedule:read' }
];

const actionOptions = [
  { label: 'list 列表', value: 'list' },
  { label: 'read 单条读', value: 'read' },
  { label: 'add 新增', value: 'add' },
  { label: 'edit 修改', value: 'edit' },
  { label: 'remove 删除', value: 'remove' },
  { label: 'start 发起流程', value: 'start' }
];

const appOptions = ref<{ label: string; value: string }[]>([]);

function defaultModel(): SystemOpenapiNamespace.OpenApiCredentialForm {
  return {
    id: '',
    appId: '',
    credentialName: '',
    scopes: ['data:read'],
    tableGrants: [],
    status: 1,
    rateLimitPerMinute: 600,
    boundUserId: '',
    boundDepartmentId: '',
    remark: '',
    revision: 1,
    tenantId: '',
    createdBy: '',
    createdTime: '',
    updatedBy: '',
    updatedTime: '',
    deletedFlag: 'N'
  } as SystemOpenapiNamespace.OpenApiCredentialForm;
}

const formModel = reactive<SystemOpenapiNamespace.OpenApiCredentialForm>(defaultModel());

const rules = {
  credentialName: createRequiredFormRule('请填写凭证名称'),
  appId: createRequiredFormRule('请选择归属应用'),
  scopes: createRequiredFormRule('请至少选择一个 API 范围')
};

async function loadApps() {
  const { data, error } = await findSystemAppListByOrg();
  if (error === null && data) {
    appOptions.value = data.map((item: any) => ({ label: item.appName, value: item.id }));
  }
}

function fillModel(data: SystemOpenapiNamespace.OpenApiCredentialForm) {
  Object.assign(formModel, defaultModel(), data);
  if (!formModel.scopes) {
    formModel.scopes = [];
  }
  if (!formModel.tableGrants) {
    formModel.tableGrants = [];
  }
  expireTs.value = data.expireTime ? new Date(String(data.expireTime)).getTime() : null;
}

watch(
  () => props.visible,
  value => {
    if (!value) {
      return;
    }
    loadApps();
    if (props.type === 'add') {
      Object.assign(formModel, defaultModel());
      expireTs.value = null;
      return;
    }
    if (props.editData?.id) {
      findOpenApiCredentialDetail(props.editData.id).then(res => {
        if (res.error === null && res.data) {
          fillModel(res.data);
        }
      });
    }
  }
);

function addGrant() {
  formModel.tableGrants.push({ tableCode: '', actions: ['list'] });
}

function removeGrant(index: number) {
  formModel.tableGrants.splice(index, 1);
}

function handleSubmit() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) {
      window.$message?.error('请检查必填项');
      return;
    }
    const invalid = formModel.tableGrants.some(item => !item.tableCode || !item.actions?.length);
    if (invalid) {
      window.$message?.error('表授权每行都要填表编码并至少选一个动作');
      return;
    }
    submitting.value = true;
    const payload = { ...formModel };
    // 过期时间以时间戳提交：Jackson 对 Date 能解 epoch millis，解不了 "yyyy-MM-dd HH:mm:ss"
    if (expireTs.value) {
      payload.expireTime = expireTs.value;
    } else {
      delete payload.expireTime;
    }
    const requestPromise = payload.id ? updateOpenApiCredentialDetail(payload) : saveOpenApiCredentialDetail(payload);
    requestPromise
      .then(res => {
        if (res.error === null) {
          window.$message?.success('保存成功');
          const created = res.data as SystemOpenapiNamespace.OpenApiCredentialForm;
          // 新建时后端把明文 secret 放在同一次响应里，错过就只能轮换
          if (!payload.id && created?.secret) {
            emit('secret', created);
          }
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
  <ElDrawer v-model="modalVisible" :size="640" placement="right" :title="title">
    <ElForm ref="formRef" :model="formModel" :rules="rules" label-position="left" label-width="110" :disabled="isView">
      <ElFormItem label="凭证名称" path="credentialName">
        <ElInput v-model="formModel.credentialName" placeholder="如：MES 对接用的读数据密钥" />
      </ElFormItem>

      <ElFormItem label="归属应用" path="appId">
        <ElSelect v-model="formModel.appId" filterable placeholder="选择这把密钥属于哪个应用">
          <ElOption v-for="opt in appOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="API 范围" path="scopes">
        <ElSelect v-model="formModel.scopes" multiple placeholder="凭证能调哪几类接口">
          <ElOption v-for="opt in scopeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="每分钟额度" path="rateLimitPerMinute">
        <ElInputNumber v-model="formModel.rateLimitPerMinute" :min="1" :max="100000" class="w-200px" />
        <span class="ml-8px text-12px opacity-70">超出后返回 429，默认 600</span>
      </ElFormItem>

      <ElFormItem label="过期时间" path="expireTime">
        <ElDatePicker v-model="expireTs" type="datetime" clearable class="w-240px" />
        <span class="ml-8px text-12px opacity-70">留空表示长期有效</span>
      </ElFormItem>

      <ElFormItem label="数据归属人" path="boundUserId">
        <ElInput v-model="formModel.boundUserId" placeholder="留空则取当前登录人" />
      </ElFormItem>

      <ElFormItem label="归属部门" path="boundDepartmentId">
        <ElInput v-model="formModel.boundDepartmentId" placeholder="留空则取当前登录人的部门" />
      </ElFormItem>

      <ElFormItem label="表与动作授权">
        <div class="w-full">
          <div v-for="(grant, index) in formModel.tableGrants" :key="index" class="mb-8px flex items-center gap-8px">
            <ElInput v-model="grant.tableCode" placeholder="表编码，如 xl_work_order" class="flex-1" />
            <ElSelect v-model="grant.actions" multiple class="flex-1" placeholder="允许的动作">
              <ElOption v-for="opt in actionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
            <ElButton size="small" tertiary type="danger" @click="removeGrant(index)">删除</ElButton>
          </div>
          <ElButton size="small" dashed block @click="addGrant">添加一张表</ElButton>
          <div class="mt-6px text-12px opacity-70">
            只有列在这里的表才允许调用；审批类动作刻意不开放，外部系统不能替人审批。
          </div>
        </div>
      </ElFormItem>

      <ElFormItem label="状态" path="status">
        <ElRadioGroup v-model="formModel.status">
          <ElRadio :value="1">启用</ElRadio>
          <ElRadio :value="0">停用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem label="备注" path="remark">
        <ElInput v-model="formModel.remark" type="textarea" placeholder="给谁用的、什么时候可以撤" />
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
