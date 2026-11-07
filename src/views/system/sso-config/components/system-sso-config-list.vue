<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue';
import { ElButton, ElPopconfirm, ElSpace, ElTag } from 'element-plus';
import { delSsoConfig, findSsoConfigList, testSsoConfig } from '@/service';
import { useAuth, useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-sso-config-modal.vue';
import SystemSsoConfigModal from './system-sso-config-modal.vue';

defineOptions({ name: 'SystemSsoConfigList' });

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { hasAuth } = useAuth();
const testingId = ref('');

const tableData = ref<SystemSsoNamespace.SsoOidcConfigForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
const modalType = ref<ModalType>('add');
const editData = ref<SystemSsoNamespace.SsoOidcConfigForm | null>(null);

const defaultPageNum = 1;
const defaultPageSize = 20;
type FormFilterModel = SystemSsoNamespace.SsoOidcConfigQuery & { keyword: string };
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: [],
  configName: '',
  status: undefined
});

const pagination = reactive({
  page: defaultPageNum,
  pageSize: defaultPageSize,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0,
  prefix(info: DataTable.PaginationInfo) {
    return `总数: ${info.itemCount}条`;
  },
  onChange: (page: number) => {
    pagination.page = page;
    formFilter.pageNum = page;
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

async function getTableData() {
  startLoading();
  const { data, error } = await findSsoConfigList(formFilter);
  if (error === null && data) {
    tableData.value = data.list || [];
    pagination.itemCount = data.total || 0;
  }
  endLoading();
}

function search() {
  formFilter.pageNum = defaultPageNum;
  pagination.page = defaultPageNum;
  getTableData();
}

function resetForm() {
  formFilter.configName = '';
  formFilter.status = undefined;
  search();
}

function handleAddTable() {
  modalType.value = 'add';
  editData.value = null;
  openModal();
}

function handleEdit(row: SystemSsoNamespace.SsoOidcConfigForm) {
  modalType.value = 'edit';
  editData.value = row;
  openModal();
}

function handleView(row: SystemSsoNamespace.SsoOidcConfigForm) {
  modalType.value = 'view';
  editData.value = row;
  openModal();
}

/** 点测试即验证 issuer/发现文档可达，并把解析到的端点落到配置上 */
function handleTest(row: SystemSsoNamespace.SsoOidcConfigForm) {
  testingId.value = row.id;
  testSsoConfig(row.id)
    .then(res => {
      if (res.error === null) {
        window.$message?.success('发现文档连通，端点已回填');
        getTableData();
      }
    })
    .finally(() => {
      testingId.value = '';
    });
}

function handleDeleteRow(row: SystemSsoNamespace.SsoOidcConfigForm) {
  delSsoConfig([row.id]).then(res => {
    if (res.error === null) {
      window.$message?.success('删除成功');
      getTableData();
    }
  });
}

function handleDeleteRows() {
  if (!checkedRowKeys.value.length) {
    window.$message?.error('请选择要删除的渠道！');
    return;
  }
  delSsoConfig(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      window.$message?.success('删除成功');
      checkedRowKeys.value = [];
      getTableData();
    }
  });
}

const columns = ref<DataTable.Column<SystemSsoNamespace.SsoOidcConfigForm>[]>([
  { type: 'selection', width: 60, align: 'center' },
  {
    key: 'configCode',
    title: '渠道编码',
    width: 140,
    render: row => <span class="font-mono">{row.configCode}</span>
  },
  {
    key: 'configName',
    title: '渠道名称',
    minWidth: 140,
    ellipsis: { tooltip: true },
    render: row => <a onClick={() => handleView(row)}>{row.configName}</a>
  },
  { key: 'issuer', title: 'Issuer', minWidth: 220, ellipsis: { tooltip: true } },
  { key: 'clientId', title: 'client_id', minWidth: 160, ellipsis: { tooltip: true } },
  {
    key: 'secret',
    title: '密钥',
    width: 130,
    render: row => <span class="font-mono">{`${row.clientSecretPrefix || ''}••••${row.clientSecretLast4 || ''}`}</span>
  },
  {
    key: 'tokenUrl',
    title: '端点来源',
    width: 120,
    render: row =>
      row.tokenUrl ? (
        <ElTag size="small" type="success">
          已发现
        </ElTag>
      ) : (
        <ElTag size="small">待测试</ElTag>
      )
  },
  {
    key: 'autoRegister',
    title: '自动建号',
    width: 100,
    render: row => (row.autoRegister === 1 ? '是' : '否')
  },
  {
    key: 'status',
    title: '状态',
    width: 90,
    render: row => (
      <ElTag size="small" type={row.status === 1 ? 'success' : 'info'}>
        {row.status === 1 ? '启用' : '停用'}
      </ElTag>
    )
  },
  {
    key: 'operation',
    title: '操作',
    width: 240,
    align: 'center',
    fixed: 'right',
    render(row) {
      return (
        <ElSpace size={8} alignment="center">
          {hasAuth('system:ssoConfig:test') && (
            <ElButton size="small" text loading={testingId.value === row.id} onClick={() => handleTest(row)}>
              发现文档测试
            </ElButton>
          )}
          {hasAuth('system:ssoConfig:edit') && (
            <ElButton size="small" type="primary" plain onClick={() => handleEdit(row)}>
              编辑
            </ElButton>
          )}
          {hasAuth('system:ssoConfig:remove') && (
            <ElPopconfirm
              title="删除后该渠道的登录入口立即消失，已绑定的社交账号不受影响。确认删除？"
              confirm-button-text="确认"
              cancel-button-text="取消"
              width={300}
              onConfirm={() => handleDeleteRow(row)}
            >
              {{
                reference: () => (
                  <ElButton size="small" type="danger" plain>
                    删除
                  </ElButton>
                )
              }}
            </ElPopconfirm>
          )}
        </ElSpace>
      );
    }
  }
]);

onMounted(() => {
  getTableData();
});
</script>

<template>
  <div class="h-full overflow-hidden">
    <ElCard title="" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <ListFilter
          v-model:keyword="formFilter.keyword"
          permission-add="system:ssoConfig:add"
          permission-remove="system:ssoConfig:remove"
          permission-export="system:ssoConfig:export"
          permission-import="system:ssoConfig:import"
          operation-title="单点登录渠道"
          :show-export="false"
          :show-import="false"
          @add="handleAddTable"
          @delete="handleDeleteRows"
          @keyword-search="search"
          @keyword-clear="search"
          @search="search"
          @reset="resetForm"
        >
          <template #filter>
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px">
              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">渠道名称</div>
              <div class="col-span-8">
                <ElInput v-model="formFilter.configName" placeholder="请输入渠道名称" size="small" />
              </div>

              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">状态</div>
              <div class="col-span-8">
                <ElSelect v-model="formFilter.status" size="small" clearable placeholder="请选择状态">
                  <ElOption
                    v-for="opt in [
                      { label: '启用', value: 1 },
                      { label: '停用', value: 0 }
                    ]"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
              </div>
            </div>
          </template>
        </ListFilter>

        <DataTable
          v-model:checked-row-keys="checkedRowKeys"
          remote
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: any) => row.id"
          :scroll-x="1500"
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          striped
        />

        <SystemSsoConfigModal
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
          @closed="getTableData"
        />
      </div>
    </ElCard>
  </div>
</template>
