<script setup lang="ts">
/**
 * 高级设置「单据模板」页签。
 * 列表 + 编辑器：SHEET（Luckysheet 表格模板）。文档模板（AiEditor）编辑器已随依赖下线，
 * 存量 DOC 模板仅在列表中展示，不可再编辑。
 * 权限：dynamic:docTemplate:*。
 */
import { defineAsyncComponent, onMounted, ref } from 'vue';
import {
  ElButton as __forwarded_ElButton,
  ElEmpty as __forwarded_ElEmpty,
  ElSpace as __forwarded_ElSpace,
  ElTag as __forwarded_ElTag
} from 'element-plus';
import { deleteDocTemplate, fetchDocTemplates, updateDocTemplate } from '@/service/api/dynamic/doc-template';
import { useAuth } from '@/hooks';

// 异步加载：luckysheet 大依赖单独成 chunk，只在打开编辑器时拉取
const DocTemplateSheetEditor = defineAsyncComponent(
  () => import('@/views/builder/doc-template/doc-template-sheet-editor.vue')
);

const props = defineProps<{
  form: {
    formId: string;
    tableCode: string;
    tableName: string;
    metaData?: Record<string, any> | null;
  };
}>();

const { hasAuth } = useAuth();
interface Row {
  id: string;
  name: string;
  templateType?: 'DOC' | 'SHEET';
  isDefault?: string;
  status?: string;
  updatedTime?: string;
}

const rows = ref<Row[]>([]);
const loading = ref(false);
/** undefined=列表；{id:null}=新建；{id:string}=编辑 */
const editing = ref<{ id: string | null } | undefined>(undefined);

async function load() {
  if (!props.form.formId) return;
  loading.value = true;
  try {
    const { data, error } = await fetchDocTemplates(props.form.formId);
    if (!error) rows.value = (data ?? []) as Row[];
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function openCreate() {
  editing.value = { id: null };
}

function openEdit(row: Row) {
  if (row.templateType !== 'SHEET') {
    window.$message?.warning('文档模板编辑器已下线，请在表格模板中重新排版');
    return;
  }
  editing.value = { id: row.id };
}

async function remove(row: Row) {
  window.$dialog?.warning({
    title: '删除模板',
    content: `确定删除「${row.name}」？删除后不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deleteDocTemplate(row.id);
      if (!error) {
        window.$message?.success('已删除');
        load();
      }
    }
  });
}

async function toggleDefault(row: Row) {
  // 局部更新：只送默认标记锚点，内容字段不传（后端对空值回退存量，不覆盖版式）
  const { error } = await updateDocTemplate({
    id: row.id,
    formId: props.form.formId,
    name: row.name,
    templateType: row.templateType ?? 'SHEET',
    isDefault: 'Y'
  } as AdvancedNamespace.DocTemplate);
  if (error) return;
  window.$message?.success('已设为默认模板');
  load();
}

function onSaved() {
  editing.value = undefined;
  load();
}

async function onCanceled() {
  editing.value = undefined;
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;
const ElEmpty = __forwarded_ElEmpty;
const ElSpace = __forwarded_ElSpace;
const ElTag = __forwarded_ElTag;
</script>

<template>
  <div class="doc-template-panel">
    <template v-if="editing !== undefined && props.form.formId">
      <DocTemplateSheetEditor
        :key="`sheet-${editing.id ?? 'new'}`"
        :form-id="props.form.formId"
        :template-id="editing.id ?? undefined"
        :meta-data="props.form.metaData"
        @saved="onSaved"
        @cancel="onCanceled"
      />
    </template>
    <template v-else>
      <ElSpace class="mb-10px" align="center">
        <ElButton size="small" type="primary" :disabled="!hasAuth('dynamic:docTemplate:add')" @click="openCreate">
          新建表格模板
        </ElButton>
        <span class="text-12px text-gray-400">表格模板：类 Excel 画布，支持边框与明细循环</span>
      </ElSpace>
      <div v-if="rows.length" class="flex-col gap-8px">
        <div v-for="row in rows" :key="row.id" class="flex items-center border border-gray-200 rd-6px px-12px py-8px">
          <ElSpace justify="space-between" align="center" :wrap="false" class="w-full">
            <ElSpace align="center">
              <span>{{ row.name }}</span>
              <ElTag :type="row.templateType === 'SHEET' ? 'primary' : 'info'" size="small" :bordered="false">
                {{ row.templateType === 'SHEET' ? '表格' : '文档' }}
              </ElTag>
              <ElTag v-if="row.isDefault === 'Y'" type="success" size="small" :bordered="false">默认</ElTag>
              <ElTag v-if="row.status === '0'" type="warning" size="small" :bordered="false">已停用</ElTag>
            </ElSpace>
            <ElSpace :wrap="false">
              <ElButton
                text
                type="primary"
                size="small"
                :disabled="!hasAuth('dynamic:docTemplate:edit') || row.templateType !== 'SHEET'"
                @click="openEdit(row)"
              >
                编辑
              </ElButton>
              <ElButton
                v-if="row.isDefault !== 'Y'"
                text
                type="primary"
                size="small"
                :disabled="!hasAuth('dynamic:docTemplate:edit')"
                @click="toggleDefault(row)"
              >
                设为默认
              </ElButton>
              <ElButton
                text
                type="danger"
                size="small"
                :disabled="!hasAuth('dynamic:docTemplate:delete')"
                @click="remove(row)"
              >
                删除
              </ElButton>
            </ElSpace>
          </ElSpace>
        </div>
      </div>
      <ElEmpty v-else description="暂无单据打印模板，点「新建表格模板」开始排版" class="mt-40px" />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.doc-template-panel {
  height: 100%;
  overflow: auto;
}
</style>
