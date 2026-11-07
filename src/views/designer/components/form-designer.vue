<script setup lang="ts">
import { computed, ref, shallowRef, watchEffect } from 'vue';
import { type PageSchema, EDesigner as __forwarded_EDesigner, findSchemas } from 'phoenix-designer';
import { registerBackScriptCompletion, setBackScriptFields } from '@/utils/form/back-script-completion';

const MonacoEditorConfig = {
  minimap: {
    enabled: false
  },
  selectOnLineNumbers: true,
  theme: 'vs-light'
};
const designerRef = ref<InstanceType<typeof EDesigner>>();
/** 设计器内部的 live pageSchema（reactive 引用）：顶栏与属性面板双向实时同步用 */
const pageSchemaLive = shallowRef<any>(null);
/** 界面设计 / 后端代码 二级页签 */
const innerTab = ref('from');
export interface Props {
  backScript?: { script: string; transactional: boolean };
  formData?: PageSchema;
  /** 保存中状态，用于二级页签右侧的保存按钮 */
  saving?: boolean;
  /** 存草稿中状态 */
  draftSaving?: boolean;
}
defineOptions({ name: 'SystemMessageList' });
const props = defineProps<Props>();

// 后端代码编辑器的语法提示：绑定变量/工具库注册一次，字段列表随画布实时注入
registerBackScriptCompletion();
watchEffect(() => {
  const schemas = props.formData?.schemas ?? pageSchemaLive.value?.schemas ?? [];
  const matched = findSchemas(schemas as any[], (schema: any) => Boolean(schema?.input && schema?.field));
  const list = Array.isArray(matched) ? matched : [];
  setBackScriptFields(
    list.map((schema: any) => ({
      label: String(schema.label ?? schema.field),
      value: String(schema.field)
    }))
  );
});

/** 后端代码编辑内容，未传入时使用默认空脚本 */
const backScriptValue = computed(() => props.backScript ?? { script: '', transactional: true });

interface Emits {
  (e: 'submit', data: any): void;
  (e: 'draft', data: any): void;
}
const emit = defineEmits<Emits>();

function handleChange() {
  return true;
}

function handleSubmit() {
  const formData = designerRef.value?.getData();
  emit('submit', formData);
}

/** 存草稿：内容只进版本快照，不生效、不改物理表 */
function handleDraft() {
  const formData = designerRef.value?.getData();
  emit('draft', formData);
}

/** 新窗口打开后端代码示例手册（public/back-script-examples.html，无需登录的独立页面） */
function openBackScriptHelp() {
  window.open('/back-script-examples.html', '_blank');
}

/** 供父组件通过模板引用加载表单配置 */
function setData(data: PageSchema) {
  designerRef.value?.setData?.(data);
}

function getData() {
  return designerRef.value?.getData();
}

/** 设计器 ready 后取内部 live pageSchema（reactive），父组件据此做顶栏↔属性面板双向同步 */
function handleDesignerReady(pageManager: any) {
  pageSchemaLive.value = pageManager?.pageSchema ?? null;
}

function getPageSchemaLive() {
  return pageSchemaLive.value;
}

defineExpose({ setData, getData, getPageSchemaLive });

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const EDesigner = __forwarded_EDesigner;
</script>

<template>
  <!--
 EP 的 ElTabs 没有 #suffix 插槽（naive 迁移遗留：写在 #suffix 里的按钮被静默丢弃，
       迁移后设计器一直无法保存），保存按钮改为页签行右侧的独立定位按钮组 
-->
  <div class="form-designer-wrap">
    <ElTabs v-model="innerTab" animated class="form-designer-tabs" @before-leave="handleChange">
      <ElTabPane name="from" label="界面设计" display-directive="show">
        <EDesigner
          ref="designerRef"
          form-mode
          title="PhoenixDesigner基础用法示例"
          hidden-header
          @ready="handleDesignerReady"
        ></EDesigner>
      </ElTabPane>
      <ElTabPane name="back" display-directive="show">
        <!-- EP 的 ElTabPane 页签文字走 #label 插槽（#tab 是 naive 的插槽名，EP 下页签会变空白） -->
        <template #label>
          <span class="back-tab-label">
            后端代码
            <!-- EP 的 ElTooltip：默认插槽是触发元素，正文走 content（#reference 是 Popover 的插槽，这里不会渲染） -->
            <ElTooltip placement="top" content="查看语法与示例：for / while / switch、数据操作等">
              <ElButton
                text
                type="primary"
                size="small"
                class="back-tab-help"
                title="后端代码示例手册"
                @click.stop="openBackScriptHelp"
              >
                ?
              </ElButton>
            </ElTooltip>
          </span>
        </template>
        <MonacoEditor
          ref="monacoEditorRef"
          v-model="backScriptValue.script"
          class="h-full"
          theme="vs-light"
          language="java"
          :config="MonacoEditorConfig"
        />
      </ElTabPane>
    </ElTabs>
    <div class="fd-save-actions">
      <ElButton size="small" class="tab-save-btn" :loading="draftSaving" @click="handleDraft()">存草稿</ElButton>
      <ElButton type="primary" size="small" :loading="saving" class="tab-save-btn" @click="handleSubmit()">
        保存
      </ElButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-designer-wrap {
  position: relative;
  height: 100%;
}

// 保存按钮组住在页签行右侧（绝对定位覆盖在 tabs 头部之上），与 34px 细条共存
.fd-save-actions {
  position: absolute;
  top: 2px;
  right: 12px;
  z-index: 6;
  display: flex;
  gap: 4px;
  align-items: center;
}

.form-designer-tabs {
  height: 100%;

  // 二级页签只是画布的切换器，做成细条，不与设计器顶部再叠一层大间距
  :deep(.n-tabs-nav) {
    height: 34px;
    padding: 0 14px;
    background: rgb(var(--container-bg-color));
    border-bottom: 1px solid rgba(31, 41, 55, 0.08);
  }

  :deep(.n-tabs-tab) {
    padding: 4px 10px;
    font-size: 13px;
  }

  :deep(.n-tabs-pane-wrapper),
  :deep(.n-tab-pane) {
    height: 100%;
    padding: 0;
  }

  :deep(.n-tabs-pane-wrapper) {
    overflow: hidden;
  }
}

html.dark .form-designer-tabs {
  :deep(.n-tabs-nav) {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
}

// 保存按钮住在页签行右侧，与 34px 细条共存
.tab-save-btn {
  margin-left: 4px;
}

// 「后端代码」tab 标签 + 问号帮助按钮
.back-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.back-tab-help {
  width: 16px;
  height: 16px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid currentColor;
  font-size: 12px;
  line-height: 1;
}
</style>
