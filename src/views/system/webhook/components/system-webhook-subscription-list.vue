<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue';
import { ElButton, ElPopconfirm, ElSpace, ElTag } from 'element-plus';
import { delWebhookSubscription, findWebhookSubscriptionList, rotateWebhookSubscription } from '@/service';
import { useAuth, useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-webhook-subscription-modal.vue';
import SystemWebhookSubscriptionModal from './system-webhook-subscription-modal.vue';

defineOptions({ name: 'SystemWebhookSubscriptionList' });

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { bool: secretVisible, setTrue: openSecretModal } = useBoolean();
const { hasAuth } = useAuth();
const tableData = ref<SystemWebhookNamespace.WebhookSubscriptionForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
const modalType = ref<ModalType>('add');
const editData = ref<SystemWebhookNamespace.WebhookSubscriptionForm | null>(null);
const revealed = ref<SystemWebhookNamespace.WebhookSubscriptionForm | null>(null);

const defaultPageNum = 1;
const defaultPageSize = 20;
/** ListFilter 的 keyword 是必填，查询类型里它是可选，用本地交叉类型补齐 */
type FormFilterModel = SystemWebhookNamespace.WebhookSubscriptionQuery & { keyword: string };
const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: [],
  subscriptionName: '',
  tableCode: '',
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
  const { data, error } = await findWebhookSubscriptionList(formFilter);
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
  formFilter.subscriptionName = '';
  formFilter.tableCode = '';
  formFilter.status = undefined;
  search();
}

function handleAddTable() {
  modalType.value = 'add';
  editData.value = null;
  openModal();
}

function handleEdit(row: SystemWebhookNamespace.WebhookSubscriptionForm) {
  modalType.value = 'edit';
  editData.value = row;
  openModal();
}

function handleView(row: SystemWebhookNamespace.WebhookSubscriptionForm) {
  modalType.value = 'view';
  editData.value = row;
  openModal();
}

function handleRotate(row: SystemWebhookNamespace.WebhookSubscriptionForm) {
  rotateWebhookSubscription(row.id).then(res => {
    if (res.error === null && res.data) {
      revealed.value = res.data;
      openSecretModal();
      getTableData();
    }
  });
}

function handleDeleteRow(row: SystemWebhookNamespace.WebhookSubscriptionForm) {
  delWebhookSubscription([row.id]).then(res => {
    if (res.error === null) {
      window.$message?.success('删除成功');
      getTableData();
    }
  });
}

function handleDeleteRows() {
  if (!checkedRowKeys.value.length) {
    window.$message?.error('请选择要删除的订阅！');
    return;
  }
  delWebhookSubscription(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      window.$message?.success('删除成功');
      checkedRowKeys.value = [];
      getTableData();
    }
  });
}

const columns = ref<DataTable.Column<SystemWebhookNamespace.WebhookSubscriptionForm>[]>([
  { type: 'selection', width: 60, align: 'center' },
  {
    key: 'subscriptionName',
    title: '订阅名称',
    minWidth: 160,
    ellipsis: true,
    render: row => <a onClick={() => handleView(row)}>{row.subscriptionName}</a>
  },
  { key: 'url', title: '回调地址', minWidth: 240, ellipsis: true },
  {
    key: 'events',
    title: '订阅事件',
    minWidth: 220,
    render: row => (
      <ElSpace size={4}>
        {(row.events || []).map(item => (
          <ElTag size="small">{item}</ElTag>
        ))}
      </ElSpace>
    )
  },
  {
    key: 'tableCode',
    title: '限定表',
    minWidth: 140,
    render: row => row.tableCode || <span class="opacity-60">全部</span>
  },
  {
    key: 'secret',
    title: '签名密钥',
    width: 150,
    render: row => <span class="font-mono">{`${row.secretPrefix || ''}••••${row.secretLast4 || ''}`}</span>
  },
  {
    key: 'timeoutMs',
    title: '超时/重试',
    width: 120,
    render: row => `${row.timeoutMs ?? '-'}ms / ${row.maxRetry ?? '-'}次`
  },
  {
    key: 'sslVerify',
    title: '证书',
    width: 90,
    render: row => (
      <ElTag size="small" type={row.sslVerify === 0 ? 'warning' : 'info'}>
        {row.sslVerify === 0 ? '不校验' : '校验'}
      </ElTag>
    )
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
          {hasAuth('system:webhook:edit') && (
            <ElButton size="small" type="primary" plain onClick={() => handleEdit(row)}>
              编辑
            </ElButton>
          )}
          {hasAuth('system:webhook:edit') && (
            <ElPopconfirm
              title="轮换后旧密钥立即失效，对端验签会全部失败，确认轮换？"
              confirm-button-text="确认"
              cancel-button-text="取消"
              width={280}
              onConfirm={() => handleRotate(row)}
            >
              {{
                reference: () => (
                  <ElButton size="small" type="warning" plain>
                    轮换密钥
                  </ElButton>
                )
              }}
            </ElPopconfirm>
          )}
          {hasAuth('system:webhook:remove') && (
            <ElPopconfirm
              title="删除订阅后历史事件仍可重发，确认删除？"
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
          permission-add="system:webhook:add"
          permission-remove="system:webhook:remove"
          permission-export="system:webhook:export"
          permission-import="system:webhook:import"
          operation-title="Webhook订阅"
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
              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">订阅名称</div>
              <div class="col-span-8">
                <ElInput v-model="formFilter.subscriptionName" placeholder="请输入订阅名称" size="small" />
              </div>

              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">表编码</div>
              <div class="col-span-8">
                <ElInput v-model="formFilter.tableCode" placeholder="请输入表编码" size="small" />
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

        <SystemWebhookSubscriptionModal
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
          title="订阅已创建"
          label="回调地址"
          :label-value="revealed?.url || ''"
          :secret="revealed?.secret || ''"
        />
      </div>
    </ElCard>
  </div>
</template>
