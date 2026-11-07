<script setup lang="tsx">
import { ElButton as __forwarded_ElButton } from 'element-plus';
import { DeleteOutlined as __forwarded_DeleteOutlined, EditOutlined as __forwarded_EditOutlined } from '@vicons/antd';
import { FlowData as __forwarded_FlowData } from '@vicons/carbon';
import { useFormCommandStore } from '@/store';

export interface Props {
  /** 权限：编辑 */
  permissionEdit: string;
  showEdit?: boolean;
  /** 权限：删除 */
  permissionRemove: string;
  showRemove?: boolean;

  /** 是否工作流控制按钮 */
  workflowControl?: boolean;

  /** 隐藏按钮后显示的内容 */
  title?: string;

  /** 是否显示全屏按钮 */
  showScreen?: boolean;

  type?: 'add' | 'edit' | 'view';
}

defineOptions({ name: 'FormOperation' });
withDefaults(defineProps<Props>(), {
  permissionEdit: '',
  showEdit: true,
  permissionRemove: '',
  showRemove: true,
  title: '',
  workflowControl: false,
  type: 'add'
});

interface Emits {
  (e: 'fullScreen', data: any): void;
  (e: 'showFlow', data: any): void;
  (e: 'edit', data: any): void;
  (e: 'delete', data: any): void;
}

const emit = defineEmits<Emits>();

const formStore = useFormCommandStore();

/** 编辑 */
function editRow() {
  emit('edit', true);
}

/** 显示流程 */
function toShowFlow() {
  emit('showFlow', true);
}

/** 全屏 */
function fullScreen() {
  emit('fullScreen', true);
}

/** 删除 */
function handleDeleteRows() {
  emit('delete', true);
}

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const DeleteOutlined = __forwarded_DeleteOutlined;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const EditOutlined = __forwarded_EditOutlined;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const FlowData = __forwarded_FlowData;
</script>

<template>
  <div class="w-full flex flex-row items-center justify-between">
    <div>{{ title }}</div>
    <div class="flex flex-row items-center">
      <div
        v-show="(formStore.hasBtnShow('SUBEDIT') || !workflowControl) && showEdit && type === 'view'"
        v-permission="permissionEdit"
      >
        <ElTooltip content="编辑" placement="bottom">
          <ElButton text class="h-36px text-icon" @click="editRow">
            <ElIcon size="18"><component :is="EditOutlined" /></ElIcon>
          </ElButton>
        </ElTooltip>
      </div>

      <div
        v-show="(formStore.hasBtnShow('SUBDEL') || !workflowControl) && showRemove && type !== 'add'"
        v-permission="permissionRemove"
      >
        <ElPopconfirm
          title="删除后将无法恢复，确认删除当前数据吗？"
          confirm-button-text="确认"
          cancel-button-text="取消"
          width="260"
          @confirm="handleDeleteRows"
        >
          <template #reference>
            <ElButton text class="h-36px text-icon" title="删除">
              <ElIcon size="18"><component :is="DeleteOutlined" /></ElIcon>
            </ElButton>
          </template>
        </ElPopconfirm>
      </div>

      <div v-show="type !== 'add' && workflowControl" class="mr-2">
        <ElButton class="mr-1 w-95px" quaternary @click="toShowFlow">
          <ElIcon size="20"><component :is="FlowData" /></ElIcon>
          流程详情
        </ElButton>
      </div>

      <div v-show="showScreen">
        <FullScreen @full-screen="fullScreen"></FullScreen>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
