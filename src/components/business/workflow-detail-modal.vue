<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { ElButton as __forwarded_ElButton, ElSpace as __forwarded_ElSpace } from 'element-plus';
import {
  AppstoreOutlined as __forwarded_AppstoreOutlined,
  EditOutlined as __forwarded_EditOutlined
} from '@vicons/antd';
import { RestartAltOutlined as __forwarded_RestartAltOutlined } from '@vicons/material';
import {
  CheckmarkCircleSharp as __forwarded_CheckmarkCircleSharp,
  PlayCircleOutline as __forwarded_PlayCircleOutline,
  StopCircleOutline as __forwarded_StopCircleOutline,
  Time as __forwarded_Time
} from '@vicons/ionicons5';
import {
  dataStatusDisableOrCanceled as __forwarded_dataStatusDisableOrCanceled,
  dataStatusProcessing as __forwarded_dataStatusProcessing
} from '@/constants';
import {
  adjustFlowTask,
  changePersonFlowTask,
  findFlowDefinitionList,
  findFlowRecordByInstanceId,
  findFlowStatusByBusinessId,
  getFlowInstanceNodes,
  restartFlowInstance,
  terminateFlowInstance
} from '@/service';
import { useBodyLoading } from '@/hooks';
import { isOrgAdmin as __forwarded_isOrgAdmin, isPlatformAdmin as __forwarded_isPlatformAdmin } from '@/utils';
import { type FlowDesignerModule, loadWarmFlowDesigner } from '@/libs/warm-flow-designer';
import { isBtnVisible, useFlowBtnPerms } from '@/views/flow/components/btn-perm';
import FlowFormPanel from '@/views/flow/components/flow-form-panel.vue';
export interface Props {
  visible: boolean;
  processBusinessKey: string;
}

defineOptions({ name: 'WorkflowDetail' });
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  processBusinessKey: ''
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'closed', data: boolean): void;
}

const drawerWidth = ref('90%');
const emit = defineEmits<Emits>();

const moduleRef = shallowRef<FlowDesignerModule | null>(null);
const designerLoading = ref(false);

const definitionId = ref<string>('');
const instanceId = ref<string>('');
const flowStatus = ref<string>('');
const dataStatus = ref<number>(0);
const flowCode = ref<string>('');
const businessKey = ref('');
const nodeList = ref<FlowNamespace.FlowNodeInfoDTO[]>([]);
const taskList = ref<FlowNamespace.HisTask[]>([]);
const currentNodeInfo = ref<FlowNamespace.FlowNodeInfoDTO[]>([]);

const detailShow = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});

const showChangeModal = ref(false);
const showAdjustModal = ref(false);
const userIds = ref<string[]>([]);
const userList = ref<Array<{ id: string; name: string }>>([]);
const showModal = ref(false);

const taskRequest = reactive<FlowNamespace.TaskHandle>({
  taskId: '',
  message: '',
  targetNodeCode: '',
  userIds: []
});

const { startBodyLoading, endBodyLoading } = useBodyLoading();

/** 申请单页签显隐：与流程列表一致，由客户的按钮权限配置控制（按全局行判定） */
const { byFlow: btnPermByFlow, reload: loadBtnConfigs } = useFlowBtnPerms();
const canViewForm = computed(() => isBtnVisible(btnPermByFlow.value.get(flowCode.value || ''), undefined, 'viewForm'));
const activeTab = ref('form');
// 配置在打开后才返回，申请单被隐藏时要把页签切到流程图，否则停在已不存在的页上
watch(canViewForm, visible => {
  if (!visible && activeTab.value === 'form') activeTab.value = 'graph';
});

async function initDesigner() {
  try {
    designerLoading.value = true;
    const mod = await loadWarmFlowDesigner();
    moduleRef.value = mod;
  } catch (e) {
    console.error('加载流程设计器失败', e);
    window.$message?.error('流程设计器加载失败');
  } finally {
    designerLoading.value = false;
  }
}

function cancelModel() {
  showModal.value = false;
}

