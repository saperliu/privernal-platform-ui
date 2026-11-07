<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ElEmpty as __forwarded_ElEmpty,
  ElTabPane as __forwarded_ElTabPane,
  ElTabs as __forwarded_ElTabs
} from 'element-plus';
import { collectFormFieldOptions } from '@/components/business/form-field-options';
import IoPanel from './io-panel.vue';
import SharePanel from './share-panel.vue';
import LinkagePanel from './linkage-panel.vue';
import DocTemplatePanel from './doc-template-panel.vue';
import ScriptPanel from './script-panel.vue';

const props = defineProps<{
  dynamicForm: {
    id: string;
    tableCode: string;
    tableName: string;
    metaData?: Record<string, any> | null;
  };
}>();

const activeTab = ref('linkage');

/** 未保存过表单时其余配置都没有锚点（所有配置以 form_id 关联，§3.2） */
const saved = computed(() => Boolean(props.dynamicForm.id));

/** metaData schemas 顶层输入组件 → 字段下拉选项（联动条件/动作共用） */
const fieldOptions = computed(() => collectFormFieldOptions(props.dynamicForm.metaData));

const formRef = computed(() => ({
  formId: props.dynamicForm.id,
  tableCode: props.dynamicForm.tableCode,
  tableName: props.dynamicForm.tableName,
  fieldOptions: fieldOptions.value,
  // 单据模板的字段树与「打印参数」的字段下拉都取自 metaData.schemas：此前没往下传，
  // 导致编辑器侧栏字段为空、参数按钮被 disabled（看着像"参数无法添加"）
  metaData: props.dynamicForm.metaData
}));

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElEmpty = __forwarded_ElEmpty;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTabPane = __forwarded_ElTabPane;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTabs = __forwarded_ElTabs;
</script>

<template>
  <div class="advanced-panel">
    <ElEmpty
      v-if="!saved"
      class="advanced-empty"
      description="请先保存表单：高级设置（导入导出/外链/单据模板/联动规则）都以表单为锚点实时生效，不随版本发布回滚"
    />
    <ElTabs v-else v-model="activeTab" animated>
      <ElTabPane name="linkage" label="联动规则">
        <LinkagePanel :form="formRef" />
      </ElTabPane>
      <ElTabPane name="script" label="校验与算法">
        <ScriptPanel :form="formRef" />
      </ElTabPane>
      <ElTabPane name="share" label="外链管理">
        <SharePanel :form="formRef" />
      </ElTabPane>
      <ElTabPane name="docTemplate" label="单据模板">
        <DocTemplatePanel :form="formRef" />
      </ElTabPane>
      <ElTabPane name="io" label="导入/导出设置">
        <IoPanel :form="formRef" />
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<style lang="scss" scoped>
.advanced-panel {
  height: 100%;
  padding: 12px 16px;
  overflow: auto;
  background: var(--ds-canvas);
}

.advanced-empty {
  margin-top: 80px;
}
</style>
