<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue';
import { ElButton, ElPopconfirm, ElTag, ElSpace as __forwarded_ElSpace } from 'element-plus';
import { findWebhookEventDetail, findWebhookEventList, resendWebhookEvent } from '@/service';
import { useAuth, useLoading } from '@/hooks';
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;

defineOptions({ name: 'SystemWebhookEventList' });

const { loading, startLoading, endLoading } = useLoading(false);
const { hasAuth } = useAuth();
const tableData = ref<SystemWebhookNamespace.WebhookEventForm[]>([]);
const detailVisible = ref(false);
const detail = ref<SystemWebhookNamespace.WebhookEventForm | null>(null);

const statusOptions = [
  { label: '待投递 PENDING', value: 'PENDING' },
  { label: '投递中 DELIVERING', value: 'DELIVERING' },
  { label: '已送达 SUCCESS', value: 'SUCCESS' },
  { label: '待重试 FAILED', value: 'FAILED' },
  { label: '已放弃 DEAD', value: 'DEAD' }
];

const defaultPageNum = 1;
const defaultPageSize = 20;
/** ListFilter 的 keyword 是必填 prop，而查询类型里它是可选的，这里在本地补成必填 */
type FormFilterModel = SystemWebhookNamespace.WebhookEventQuery & { keyword: string };

const formFilter = reactive<FormFilterModel>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  keyword: '',
  keywords: [],
  eventType: undefined,
  tableCode: '',
  bizId: '',
  status: undefined,
  beginTime: '',
  endTime: ''
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

/** ElTag 的 type 值域（naive 的 error 在 EP 里是 danger） */
type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger';

function statusType(status?: string): TagType {
  if (status === 'SUCCESS') {
    return 'success';
  }
  if (status === 'DEAD') {
    return 'danger';
  }
  if (status === 'FAILED') {
    return 'warning';
  }
  return 'info';
}

