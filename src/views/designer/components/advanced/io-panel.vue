<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  ElButton as __forwarded_ElButton,
  ElCard as __forwarded_ElCard,
  ElForm as __forwarded_ElForm,
  ElFormItem as __forwarded_ElFormItem,
  ElInputNumber as __forwarded_ElInputNumber,
  ElRadioButton as __forwarded_ElRadioButton,
  ElRadioGroup as __forwarded_ElRadioGroup,
  ElSwitch as __forwarded_ElSwitch
} from 'element-plus';
import { getIoConfig, saveIoConfig } from '@/service/api/dynamic/advanced';

const props = defineProps<{
  form: { formId: string; tableCode: string; fieldOptions: Array<{ label: string; value: string }> };
}>();
const saving = ref(false);
const config = ref<AdvancedNamespace.IoConfig>(buildDefault());

function buildDefault(): AdvancedNamespace.IoConfig {
  return {
    formId: props.form.formId,
    exportEnabled: 'N',
    importEnabled: 'N',
    exportScope: 'SELF',
    sensitivePolicy: 'MASK',
    dupStrategy: 'SKIP',
    strictValidate: 'Y',
    importLimit: 5000,
    importAsync: 'Y',
    runBackscript: 'N',
    triggerMode: 'SUPPRESS',
    importFlowMode: 'NONE'
  };
}

async function load() {
  const { data, error } = await getIoConfig(props.form.formId);
  if (!error && data) {
    config.value = { ...buildDefault(), ...data, formId: props.form.formId };
  }
}

async function save() {
  saving.value = true;
  try {
    const { error } = await saveIoConfig(config.value);
    if (!error) {
      window.$message?.success('导入/导出配置已保存，实时生效（不随表单版本发布/回滚）');
    }
  } finally {
    saving.value = false;
  }
}

onMounted(load);

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElCard = __forwarded_ElCard;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElForm = __forwarded_ElForm;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElFormItem = __forwarded_ElFormItem;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInputNumber = __forwarded_ElInputNumber;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElRadioGroup = __forwarded_ElRadioGroup;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElRadioButton = __forwarded_ElRadioButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSwitch = __forwarded_ElSwitch;
</script>

<template>
  <div class="io-panel">
    <ElCard title="数据导出" size="small" class="panel-card">
      <ElForm label-position="left" label-width="150">
        <ElFormItem label="允许数据导出">
          <ElSwitch v-model="config.exportEnabled" active-value="Y" inactive-value="N" />
        </ElFormItem>
        <ElFormItem label="导出范围">
          <ElRadioGroup v-model="config.exportScope">
            <ElRadioButton value="SELF">本人</ElRadioButton>
            <ElRadioButton value="DEPT">本部门</ElRadioButton>
            <ElRadioButton value="ALL">全部</ElRadioButton>
          </ElRadioGroup>
          <span class="hint">与查看者行级数据范围取交集，不会放大权限</span>
        </ElFormItem>
        <ElFormItem label="敏感字段处理">
          <ElRadioGroup v-model="config.sensitivePolicy">
            <ElRadioButton value="MASK">脱敏（138****1234）</ElRadioButton>
            <ElRadioButton value="HIDE">不出列</ElRadioButton>
          </ElRadioGroup>
          <span class="hint">对导出/打印/外链三条链路统一生效；字段勾选在「列表设计」</span>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard title="数据导入" size="small" class="panel-card">
      <ElForm label-position="left" label-width="150">
        <ElFormItem label="允许数据导入">
          <ElSwitch v-model="config.importEnabled" active-value="Y" inactive-value="N" />
        </ElFormItem>
        <ElFormItem label="重复键策略">
          <ElRadioGroup v-model="config.dupStrategy">
            <ElRadioButton value="SKIP">跳过</ElRadioButton>
            <ElRadioButton value="OVERWRITE">覆盖</ElRadioButton>
            <ElRadioButton value="REJECT">整批报错</ElRadioButton>
          </ElRadioGroup>
          <span class="hint">冲突键 = id 列 + 字段属性里设了「不允许重复」的业务列</span>
        </ElFormItem>
        <ElFormItem label="必填/类型校验">
          <ElSwitch v-model="config.strictValidate" active-value="Y" inactive-value="N" />
          <span class="hint">关闭时仅做类型转换（用于数据迁移）</span>
        </ElFormItem>
        <ElFormItem label="单次导入上限">
          <ElInputNumber v-model="config.importLimit" :min="1" :max="50000" />
        </ElFormItem>
        <ElFormItem label="导入触发联动">
          <ElRadioGroup v-model="config.triggerMode">
            <ElRadioButton value="SUPPRESS">不触发（默认）</ElRadioButton>
            <ElRadioButton value="FIRE">触发</ElRadioButton>
          </ElRadioGroup>
          <span class="hint">默认不触发：5000 行导入若逐行发联动会打出上万动作，改由「导入完成后重算」显式补算</span>
        </ElFormItem>
        <ElFormItem label="工作流表单导入">
          <ElRadioGroup v-model="config.importFlowMode">
            <ElRadioButton value="NONE">不发起流程</ElRadioButton>
            <ElRadioButton value="AUTO_START">自动发起</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <div class="panel-actions">
      <ElButton type="primary" :loading="saving" @click="save">保存配置</ElButton>
      <span class="hint">运行时的导入/导出按钮与异步导入任务为 P1 交付项，本面板先行管理策略配置</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.io-panel {
  max-width: 860px;
}

.panel-card {
  margin-bottom: 12px;
}

.panel-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.hint {
  margin-left: 12px;
  font-size: 12px;
  color: #999;
}
</style>
