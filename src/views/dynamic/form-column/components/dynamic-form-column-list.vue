<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { delDynamicFormColumn, findDynamicFormColumnList } from '@/service';
import { useBoolean, useDeptOrgNames, useLoading } from '@/hooks';
import { orderByColumn } from '@/utils';
import DataStatus from '@/components/business/data-status.vue';
import type { ModalType } from './dynamic-form-column-modal.vue';
import DynamicFormColumnModal from './dynamic-form-column-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'DynamicFormColumnList' });
withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: DynamicFormColumnNamespace.DynamicFormColumnForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { deptName, orgName } = useDeptOrgNames();
const tableData = ref<DynamicFormColumnNamespace.DynamicFormColumnForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/**
 * 查询条件模型
 *
 * 接口的查询类型没有声明主键与审计字段，但筛选面板已经把它们绑成了输入框（v-model 会在运行时写入），
 * 这里按 ApiCommon.FormBase 补齐这些字段，使模板绑定与运行时写入的都是已声明的属性。
 */
interface FormFilterModel extends DynamicFormColumnNamespace.DynamicFormColumnQuery, ApiCommon.FormBase {
  /** 主键 */
  id?: string;
  /** 模糊搜索关键字：ListFilter 的 v-model 需要非空字符串，初始化时已置为 '' */
  keyword: string;
}
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

function setTableData(data: DynamicFormColumnNamespace.DynamicFormColumnPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: DynamicFormColumnNamespace.DynamicFormColumnQuery) {
  startLoading();
  const { data } = await findDynamicFormColumnList(dataQuery);
  let result: DynamicFormColumnNamespace.DynamicFormColumnPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<DynamicFormColumnNamespace.DynamicFormColumnForm>[]> = ref([
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
    key: 'filedName',
    title: '字段名称',
    align: 'left',
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'filedType',
    title: '字段类型',
    align: 'left',
    width: 100,
    ellipsis: {
      tooltip: true
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
    key: 'filedCode',
    title: '字段编码',
    align: 'left',
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'departmentId',
    title: '所属部门',
    align: 'left',
    ellipsis: {
      tooltip: true
    },
    render: row => deptName(row.departmentId)
  },
  {
    key: 'organizationId',
    title: '所属组织',
    align: 'left',
    ellipsis: {
      tooltip: true
    },
    render: row => orgName(row.organizationId)
  },
  {
    key: 'sort',
    title: '排序',
    align: 'left',
    width: 70,
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'showList',
    title: '列表显示',
    align: 'left',
    width: 80,
    render: row => (Number(row.showList) === 1 ? '是' : '否')
  },
  {
    key: 'showQuery',
    title: '查询显示',
    align: 'left',
    width: 80,
    render: row => (Number(row.showQuery) === 1 ? '是' : '否')
  },
  {
    key: 'sensitive',
    title: '敏感字段',
    width: 90,
    align: 'center',
    render: row => (row.sensitive === 'Y' ? '是' : '否')
  },
  {
    key: 'uniqueFlag',
    title: '不允许重复',
    width: 100,
    align: 'center',
    render: row => (row.uniqueFlag === 'Y' ? '是' : '否')
  },
  {
    key: 'remark',
    title: '备注',
    align: 'left',
    ellipsis: {
      tooltip: true
    }
  }
]) as Ref<DataTable.Column<DynamicFormColumnNamespace.DynamicFormColumnForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<DynamicFormColumnNamespace.DynamicFormColumnForm | null>(null);

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
  delDynamicFormColumn(checkedRowKeys.value).then(res => {
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
 * element-plus 没有导出 naive-ui 的 `DataTable.SortState`，排序状态的字段（columnKey + ascend/descend）
 * 仍由共享的 `orderByColumn`（src/utils/common.ts）决定并写入 orderBy/direction 查询参数，
 * 故这里直接沿用它的入参类型，避免在本文件另立一套排序契约。
 *
 * @param sorter
 */
function handleUpdateSorter(sorter: Parameters<typeof orderByColumn>[0]) {
  orderByColumn(sorter, formFilter, columns);
  getTableData(formFilter);
}
/** 重置搜索 */
function resetForm() {
  clearSearch();
}

/** 清空模糊搜索 */
function clearSearch() {
  // pageNum 回到首页、pageSize 保持每页条数，其余已填写的条件全部清空
  for (const field of Object.keys(formFilter)) {
    if (field === 'pageNum') {
      Reflect.set(formFilter, field, defaultPageNum);
    } else if (field !== 'pageSize') {
      Reflect.set(formFilter, field, null);
    }
  }

  getTableData(formFilter);
}

/** 模糊搜索 */
function keywordSearch() {
  if (formFilter.keyword !== null && formFilter.keyword !== '' && formFilter.keyword !== undefined) {
    formFilter.keywords = formFilter.keyword.split(' ');
  }
  getTableData(formFilter);
}

/**
 * 显示详情关闭的回调函数
 *
 * @param value 关闭时是否需要同步刷新列表
 */
function handleClose(value: boolean) {
  if (value) {
    getTableData(formFilter);
  }
}

/**
 * 回调推送选择的数据
 *
 * @param keys 勾选行的主键（DataTable 只回传主键，行数据按 rowKey 从当前页数据取）
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
          permission-add="dynamic:formColumn:add"
          permission-remove="dynamic:formColumn:remove"
          permission-import="dynamic:formColumn:import"
          permission-export="dynamic:formColumn:export"
          operation-title="form的列的数据"
          :show-operation="showOperation"
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
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">主键</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.id" placeholder="请输入主键" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">租户号</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.tenantId" placeholder="请输入租户号" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">乐观锁</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.revision" placeholder="请输入乐观锁" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">创建人</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.createdBy" placeholder="请输入创建人" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">更新人</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.updatedBy" placeholder="请输入更新人" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">是否删除</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.deletedFlag" placeholder="请输入是否删除" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">删除人</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.deletedBy" placeholder="请输入删除人" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">所属部门</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.departmentId" placeholder="请输入所属部门" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">所属组织</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.organizationId" placeholder="请输入所属组织" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">备注</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.remark" placeholder="请输入备注" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">数据标题</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.title" placeholder="请输入数据标题" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">表单ID</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.formId" placeholder="请输入表单ID" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">字段编码,数据库表的列表</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.filedCode" placeholder="请输入 字段编码,数据库表的列表" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">字段名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.filedName" placeholder="请输入字段名称" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">长度</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.length" placeholder="请输入长度" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">小数点位数</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.scale" placeholder="请输入小数点位数" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">排序</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.sort" placeholder="请输入排序" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">默认值</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.defaultValue" placeholder="请输入默认值" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">列表是否显示</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.showList" placeholder="请输入列表是否显示" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">查询是否显示</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.showQuery" placeholder="请输入查询是否显示" size="small" />
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

        <DynamicFormColumnModal
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