function findProcessInstance() {
  if (props.processBusinessKey) {
    findFlowStatusByBusinessId(props.processBusinessKey).then(async res => {
      if (res.data) {
        flowCode.value = res.data.flowCode;
        instanceId.value = res.data.instanceId;
        flowStatus.value = res.data.flowStatus;
        dataStatus.value = res.data.dataStatus;

        if (res.data.flowCode) {
          await loadBtnConfigs([{ flowCode: res.data.flowCode }]);
          activeTab.value = canViewForm.value ? 'form' : 'graph';
          try {
            const defRes = await findFlowDefinitionList({
              flowCode: res.data.flowCode,
              isPublish: 1,
              pageNum: 1,
              pageSize: 10,
              keywords: []
            });
            if (defRes.data?.list && defRes.data.list.length > 0) {
              definitionId.value = String(defRes.data.list[0].id);
            }
          } catch (e) {
            console.error('查询流程定义失败', e);
          }
        }
      }
    });
  }
}

function findTaskList() {
  if (instanceId.value) {
    findFlowRecordByInstanceId(instanceId.value).then(res => {
      if (res.data) {
        taskList.value = res.data;
        if (res.data.length > 0) {
          const firstTask = res.data[0];
          taskRequest.taskId = firstTask.taskId;
          taskRequest.targetNodeCode = firstTask.nodeCode;
        }
      }
    });
  }
}

function findNodeList() {
  if (instanceId.value) {
    getFlowInstanceNodes(instanceId.value).then(res => {
      if (res.data) {
        nodeList.value = res.data;
        currentNodeInfo.value = res.data.filter(n => n.nodeStatus === 'ACTIVE');
      }
    });
  }
}

function handleSelectPerson(list: any[]) {
  userList.value = [];
  list.forEach(item => {
    userList.value.push({ id: item.id, name: item.nickName });
  });
}

function fullScreen(value: boolean) {
  if (value) {
    drawerWidth.value = '100%';
  } else {
    drawerWidth.value = '90%';
  }
}

function modifyWorkflow() {
  showModal.value = true;
}

function adjustWorkflow() {
  showAdjustModal.value = true;
}

function endWorkflow() {
  startBodyLoading();
  terminateFlowInstance(instanceId.value, '').then(res => {
    if (res.error !== null) {
      window.$message?.error(res.error.message);
    } else {
      window.$message?.success('取消成功');
      detailShow.value = false;
    }
    endBodyLoading();
  });
}

function saveTaskChangePerson() {
  taskRequest.message = '';
  taskRequest.userIds = userList.value.map(u => u.id);

  changePersonFlowTask(taskRequest).then(res => {
    if (res.error !== null) {
      window.$message?.error(res.error.message);
    } else {
      window.$message?.success('更换成功');
      detailShow.value = false;
    }
  });
}

function saveTaskAdjust() {
  taskRequest.message = '';
  taskRequest.userIds = userList.value.map(u => u.id);
  startBodyLoading();
  adjustFlowTask(taskRequest).then(res => {
    if (res.error !== null) {
      window.$message?.error(res.error.message);
    } else {
      window.$message?.success('调整成功');
      detailShow.value = false;
    }
    endBodyLoading();
    showAdjustModal.value = false;
  });
}

function restartWorkflow() {
  startBodyLoading();
  restartFlowInstance(instanceId.value, taskRequest.targetNodeCode, '').then(res => {
    if (res.error !== null) {
      window.$message?.error(res.error.message);
    } else {
      window.$message?.success('重启成功');
      detailShow.value = false;
    }
    endBodyLoading();
    showModal.value = false;
  });
}

