<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue';
import { ElButton, ElPopconfirm, ElSpace, ElTag } from 'element-plus';
import { delOpenApiCredential, findOpenApiCredentialList, rotateOpenApiCredential } from '@/service';
import { useAuth, useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-openapi-credential-modal.vue';
import SystemOpenapiCredentialModal from './system-openapi-credential-modal.vue';

defineOptions({ name: 'SystemOpenapiCredentialList' });

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { bool: secretVisible, setTrue: openSecretModal } = useBoolean();
const { hasAuth } = useAuth();
const tableData = ref<SystemOpenapiNamespace.OpenApiCredentialForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
const modalType = ref<ModalType>('add');
const editData = ref<SystemOpenapiNamespace.OpenApiCredentialForm | null>(null);
const revealed = ref<SystemOpenapiNamespace.OpenApiCredentialForm | null>(null);

const defaultPageNum = 1;
const defaultPageSize = 20;
/** 查询类型里 keyword 是可选的，列表页筛选模型必须保证它是字符串（ListFilter 受控关键字） */
type FormFilterModel = SystemOpenapiNamespace.OpenApiCredentialQuery & { keyword: string };
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: [],
  credentialName: '',
  accessKey: '',
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
  const { data, error } = await findOpenApiCredentialList(formFilter);
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
  formFilter.credentialName = '';
  formFilter.accessKey = '';
  formFilter.status = undefined;
  search();
}

function keywordSearch() {
  search();
}

function clearSearch() {
  formFilter.keyword = '';
  search();
}

function handleAddTable() {
  modalType.value = 'add';
  editData.value = null;
  openModal();
}

function handleEdit(row: SystemOpenapiNamespace.OpenApiCredentialForm) {
  modalType.value = 'edit';
  editData.value = row;
  openModal();
}

function handleView(row: SystemOpenapiNamespace.OpenApiCredentialForm) {
  modalType.value = 'view';
  editData.value = row;
  openModal();
}

function handleRotate(row: SystemOpenapiNamespace.OpenApiCredentialForm) {
  rotateOpenApiCredential(row.id).then(res => {
    if (res.error === null && res.data) {
      revealed.value = res.data;
      openSecretModal();
      getTableData();
    }
  });
}

function handleDeleteRow(row: SystemOpenapiNamespace.OpenApiCredentialForm) {
  delOpenApiCredential([row.id]).then(res => {
    if (res.error === null) {
      window.$message?.success('删除成功');
      getTableData();
    }
  });
}

function handleDeleteRows() {
  if (!checkedRowKeys.value.length) {
    window.$message?.error('请选择要删除的凭证！');
    return;
  }
  delOpenApiCredential(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      window.$message?.success('删除成功');
      checkedRowKeys.value = [];
      getTableData();
    }
  });
}

function secretMask(row: SystemOpenapiNamespace.OpenApiCredentialForm) {
  if (!row.secretPrefix && !row.secretLast4) {
    return '-';
  }
  return `${row.secretPrefix || ''}••••••${row.secretLast4 || ''}`;
}

const columns = ref<DataTable.Column<SystemOpenapiNamespace.OpenApiCredentialForm>[]>([
  {
    type: 'selection',
    width: 60,
    align: 'center'
  },
  {
    key: 'credentialName',
    title: '凭证名称',
    minWidth: 160,
    ellipsis: true,
    render: row => <a onClick={() => handleView(row)}>{row.credentialName}</a>
  },
  {
    key: 'accessKey',
    title: 'AccessKey',
    minWidth: 180,
    render: row => <span class="font-mono">{row.accessKey}</span>
  },
  {
    key: 'secret',
    title: 'Secret（掩码）',
    minWidth: 150,
    render: row => <span class="font-mono">{secretMask(row)}</span>
  },
  {
    key: 'scopes',
    title: 'API 范围',
    minWidth: 200,
    render: row => (
      <ElSpace size={4}>
        {(row.scopes || []).map(item => (
          <ElTag size="small">{item}</ElTag>
        ))}
      </ElSpace>
    )
  },
  {
    key: 'tableGrants',
    title: '授权表',
    minWidth: 120,
    render: row => `${(row.tableGrants || []).length} 张`
  },
  {
    key: 'callCount',
    title: '调用次数',
    width: 100,
    render: row => row.callCount || '0'
  },
  {
    key: 'lastCallTime',
    title: '最近调用',
    width: 170,
    render: row => row.lastCallTime || '-'
  },
  {
    key: 'expireTime',
    title: '过期时间',
    width: 170,
    render: row => row.expireTime || '长期'
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
    width: 220,
    align: 'center',
    fixed: 'right',
    render(row) {
      return (
        <ElSpace size={8} alignment="center">
          {hasAuth('system:openapi:edit') && (
            <ElButton size="small" type="primary" plain onClick={() => handleEdit(row)}>
              编辑
            </ElButton>
          )}
          {hasAuth('system:openapi:rotate') && (
            <ElPopconfirm
              title="轮换会生成新的 Secret，旧 Secret 立即失效，调用方要同步更新。确认轮换？"
              confirm-button-text="确认"
              cancel-button-text="取消"
              width={300}
              onConfirm={() => handleRotate(row)}
            >
              {{
                reference: () => (
                  <ElButton size="small" type="warning" plain>
                    轮换
                  </ElButton>
                )
              }}
            </ElPopconfirm>
          )}
          {hasAuth('system:openapi:remove') && (
            <ElPopconfirm
              title="删除后该凭证的调用会立刻被拒，确认删除？"
              confirm-button-text="确认"
              cancel-button-text="取消"
              width={260}
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
          permission-add="system:openapi:add"
          permission-remove="system:openapi:remove"
          permission-export=""
          permission-import=""
          operation-title="OpenAPI凭证"
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
              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">凭证名称</div>
              <div class="col-span-8">
                <ElInput v-model="formFilter.credentialName" placeholder="请输入凭证名称" size="small" />
              </div>

              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">AccessKey</div>
              <div class="col-span-8">
                <ElInput v-model="formFilter.accessKey" placeholder="请输入 AccessKey" size="small" />
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
          :scroll-x="1600"
          flex-height
          class="flex-1-hidden"
          size="small"
          :bordered="false"
          striped
        />

        <SystemOpenapiCredentialModal
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
          @closed="getTableData"
          @secret="
            data => {
              revealed = data;
              openSecretModal();
            }
          "
        />

        <SecretRevealModal
          v-model:visible="secretVisible"
          title="凭证已创建"
          label="AccessKey"
          :label-value="revealed?.accessKey || ''"
          :secret="revealed?.secret || ''"
        />
      </div>
    </ElCard>
  </div>
</template>
