<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { PageSchema } from 'phoenix-designer';
import { EBuilder as __forwarded_EBuilder } from 'phoenix-designer';
import { findDynamicFormByCode } from '@/service';
import { delDynamicFormData, findDynamicFormData, saveDynamicFormData } from '@/service/api/dynamic/dynamic-common';
import { useBodyLoading } from '@/hooks';
import { getQueryString } from '@/utils';
import { buildCustomViewPageApi } from '@/utils/custom-view/page-api';
import { applyRelationScope } from '@/libs/relation-scope';
import { btnColorOf, loadBtnPermConfig, matchBtn, visibleBtnPerms } from '@/views/flow/components/btn-perm';
import CustomViewHost from './custom-view-host.vue';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit' | 'view';
  /** 编辑的表格行数据 */
  editData?: any | null;
  /** 父级id，做为子表时父表传参数 */
  parentId?: string;
  /** 表单编码覆盖：默认取 URL（?code= 或 /builder/{tableCode} 路径段），AI 对话页等跨页面打开场景必传 */
  formCode?: string;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'DesignerFormModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null,
  parentId: undefined,
  formCode: ''
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'closed', data: any): void;
}

const { startBodyLoading, endBodyLoading } = useBodyLoading();
const drawerWidth = ref('90%');
const formType = ref<ModalType>('add');
const emit = defineEmits<Emits>();
const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});
const closeModal = () => {
  modalVisible.value = false;
};

const ebRef = ref<any>();
/** 每次打开弹窗自增，强制 EBuilder 重建以获得干净的表单模型 */
const ebKey = ref(0);
/**
 * 传给 EBuilder 的表单初始数据副本。
 * pageManager.setFormData 在模型不存在时会 reactive(传入对象)——直接引用 app 的
 * formData 对象，后续 setData(数据行) 的合并会原地污染它，重开弹窗也无法复原，
 * 必须每次打开传浅拷贝，保证模型与 app 数据不同引用
 */
const ebFormData = ref<Record<string, any>>({});
const pageSchema = ref<PageSchema | null>(null);
/** ===== 自定义编辑页（metaData.customView.edit 启用时替换 EBuilder 渲染，提交契约不变） ===== */
const customEditView = ref<{ source: string } | null>(null);
const customEditPageApi = ref<ReturnType<typeof buildCustomViewPageApi> | null>(null);
const customEditContext = computed(() => ({
  tableCode: code,
  formName: formData.value.tableName,
  /** 'add' | 'edit' | 'view'：查看态自定义页自行渲染只读样式 */
  mode: formType.value,
  fields: customEditPageApi.value?.fields ?? [],
  data: ebFormData.value,
  pageApi: customEditPageApi.value
}));
/** 表单编码：优先取调用方覆盖（跨页面打开），其次 URL query，最后菜单路由路径段（/builder/{tableCode}） */
const route = useRoute();
const code =
  props.formCode ||
  getQueryString(window.location.search, 'code') ||
  String(route.path.split('/').filter(Boolean).pop() || '');
const id = getQueryString(window.location.search, 'id');

const formData = ref<Partial<DynamicFormNamespace.DynamicFormDetail>>({});
const dynamicData = ref<Partial<DynamicFormNamespace.DynamicFormDetail>>({});

const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: `添加${formData.value.tableName}`,
    view: `${formData.value.tableName}信息`,
    edit: `编辑${formData.value.tableName}`
  };
  return titles[props.type];
});

// 如果存在图片上传，需要使用下面代码上传及查询
// const fileList = ref([]);
// //上传
// uploadSystemFile(fileList.value, 'GLOBAL', formModel.id, 'LOGO', 'IMAGE');
// //查询
// findSystemFileInfoArray('GLOBAL', formModel.id, 'LOGO').then(res => {
//   fileList.value = res;
// });

function handleUpdateFormModelByModalType() {
  const handlers: Record<ModalType, () => void> = {
    add: () => {
      ebRef.value?.setData({});
    },
    edit: () => {
      if (props.editData) {
        findFormOfData(props.editData?.id, code);
      }
    },
    view: () => {
      if (props.editData) {
        findFormOfData(props.editData?.id, code);
      }
    }
  };

  handlers[props.type]();
}

