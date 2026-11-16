<script setup lang="tsx">
import { reactive, ref } from 'vue';
import { findPermissionAuditList, findPermissionMatrix } from '@/service';
import { useLoading } from '@/hooks';

defineOptions({ name: 'PermissionAuditList' });

const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<PermissionAuditNamespace.PermissionAuditRow[]>([]);

const defaultPageNum = 1;
const defaultPageSize = 20;
type FormFilterModel = PermissionAuditNamespace.PermissionAuditQuery & { keyword: string };
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: [],
  operationPerson: '',
  dateList: []
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

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: PermissionAuditNamespace.PermissionAuditQuery) {
  startLoading();
  if (formFilter.dateList && formFilter.dateList.length > 0) {
    formFilter.parameters = {
      beginDate: formFilter.dateList[0],
      endDate: formFilter.dateList[1]
    };
  } else {
    formFilter.parameters = undefined;
  }
  const { data } = await findPermissionAuditList(dataQuery);
  const result: PermissionAuditNamespace.PermissionAuditPage = data || { list: [], total: 0 };
  tableData.value = result.list;
  pagination.itemCount = result.total;
  endLoading();
}

function search() {
  getTableData(formFilter);
}

function keywordSearch() {
  formFilter.keywords = formFilter.keyword ? formFilter.keyword.split(' ') : [];
  formFilter.pageNum = defaultPageNum;
  getTableData(formFilter);
}

function resetForm() {
  formFilter.keyword = '';
  formFilter.keywords = [];
  formFilter.operationPerson = '';
  formFilter.dateList = [];
  formFilter.parameters = undefined;
  formFilter.pageNum = defaultPageNum;
  getTableData(formFilter);
}

const columns: Ref<DataTable.Column<PermissionAuditNamespace.PermissionAuditRow>[]> = ref([
  {
    key: 'index',
    title: '序号',
    width: 60,
    align: 'left',
    render(_, index) {
      return index + 1;
    }
  },
  {
    key: 'createdTime',
    title: '时间',
    width: 170,
    align: 'left',
    ellipsis: true
  },
  {
    key: 'action',
    title: '动作',
    width: 130,
    align: 'left',
    ellipsis: true,
    render: row => <ElTag type={row.status === 1 ? 'danger' : 'info'}>{row.action || row.name}</ElTag>
  },
  {
    key: 'targetSummary',
    title: '对象',
    minWidth: 220,
    align: 'left',
    ellipsis: true
  },
  {
    key: 'roleNames',
    title: '涉及角色',
    minWidth: 140,
    align: 'left',
    ellipsis: true
  },
  {
    key: 'userNames',
    title: '涉及用户',
    minWidth: 160,
    align: 'left',
    ellipsis: true
  },
  {
    key: 'operationPerson',
    title: '操作人',
    width: 140,
    align: 'left',
    ellipsis: true
  },
  {
    key: 'operationIp',
    title: '来源IP',
    width: 120,
    align: 'left',
    ellipsis: true
  },
  {
    key: 'operationParam',
    title: '请求参数',
    minWidth: 200,
    align: 'left',
    ellipsis: true
  },
  {
    key: 'message',
    title: '结果消息',
    minWidth: 140,
    align: 'left',
    ellipsis: true
  }
]) as Ref<DataTable.Column<PermissionAuditNamespace.PermissionAuditRow>[]>;

// ---- R1-8 权限台账导出（人 × 角色 × 应用 × 权限 × 数据范围） ----
const matrixVisible = ref(false);
const matrixLoading = ref(false);
const dataScopeLabels: Record<number, string> = {
  10: '仅本人',
  20: '本部门',
  30: '本部门及以下',
  40: '自定义',
  50: '全部'
};

function openMatrixDialog() {
  matrixVisible.value = true;
}

/** 拉取台账并生成 CSV（UTF-8 BOM，Excel 直开） */
async function exportMatrix() {
  matrixLoading.value = true;
  try {
    const { data, error } = await findPermissionMatrix({});
    if (error !== null || !data) {
      window.$message?.error('权限台账拉取失败');
      return;
    }
    const header = ['登录名', '姓名', '角色', '应用', '权限标识', '数据范围', '授权有效期'];
    const lines = data.map(row =>
      [
        row.loginName,
        row.nickName,
        row.roleName,
        row.appName || '平台菜单',
        row.permission,
        dataScopeLabels[Number(row.dataScope)] || String(row.dataScope ?? ''),
        row.expireTime || '永久'
      ]
        .map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = '\ufeff' + [header.join(','), ...lines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `权限台账_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    window.$message?.success(`已导出 ${data.length} 行授权台账`);
  } finally {
    matrixLoading.value = false;
  }
}
</script>

<template>
  <div class="main-space h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:permissionAudit:list"
          permission-remove="system:permissionAudit:list"
          permission-export="system:permissionAudit:list"
          permission-import="system:permissionAudit:list"
          operation-title="权限审计"
          :show-operation="false"
          :show-export="false"
          :show-import="false"
          @keyword-search="keywordSearch"
          @keyword-clear="resetForm"
          @search="search"
          @reset="resetForm"
        >
          <template #filter>
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px">
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">操作人</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.operationPerson" placeholder="请输入操作人" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">时间范围</div>
              <div class="col-span-7">
                <PrivernalDatepicker
                  v-model:value="formFilter.dateList"
                  clearable
                  type="datetimerange"
                  value-format="yyyy-MM-dd HH:mm:ss"
                  placeholder="请选择时间范围"
                />
              </div>
            </div>
          </template>
          <template #toolbar-extra>
            <ElButton size="small" type="primary" @click="openMatrixDialog">权限台账导出</ElButton>
          </template>
        </ListFilter>

        <DataTable
          remote
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :row-key="rowKey"
          :scroll-x="1400"
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          :bottom-bordered="true"
          striped
        />

        <!-- 权限台账导出：人 × 角色 × 应用 × 权限 × 数据范围（仅生效中的授权） -->
        <ElDialog v-model="matrixVisible" title="权限台账导出" width="520px" :close-on-click-modal="false">
          <div class="flex-col gap-12px text-13px text-gray-600">
            <div>
              导出当前组织全部<b>生效中的授权</b>：人 × 角色 × 应用 × 权限标识 × 数据范围（授权已到期、角色停用、账号停用的行不包含）。
            </div>
            <div class="text-gray-400">平台管理员导出全部组织；组织管理员仅导出本组织。CSV 可直接用 Excel 打开。</div>
          </div>
          <template #footer>
            <ElButton @click="matrixVisible = false">取消</ElButton>
            <ElButton type="primary" :loading="matrixLoading" @click="exportMatrix">导出 CSV</ElButton>
          </template>
        </ElDialog>
      </div>
    </ElCard>
  </div>
</template>

<style lang="scss" scoped></style>
