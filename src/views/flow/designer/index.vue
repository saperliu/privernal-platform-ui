<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { findFlowDefinitionDetail } from '@/service';
import { type FlowDesignerModule, loadWarmFlowDesigner, setCurrentFormCode } from '@/libs/warm-flow-designer';
import NodeFormPermPanel from '@/views/designer/components/node-form-perm-panel.vue';
import FlowConditionEditor from '@/views/flow/components/flow-condition-editor.vue';

const route = useRoute();
const router = useRouter();

const designerRef = ref<any>(null);
const moduleRef = shallowRef<FlowDesignerModule | null>(null);
const loading = ref(true);
const hasUnsavedChanges = ref(false);

const definitionId = computed(() => {
  const id = route.query.definitionId || route.query.id;
  return id ? String(id) : '';
});

const isEditMode = computed(() => Boolean(definitionId.value));

/** 流程编码：人员设置面板按它定位权限草稿版本 */
const flowCode = ref('');

async function loadFlowCode() {
  if (!definitionId.value) {
    flowCode.value = '';
    return;
  }
  try {
    const res = await findFlowDefinitionDetail(definitionId.value);
    if (res.error === null && res.data) {
      flowCode.value = String((res.data as any).flowCode ?? '');
    }
  } catch (e) {
    console.error('查询流程定义失败', e);
  }
}

const designProps = computed(() => ({
  definitionId: definitionId.value || undefined,
  disabled: false,
  onlyDesignShow: false
}));

async function initDesigner() {
  try {
    loading.value = true;
    const mod = await loadWarmFlowDesigner();
    moduleRef.value = mod;
  } catch (e) {
    console.error('加载设计器失败', e);
    window.$message?.error('流程设计器加载失败');
  } finally {
    loading.value = false;
  }
}

function onSaved(payload: any) {
  hasUnsavedChanges.value = false;
  const id = payload?.data?.id || payload?.id;
  window.$message?.success(`保存成功，流程ID：${id}`);
  if (!isEditMode.value && id) {
    router.replace({ path: '/flow/designer', query: { definitionId: String(id) } });
  }
}

function onClose() {
  router.push('/flow/definition');
}

function onDirty(dirty: boolean) {
  hasUnsavedChanges.value = dirty;
}

function onNodeClick(payload: any) {
  console.log('节点点击', payload);
}

function onReady(payload: any) {
  console.log('设计器就绪', payload);
}

function onBeforeSave(payload: any) {
  console.log('保存前', payload);
}

onMounted(() => {
  // 本页流程不绑定动态表单：清掉 dataProvider 模块级残留的表单编码，
  // 避免保存时把其它表单的 formCustom/formPath 注入到这里的节点
  setCurrentFormCode('');
  initDesigner();
  loadFlowCode();
});

watch(
  () => route.query.definitionId,
  () => {
    hasUnsavedChanges.value = false;
    loadFlowCode();
  }
);
</script>

<template>
  <div class="flow-designer-page h-full flex-col">
    <div
      v-if="loading"
      v-loading="true"
      class="flex flex-1 items-center justify-center"
      element-loading-text="流程设计器加载中..."
    />
    <div v-else-if="moduleRef" class="flex flex-col flex-1 overflow-hidden">
      <div class="designer-toolbar">
        <ElSpace>
          <ElButton @click="router.push('/flow/definition')">返回列表</ElButton>
          <ElTag v-if="hasUnsavedChanges" type="warning" size="small">有未保存的改动</ElTag>
          <ElTag v-else type="success" size="small">已保存</ElTag>
        </ElSpace>
        <ElSpace>
          <ElButton v-if="designerRef" size="small" @click="moduleRef?.useFlowDesigner().zoomIn()">放大</ElButton>
          <ElButton v-if="designerRef" size="small" @click="moduleRef?.useFlowDesigner().zoomOut()">缩小</ElButton>
          <ElButton v-if="designerRef" size="small" @click="moduleRef?.useFlowDesigner().fitView()">适应</ElButton>
          <ElButton v-if="designerRef" size="small" @click="moduleRef?.useFlowDesigner().undo()">撤销</ElButton>
          <ElButton v-if="designerRef" size="small" @click="moduleRef?.useFlowDesigner().redo()">重做</ElButton>
        </ElSpace>
      </div>

      <div class="designer-body flex flex-1 overflow-hidden">
        <FlowDesigner
          v-if="moduleRef"
          ref="designerRef"
          v-bind="designProps"
          @saved="onSaved"
          @close="onClose"
          @dirty="onDirty"
          @node-click="onNodeClick"
          @ready="onReady"
          @before-save="onBeforeSave"
        >
          <template #node-form-extra="{ form, disabled, nodes }">
            <!--
 人员设置等节点扩展配置：复用动态表单流程设计页的扩展面板，
                 人员/超时/节点规则/流转规则写节点 permissionFlag/ext/nodeRatio/anyNodeSkip 随流程保存，字段/按钮权限存 flow_form_version 草稿 
-->
            <NodeFormPermPanel :form="form" :disabled="disabled" table-code="" :flow-code="flowCode" :nodes="nodes" />
          </template>

          <!-- 网关连线「节点流转条件」：替换边面板内置的运算符条件行（独立设计器页无绑定表单，仅系统/组织机构/角色分组） -->
          <template #skip-condition="{ form, disabled }">
            <FlowConditionEditor :form="form" :disabled="disabled" table-code="" />
          </template>

          <template #loading>
            <div v-loading="true" class="designer-loading h-full" element-loading-text="流程加载中..." />
          </template>
        </FlowDesigner>
      </div>
    </div>
    <div v-else class="flex flex-1 items-center justify-center">
      <ElResult status="500" title="设计器加载失败" description="请刷新页面重试">
        <template #footer>
          <ElButton type="primary" @click="initDesigner">重新加载</ElButton>
        </template>
      </ElResult>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.flow-designer-page {
  height: 100%;
  background: #f4f6fa;
}

.designer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.designer-body {
  position: relative;
}

.designer-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f6fa;
}
</style>

<style lang="scss">
/* 独立流程设计器页与动态表单流程设计页同一套隐藏口径（规则释义见 flow-design-panel.vue）：
   节点属性抽屉与基本信息弹窗 append-to-body，必须全局样式；EP 类名 .el-form-item/.el-switch */
.property-drawer-modern .modern-tab-item:nth-child(n + 2) {
  display: none;
}

.property-drawer-modern .el-form-item:has(.radio-card-group.radio-card-sm),
.property-drawer-modern .el-form-item:has(.radio-card-group.radio-card-sm) + .el-form-item {
  display: none;
}

.property-drawer-modern .el-drawer__body {
  scrollbar-width: none;
}

.property-drawer-modern .el-drawer__body::-webkit-scrollbar {
  display: none;
}

.dialogForm .el-form-item:has(.el-switch),
.dialogForm .el-form-item:has(.el-switch) + .el-form-item {
  display: none;
}
</style>
