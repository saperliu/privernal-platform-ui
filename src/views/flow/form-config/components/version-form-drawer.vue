<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, reactive, ref, watch } from 'vue';
import {
  ElButton,
  ElInput,
  ElSelect,
  ElSwitch,
  ElSpace as __forwarded_ElSpace,
  ElTabPane as __forwarded_ElTabPane,
  ElTabs as __forwarded_ElTabs
} from 'element-plus';
import {
  copyFlowFormVersion,
  findFlowDefinitionDetail,
  findFlowDefinitionList,
  findFlowFormVersionDetail,
  saveFlowFormVersion
} from '@/service';
import { useLoading } from '@/hooks';
import { btnCodeLabel, normalizeBtnCode } from '../../components/btn-perm';

/**
 * 流程表单配置版本明细编辑抽屉：
 * 1. 第一个 tab 固定为"全局配置"（nodeCode=global），其后每个流程节点一个 tab；
 * 2. 字段/按钮权限为结构化表格编辑（替代旧 JSON textarea）；
 * 3. 仅草稿可保存，已发布版本只读查看；
 * 4. 节点未配置时可将全局配置一键复制为该节点配置。
 */

const props = defineProps<{
  show: boolean;
  versionId: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'saved'): void;
}>();
const { loading: detailLoading, startLoading, endLoading } = useLoading(false);
const saving = ref(false);

const detail = ref<FlowNamespace.FormVersion | null>(null);
const nodes = ref<Array<{ nodeCode: string; nodeName: string }>>([]);
const activeTab = ref<string>('global');

interface NodeConfig {
  fields: FlowNamespace.FormFieldPerm[];
  btns: FlowNamespace.FormBtnPerm[];
}

const nodeMap = reactive<Record<string, NodeConfig>>({});

const isDraft = computed(() => detail.value?.publishStatus === 0);

const btnColorOptions = ['default', 'primary', 'info', 'success', 'warning', 'error'].map(value => ({
  label: value,
  value
}));

watch(
  () => props.show,
  show => {
    if (show && props.versionId) {
      open();
    }
  }
);

async function open() {
  startLoading();
  try {
    const detailResult = await findFlowFormVersionDetail(props.versionId as string);
    const version = detailResult.data || null;
    detail.value = version;
    nodes.value = [];
    if (version) {
      const defResult = await findFlowDefinitionList({
        pageNum: 1,
        pageSize: 1,
        flowCode: version.flowCode,
        keywords: []
      });
      const definition = defResult.data?.list?.[0];
      if (definition) {
        const defDetailResult = await findFlowDefinitionDetail(String(definition.id));
        const defDetail = defDetailResult.data as unknown as {
          nodeList?: Array<{ nodeCode: string; nodeName: string }>;
        };
        nodes.value = (defDetail?.nodeList || []).filter(node => node.nodeCode);
      }
    }
    buildNodeMap(version);
    activeTab.value = 'global';
  } finally {
    endLoading();
  }
}

function buildNodeMap(version: FlowNamespace.FormVersion | null) {
  Object.keys(nodeMap).forEach(key => Reflect.deleteProperty(nodeMap, key));
  const globalFields = (version?.fieldPermList || []).filter(item => item.nodeCode === 'global');
  const globalBtns = (version?.btnPermList || []).filter(item => item.nodeCode === 'global');
  nodeMap.global = { fields: globalFields.map(cloneField), btns: globalBtns.map(cloneBtn) };
  nodes.value.forEach(node => {
    const fields = (version?.fieldPermList || []).filter(item => item.nodeCode === node.nodeCode);
    const btns = (version?.btnPermList || []).filter(item => item.nodeCode === node.nodeCode);
    nodeMap[node.nodeCode] = { fields: fields.map(cloneField), btns: btns.map(cloneBtn) };
  });
}

function cloneField(item: FlowNamespace.FormFieldPerm): FlowNamespace.FormFieldPerm {
  return { ...item };
}

function cloneBtn(item: FlowNamespace.FormBtnPerm): FlowNamespace.FormBtnPerm {
  const alias = item.aliasName;
  const sameAsCode = alias !== undefined && alias !== '' && normalizeBtnCode(alias) === normalizeBtnCode(item.btnCode);
  return {
    ...item,
    // 后端内置枚举把别名/名称回填成英文编码：名称补内置中文名、别名留空，表格里不出现英文
    btnName: isEnglishCodeText(item.btnName) ? btnCodeLabel(item.btnCode) || item.btnName : item.btnName,
    aliasName: sameAsCode ? '' : alias
  };
}

