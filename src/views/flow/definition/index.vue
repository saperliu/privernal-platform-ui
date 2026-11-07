<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ElInput,
  ElOption,
  ElTag,
  ElButton as __forwarded_ElButton,
  ElSelect as __forwarded_ElSelect,
  ElSpace as __forwarded_ElSpace
} from 'element-plus';
import {
  copyFlowDefinition,
  delFlowDefinition,
  findFlowDefinitionList,
  publishFlowDefinition,
  startFlowInstance,
  unpublishFlowDefinition
} from '@/service';
import { useLoading } from '@/hooks';
import { formatDateTime } from '@/utils/common';

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）；必须先于 columns 中的 JSX 使用
const ElButton = __forwarded_ElButton;
const ElSelect = __forwarded_ElSelect;
const ElSpace = __forwarded_ElSpace;

/** warm-flow 发布状态：0未发布 1已发布 9已失效 */
const publishLabels: Record<number, string> = { 0: '未发布', 1: '已发布', 9: '已失效' };
const publishTags: Record<number, 'info' | 'success' | 'warning'> = {
  0: 'info',
  1: 'success',
  9: 'warning'
};

const { loading, startLoading, endLoading } = useLoading(false);
const router = useRouter();
const tableData = ref<FlowNamespace.Definition[]>([]);
const checkedRowKeys = ref<string[]>([]);

type FormFilterModel = FlowNamespace.DefinitionQuery;
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  flowCode: '',
  flowName: '',
  isPublish: undefined,
  keywords: []
});

const pagination = reactive<DataTable.PaginationProps>({
  page: defaultPageNum,
  pageSize: defaultPageSize,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30, 50, 100],
  itemCount: 0,
  prefix: info => `总数: ${info.itemCount}条`,
  onChange: (page: number) => {
    pagination.page = page;
    formFilter.pageNum = page;
    formFilter.pageSize = pagination.pageSize || defaultPageSize;
    getTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = defaultPageNum;
    formFilter.pageNum = defaultPageNum;
    formFilter.pageSize = pageSize;
    getTableData();
  }
});

function rowKey(rowData: FlowNamespace.Definition) {
  return String(rowData.id);
}

async function getTableData() {
  startLoading();
  const { data } = await findFlowDefinitionList(formFilter);
  tableData.value = data?.list || [];
  pagination.itemCount = data?.total || 0;
  endLoading();
}

/** 新建/编辑均进入 warm-flow 设计器 */
function openDesigner(row?: FlowNamespace.Definition) {
  router.push({
    path: '/flow/designer',
    query: row ? { definitionId: String(row.id) } : {}
  });
}

function handlePublish(row: FlowNamespace.Definition) {
  window.$dialog?.warning({
    title: '发布确认',
    content: `确定发布流程「${row.flowName}」吗？发布后即可发起流程。`,
    positiveText: '发布',
    negativeText: '取消',
    onPositiveClick: async () => {
      await publishFlowDefinition(row.id);
      window.$message?.success('发布成功');
      getTableData();
    }
  });
}

function handleUnpublish(row: FlowNamespace.Definition) {
  window.$dialog?.warning({
    title: '停用确认',
    content: `确定停用流程「${row.flowName}」吗？停用后不可再发起新流程，运行中的实例不受影响。`,
    positiveText: '停用',
    negativeText: '取消',
    onPositiveClick: async () => {
      await unpublishFlowDefinition(row.id);
      window.$message?.success('已停用');
      getTableData();
    }
  });
}

function handleCopy(row: FlowNamespace.Definition) {
  window.$dialog?.info({
    title: '复制确认',
    content: `确定复制流程「${row.flowName}」吗？`,
    positiveText: '复制',
    negativeText: '取消',
    onPositiveClick: async () => {
      await copyFlowDefinition(row.id);
      window.$message?.success('复制成功');
      getTableData();
    }
  });
}

function handleDelete(row: FlowNamespace.Definition) {
  window.$dialog?.error({
    title: '删除确认',
    content: `确定删除流程「${row.flowName}」吗？删除后不可恢复，关联的表单绑定与节点配置将一并删除。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await delFlowDefinition(String(row.id));
      window.$message?.success('删除成功');
      getTableData();
    }
  });
}

function handleBatchDelete() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.warning('请选择要删除的流程');
    return;
  }
  window.$dialog?.error({
    title: '批量删除确认',
    content: `确定删除选中的 ${checkedRowKeys.value.length} 个流程吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await delFlowDefinition(checkedRowKeys.value.join(','));
      window.$message?.success('删除成功');
      getTableData();
    }
  });
}

