<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { delSystemLogLogin, findSystemLogLoginList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-log-login-modal.vue';
import SystemLogLoginModal from './system-log-login-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'SystemLogLoginList' });
withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: SystemLogLoginNamespace.SystemLogLoginForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemLogLoginNamespace.SystemLogLoginForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/** ListFilter 的 keyword 是必填 string，查询类型里它是可选，本地交叉补齐 */
type FormFilterModel = SystemLogLoginNamespace.SystemLogLoginQuery & { keyword: string };
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

function setTableData(data: SystemLogLoginNamespace.SystemLogLoginPage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemLogLoginNamespace.SystemLogLoginQuery) {
  startLoading();
  if (formFilter.dateList !== undefined && formFilter.dateList.length > 0) {
    formFilter.parameters = {
      beginDate: formFilter.dateList[0],
      endDate: formFilter.dateList[1]
    };
  }
  const { data } = await findSystemLogLoginList(dataQuery);
  let result: SystemLogLoginNamespace.SystemLogLoginPage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemLogLoginNamespace.SystemLogLoginForm>[]> = ref([
  {
    type: 'selection',
    align: 'center',
    width: 60
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
    key: 'loginName',
    title: '登录名',
    align: 'left',
    ellipsis: true
    // render: row => {
    //   return <TableColumnLink value={row} name={row.loginName} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    // }
  },
  // {
  //   key: 'nickName',
  //   title: '昵称',
  //   align: 'left',
  //   ellipsis: true
  // },
  {
    key: 'loginIp',
    title: '登录IP',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'loginLocation',
    title: '登录地址',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'browser',
    title: '浏览器',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'os',
    title: '操作系统',
    align: 'left',
    ellipsis: true
  },
  // {
  //   key: 'platform',
  //   title: '平台固件',
  //   align: 'left',
  //   ellipsis: true
  // },
  {
    key: 'message',
    title: '消息',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'createdTime',
    title: '时间',
    align: 'left',
    ellipsis: true
  }
  // {
  //   key: 'status',
  //   title: '状态',
  //   align: 'left',
  //   ellipsis: true,
  //   render: row => {
  //     return <DataStatus value={row.status}></DataStatus>;
  //   }
  // },
  // {
  //   key: 'departmentId',
  //   title: '部门',
  //   align: 'left',
  //   ellipsis: true
  // },
  // {
  //   key: 'organizationId',
  //   title: '组织',
  //   align: 'left',
  //   ellipsis: true
  // }
]) as Ref<DataTable.Column<SystemLogLoginNamespace.SystemLogLoginForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemLogLoginNamespace.SystemLogLoginForm | null>(null);

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
  delSystemLogLogin(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      search();
    }
  });
}

/** 重置搜索 */
function resetForm() {
  clearSearch();
}

/** 清空模糊搜索 */
function clearSearch() {
  /** 查询模型是 interface（无隐式索引签名），交叉一层 Record 取可写视图，用于按 key 批量清空 */
  const filterFields = formFilter as FormFilterModel & Record<string, unknown>;
  for (const field in filterFields) {
    if (field === 'pageNum') {
      formFilter.pageNum = defaultPageNum;
    } else if (field !== 'pageSize') {
      filterFields[field] = null;
    }
  }

  getTableData(formFilter);
}

/** 模糊搜索 */
function keywordSearch() {
  if (formFilter.keyword !== null) {
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
  rows: SystemLogLoginNamespace.SystemLogLoginForm[],
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
          permission-add="message:systemLogLogin:add"
          permission-remove="message:systemLogLogin:remove"
          permission-import="message:systemLogLogin:import"
          permission-export="message:systemLogLogin:export"
          operation-title="登录日志"
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
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">登录名</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.loginName" placeholder="请输入登录名" size="small" />
              </div>

              <!--              <el-grid-item :span="3" class="flex flex-row items-center justify-end ml-10px">昵称</el-grid-item>-->
              <!--              <el-grid-item :span="7">-->
              <!--                <el-input v-model="formFilter.nickName" placeholder="请输入昵称" size="small" />-->
              <!--              </el-grid-item>-->

              <!--              <el-grid-item :span="3" class="flex flex-row items-center justify-end ml-10px">登录IP</el-grid-item>-->
              <!--              <el-grid-item :span="7">-->
              <!--                <el-input v-model="formFilter.loginIp" placeholder="请输入登录IP" size="small" />-->
              <!--              </el-grid-item>-->

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">登录地址</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.loginLocation" placeholder="请输入登录地址" size="small" />
              </div>

              <!--              <el-grid-item :span="3" class="flex flex-row items-center justify-end ml-10px">浏览器</el-grid-item>-->
              <!--              <el-grid-item :span="7">-->
              <!--                <el-input v-model="formFilter.browser" placeholder="请输入浏览器" size="small" />-->
              <!--              </el-grid-item>-->

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">操作系统</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.os" placeholder="请输入操作系统" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">登录时间</div>
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

        <SystemLogLoginModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />
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
