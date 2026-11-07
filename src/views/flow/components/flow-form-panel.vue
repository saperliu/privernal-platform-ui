<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { ElEmpty as __forwarded_ElEmpty } from 'element-plus';
import type { PageSchema } from 'phoenix-designer';
import { EBuilder as __forwarded_EBuilder } from 'phoenix-designer';
import {
  findDynamicFormByCode,
  findDynamicFormData,
  findFlowFormPermission,
  findFlowStatusByBusinessId
} from '@/service';
import { applyRelationScope } from '@/libs/relation-scope';

/**
 * 申请单只读视图：按业务数据id渲染对应的动态表单记录，并套用当前流程节点的字段权限（隐藏字段不显示）。
 *
 * 存在的意义是审批人通常没有申请单所在表的按钮权限，此前流程详情页只有流程图与审批轨迹、
 * 看不到申请内容；后端已按「流程参与人」放行单条读取与关联显示数据读取，这里把内容显示出来。
 */
const props = defineProps<{
  /** 业务数据id（动态表主键） */
  businessId: string;
  /** 业务表编码；缺省时按业务数据id从流程实例解析 */
  tableCode?: string;
}>();

const ebRef = ref<InstanceType<typeof EBuilder>>();
/** 每次载入自增，强制 EBuilder 重建，避免上一条数据的字段残留 */
const ebKey = ref(0);
const loading = ref(false);
const tip = ref('');
/** 实际使用的业务表编码（props.tableCode 缺省时由流程实例解析），命名避开同名 prop */
const resolvedTableCode = ref('');
const pageSchema = ref<PageSchema | null>(null);
const fieldStates = ref<any[]>([]);

async function load() {
  pageSchema.value = null;
  fieldStates.value = [];
  tip.value = '';
  if (!props.businessId) {
    tip.value = '缺少业务数据，无法显示申请单';
    return;
  }
  loading.value = true;
  try {
    if (props.tableCode) {
      resolvedTableCode.value = props.tableCode;
    } else {
      const status = await findFlowStatusByBusinessId(props.businessId);
      resolvedTableCode.value = status.data?.tableCode || '';
    }
    if (!resolvedTableCode.value) {
      tip.value = '该流程未绑定动态表单，无申请单内容';
      return;
    }
    const [permRes, formRes, dataRes] = await Promise.all([
      findFlowFormPermission(resolvedTableCode.value, props.businessId),
      findDynamicFormByCode(resolvedTableCode.value),
      findDynamicFormData(props.businessId, resolvedTableCode.value)
    ]);
    if (formRes.error !== null || !formRes.data?.metaData) {
      tip.value = '申请单表单配置读取失败';
      return;
    }
    if (dataRes.error !== null || !dataRes.data) {
      tip.value = '无权查看该申请单，或数据已被删除';
      return;
    }
    const schema = formRes.data.metaData as PageSchema;
    // 设计器内置的关联组件只会提交被关联表编码；把引用方表单与业务数据id挂进 dataUrl，
    // 后端才能按「引用方表单权限 → 流程参与人 → 被关联表 list 权限」放行关联显示值
    applyRelationScope(schema, { fromTableCode: resolvedTableCode.value, businessId: props.businessId });
    pageSchema.value = schema;
    // 只读视图里字段权限只体现为「是否显示」；未配置的字段由后端补成显示
    fieldStates.value = (permRes.data?.fieldDTOList || [])
      .filter(item => item.isShow === 0)
      .map(item => ({ field: item.fieldValue, state: 'HIDE' as const }));
    ebKey.value += 1;
    await nextTick();
    ebRef.value?.setData(dataRes.data as Record<string, any>);
  } finally {
    loading.value = false;
  }
}

watch(() => [props.businessId, props.tableCode], load, { immediate: true });

defineExpose({ reload: load });

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElEmpty = __forwarded_ElEmpty;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const EBuilder = __forwarded_EBuilder;
</script>

<template>
  <div class="flow-form-panel">
    <div v-loading="loading" class="panel-spin">
      <div v-if="pageSchema" class="panel-body">
        <EBuilder ref="ebRef" :key="ebKey" :page-schema="pageSchema" :field-states="fieldStates" readonly />
      </div>
      <ElEmpty v-else-if="!loading" :description="tip" class="panel-empty" />
      <div v-else class="panel-placeholder" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.flow-form-panel {
  height: 100%;
  overflow: auto;

  .panel-spin {
    min-height: 160px;
  }

  .panel-body {
    padding: 8px 16px 16px;
  }

  .panel-empty {
    padding-top: 48px;
  }

  .panel-placeholder {
    min-height: 160px;
  }
}
</style>
