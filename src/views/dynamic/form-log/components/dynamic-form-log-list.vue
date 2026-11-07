<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { ElButton, ElTag } from 'element-plus';
import { delDynamicFormLog, findDynamicFormLogList, publishDynamicFormLog, rollbackDynamicFormLog } from '@/service';
import { useBoolean, useDeptOrgNames, useLoading } from '@/hooks';
import { orderByColumn } from '@/utils';
import type { ModalType } from './dynamic-form-log-modal.vue';
import DynamicFormLogModal from './dynamic-form-log-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'DynamicFormLogList' });
const props = withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: DynamicFormLogNamespace.DynamicFormLogForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { deptName, orgName } = useDeptOrgNames();
const tableData = ref<DynamicFormLogNamespace.DynamicFormLogForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/** 本地筛选模型：keyword 为 ListFilter 必填 string */
type FormFilterModel = DynamicFormLogNamespace.DynamicFormLogQuery & { keyword: string };
const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: []
});
const pagination = reactive({
  page: defaultPageNum,
  pageSize: defaultPageSize,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30, 50, 100],
  itemCount: 0,
  prefix(info: DataTable.PaginationInfo) {
    return `总数: ${info.itemCount}条`;
  },
  onChange: (page: number) => {
    pagination.page = page;
    formFilter.pageNum = page;
    formFilter.pageSize = pagination.pageSize ? pagination.pageSize : defaultPageSize;
    getTableData(formFilter);
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = defaultPageNum;
    formFilter.pageNum = pagination.page;
    formFilter.pageSize = pageSize;
    getTableData(formFilter);
  }
});

function setTableData(data: DynamicFormLogNamespace.DynamicFormLogPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: DynamicFormLogNamespace.DynamicFormLogQuery) {
  startLoading();
  const { data } = await findDynamicFormLogList(dataQuery);
  let result: DynamicFormLogNamespace.DynamicFormLogPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<DynamicFormLogNamespace.DynamicFormLogForm>[]> = ref([
  {
    type: 'selection',
    width: 60,
    align: 'center'
  },
  {
    key: 'index',
    title: '序号',
    align: 'left',
    width: 60,
    render(_, index) {
      return index + 1;
    }
  },

  {
    key: 'version',
    title: '版本',
    align: 'left',
    width: 80,
    render: row => {
      return <ElTag size="small">v{row.version}</ElTag>;
    }
  },
  {
    key: 'formName',
    title: '表单名',
    align: 'left',
    minWidth: 140,
    ellipsis: true,
    render: row => row.formName || '-'
  },
  {
    key: 'formCode',
    title: '表单编码',
    align: 'left',
    minWidth: 170,
    ellipsis: true,
    render: row => row.formCode || '-'
  },
  {
    key: 'logType',
    title: '类型',
    align: 'left',
    width: 80,
    render: row => {
      const isDraft = row.logType === 'DRAFT';
      return (
        <ElTag size="small" type={isDraft ? 'warning' : 'success'}>
          {isDraft ? '草稿' : '版本'}
        </ElTag>
      );
    }
  },
  {
    key: 'status',
    title: '状态',
    align: 'left',
    render: row => {
      return <DataStatus value={row.status}></DataStatus>;
    }
  },
  {
    key: 'departmentId',
    title: '所属部门',
    align: 'left',
    ellipsis: true,
    render: row => deptName(row.departmentId)
  },
  {
    key: 'organizationId',
    title: '所属组织',
    align: 'left',
    ellipsis: true,
    render: row => orgName(row.organizationId)
  },
  {
    key: 'isWorkflow',
    title: '启用工作流',
    align: 'left',
    width: 110,
    render: row => (Number(row.isWorkflow) === 1 ? '是' : '否')
  },
  {
    key: 'workflowCode',
    title: '工作流的标识',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'operation',
    title: '操作',
    align: 'left',
    width: 90,
    render(row) {
      if (!props.showOperation) {
        return null;
      }
      if (row.logType === 'DRAFT') {
        return (
          <ElButton size="small" type="primary" plain onClick={() => handlePublishLog(row)}>
            发布
          </ElButton>
        );
      }
      return (
        <ElButton size="small" type="warning" plain onClick={() => handleRollbackLog(row)}>
          回滚
        </ElButton>
      );
    }
  }
]) as Ref<DataTable.Column<DynamicFormLogNamespace.DynamicFormLogForm>[]>;

/** 发布草稿/指定快照：内容应用为生效定义（含改表），发布后草稿清除 */
function handlePublishLog(row: DynamicFormLogNamespace.DynamicFormLogForm) {
  window.$dialog?.warning({
    title: '发布确认',
    content: `确定要发布该快照吗？快照内容将立即生效（含物理表结构变更），原当前定义将留存为历史版本。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      publishDynamicFormLog(row.id).then(res => {
        if (res.error === null) {
          window.$message?.success('发布成功');
          search();
        }
      });
    }
  });
}

/** 回滚到指定正式版本 */
function handleRollbackLog(row: DynamicFormLogNamespace.DynamicFormLogForm) {
  window.$dialog?.warning({
    title: '回滚确认',
    content: `确定要回滚到 v${row.version} 吗？当前定义将回退为该版本内容（含物理表结构变更），并留存为新的历史版本。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      rollbackDynamicFormLog(row.id).then(res => {
        if (res.error === null) {
          window.$message?.success('回滚成功');
          search();
        }
      });
    }
  });
}

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<DynamicFormLogNamespace.DynamicFormLogForm | null>(null);