/**
 * 提交表单数据
 *
 * @param startFlow 是否按绑定流程发起审批；false 时只落数据（草稿），由列表的「发起」入口后续提交
 */
async function handleSubmit(startFlow = true) {
  startBodyLoading();
  const pass = await ebRef.value?.validate();
  if (pass) {
    const values = await ebRef.value?.getData();
    // 后端 /dbs/open/dynamic/data/add 需要 tableCode 定位动态表；编辑时回传 id 走更新分支
    const payload: Record<string, any> = { ...values, tableCode: code };
    if (formType.value !== 'add' && props.editData?.id) {
      payload.id = props.editData.id;
    } else if (formType.value === 'add') {
      // EBuilder 初始数据（表单元数据对象）含 id，getData 会带出；新增必须剔除，否则后端误走更新分支
      delete payload.id;
    }
    if (!startFlow) payload.startFlow = false;
    saveDynamicFormData(payload).then(res => {
      if (res.error === null) {
        window.$message?.success(startFlow ? '保存成功' : '草稿已保存，可在列表操作列点「发起」提交审批');
        emit('update:visible', false);
        emit('closed', true);
        closeModal();
      }
      endBodyLoading();
    });
  } else {
    endBodyLoading();
    window.$message?.error('验证失败');
  }
}
/** 删除当前显示的数据 */
function deleteRow() {
  const dataId = dynamicData.value.id;
  const tableCode = formData.value.tableCode;
  // 数据还没加载（没有 id / 表单编码）时不发这个请求：原来只会打到 /dynamic/undefined/undefined 上失败
  if (!dataId || !tableCode) return;
  delDynamicFormData(dataId, tableCode).then(res => {
    if (res.error === null) {
      window.$message?.success('删除成功');
      emit('update:visible', false);
      emit('closed', true);
    }
  });
}

/** 改为编辑状态 */
function editRow() {
  formType.value = 'edit';
}

function fullScreen(value: boolean) {
  if (value) {
    drawerWidth.value = '100%';
  } else {
    drawerWidth.value = '90%';
  }
}

watch(
  () => props.visible,
  async newValue => {
    if (newValue) {
      formType.value = props.type;

      // pageManager.setFormData 是合并语义、resetData 只重置 schema 输入字段，
      // 上一条数据的 id/status 等残留键都清不掉；每次打开用 :key 重建 EBuilder
      // 换一套全新表单模型（初始数据传副本防引用污染），等挂载完成后再按类型填充
      ebFormData.value = { ...formData.value };
      // 编辑/查看已有数据时补上业务数据id：审批人等流程参与人没有本表单权限，靠它按参与人放行关联数据
      applyRelationScope(pageSchema.value, { fromTableCode: code, businessId: props.editData?.id });
      ebKey.value += 1;
      await nextTick();
      handleUpdateFormModelByModalType();
    }
  },
  // AI 对话页等跨页面场景以 v-if 挂载、挂载时 visible 即为 true，
  // 不加 immediate 首次打开不进 watch，formType 卡在 add、数据不回填
  { immediate: true }
);

/**
 * 查询表单
 *
 * @param codeForm 表单编码
 */
function findForm(codeForm: string) {
  findDynamicFormByCode(codeForm).then(res => {
    if (res.error === null) {
      // 关联组件取数要带上「引用方表单」，后端按引用关系放行被关联表的显示数据
      applyRelationScope(res.data.metaData, { fromTableCode: codeForm });
      pageSchema.value = res.data.metaData;
      formData.value = res.data;
      // 自定义编辑页：启用即替换 EBuilder 渲染（validate/getData/setData 契约由宿主兼容转发）
      const customView = (res.data.metaData as any)?.customView;
      if (customView?.edit?.enabled && customView.edit.source) {
        customEditView.value = { source: String(customView.edit.source) };
        customEditPageApi.value = buildCustomViewPageApi({
          tableCode: codeForm,
          formName: res.data.tableName,
          metaData: res.data.metaData
        });
      } else {
        customEditView.value = null;
        customEditPageApi.value = null;
      }
      loadFormBtns();
    }
  });
}

