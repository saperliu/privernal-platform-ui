<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { messageTypeLabels } from '@/constants';
import { delSystemMessage, findSystemMessageList } from '@/service';
import { useBoolean, useLoading } from '@/hooks';
import type { ModalType } from './system-message-modal.vue';
import SystemMessageModal from './system-message-modal.vue';

export interface Props {
  /** 操作按钮可见性 */
  showOperation?: boolean;
  multiple?: boolean;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
}
defineOptions({ name: 'SystemMessageList' });
// 组件内不读取 props（模板按名字取用），保留对外声明即可
withDefaults(defineProps<Props>(), {
  showOperation: true,
  multiple: true,
  parentId: ''
});
interface Emits {
  (e: 'change', data: SystemMessageNamespace.SystemMessageForm[]): void;
}
const emit = defineEmits<Emits>();

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const tableData = ref<SystemMessageNamespace.SystemMessageForm[]>([]);
const checkedRowKeys = ref<string[]>([]);
/**
 * `keyword` 在 ListFilter 里是必填 string，这里收紧成非可选，避免 v-model 传 `string | undefined`。
 */
type FormFilterModel = SystemMessageNamespace.SystemMessageQuery & { keyword: string };
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

function setTableData(data: SystemMessageNamespace.SystemMessagePage) {
  tableData.value = data.list;
  pagination.itemCount = data.total;
}

function rowKey(rowData: any) {
  return rowData.id;
}

async function getTableData(dataQuery: SystemMessageNamespace.SystemMessageQuery) {
  startLoading();
  const { data } = await findSystemMessageList(dataQuery);
  let result: SystemMessageNamespace.SystemMessagePage = { list: [], total: 0 };
  if (data) {
    result = data;
  }
  setTableData(result);
  endLoading();
}

const columns: Ref<DataTable.Column<SystemMessageNamespace.SystemMessageForm>[]> = ref([
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
    key: 'mainTitle',
    title: '标题',
    align: 'left',
    ellipsis: true,
    render: row => {
      return <TableColumnLink value={row} name={row.mainTitle} onClick={() => tableColumnClick(row)}></TableColumnLink>;
    }
  },
  {
    key: 'subTitle',
    title: '副标题',
    align: 'left',
    ellipsis: true
  },
  {
    key: 'messageType',
    title: '消息类型',
    align: 'left',
    ellipsis: true,
    render: row => {
      return messageTypeLabels[row.messageType];
    }
  },
  // {
  //   key: 'messagePerson',
  //   title: '发送人类型，ALL-所有人[限制组织内]，SEL-选定的人员',
  //       align: 'left',
  //   ellipsis: true,
  // },
  {
    key: 'detailUrl',
    title: '详情链接',
    align: 'left',
    ellipsis: true
  },
  // {
  //   key: 'content',
  //   title: '内容简介',
  //       align: 'left',
  //   ellipsis: true,
  // },
  // {
  //   key: 'status',
  //   title: '状态',
  //       align: 'left',
  //   ellipsis: true,,
  //   render: row => {
  //     return (
  //       <ElButton size={'small'} color={dataStatusColors[row.status]}>
  //         {dataStatusLabels[row.status]}
  //       </ElButton>
  //     );
  //   }
  // },
  {
    key: 'remark',
    title: '备注',
    align: 'left',
    ellipsis: true
  },

  {
    key: 'createdName',
    title: '创建人',
    align: 'left',
    ellipsis: true
  }
]) as Ref<DataTable.Column<SystemMessageNamespace.SystemMessageForm>[]>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<SystemMessageNamespace.SystemMessageForm | null>(null);

function setEditData(data: SystemMessageNamespace.SystemMessageForm | null) {
  editData.value = data;
}

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
  delSystemMessage(checkedRowKeys.value).then(res => {
    if (res.error === null) {
      checkedRowKeys.value = [];
      window.$message?.success('删除成功');
      search();
    }
  });
}

/**
 * 单独某列的点击的处理
 *
 * @param row
 */
function tableColumnClick(row: SystemMessageNamespace.SystemMessageForm) {
  setEditData(row);
  setModalType('view');
  openModal();
}

/** 重置搜索 */
function resetForm() {
  // formFilter.name = '';
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
  rows: SystemMessageNamespace.SystemMessageForm[],
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
          permission-add="message:systemMessage:add"
          permission-remove="message:systemMessage:remove"
          permission-import="message:systemMessage:import"
          permission-export="message:systemMessage:export"
          operation-title="系统消息"
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
              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">标题</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.mainTitle" placeholder="请输入标题" size="small" />
              </div>

              <div class="col-span-3 ml-10px flex flex-row items-center justify-end">副标题</div>
              <div class="col-span-7">
                <ElInput v-model="formFilter.subTitle" placeholder="请输入副标题" size="small" />
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

        <SystemMessageModal v-model:visible="visible" :type="modalType" :edit-data="editData" @closed="handleClose" />
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
