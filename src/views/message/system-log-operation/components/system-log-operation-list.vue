<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { operationTypeLabels } from '@/constants';
import { delSystemLogOperation, findSystemLogOperationList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-log-operation-modal.vue';
import SystemLogOperationModal from './system-log-operation-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'SystemLogOperationList' });
// props 只用于对外声明：组件内部不读取（多选列的 multiple 在 element-plus 的列体系里没有对应项）
withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: SystemLogOperationNamespace.SystemLogOperationForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemLogOperationNamespace.SystemLogOperationForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/**
 * `keyword` 在 ListFilter 里是必填 string，这里收紧成非可选，避免 v-model 传 `string | undefined`。
 */
type FormFilterModel = SystemLogOperationNamespace.SystemLogOperationQuery & { keyword: string };
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

function setTableData(data: SystemLogOperationNamespace.SystemLogOperationPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemLogOperationNamespace.SystemLogOperationQuery) {
  startLoading();
  if (formFilter.dateList !== undefined && formFilter.dateList.length > 0) {
    formFilter.parameters = {
      beginDate: formFilter.dateList[0],
      endDate: formFilter.dateList[1]
    };
  }
  const { data } = await findSystemLogOperationList(dataQuery);
  let result: SystemLogOperationNamespace.SystemLogOperationPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemLogOperationNamespace.SystemLogOperationForm>[]> = ref([
  {
    type: 'selection',
    width: 60,
    align: 'center'
  },
  {
    key: 'index',
    title: '序号',
    align: 'left',
    ellipsis: true,
    width: 60,
    render(_, index) {
      return index + 1;
    }
  },
  {
    key: 'name',
    title: '模块名称',
    align: 'left',
    ellipsis: true
    // render: row => {
    //   return <TableColumnLink value={row} name={row.name} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    // }
  },

  {
    key: 'operationType',
    title: '操作类型',
    align: 'left',
    ellipsis: true,
    render: row => {
      return operationTypeLabels[Number(row.operationType)];
    }
  },
  // {
  //   key: 'method',
  //   title: '方法名称',
  //   align: 'left',
  //   ellipsis: true
  // },
  {
    key: 'requestMethod',
    title: '请求方式',
    align: 'left',
    ellipsis: true
  },
  // {
  //   key: 'businessType',
  //   title: '业务类型;0其它 1后台用户 2手机端用户',
  //   align: 'left',
  //   ellipsis: true
  // },
  {
    key: 'operationUrl',
    title: '请求URL',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'operationIp',
    title: '主机地址',
    align: 'left',
    ellipsis: true
  },
  // {
  //   key: 'operationLocation',
  //   title: '操作地点',
  //   align: 'left',
  //   ellipsis: true
  // },
  {
    key: 'operationParam',
    title: '请求参数',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'operationResult',
    title: '返回参数',
    align: 'left',
    ellipsis: true
  },
  // {
  //   key: 'status',
  //   title: '状态',
  //   align: 'left',
  //   ellipsis: true,
  //   render: row => {
  //     return <DataStatus value={row.status}></DataStatus>;
  //   }
  // },
  {
    key: 'operationPerson',
    title: '操作人员',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'message',
    title: '操作消息',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'createdTime',
    title: '时间',
    align: 'left',
    ellipsis: true
  }
]) as Ref<DataTable.Column<SystemLogOperationNamespace.SystemLogOperationForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemLogOperationNamespace.SystemLogOperationForm | null>(null);

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
  delSystemLogOperation(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      search();
    }
  });
}

/** 重置搜索 */
function resetForm() {
  formFilter.name = '';
  clearSearch();
}

/** 清空模糊搜索 */
function clearSearch() {
  for (const field of Object.keys(formFilter)) {
    if (field === 'pageNum') {
      formFilter.pageNum = defaultPageNum;
    } else if (field === 'keyword') {
      formFilter.keyword = '';
    } else if (field !== 'pageSize') {
      Reflect.set(formFilter, field, null);
    }
  }

  getTableData(formFilter);
}

/** 模糊搜索 */
function keywordSearch() {
  if (formFilter.keyword) {
    formFilter.keywords = formFilter.keyword.split(' ');
  }
  getTableData(formFilter);
}

/**
 * 显示详情关闭的回调函数
 *
 * @param value
 */
function handleClose(value: boolean) {
  if (value) {
    getTableData(formFilter);
  }
}

/**
 * 回调推送选择的数据
 *
 * @param keys
 * @param rows
 * @param meta
 */
function handleChangeChecked(
  _keys: Array<string | number>,
  rows: SystemLogOperationNamespace.SystemLogOperationForm[],
  _meta: { row: object | undefined; action: 'check' | 'uncheck' | 'checkAll' | 'uncheckAll' }
) {
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
          permission-add="message:systemLogOperation:add"
          permission-remove="message:systemLogOperation:remove"
          permission-import="message:systemLogOperation:import"
          permission-export="message:systemLogOperation:export"
          operation-title="操作日志"
          :show-operation="false"
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
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">模块名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.name" placeholder="请输入模块名称" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">操作人员</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.operationPerson" placeholder="请输入操作人员" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">操作时间</div>
              <div class="col-span-7">
                <PrivernalDatepicker
                  v-model:value="formFilter.dateList"
                  clearable
                  type="datetimerange"
                  value-format="yyyy-MM-dd HH:mm:ss"
                  placeholder="请选择重置时间"
                />
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
        />

        <SystemLogOperationModal
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
          @closed="handleClose"
        />
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