function approveStatus(status: string) {
  if (status === 'PROCESS') {
    return '待审批';
  }
  if (status === 'APPROVE' || status === '2') {
    return '已审批';
  }
  if (status === 'SEND') {
    return '已抄送';
  }
  if (status === 'CANCEL' || status === '3') {
    return '已取消';
  }
  if (status === 'REJECT' || status === '9') {
    return '已驳回';
  }
  if (status === 'SUBMIT' || status === '0') {
    return '提报';
  }
  if (status === 'END' || status === '8') {
    return '已完成';
  }
  return status;
}

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      businessKey.value = props.processBusinessKey;
      initDesigner();
      findProcessInstance();
      findTaskList();
      findNodeList();
    }
  }
);

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSpace = __forwarded_ElSpace;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const AppstoreOutlined = __forwarded_AppstoreOutlined;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const EditOutlined = __forwarded_EditOutlined;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const RestartAltOutlined = __forwarded_RestartAltOutlined;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const CheckmarkCircleSharp = __forwarded_CheckmarkCircleSharp;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const PlayCircleOutline = __forwarded_PlayCircleOutline;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const StopCircleOutline = __forwarded_StopCircleOutline;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const Time = __forwarded_Time;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const isOrgAdmin = __forwarded_isOrgAdmin;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const isPlatformAdmin = __forwarded_isPlatformAdmin;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const dataStatusDisableOrCanceled = __forwarded_dataStatusDisableOrCanceled;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const dataStatusProcessing = __forwarded_dataStatusProcessing;
</script>

