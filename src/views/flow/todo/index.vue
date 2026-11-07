<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import {
  ElButton,
  ElDatePicker,
  ElDialog as __forwarded_ElDialog,
  ElForm as __forwarded_ElForm,
  ElFormItem as __forwarded_ElFormItem,
  ElInput as __forwarded_ElInput,
  ElRadioButton as __forwarded_ElRadioButton,
  ElRadioGroup as __forwarded_ElRadioGroup,
  ElSelect as __forwarded_ElSelect,
  ElSpace as __forwarded_ElSpace
} from 'element-plus';
import {
  addSignFlowTask,
  approveFlowTask,
  delegateFlowTask,
  findFlowTaskOptions,
  findFlowTodoList,
  findSystemUserList,
  jumpFlowTask,
  reduceSignFlowTask,
  rejectFlowTask,
  transferFlowTask
} from '@/service';
import { useLoading } from '@/hooks';
import { formatDateTime } from '@/utils';
import {
  btnCodeLabel,
  btnColorOf,
  btnPermLabel,
  canonicalBtnCode,
  useFlowBtnPerms,
  visibleBtnPerms
} from '../components/btn-perm';
import FlowFormModal from '../components/flow-form-modal.vue';
import FlowListLayout from '../components/flow-list-layout.vue';
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElForm = __forwarded_ElForm;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElFormItem = __forwarded_ElFormItem;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInput = __forwarded_ElInput;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDialog = __forwarded_ElDialog;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElRadioButton = __forwarded_ElRadioButton;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElRadioGroup = __forwarded_ElRadioGroup;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;
// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;

/** 驳回方式：LAST 上一节点 / START 发起节点 / TARGET 指定节点 */
const rejectTypeOptions = [
  { label: '退回上一节点', value: 'LAST' },
  { label: '退回发起人', value: 'START' },
  { label: '退回指定节点', value: 'TARGET' }
];

/** 跳转方式：PASS 按通过流转 / REJECT 按退回流转 */
const jumpSkipTypeOptions = [
  { label: '通过', value: 'PASS' },
  { label: '退回', value: 'REJECT' }
];

/** 操作类型 */
type ActionType = 'approve' | 'reject' | 'transfer' | 'delegate' | 'addSign' | 'reduceSign' | 'jump';

/** 下拉选项（原 naive-ui 全局 SelectOption，迁移后本地声明） */
interface SelectOption {
  label: string;
  value: string;
}

const actionLabels: Record<ActionType, string> = {
  approve: '审批通过',
  reject: '驳回',
  transfer: '转办',
  delegate: '委派',
  addSign: '加签',
  reduceSign: '减签',
  jump: '跳转'
};

/** 操作列按钮文案（未配置按钮时的内置集合用） */
const actionBtnLabels: Record<ActionType, string> = {
  approve: '通过',
  reject: '驳回',
  transfer: '转办',
  delegate: '委派',
  addSign: '加签',
  reduceSign: '减签',
  jump: '跳转'
};

/** 操作列按钮配色 */
const actionButtonTypes: Record<ActionType, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
  approve: 'success',
  reject: 'danger',
  transfer: 'warning',
  delegate: 'warning',
  addSign: 'info',
  reduceSign: 'info',
  jump: 'default'
};

/** 需要办理选项（可选节点/当前办理人）的操作 */
const needTaskOptionActions: ActionType[] = ['reject', 'jump', 'reduceSign'];
/** 需要选择平台人员的操作 */
const needSystemUserActions: ActionType[] = ['transfer', 'delegate', 'addSign'];
/** 需要弹窗选择目标节点/人员的操作（无论按钮是否配置意见弹窗都必须弹出） */
const needInputActions: ActionType[] = ['reject', 'transfer', 'delegate', 'addSign', 'reduceSign', 'jump'];

/** 网关节点不可作为跳转/驳回落点（3互斥网关 4并行网关） */
const gatewayNodeTypes = [3, 4];

const { loading, startLoading, endLoading } = useLoading(false);
const tableData = ref<FlowNamespace.Task[]>([]);