/** 纯英文/编码写法的文案（后端枚举回填的 aliasName 就是编码本身） */
function isEnglishCodeText(text?: string) {
  return text !== undefined && text !== '' && !/[\u4E00-\u9FA5]/.test(text);
}

/** 节点未配置时，从全局配置复制一份（nodeCode 替换、清空 id） */
function copyFromGlobal(nodeCode: string) {
  const config = nodeMap[nodeCode];
  if (!config) return;
  config.fields = nodeMap.global.fields.map(item => ({
    ...item,
    id: undefined,
    nodeCode
  }));
  config.btns = nodeMap.global.btns.map(item => ({
    ...item,
    id: undefined,
    nodeCode
  }));
}

function globalFieldCount() {
  return nodeMap.global?.fields.length || 0;
}

const fieldColumns: Ref<DataTable.Column<FlowNamespace.FormFieldPerm>[]> = ref([
  { key: 'fieldCode', title: '字段编码', width: 160, align: 'left' },
  { key: 'fieldName', title: '字段名称', width: 140, align: 'left' },
  {
    key: 'isShow',
    title: '显示',
    width: 70,
    align: 'center',
    render: row => (
      <ElSwitch
        size="small"
        modelValue={row.isShow === 1}
        disabled={!isDraft.value}
        onUpdate:modelValue={(value: string | number | boolean) => {
          row.isShow = value ? 1 : 0;
        }}
      />
    )
  },
  {
    key: 'isEdit',
    title: '可编辑',
    width: 80,
    align: 'center',
    render: row => (
      <ElSwitch
        size="small"
        modelValue={row.isEdit === 1}
        disabled={!isDraft.value}
        onUpdate:modelValue={(value: string | number | boolean) => {
          row.isEdit = value ? 1 : 0;
        }}
      />
    )
  },
  {
    key: 'isRequired',
    title: '必填',
    width: 70,
    align: 'center',
    render: row => (
      <ElSwitch
        size="small"
        modelValue={row.isRequired === 1}
        disabled={!isDraft.value}
        onUpdate:modelValue={(value: string | number | boolean) => {
          row.isRequired = value ? 1 : 0;
        }}
      />
    )
  },
  {
    key: 'defaultValue',
    title: '默认值',
    align: 'left',
    render: row => <ElInput v-model={row.defaultValue} size="small" disabled={!isDraft.value} placeholder="默认值" />
  },
  {
    key: 'dictType',
    title: '字典',
    align: 'left',
    render: row => <ElInput v-model={row.dictType} size="small" disabled={!isDraft.value} placeholder="字典类型" />
  }
]);

const btnColumns: Ref<DataTable.Column<FlowNamespace.FormBtnPerm>[]> = ref([
  { key: 'btnCode', title: '按钮编码', width: 110, align: 'left' },
  { key: 'btnName', title: '按钮名称', width: 100, align: 'left' },
  {
    key: 'aliasName',
    title: '别名',
    align: 'left',
    render: row => <ElInput v-model={row.aliasName} size="small" disabled={!isDraft.value} placeholder="按钮别名" />
  },
  {
    key: 'isShow',
    title: '显示',
    width: 70,
    align: 'center',
    render: row => (
      <ElSwitch
        size="small"
        modelValue={row.isShow === 1}
        disabled={!isDraft.value}
        onUpdate:modelValue={(value: string | number | boolean) => {
          row.isShow = value ? 1 : 0;
        }}
      />
    )
  },
  {
    key: 'showDialog',
    title: '确认弹窗',
    width: 90,
    align: 'center',
    render: row => (
      <ElSwitch
        size="small"
        modelValue={row.showDialog === 1}
        disabled={!isDraft.value}
        onUpdate:modelValue={(value: string | number | boolean) => {
          row.showDialog = value ? 1 : 0;
        }}
      />
    )
  },
  {
    key: 'color',
    title: '颜色',
    width: 120,
    align: 'left',
    render: row => (
      <ElSelect
        v-model={row.color}
        size="small"
        disabled={!isDraft.value}
        options={btnColorOptions}
        placeholder="颜色"
      />
    )
  }
]);