<template>
  <div class="workflow-detail">
    <ElDrawer v-model="detailShow" :size="drawerWidth" title="title" resizable class="privernal-drawer">
      <template #header>
        <ElSpace :size="24" justify="space-between" align="center">
          <div>流程详情</div>
          <div class="privernal-header-left">
            <div
              v-if="dataStatus === dataStatusProcessing && (isOrgAdmin() || isPlatformAdmin())"
              v-permission="'flow:task:adjust'"
            >
              <ElButton class="mr-1 w-95px" quaternary @click="adjustWorkflow">
                <ElIcon size="20"><component :is="EditOutlined" /></ElIcon>
                调整流程
              </ElButton>
            </div>
            <div
              v-if="dataStatus === dataStatusProcessing && (isOrgAdmin() || isPlatformAdmin())"
              v-permission="'flow:task:end'"
            >
              <ElButton class="mr-1 w-95px" quaternary @click="endWorkflow">
                <ElIcon size="20"><component :is="StopCircleOutline" /></ElIcon>
                取消流程
              </ElButton>
            </div>
            <div
              v-if="dataStatus === dataStatusDisableOrCanceled && (isOrgAdmin() || isPlatformAdmin())"
              v-permission="'flow:task:restart'"
            >
              <ElButton class="mr-1 w-95px" quaternary @click="modifyWorkflow">
                <ElIcon size="20"><component :is="RestartAltOutlined" /></ElIcon>
                重启流程
              </ElButton>
            </div>

            <FullScreen @full-screen="fullScreen"></FullScreen>
          </div>
        </ElSpace>
      </template>
      <div class="h-full flex flex-row flex-items-start">
        <div id="designer-container" class="designer-container h-full w-75% bg-gray-1">
          <div class="main-content h-full">
            <ElTabs v-model="activeTab" class="detail-tabs h-full">
              <!-- 申请单常驻（show）：切回页签不重新拉数；流程图用默认 if，设计器只在可见时挂载才能算对画布尺寸 -->
              <ElTabPane v-if="canViewForm" name="form" label="申请单" display-directive="show">
                <FlowFormPanel :business-id="businessKey" />
              </ElTabPane>
              <ElTabPane name="graph" label="流程图">
                <div v-if="designerLoading" class="h-full flex items-center justify-center">
                  <div v-loading="true" element-loading-text="流程设计器加载中..."></div>
                </div>
                <component
                  :is="moduleRef?.FlowDesigner"
                  v-else-if="moduleRef"
                  :definition-id="definitionId"
                  :disabled="true"
                  :only-design-show="true"
                />
                <div v-else class="h-full flex items-center justify-center">
                  <ElResult status="500" title="设计器加载失败" description="请刷新页面重试" />
                </div>
              </ElTabPane>
            </ElTabs>
          </div>
        </div>

        <div class="ml-9 h-full w-25% flex-col-reverse justify-end justify-end overflow-auto overflow-x-hidden">
          <ElTimeline class="flex-col justify-end">
            <ElTimelineItem v-for="(item, index) in taskList" :key="item.id" line-type="dashed">
              <template #icon>
                <ElIcon v-if="item.flowStatus === 'END' || item.flowStatus === '8'" size="20">
                  <component :is="StopCircleOutline" />
                </ElIcon>
                <ElIcon v-else-if="item.flowStatus === 'PROCESS' || item.flowStatus === '1'" size="20" color="#FF5353">
                  <component :is="Time" />
                </ElIcon>
                <ElIcon v-else-if="index === taskList.length - 1" size="20">
                  <component :is="PlayCircleOutline" />
                </ElIcon>
                <ElIcon v-else size="20" color="#9BD93F"><component :is="CheckmarkCircleSharp" /></ElIcon>
              </template>
              <template #default>
                <div class="h-116px w-95% flex-col rounded-1 shadow-gray shadow-sm">
                  <div class="title h-36px flex items-center justify-between bg-truegray-1 pr-2">
                    <div class="pl-16 font-size-4 font-600">{{ item.nodeName }}</div>

                    <div v-if="item.flowStatus === 'APPROVE' || item.flowStatus === '2'" class="color-blue font-600">
                      {{ approveStatus(item.flowStatus || '') }}
                    </div>
                    <div
                      v-else-if="item.flowStatus === 'PROCESS' || item.flowStatus === '1'"
                      class="color-red font-600"
                    >
                      {{ approveStatus(item.flowStatus || '') }}
                    </div>
                    <div v-else-if="item.flowStatus === 'REJECT' || item.flowStatus === '9'" class="color-red font-600">
                      已驳回
                    </div>
                    <div v-else-if="item.skipType === 'TIMEOUT'" class="color-red font-600">已超时</div>
                    <div v-else-if="item.skipType === 'UNDO'" class="color-red font-600">被撤回</div>
                    <div v-else-if="item.skipType === 'JUMP'" class="color-red font-600">被跳转</div>
                    <div v-else-if="item.skipType === 'CHANGE'" class="color-red font-600">被更换</div>
                    <div v-else class="font-600">{{ approveStatus(item.flowStatus || '') }}</div>
                  </div>

                  <div class="content pl-16 pr-2">
                    <div class="mt-3 flex justify-between">
                      <div>{{ item.approver || '-' }}</div>
                      <div
                        v-if="item.flowStatus === 'APPROVE' || item.flowStatus === '2'"
                        class="h-5 w-12 border-2 border-green b-rd-3 text-center font-size-3 color-green font-400"
                      >
                        同意
                      </div>
                      <div
                        v-else-if="item.flowStatus === 'PROCESS' || item.flowStatus === '1'"
                        class="h-5 w-12 border-2 border-gray b-rd-3 text-center font-size-3 color-gray font-400"
                      >
                        处理中
                      </div>
                      <div
                        v-else-if="item.flowStatus === 'REJECT' || item.flowStatus === '9'"
                        class="h-5 w-12 border-2 border-red b-rd-3 text-center font-size-3 color-red font-400"
                      >
                        驳回
                      </div>
                      <div
                        v-else-if="item.cooperateType === 3"
                        class="h-5 w-12 border-2 border-red b-rd-3 text-center font-size-3 color-red font-400"
                      >
                        更换
                      </div>
                      <div class="color-gray">{{ item.updateTime || item.createTime }}</div>
                    </div>
                    <div v-if="item.message" class="mt-3 color-gray">
                      <span class="truncate" style="max-width: 95%">
                        {{ item.message }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="relative left-3 top--26">
                  <!-- 原 naive 的 ElIconWrapper 在 EP 无此组件（会被解析成不存在的 icons 导出导致整页加载失败） -->
                  <div class="flex-center rounded-full" style="width: 42px; height: 42px; background: #dcfbea">
                    <ElIcon :size="22" color="#249F5D"><component :is="AppstoreOutlined" /></ElIcon>
                  </div>
                </div>
              </template>
            </ElTimelineItem>
          </ElTimeline>
        </div>
      </div>
    </ElDrawer>

    <ElDialog v-model="showModal" :mask-closable="false" class="w-50%">
      <ElCard>
        <template #header>
          <div>重启流程</div>
        </template>
        <ElSpace direction="vertical">
          <ElSelect v-model="taskRequest.targetNodeCode" placeholder="选择目标节点">
            <ElOption
              v-for="opt in nodeList.map(n => ({ label: n.nodeName, value: n.nodeCode }))"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElSpace>
        <template #footer>
          <ElSpace justify="end">
            <ElButton type="primary" class="m-l-2" @click="restartWorkflow">确定</ElButton>
            <ElButton @click="cancelModel">取消</ElButton>
          </ElSpace>
        </template>
      </ElCard>
    </ElDialog>

    <ElDialog v-model="showChangeModal" :mask-closable="false" class="w-70%">
      <ElCard>
        <template #header>
          <div>更换审批人员</div>
        </template>
        <ElSpace direction="vertical">
          <div>
            <div>更换审批人员</div>
            <SelectPerson v-model:value="userIds" :multiple="true" @person-selected="handleSelectPerson"></SelectPerson>
          </div>
        </ElSpace>
        <template #footer>
          <ElSpace justify="end">
            <ElButton type="primary" class="m-l-2" @click="saveTaskChangePerson">确定</ElButton>
            <ElButton @click="showChangeModal = false">取消</ElButton>
          </ElSpace>
        </template>
      </ElCard>
    </ElDialog>

    <ElDialog v-model="showAdjustModal" :mask-closable="false" class="w-50%">
      <ElCard>
        <template #header>
          <div>调整流程</div>
        </template>
        <div class="flex-col">
          <div
            v-for="item in currentNodeInfo"
            :key="item.nodeCode"
            class="mt-5 flex flex-row flex-justify-start flex-items-center"
          >
            <div class="flex flex-row">
              <div>当前节点:</div>
              <div class="ml-3">{{ item.nodeName }}</div>
            </div>
            <div class="ml-5 flex flex-row">
              <div>当前审批人:</div>
              <div class="ml-3">{{ item.assigneeName || '-' }}</div>
            </div>
          </div>

          <div class="mt-5 flex flex-row flex-justify-start flex-items-center">
            <div class="">更换处理节点:</div>
            <div class="ml-3 w-30%">
              <ElSelect v-model="taskRequest.targetNodeCode" placeholder="选择目标节点">
                <ElOption
                  v-for="opt in nodeList.map(n => ({ label: n.nodeName, value: n.nodeCode }))"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </div>
          </div>
          <div class="mt-5 flex flex-row flex-justify-start flex-items-center">
            <div>更换审批人员:</div>
            <div class="ml-3 w-30%">
              <SelectPerson
                v-model:value="userIds"
                :multiple="true"
                @person-selected="handleSelectPerson"
              ></SelectPerson>
            </div>
          </div>
        </div>
        <template #footer>
          <ElSpace justify="end">
            <ElButton type="primary" class="m-l-2" @click="saveTaskAdjust">确定</ElButton>
            <ElButton @click="showAdjustModal = false">取消</ElButton>
          </ElSpace>
        </template>
      </ElCard>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.privernal-header-left {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: end;
  align-items: center;
}
:deep(.n-drawer-header__main) {
  width: 100%;
}
:deep(.n-timeline.n-timeline--left-placement .n-timeline-item .n-timeline-item-timeline) {
  left: 2px;
}
.workflow-detail {
  width: 100%;
}
/* 页签撑满抽屉高度，申请单/流程图各自内部滚动，避免抽屉整体被拉长 */
.detail-tabs :deep(.n-tabs-pane-wrapper) {
  overflow: hidden;
}
.detail-tabs :deep(.n-tab-pane) {
  height: 100%;
  overflow-y: auto;
}
.user-list {
  height: 67%;
  overflow-y: auto;
  .content {
    height: 65px;
  }
}
</style>