/**
 * 表单创建按钮：新增数据即「保存 + 按绑定流程发起审批」（后端 add 接口内自动发起），
 * 所以只出一个「提交」按钮，文案固定、颜色取全局按钮配置里的表单级按钮（save），
 * 开启流程时并排出「保存草稿」（startFlow=false，只落数据）；
 * 未开启流程 / 无按钮配置时回退单个「确定」按钮
 */
const formBtns = ref<{ code: string; label: string; primary: boolean; color?: string }[]>([]);
const isWorkflowForm = computed(() => Number((formData.value as any)?.isWorkflow ?? 0) === 1);
/** 草稿入口不依赖按钮配置：流程表单新增数据都可以只落数据、稍后在列表里发起 */
const showDraftBtn = computed(
  () => formType.value === 'add' && isWorkflowForm.value && Boolean((formData.value as any)?.workflowCode ?? '')
);

async function loadFormBtns() {
  formBtns.value = [];
  const flowCode = (formData.value as any)?.workflowCode as string;
  if (!isWorkflowForm.value || !flowCode) return;
  const list = await loadBtnPermConfig(flowCode);
  if (!list.length) return;
  const saveBtn = visibleBtnPerms(list).find(item => matchBtn(item.btnCode, 'save'));
  if (!saveBtn) return;
  formBtns.value.push({
    code: 'submit',
    label: '提交',
    primary: true,
    color: btnColorOf(saveBtn.btnCode, saveBtn.color)
  });
}

/**
 * 查询表单的数据
 *
 * @param idData 表单数据的ID
 * @param tableCode 表单的编码
 */
function findFormOfData(idData: string, tableCode: string) {
  console.log('id. =', idData, tableCode);
  findDynamicFormData(idData, tableCode).then(res => {
    if (res.error === null) {
      dynamicData.value = res.data;
      ebRef.value?.setData(res.data);
    }
  });
}

onMounted(() => {
  if (code) {
    findForm(code);
  }

  if (id) {
    console.log('id', id, code);
    findFormOfData(id, code);
  }
});

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const EBuilder = __forwarded_EBuilder;
</script>

<template>
  <div>
    <ElDrawer v-model="modalVisible" :size="drawerWidth" :title="title" resizable class="privernal-drawer">
      <template #header>
        <FormOperation
          :title="title"
          :permission-edit="'dynamic:' + code + ':edit'"
          :show-edit="true"
          :permission-remove="'dynamic:' + code + ':remove'"
          :show-remove="true"
          :type="formType"
          :workflow-control="false"
          :show-screen="true"
          @full-screen="fullScreen"
          @edit="editRow"
          @delete="deleteRow"
        ></FormOperation>
      </template>
      <!-- 自定义编辑页启用时替换 EBuilder 渲染；宿主兼容 validate/getData/setData，提交链零改动 -->
      <EBuilder
        v-if="!customEditView"
        ref="ebRef"
        :key="ebKey"
        :page-schema="pageSchema"
        :form-data="ebFormData"
        :disabled="formType === 'view'"
      />
      <CustomViewHost v-else ref="ebRef" :key="ebKey" :source="customEditView.source" :context="customEditContext" />
      <template #footer>
        <ElSpace v-if="formType !== 'view'" class="w-full pt-16px" :size="24" justify="end">
          <ElButton class="w-72px" @click="closeModal">取消</ElButton>
          <!-- 流程表单新增：可只存草稿（startFlow=false），也可提交并按绑定流程发起审批 -->
          <ElButton
            v-if="showDraftBtn"
            class="w-88px"
            title="仅保存数据（状态=草稿）、不发起流程，之后在列表操作列点「发起」提交审批"
            @click="handleSubmit(false)"
          >
            保存草稿
          </ElButton>
          <template v-if="formType === 'add' && formBtns.length">
            <ElButton
              v-for="btn in formBtns"
              :key="btn.code"
              class="w-88px"
              :type="btn.primary ? 'primary' : 'default'"
              :color="btn.color"
              :title="isWorkflowForm ? '提交数据并按绑定的流程发起审批' : undefined"
              @click="handleSubmit(true)"
            >
              {{ btn.label }}
            </ElButton>
          </template>
          <ElButton v-else class="w-72px" type="primary" @click="handleSubmit()">确定</ElButton>
        </ElSpace>
        <div></div>
      </template>
    </ElDrawer>
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
</style>