async function handleSave() {
  if (!detail.value) return;
  const fieldPermList: FlowNamespace.FormFieldPerm[] = [];
  const btnPermList: FlowNamespace.FormBtnPerm[] = [];
  let fieldSort = 0;
  let btnSort = 0;
  Object.keys(nodeMap).forEach(nodeCode => {
    nodeMap[nodeCode].fields.forEach(item => {
      fieldSort += 1;
      fieldPermList.push({
        ...item,
        id: undefined,
        versionId: detail.value?.id,
        flowCode: detail.value?.flowCode,
        version: detail.value?.version,
        nodeCode,
        sort: fieldSort
      });
    });
    nodeMap[nodeCode].btns.forEach(item => {
      btnSort += 1;
      btnPermList.push({
        ...item,
        id: undefined,
        versionId: detail.value?.id,
        flowCode: detail.value?.flowCode,
        version: detail.value?.version,
        nodeCode,
        sort: btnSort
      });
    });
  });
  if (fieldPermList.length === 0) {
    window.$message?.error('未配置任何字段权限，请先在全局配置中初始化');
    return;
  }
  saving.value = true;
  try {
    await saveFlowFormVersion({
      id: detail.value.id,
      flowCode: detail.value.flowCode,
      flowName: detail.value.flowName,
      tableCode: detail.value.tableCode,
      formName: detail.value.formName,
      remark: detail.value.remark,
      fieldPermList,
      btnPermList
    });
    window.$message?.success('草稿已保存');
    emit('saved');
  } finally {
    saving.value = false;
  }
}

async function handleCopyDraft() {
  if (!detail.value) return;
  await copyFlowFormVersion(detail.value.id);
  window.$message?.success('已复制为新草稿，请在版本列表中打开编辑');
  emit('update:show', false);
  emit('saved');
}

function close() {
  emit('update:show', false);
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTabPane = __forwarded_ElTabPane;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTabs = __forwarded_ElTabs;
</script>

<template>
  <ElDrawer
    :model-value="props.show"
    size="1080px"
    append-to-body
    @update:model-value="(value: boolean) => emit('update:show', value)"
  >
    <div v-loading="detailLoading">
      <ElTabs v-model="activeTab">
        <ElTabPane name="global">
          <!-- EP 的页签文字只认 #label 插槽（#tab 是 naive 语法，整段不渲染） -->
          <template #label>
            全局配置
            <ElTag v-if="globalFieldCount() === 0" size="small" type="warning" class="ml-4px">未初始化</ElTag>
          </template>
          <DataTable
            :columns="fieldColumns"
            :data="nodeMap.global?.fields || []"
            :max-height="320"
            size="small"
            class="mb-16px"
          />
          <DataTable :columns="btnColumns" :data="nodeMap.global?.btns || []" :max-height="260" size="small" />
        </ElTabPane>
        <ElTabPane
          v-for="node in nodes"
          :key="node.nodeCode"
          :name="node.nodeCode"
          :label="node.nodeName || node.nodeCode"
        >
          <div
            v-if="isDraft && (nodeMap[node.nodeCode]?.fields.length || 0) === 0"
            class="mb-12px flex items-center gap-10px"
          >
            <span class="text-12px text-gray-500">
              该节点暂未配置，可复制全局配置后按需调整（未配置的节点运行时按全局配置生效）
            </span>
            <ElButton size="small" type="primary" plain @click="copyFromGlobal(node.nodeCode)">从全局配置复制</ElButton>
          </div>
          <DataTable
            :columns="fieldColumns"
            :data="nodeMap[node.nodeCode]?.fields || []"
            :max-height="320"
            size="small"
            class="mb-16px"
          />
          <DataTable :columns="btnColumns" :data="nodeMap[node.nodeCode]?.btns || []" :max-height="260" size="small" />
        </ElTabPane>
      </ElTabs>
      <ElEmpty v-if="!detailLoading && !detail" description="版本不存在" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-10px">
        <ElButton @click="close">关闭</ElButton>
        <ElButton v-if="detail && !isDraft" type="primary" plain @click="handleCopyDraft">复制为新草稿</ElButton>
        <ElButton v-if="isDraft" type="primary" :loading="saving" @click="handleSave">保存草稿</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<style scoped></style>