const columns = ref<DataTable.Column<SystemWebhookNamespace.WebhookEventForm>[]>([
  { key: 'createdTime', title: '产生时间', width: 170, render: row => row.createdTime || '-' },
  { key: 'eventType', title: '事件类型', minWidth: 170 },
  {
    key: 'subscriptionName',
    title: '订阅',
    minWidth: 140,
    ellipsis: { tooltip: true },
    render: row => row.subscriptionName || <span class="opacity-60">已删除</span>
  },
  { key: 'tableCode', title: '表', minWidth: 140, render: row => row.tableCode || '-' },
  { key: 'bizId', title: '业务数据ID', minWidth: 160, ellipsis: { tooltip: true } },
  {
    key: 'status',
    title: '状态',
    width: 110,
    render: row => (
      <ElTag size="small" type={statusType(row.status)}>
        {row.status}
      </ElTag>
    )
  },
  { key: 'retryCount', title: '尝试', width: 80, render: row => row.retryCount ?? 0 },
  {
    key: 'nextRetryTime',
    title: '下次可投递',
    width: 170,
    render: row => row.nextRetryTime || '-'
  },
  { key: 'deliveredTime', title: '送达时间', width: 170, render: row => row.deliveredTime || '-' },
  {
    key: 'lastError',
    title: '最近失败原因',
    minWidth: 200,
    ellipsis: { tooltip: true },
    render: row => row.lastError || '-'
  },
  {
    key: 'operation',
    title: '操作',
    width: 180,
    align: 'center',
    fixed: 'right',
    render(row) {
      return (
        <ElSpace size={8} alignment="center">
          <ElButton size="small" text onClick={() => openDetail(row.id)}>
            投递记录
          </ElButton>
          {hasAuth('system:webhook:resend') && (
            <ElPopconfirm
              title="重发会重新排队并按当前订阅配置投递，确认重发？"
              confirm-button-text="确认"
              cancel-button-text="取消"
              width={280}
              onConfirm={() => handleResend(row)}
            >
              {{
                reference: () => (
                  <ElButton size="small" type="primary" plain>
                    重发
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

const deliveryColumns: DataTable.Column<SystemWebhookNamespace.WebhookDeliveryLogForm>[] = [
  { key: 'attempt', title: '第几次', width: 70 },
  { key: 'createdTime', title: '时间', width: 170, render: row => row.createdTime || '-' },
  {
    key: 'success',
    title: '结果',
    width: 80,
    render: row => (
      <ElTag size="small" type={row.success === 1 ? 'success' : 'danger'}>
        {row.success === 1 ? '成功' : '失败'}
      </ElTag>
    )
  },
  { key: 'statusCode', title: 'HTTP', width: 80, render: row => row.statusCode ?? '-' },
  { key: 'costMs', title: '耗时(ms)', width: 100, render: row => row.costMs ?? '-' },
  { key: 'errorMsg', title: '失败原因', minWidth: 160, render: row => row.errorMsg || '-' },
  {
    key: 'responseBrief',
    title: '响应摘要',
    minWidth: 160,
    ellipsis: { tooltip: true },
    render: row => row.responseBrief || '-'
  }
];

async function getTableData() {
  startLoading();
  const query = { ...formFilter };
  if (!query.beginTime) {
    delete query.beginTime;
  }
  if (!query.endTime) {
    delete query.endTime;
  }
  const { data, error } = await findWebhookEventList(query);
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
  formFilter.eventType = undefined;
  formFilter.tableCode = '';
  formFilter.bizId = '';
  formFilter.status = undefined;
  formFilter.beginTime = '';
  formFilter.endTime = '';
  search();
}

function openDetail(id: string) {
  findWebhookEventDetail(id).then(res => {
    if (res.error === null && res.data) {
      detail.value = res.data;
      detailVisible.value = true;
    }
  });
}

function handleResend(row: SystemWebhookNamespace.WebhookEventForm) {
  resendWebhookEvent(row.id).then(res => {
    if (res.error === null) {
      window.$message?.success('已重新入队投递，稍后可查看投递记录');
      getTableData();
    }
  });
}

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
          permission-add=""
          permission-remove=""
          permission-export=""
          permission-import=""
          :show-add="false"
          :show-remove="false"
          operation-title="事件与投递记录"
          :show-export="false"
          :show-import="false"
          @keyword-search="search"
          @keyword-clear="search"
          @search="search"
          @reset="resetForm"
        >
          <template #filter>
            <div class="grid grid-cols-40 gap-x-12px gap-y-8px">
              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">事件类型</div>
              <div class="col-span-8">
                <ElInput v-model="formFilter.eventType" placeholder="如 dynamic.data.created" size="small" />
              </div>

              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">表编码</div>
              <div class="col-span-8">
                <ElInput v-model="formFilter.tableCode" placeholder="请输入表编码" size="small" />
              </div>

              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">状态</div>
              <div class="col-span-8">
                <ElSelect v-model="formFilter.status" size="small" clearable placeholder="请选择状态">
                  <ElOption v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </ElSelect>
              </div>

              <div class="col-span-4 ml-10px flex flex-row items-center justify-end">业务ID</div>
              <div class="col-span-8">
                <ElInput v-model="formFilter.bizId" placeholder="数据ID" size="small" />
              </div>
            </div>
          </template>
        </ListFilter>

        <DataTable
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

        <ElDialog v-model="detailVisible" title="事件详情与投递记录" class="w-1000px">
          <ElSpace size="default">
            <ElDescriptions label-position="left" :column="3" size="small">
              <ElDescriptionsItem label="事件类型">{{ detail?.eventType }}</ElDescriptionsItem>
              <ElDescriptionsItem label="订阅">{{ detail?.subscriptionName || '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="表">{{ detail?.tableCode || '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="业务数据ID">{{ detail?.bizId || '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="状态">{{ detail?.status }}</ElDescriptionsItem>
              <ElDescriptionsItem label="尝试次数">{{ detail?.retryCount ?? 0 }}</ElDescriptionsItem>
              <ElDescriptionsItem label="送达时间">{{ detail?.deliveredTime || '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="失败原因" :span="3">{{ detail?.lastError || '-' }}</ElDescriptionsItem>
            </ElDescriptions>

            <div>
              <div class="mb-6px text-13px font-medium">请求体（投递时原样发送）</div>
              <ElInput
                :value="JSON.stringify(detail?.payload || {}, null, 2)"
                type="textarea"
                readonly
                :autosize="{ minRows: 4, maxRows: 10 }"
              />
            </div>

            <div>
              <div class="mb-6px text-13px font-medium">投递记录</div>
              <DataTable
                :columns="deliveryColumns"
                :data="detail?.deliveryLogs || []"
                size="small"
                :max-height="260"
                :bordered="false"
              />
            </div>
          </ElSpace>
        </ElDialog>
      </div>
    </ElCard>
  </div>
</template>
