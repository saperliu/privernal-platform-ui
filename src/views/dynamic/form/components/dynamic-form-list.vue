<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElButton } from 'element-plus';
import { delDynamicForm, findDynamicFormList } from '@/service';
import { findSystemOrganizationList } from '@/service/api/system/system-organization';
import { useBoolean, useDeptOrgNames, useLoading } from '@/hooks';
import { orderByColumn } from '@/utils';
import type { ModalType } from './dynamic-form-modal.vue';
import DynamicFormModal from './dynamic-form-modal.vue';

/** 筛选下拉选项：所属组织 */
const orgOptions = ref<{ label: string; value: string }[]>([]);
findSystemOrganizationList({ pageNum: 1, pageSize: 100 }).then(res => {
  if (res.error === null && res.data) {
    orgOptions.value = (res.data.list || []).map(item => ({ label: item.organizationName, value: item.id }));
  }
});

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'DynamicFormList' });
const props = withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: DynamicFormNamespace.DynamicFormForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible } = useBoolean();
const router = useRouter();
const { deptName, orgName } = useDeptOrgNames();
const tableData = ref<DynamicFormNamespace.DynamicFormForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/** 本地筛选模型：keyword 为 ListFilter 必填 string；remark 为模板绑定的查询字段（后端 FormBase 已有 remark） */
type FormFilterModel = DynamicFormNamespace.DynamicFormQuery & { keyword: string; remark?: string };
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

function setTableData(data: DynamicFormNamespace.DynamicFormPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: DynamicFormNamespace.DynamicFormQuery) {
  startLoading();
  const { data } = await findDynamicFormList(dataQuery);
  let result: DynamicFormNamespace.DynamicFormPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<DynamicFormNamespace.DynamicFormForm>[]> = ref([
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
    key: 'tableName',
    title: '表单名称',
    align: 'left',
    ellipsis: true
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
    key: 'tableCode',
    title: '表单编码',
    align: 'left',
    ellipsis: true
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
    key: 'remark',
    title: '备注',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'operation',
    title: '操作',
    align: 'left',
    width: 90,
    hide: !props.showOperation,
    render(row) {
      return (
        <ElButton size="small" type="primary" plain onClick={() => handleDesign(row)}>
          设计
        </ElButton>
      );
    }
  }
]) as Ref<DataTable.Column<DynamicFormNamespace.DynamicFormForm>[]>;

const modalType = ref<ModalType>('add');

const editData = ref<DynamicFormNamespace.DynamicFormForm | null>(null);

/** 新增：直接进入表单设计器（/designer 无 code 即新建模式，名称/编码/所属应用在设计器顶栏填写） */
function handleAddTable() {
  router.push('/designer');
}

/** 设计：新标签页打开表单设计页；bare=1 让设计器进入内容全屏（不渲染侧栏/头部/页签），工作区占满整窗 */
function handleDesign(row: DynamicFormNamespace.DynamicFormForm) {
  const url = router.resolve({ path: '/designer', query: { code: row.tableCode, bare: '1' } }).href;
  const win = window.open(url, '_blank');
  if (!win) {
    window.$message?.warning('新标签页已被浏览器拦截，正在当前页打开设计器');
    router.push(url);
  }
}

/** 多行删除 */
function handleDeleteRows() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error('请选择要删除的数据！');
    return;
  }
  confirmDelete(checkedRowKeys.value, () => {
    delDynamicForm(checkedRowKeys.value).then(res => {
      if (res.error === null) {
        checkedRowKeys.value = [];
        window.$message?.success('删除成功');
        search();
      }
    });
  });
}

/**
 * 删除确认：删除表单会联动删除其业务数据、数据库表、菜单权限与流程，不可恢复
 */
function confirmDelete(ids: string[], onPositiveClick: () => void) {
  window.$dialog?.warning({
    title: '删除确认',
    content: `确定要删除选中的 ${ids.length} 个表单吗？表单的业务数据、数据库表、菜单与授权、关联流程将一并删除，不可恢复！`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick
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
  formFilter.departmentId = undefined;
  formFilter.organizationId = undefined;
  formFilter.remark = undefined;
  formFilter.tableCode = undefined;
  formFilter.tableName = undefined;
  formFilter.isWorkflow = undefined;
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
          permission-add="dynamic:form:add"
          permission-remove="dynamic:form:remove"
          permission-import="dynamic:form:import"
          permission-export="dynamic:form:export"
          operation-title="表单"
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
              <!--              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">是否删除</div>-->
              <!--              <div class="col-span-7">-->
              <!--                <ElSelect-->
              <!--                  v-model="formFilter.deletedFlag"-->
              <!--                  clearable-->
              <!--                  placeholder="请选择"-->
              <!--                  size="small"-->
              <!--                >-->
              <!--  <ElOption v-for="opt in [{ label: '未删除', value: 'N' }, { label: '已删除', value: 'Y' }]" :key="opt.value" :label="opt.label" :value="opt.value" />-->
              <!--</ElSelect>-->
              <!--              </div>-->

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">所属部门</div>
              <div class="col-span-7">
                <SelectDepartment v-model:value="formFilter.departmentId" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">所属组织</div>
              <div class="col-span-7">
                <ElSelect v-model="formFilter.organizationId" clearable placeholder="请选择所属组织" size="small">
                  <ElOption v-for="opt in orgOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">备注</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.remark" placeholder="请输入备注" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">表单编码</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.tableCode" placeholder="请输入表单编码" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">表单名称</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.tableName" placeholder="请输入表单名称" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">是否启用工作流</div>
              <div class="col-span-7">
                <ElSelect v-model="formFilter.isWorkflow" clearable placeholder="请选择" size="small">
                  <ElOption
                    v-for="opt in [
                      { label: '未启用', value: 0 },
                      { label: '启用', value: 1 }
                    ]"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
              </div>

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

        <DynamicFormModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />
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
