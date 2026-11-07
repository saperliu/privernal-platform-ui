<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { ActionTagAdd, ActionTagDelete, dataStatusEnableOrFinished } from '@/constants';
import { findSystemAppListByOrgId, saveSystemOrganizationApp } from '@/service';
import { useBodyLoading } from '@/hooks';
import SystemAppInfoList from '@/views/system/app-info/components/system-app-info-list.vue';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 编辑的表格行数据 */
  editData: SystemOrganizationNamespace.SystemOrganizationForm | null;

  /** 操作按钮可见性 */
  showOperation?: boolean;
}

defineOptions({ name: 'AppInfoListModal' });
const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
}

const drawerWidth = ref('90%');
const emit = defineEmits<Emits>();
const { startBodyLoading, endBodyLoading } = useBodyLoading();
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

const editAppList = ref<SystemOrganizationAppNamespace.SystemOrganizationAppForm[]>([]);
/** 保存选择的功能 */
function handleSaveFunction() {
  startBodyLoading();
  const menuDTO: SystemOrganizationNamespace.SystemOrganizationAppDTO = {
    organizationId: props.editData!.id,
    appList: []
  };

  menuDTO.appList = editAppList.value;

  saveSystemOrganizationApp(menuDTO).then(res => {
    console.log('-------res------', res);
    if (res.error === null) {
      // for (let i = 0; i < menuDTO.appList.length; i++) {
      // const app = menuDTO.appList[i];
      // const workflowFormSynDTO: WorkflowInstanceFormNamespace.WorkflowFormSynDTO = {
      //   departmentId: null,
      //   organizationId: props.editData!.id,
      //   appId: app.appId
      // };

      // saveWorkflowInstanceFormSyn(workflowFormSynDTO).then(res2 => {
      //   if (res2.error === null) {
      //     message.success('授权成功！');
      //     closeModal();
      //   }
      //   endBodyLoading();
      // });
      // }

      window.$message?.success('授权成功！');
      closeModal();
    }
    endBodyLoading();
  });
}
function fullScreen(value: boolean) {
  if (value) {
    drawerWidth.value = '100%';
  } else {
    drawerWidth.value = '90%';
  }
}

const appList = ref<SystemAppInfoNamespace.SystemAppInfoForm[]>([]);
function findOrgAppList() {
  console.log('-------findOrgAppList------', props.editData);
  findSystemAppListByOrgId({ pageNum: 1, pageSize: 100, organizationId: props.editData!.id }).then(result => {
    if (result.error === null && result.data !== null) {
      result.data.forEach(item => {
        // icon 含 ':' 是 iconify 名（渲染层直接用 icon），否则拼本地 application-* 素材名
        item.localIcon = item.icon && String(item.icon).includes(':') ? '' : `application-${item.icon}`;
        if (item.pcPath === null) {
          item.pcPath = '';
        }
        appList.value.push(item);
      });
    }
  });
}

function handleChangeApp(rows: SystemAppInfoNamespace.SystemAppInfoForm[]) {
  // 找出在appList中，但是不在rows中的应用。
  appList.value.forEach(item => {
    let flag = false;
    rows.forEach(row => {
      if (row.id === item.id) {
        flag = true;
      }
    });
    if (!flag) {
      // 已经删除了的，不再添加
      if (!editAppList.value.find(item3 => item3.appId === item.id)) {
        editAppList.value.push({
          id: '',
          status: dataStatusEnableOrFinished,
          appId: item.id,
          organizationId: props.editData!.id,
          actionTag: ActionTagDelete
        });
      }
    } else if (editAppList.value.find(item3 => item3.appId === item.id)) {
      // 删除的应用，再次勾选，会处理成为没有做任何操作，所以要从list里删除
      // 从editAppList中删除appId等于item.id的元素
      editAppList.value = editAppList.value.filter(item2 => item2.appId !== item.id);
    }
  });

  // 找出新增的应用。
  rows.forEach(row => {
    let flag = false;
    appList.value.forEach(item => {
      if (row.id === item.id) {
        flag = true;
      }
    });
    if (!flag) {
      // 真新增
      if (!editAppList.value.find(item3 => item3.appId === row.id)) {
        editAppList.value.push({
          id: '',
          status: dataStatusEnableOrFinished,
          appId: row.id,
          organizationId: props.editData!.id,
          actionTag: ActionTagAdd
        });
      }
    }
  });

  // 新增的又被删除了的应用
  editAppList.value.forEach(row => {
    let flag = false;
    rows.forEach(item => {
      if (row.appId === item.id) {
        flag = true;
      }
    });
    if (!flag) {
      // 真新增
      if (row.actionTag === ActionTagAdd) {
        editAppList.value = editAppList.value.filter(item2 => item2.appId !== row.appId);
      }
    }
  });
}

watch(
  () => props.visible,
  () => {
    if (props.visible) {
      appList.value = [];
      editAppList.value = [];
      findOrgAppList();
    }
  }
);
</script>

<template>
  <ElDrawer v-model="modalVisible" :size="drawerWidth" resizable title="应用授权列表" class="privernal-drawer">
    <template #header>
      <div class="w-full flex flex-row items-center justify-between">
        <div>应用授权列表</div>
        <FullScreen @full-screen="fullScreen"></FullScreen>
      </div>
    </template>

    <!-- key 按企业：子表的回显勾选只在 onMounted 拉一次，不随企业切换重查，会带着上一个企业的勾选残留 -->
    <SystemAppInfoList
      :key="editData?.id ?? 'none'"
      :show-operation="showOperation"
      :list-data="appList"
      :organization-id="editData?.id"
      @change="handleChangeApp"
    ></SystemAppInfoList>
    <template #footer>
      <div class="footer">
        <ElButton style="margin-right: 10px" @click="modalVisible = false">取消</ElButton>
        <ElButton style="margin-right: 10px" type="primary" @click="handleSaveFunction">保存</ElButton>
        <!--          <el-button type="primary" @click="handleSynFunction">单个应用同步流程</el-button>-->
      </div>
    </template>
  </ElDrawer>
</template>

<style lang="scss" scoped>
.footer {
  display: flex;
  flex-direction: row;
  justify-content: end;
  margin-top: 10px;
  padding-right: 10px;
}
.middle {
  vertical-align: middle;
}
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