function handleTestStart(row: FlowNamespace.Definition) {
  window.$dialog?.info({
    title: '测试启动',
    content: `确定以当前用户发起「${row.flowName}」测试流程吗？`,
    positiveText: '启动',
    negativeText: '取消',
    onPositiveClick: async () => {
      const businessId = `test-${Date.now()}`;
      const { data } = await startFlowInstance({ flowCode: row.flowCode, businessId });
      window.$message?.success(`启动成功，实例id：${data?.instanceId ?? '-'}`);
    }
  });
}

/** ListFilter 的关键字：按流程名称模糊过滤（与关键字语义最近的后端字段） */
const keyword = computed({
  get: () => formFilter.flowName ?? '',
  set: value => {
    formFilter.flowName = value;
  }
});

function search() {
  pagination.page = defaultPageNum;
  formFilter.pageNum = defaultPageNum;
  getTableData();
}

function keywordSearch() {
  search();
}

function clearSearch() {
  formFilter.flowName = '';
  search();
}

/** ListAdditional 刷新入口 */
function init() {
  getTableData();
}

const columns: Ref<DataTable.Column<FlowNamespace.Definition>[]> = ref([
  { type: 'selection', width: 50, align: 'center' },
  {
    key: 'index',
    title: '序号',
    width: 60,
    align: 'center',
    render: (_, index) => index + 1
  },
  {
    key: 'flowName',
    title: '流程名称',
    minWidth: 160,
    align: 'left',
    ellipsis: true,
    render: row => (
      <ElButton text type="primary" onClick={() => openDesigner(row)}>
        {row.flowName}
      </ElButton>
    )
  },
  { key: 'flowCode', title: '流程编码', minWidth: 170, align: 'left', ellipsis: true },
  { key: 'category', title: '类别', width: 100, align: 'center' },
  { key: 'version', title: '版本', width: 80, align: 'center' },
  {
    key: 'isPublish',
    title: '发布状态',
    width: 90,
    align: 'center',
    render: row => (
      <ElTag size="small" type={publishTags[row.isPublish] || 'info'}>
        {publishLabels[row.isPublish] ?? row.isPublish}
      </ElTag>
    )
  },
  {
    key: 'updateTime',
    title: '更新时间',
    width: 170,
    align: 'center',
    render: (row: FlowNamespace.Definition) => <span>{formatDateTime(row.updateTime)}</span>
  },
  {
    key: 'action',
    title: '操作',
    width: 300,
    align: 'center',
    render: row => {
      const published = row.isPublish === 1;
      return (
        <ElSpace alignment="center" size="small">
          <ElButton size="small" type="primary" onClick={() => openDesigner(row)}>
            编辑
          </ElButton>
          {published ? (
            <ElButton size="small" type="warning" onClick={() => handleUnpublish(row)}>
              停用
            </ElButton>
          ) : (
            <ElButton size="small" type="success" onClick={() => handlePublish(row)}>
              发布
            </ElButton>
          )}
          {published ? (
            <ElButton size="small" type="info" onClick={() => handleTestStart(row)}>
              测试启动
            </ElButton>
          ) : null}
          <ElButton size="small" onClick={() => handleCopy(row)}>
            复制
          </ElButton>
          <ElButton size="small" type="danger" onClick={() => handleDelete(row)}>
            删除
          </ElButton>
        </ElSpace>
      );
    }
  }
]);

getTableData();
</script>

<template>
  <div class="main-space overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="keyword"
          permission-add="flow:definition:add"
          permission-remove="flow:definition:remove"
          operation-title="流程定义"
          permission-export="flow:definition:export"
          permission-import="flow:definition:import"
          :show-export="false"
          :show-import="false"
          @add="openDesigner()"
          @delete="handleBatchDelete"
          @keyword-search="keywordSearch"
          @keyword-clear="clearSearch"
          @search="search"
          @reset="clearSearch"
        >
          <template #filter>
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px">
              <div class="col-span-3 flex flex-row items-center justify-end">流程名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.flowName" clearable placeholder="请输入" size="small" />
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">流程编码</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.flowCode" clearable placeholder="请输入" size="small" />
              </div>
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">发布状态</div>
              <div class="col-span-7">
                <ElSelect v-model="formFilter.isPublish" clearable placeholder="请选择" size="small" class="w-full">
                  <ElOption
                    v-for="opt in [
                      { label: '未发布', value: 0 },
                      { label: '已发布', value: 1 },
                      { label: '已失效', value: 9 }
                    ]"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
              </div>
            </div>
          </template>
          <template #toolbar-extra>
            <ListAdditional v-model:columns="columns" @reload="init"></ListAdditional>
          </template>
        </ListFilter>

        <DataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :row-key="rowKey"
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          :bottom-bordered="true"
          striped
          remote
        />
      </div>
    </ElCard>
  </div>
</template>
