<script setup lang="tsx">
import type { Ref } from 'vue';
import { onMounted, reactive, ref } from 'vue';
import { ElButton, ElInput, ElTag, ElSpace as __forwarded_ElSpace } from 'element-plus';
import { findFlowDefinitionList } from '@/service';
import { useLoading } from '@/hooks';

export interface PickerRow {
  id: string;
  name: string;
  tableName: string;
}

interface Props {
  showOperation?: boolean;
  listData?: PickerRow[];
}

withDefaults(defineProps<Props>(), {
  showOperation: true,
  listData: () => []
});

interface Emits {
  (e: 'change', data: PickerRow[]): void;
}

const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<FlowNamespace.Definition[]>([]);
const checkedRowKeys = ref<string[]>([]);

const formFilter = reactive<FlowNamespace.DefinitionQuery>({
  pageNum: 1,
  pageSize: 50,
  flowCode: '',
  flowName: '',
  keywords: []
});

const pagination = reactive<DataTable.PaginationProps>({
  page: 1,
  pageSize: 50,
  itemCount: 0,
  onChange: (page: number) => {
    pagination.page = page;
    formFilter.pageNum = page;
    getTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    formFilter.pageSize = pageSize;
    getTableData();
  }
});

async function getTableData() {
  startLoading();
  const { data } = await findFlowDefinitionList(formFilter);
  tableData.value = data?.list || [];
  pagination.itemCount = data?.total || 0;
  endLoading();
}

const columns: Ref<DataTable.Column<FlowNamespace.Definition>[]> = ref([
  {
    type: 'selection',
    width: 50,
    align: 'center'
  },
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
    align: 'left'
  },
  { key: 'flowCode', title: '流程编码', align: 'left' },
  { key: 'category', title: '类别', width: 100, align: 'center' },
  {
    key: 'isPublish',
    title: '状态',
    width: 90,
    align: 'center',
    render: row => (
      <ElTag size="small" type={row.isPublish === 1 ? 'success' : 'info'}>
        {row.isPublish === 1 ? '已发布' : '未发布'}
      </ElTag>
    )
  }
]);

function handleConfirm() {
  const selected = tableData.value.filter(row => checkedRowKeys.value.some(key => String(key) === String(row.id)));
  const result: PickerRow[] = selected.map(item => ({
    id: String(item.id),
    name: item.flowName,
    tableName: `${item.flowName}（${item.flowCode}）`
  }));
  emit('change', result);
  window.$message?.success(`已选择 ${result.length} 个流程`);
}

onMounted(() => {
  getTableData();
});

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;
</script>

<template>
  <div class="h-full flex-col">
    <ElSpace class="h-full">
      <ElInput v-model="formFilter.flowName" placeholder="流程名称" clearable />
      <DataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: FlowNamespace.Definition) => row.id"
        flex-height
        class="h-full"
        remote
      />
      <div class="flex justify-end">
        <ElButton type="primary" @click="handleConfirm">确认选择</ElButton>
      </div>
    </ElSpace>
  </div>
</template>