/** 新增 */
function handleAddTable() {
  openModal();
  setModalType('add');
}

/** 多行删除 */
function handleDeleteRows() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error('请选择要删除的数据！');
    return;
  }
  delDynamicFormLog(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      search();
    }
  });
}

/**
 * 某列的排序处理
 *
 * @param sorter
 */
function handleUpdateSorter(sorter: DataTable.SortState) {
  orderByColumn(sorter, formFilter, columns);
  getTableData(formFilter);
}
/** 重置搜索 */
function resetForm() {
  clearSearch();
}

/** 清空模糊搜索：除 pageSize 外全部恢复初始值（undefined 字段序列化时省略，等价原来的 null） */
function clearSearch() {
  formFilter.pageNum = defaultPageNum;
  formFilter.keyword = '';
  formFilter.keywords = [];
  formFilter.workflowCode = undefined;
  formFilter.orderBy = undefined;
  formFilter.direction = undefined;

  getTableData(formFilter);
}

/** 模糊搜索 */
function keywordSearch() {
  if (formFilter.keyword !== '') {
    formFilter.keywords = formFilter.keyword.split(' ');
  }
  getTableData(formFilter);
}

/**
 * 显示详情关闭的回调函数
 *
 * @param value 弹窗是否因确认操作而关闭
 */
function handleClose(value: boolean) {
  if (value) {
    getTableData(formFilter);
  }
}

/**
 * 回调推送选择的数据（自研 DataTable 仅 emit 选中的 keys，行数据由 keys 反查）
 *
 * @param keys 选中的行主键
 */
function handleChangeChecked(keys: string[]) {
  const rows = tableData.value.filter(row => keys.includes(row.id));
  emit('change', rows);
}

function search() {
  getTableData(formFilter);
}

// 初始化
search();
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="dynamic:formLog:add"
          permission-remove="dynamic:formLog:remove"
          permission-import="dynamic:formLog:import"
          permission-export="dynamic:formLog:export"
          operation-title="表单的历史版本"
          :show-operation="showOperation"
          :show-add="false"
          :show-remove="false"
          :show-export="false"
          :show-import="false"
          @add="handleAddTable"
          @delete="handleDeleteRows"
          @keyword-search="keywordSearch"
          @keyword-clear="clearSearch"
          @search="search"
          @reset="resetForm"
        >
          <template #filter>
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px">
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">工作流的标识</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.workflowCode" placeholder="请输入工作流的标识" size="small" />
              </div>
            </div>
          </template>
          <template #toolbar-extra>
            <ListAdditional v-model:columns="columns" @reload="search"></ListAdditional>
          </template>
        </ListFilter>

        <DataTable
          v-model:checked-row-keys="checkedRowKeys"
          remote
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :row-key="rowKey"
          :scroll-x="1200"
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          :bottom-bordered="true"
          striped
          @update:checked-row-keys="handleChangeChecked"
          @update:sorter="handleUpdateSorter"
        />

        <DynamicFormLogModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />
      </div>
    </ElCard>
  </div>
</template>

<style lang="scss" scoped>
.main-space {
  // 解决数据table底边在最下面的问题
  //:deep(.n-scrollbar) {
  //  overflow: inherit;
  //}
}
</style>