const defaultPageNum = 1;
const defaultPageSize = 20;
const formFilter = reactive<FlowNamespace.TaskQuery>({
  pageNum: defaultPageNum,
  pageSize: defaultPageSize,
  flowName: '',
  businessId: '',
  keywords: [],
  timeStart: '',
  timeEnd: ''
});
// 深链：?businessId=xxx（APP 任务消息直达该单据的任务），并入初始过滤
const route = useRoute();
const deepBusinessId = typeof route.query.businessId === 'string' ? route.query.businessId : '';
if (deepBusinessId !== '') {
  formFilter.businessId = deepBusinessId;
}

/** 时间范围（控件带 value-format，取到的即 yyyy-MM-dd 字符串） */
const timeRange = ref<[string, string] | null>(null);

function applyTimeRange() {
  formFilter.timeStart = timeRange.value?.[0] ?? '';
  formFilter.timeEnd = timeRange.value?.[1] ?? '';
}

const pagination = reactive<DataTable.PaginationProps>({
  page: defaultPageNum,
  pageSize: defaultPageSize,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30, 50, 100],
  itemCount: 0,
  prefix: info => `总数: ${info.itemCount}条`,
  onChange: (page: number) => {
    pagination.page = page;
    formFilter.pageNum = page;
    formFilter.pageSize = pagination.pageSize || defaultPageSize;
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

/** 按钮配置（flow_form_btn_perm）：按当前页出现过的 flowCode 加载并缓存 */
const { byFlow: btnPermByFlow, reload: loadBtnConfigs } = useFlowBtnPerms();

/** 任务办理选项（taskId → 节点 + 当前办理人），列表刷新后清空 */
const taskOptionsCache = new Map<string, FlowNamespace.TaskOption>();
const optionsLoading = ref(false);

async function loadTaskOptions(task: FlowNamespace.Task) {
  if (taskOptionsCache.has(task.id)) return;
  optionsLoading.value = true;
  const { data, error } = await findFlowTaskOptions(task.id);
  if (error === null && data) {
    taskOptionsCache.set(task.id, data);
  }
  optionsLoading.value = false;
}

async function getTableData() {
  startLoading();
  const { data } = await findFlowTodoList(formFilter);
  tableData.value = data?.list || [];
  pagination.itemCount = data?.total || 0;
  endLoading();
  // 任务状态已变化，办理选项缓存失效
  taskOptionsCache.clear();
  await loadBtnConfigs(tableData.value);
}

/** 查询：条件默认为空直接分页展示，填写后按条件查询 */
function onSearch() {
  applyTimeRange();
  pagination.page = defaultPageNum;
  formFilter.pageNum = defaultPageNum;
  getTableData();
}

/** 清空：重置全部条件并查询 */
function onClear() {
  formFilter.flowName = '';
  formFilter.businessId = '';
  timeRange.value = null;
  formFilter.timeStart = '';
  formFilter.timeEnd = '';
  onSearch();
}

/** 操作弹窗状态 */
const showModal = ref(false);
const actionType = ref<ActionType>('approve');
const currentTask = ref<FlowNamespace.Task | null>(null);
const formRef = ref<FormInstance | null>(null);
const actionForm = reactive({
  message: '',
  rejectType: 'LAST',
  targetNodeCode: '',
  /** 转办/委派单选目标人员 */
  targetUser: '' as string,
  /** 加签/减签多选人员 */
  userIds: [] as string[],
  skipType: 'PASS'
});

const taskOption = computed(() => (currentTask.value ? taskOptionsCache.get(currentTask.value.id) : undefined));

/** 驳回指定节点：已流转节点（历史落点） */
const rejectNodeOptions = computed<SelectOption[]>(() =>
  (taskOption.value?.nodeList ?? [])
    .filter(n => n.nodeStatus === 'COMPLETED' && !gatewayNodeTypes.includes(n.nodeType))
    .map(n => ({ label: n.nodeName, value: n.nodeCode }))
);

/** 跳转目标节点：除当前节点与网关外的全部节点 */
const jumpNodeOptions = computed<SelectOption[]>(() =>
  (taskOption.value?.nodeList ?? [])
    .filter(n => n.nodeCode !== currentTask.value?.nodeCode && !gatewayNodeTypes.includes(n.nodeType))
    .map(n => ({ label: n.nodeName, value: n.nodeCode }))
);

/** 减签人员：当前任务办理人（value 为后端原值，提交原样传回） */
const taskUserOptions = computed<SelectOption[]>(() =>
  (taskOption.value?.taskUserList ?? []).map(u => ({ label: u.userName, value: u.userId }))
);

/** 平台人员远程搜索（转办/委派/加签），沿用系统用户列表接口（登录态可查） */
const userOptions = ref<SelectOption[]>([]);
const userLoading = ref(false);

async function searchUsers(keyword: string) {
  userLoading.value = true;
  const { data, error } = await findSystemUserList({
    pageNum: 1,
    pageSize: 50,
    nickName: keyword || null
  });
  if (error === null && data?.list) {
    userOptions.value = data.list.map(u => ({
      label: u.nickName && u.loginName ? `${u.nickName}（${u.loginName}）` : u.nickName || u.loginName || u.id,
      value: u.id
    }));
  }
  userLoading.value = false;
}

const actionRules = computed<FormRules>(() => {
  const rules: FormRules = {};
  if (actionType.value === 'reject' && actionForm.rejectType === 'TARGET') {
    rules.targetNodeCode = [{ required: true, message: '请选择目标节点' }];
  }
  if (actionType.value === 'jump') {
    rules.targetNodeCode = [{ required: true, message: '请选择目标节点' }];
  }
  if (actionType.value === 'transfer' || actionType.value === 'delegate') {
    rules.targetUser = [{ required: true, message: '请选择目标人员' }];
  }
  if (actionType.value === 'addSign' || actionType.value === 'reduceSign') {
    rules.userIds = [{ required: true, message: '请选择人员', type: 'array' }];
  }
  return rules;
});

function openActionModal(task: FlowNamespace.Task, type: ActionType) {
  currentTask.value = task;
  actionType.value = type;
  actionForm.message = '';
  actionForm.rejectType = 'LAST';
  actionForm.targetNodeCode = '';
  actionForm.targetUser = '';
  actionForm.userIds = [];
  actionForm.skipType = 'PASS';
  showModal.value = true;
  if (needTaskOptionActions.includes(type)) {
    loadTaskOptions(task);
  }
  if (needSystemUserActions.includes(type) && !userOptions.value.length) {
    searchUsers('');
  }
}

/** 待办操作列按钮项（来自按钮配置或内置回退集）；viewForm 为只读查看，不触发任务办理 */
type TodoBtnCode = ActionType | 'viewForm';

interface ActionBtnItem {
  action: TodoBtnCode;
  label: string;
  showDialog?: number;
  color?: string;
}

/** 规范按钮编码 → 待办动作（save/terminate/revoke 属实例/表单级操作，不在待办列展示） */
const actionByBtnCode: Partial<Record<string, ActionType>> = {
  approve: 'approve',
  reject: 'reject',
  transfer: 'transfer',
  delegate: 'delegate',
  addSign: 'addSign',
  reduceSign: 'reduceSign',
  jump: 'jump'
};

/** 编码写法兼容：APPROVE / add_sign / BACK / SIGN 等历史写法先归一为规范编码再映射 */
function btnAction(btnCode: string): ActionType | undefined {
  return actionByBtnCode[canonicalBtnCode(btnCode)];
}

/** 免弹窗（showDialog=0 且无需选择节点/人员）直接执行 */
async function executeTaskAction(task: FlowNamespace.Task, type: ActionType) {
  const handle: FlowNamespace.TaskHandle = { taskId: task.id, message: '' };
  let result: { error: unknown } | undefined;
  if (type === 'approve') {
    result = await approveFlowTask(handle);
  } else if (type === 'reject') {
    handle.rejectType = 'LAST';
    result = await rejectFlowTask(handle);
  } else {
    return;
  }
  // 失败提示由请求层统一弹出
  if (result && result.error !== null) return;
  window.$message?.success(`${actionLabels[type]}成功`);
  getTableData();
}

/** 操作列按钮点击：需要选择节点/人员的操作一律弹窗，其余按 showDialog 配置 */
function onActionBtnClick(task: FlowNamespace.Task, action: ActionType, showDialog?: number) {
  if (showDialog === 1 || needInputActions.includes(action)) {
    openActionModal(task, action);
  } else {
    executeTaskAction(task, action);
  }
}

async function submitAction() {
  if (!currentTask.value) return;
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  const handle: FlowNamespace.TaskHandle = {
    taskId: currentTask.value.id,
    message: actionForm.message
  };
  let result: { error: unknown } | undefined;
  switch (actionType.value) {
    case 'approve':
      result = await approveFlowTask(handle);
      break;
    case 'reject':
      handle.rejectType = actionForm.rejectType;
      if (actionForm.rejectType === 'TARGET') {
        handle.targetNodeCode = actionForm.targetNodeCode;
      }
      result = await rejectFlowTask(handle);
      break;
    case 'transfer':
      handle.userIds = actionForm.targetUser ? [actionForm.targetUser] : [];
      result = await transferFlowTask(handle);
      break;
    case 'delegate':
      handle.userIds = actionForm.targetUser ? [actionForm.targetUser] : [];
      result = await delegateFlowTask(handle);
      break;
    case 'addSign':
      handle.userIds = actionForm.userIds;
      result = await addSignFlowTask(handle);
      break;
    case 'reduceSign':
      handle.userIds = actionForm.userIds;
      result = await reduceSignFlowTask(handle);
      break;
    case 'jump':
      handle.targetNodeCode = actionForm.targetNodeCode;
      handle.skipType = actionForm.skipType;
      result = await jumpFlowTask(handle);
      break;
    default:
      break;
  }
  // 失败提示由请求层统一弹出，保留弹窗供修改后重试
  if (result && result.error !== null) return;
  window.$message?.success(`${actionLabels[actionType.value]}成功`);
  showModal.value = false;
  getTableData();
}

/** 申请单：只读查看待办对应的业务数据（审批人无需该表的按钮权限） */
const showForm = ref(false);
const formRow = ref<FlowNamespace.Task | null>(null);

function handleShowForm(row: FlowNamespace.Task) {
  formRow.value = row;
  showForm.value = true;
}

const columns: Ref<DataTable.Column<FlowNamespace.Task>[]> = ref([
  {
    key: 'flowName',
    title: '标题',
    minWidth: 180,
    align: 'left',
    ellipsis: true,
    // 标题兜底链：业务数据标题（表单数据标题，未配置时由后端默认取第一个输入字段）→ 任务流程名 → 实例流程名
    render: row => <span class="font-500">{row.businessTitle || row.flowName || row.instanceFlowName}</span>
  },
  {
    key: 'content',
    title: '内容',
    align: 'left',
    render: row => (
      <div class="min-w-0 w-full flex flex-col">
        <span class="truncate text-13px">{row.businessTitle || row.nodeName}</span>
        <span class="truncate text-12px color-gray">
          {row.nodeName} · {row.businessId}
        </span>
      </div>
    )
  },
  {
    key: 'createTime',
    title: '接收时间',
    width: 170,
    align: 'center',
    render: row => <span class="whitespace-nowrap text-13px">{formatDateTime(row.createTime)}</span>
  },
  {
    key: 'action',
    title: '操作',
    width: 440,
    align: 'center',
    render: row => {
      // 按钮配置驱动：global + 当前节点可见按钮（isShow=1，同义编码只保留一条）
      const config = btnPermByFlow.value.get(row.flowCode || '');
      const items: ActionBtnItem[] = [];
      const seen = new Set<string>();
      (config?.length ? visibleBtnPerms(config, row.nodeCode) : []).forEach(btn => {
        const canonical = canonicalBtnCode(btn.btnCode);
        if (seen.has(canonical)) return;
        if (canonical === 'viewForm') {
          seen.add(canonical);
          items.push({ action: 'viewForm', label: btnPermLabel(btn), color: btnColorOf(btn.btnCode, btn.color) });
          return;
        }
        const action = btnAction(btn.btnCode);
        if (!action) return;
        seen.add(canonical);
        items.push({
          action,
          label: btnPermLabel(btn),
          showDialog: btn.showDialog,
          color: btnColorOf(btn.btnCode, btn.color)
        });
      });
      // 未配置、或配置里没有可用待办动作时，回退内置全集，保证加签/减签/跳转等操作不丢入口
      const buttons = items.length
        ? items
        : (['viewForm', ...Object.keys(actionBtnLabels)] as TodoBtnCode[]).map(
            (action): ActionBtnItem => ({
              action,
              label: action === 'viewForm' ? btnCodeLabel('viewForm') : actionBtnLabels[action],
              showDialog: 1
            })
          );
      return (
        <ElSpace alignment="center" size="small">
          {buttons.map(btn => (
            <ElButton
              size="small"
              type={btn.action === 'viewForm' ? 'default' : actionButtonTypes[btn.action]}
              color={btn.color}
              onClick={() => {
                if (btn.action === 'viewForm') handleShowForm(row);
                else onActionBtnClick(row, btn.action, btn.showDialog);
              }}
            >
              {btn.label}
            </ElButton>
          ))}
        </ElSpace>
      );
    }
  }
]);

getTableData();
</script>

<template>
  <div class="h-full overflow-hidden">
    <FlowListLayout
      active="todo"
      :total="pagination.itemCount"
      :todo-count="pagination.itemCount"
      @search="onSearch"
      @clear="onClear"
    >
      <template #filter>
        <div class="flex items-center gap-8px">
          <span class="whitespace-nowrap text-13px color-gray">流程名称</span>
          <ElInput
            v-model="formFilter.flowName"
            placeholder="请输入"
            clearable
            class="w-200px"
            @keyup.enter="onSearch"
          />
        </div>
        <div class="flex items-center gap-8px">
          <span class="whitespace-nowrap text-13px color-gray">业务单号</span>
          <ElInput
            v-model="formFilter.businessId"
            placeholder="请输入"
            clearable
            class="w-200px"
            @keyup.enter="onSearch"
          />
        </div>
        <div class="flex items-center gap-8px">
          <span class="whitespace-nowrap text-13px color-gray">接收时间</span>
          <ElDatePicker v-model="timeRange" type="daterange" value-format="YYYY-MM-DD" clearable class="w-280px" />
        </div>
      </template>

      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: FlowNamespace.Task) => row.id"
        flex-height
        class="min-h-0 flex-1"
        remote
      />
    </FlowListLayout>

    <FlowFormModal
      v-model:show="showForm"
      :business-id="formRow?.businessId ?? null"
      :flow-name="formRow?.flowName"
      :business-title="formRow?.businessTitle"
    />

    <ElDialog v-model="showModal" :title="actionLabels[actionType]" class="w-560px" :close-on-click-modal="false">
      <ElForm ref="formRef" :model="actionForm" :rules="actionRules" label-position="left" :label-width="90">
        <ElFormItem v-if="actionType === 'reject'" label="驳回方式" path="rejectType">
          <ElRadioGroup v-model="actionForm.rejectType">
            <ElRadioButton v-for="item in rejectTypeOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem
          v-if="actionType === 'reject' && actionForm.rejectType === 'TARGET'"
          label="目标节点"
          path="targetNodeCode"
        >
          <ElSelect
            v-model="actionForm.targetNodeCode"
            :loading="optionsLoading"
            filterable
            placeholder="请选择驳回到的节点"
          >
            <ElOption v-for="opt in rejectNodeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="actionType === 'jump'" label="目标节点" path="targetNodeCode">
          <ElSelect
            v-model="actionForm.targetNodeCode"
            :loading="optionsLoading"
            filterable
            placeholder="请选择跳转到的节点"
          >
            <ElOption v-for="opt in jumpNodeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="actionType === 'jump'" label="跳转方式" path="skipType">
          <ElRadioGroup v-model="actionForm.skipType">
            <ElRadioButton v-for="item in jumpSkipTypeOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem v-if="actionType === 'transfer' || actionType === 'delegate'" label="目标人员" path="targetUser">
          <ElSelect
            v-model="actionForm.targetUser"
            :loading="userLoading"
            filterable
            remote
            clearable
            placeholder="输入姓名搜索后选择"
            @search="searchUsers"
          >
            <ElOption v-for="opt in userOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="actionType === 'addSign'" label="目标人员" path="userIds">
          <ElSelect
            v-model="actionForm.userIds"
            multiple
            :loading="userLoading"
            filterable
            remote
            clearable
            placeholder="输入姓名搜索后选择（可多选）"
            @search="searchUsers"
          >
            <ElOption v-for="opt in userOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="actionType === 'reduceSign'" label="减签人员" path="userIds">
          <ElSelect
            v-model="actionForm.userIds"
            multiple
            :loading="optionsLoading"
            filterable
            clearable
            placeholder="请选择要移除的办理人（可多选）"
          >
            <ElOption v-for="opt in taskUserOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="审批意见" path="message">
          <ElInput v-model="actionForm.message" type="textarea" :rows="3" placeholder="请输入审批意见" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElSpace alignment="end">
          <ElButton @click="showModal = false">取消</ElButton>
          <ElButton type="primary" @click="submitAction">确定</ElButton>
        </ElSpace>
      </template>
    </ElDialog>
  </div>
</template>
