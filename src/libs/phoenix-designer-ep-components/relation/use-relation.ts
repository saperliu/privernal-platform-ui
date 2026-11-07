import { computed, onMounted, ref, watch } from 'vue';
import { evaluateScopeCondition, useFormItem, usePageManager } from 'phoenix-designer';
import { loadRelationRecords, pickFieldValue } from '../shared/relation';

/**
 * relation-attr / relation-backfill 共用逻辑：
 * 拉取被关联表单记录 → 按 displayField 生成选项 → 选中后按 mappings 回填。
 * 差异仅一处：backfill 模式选择后总是执行回填；attr 模式仅在配置了 mappings 时回填。
 */
export function useRelationSelect(
  props: {
    model?: Record<string, any>;
    relation?: any;
  },
  emit: {
    (e: 'update:modelValue', value: any): void;
    (e: 'change', value: any): void;
  },
  options: { backfill: boolean }
) {
  const { formData } = useFormItem();
  const { isDesignMode } = usePageManager();
  const records = ref<any[]>([]);
  const loading = ref(false);

  /** 数据范围过滤：配置了 filter 表达式且非设计模式时按当前表单数据过滤 */
  const filteredRecords = computed(() => {
    const filter = props.relation?.filter;
    if (!filter?.expression || isDesignMode.value) {
      return records.value;
    }
    const source = props.model ?? formData;
    return records.value.filter(record => evaluateScopeCondition(filter, source ?? {}, record));
  });

  /** 下拉选项：显示 displayField 的值，取值为记录 id */
  const selectOptions = computed(() =>
    filteredRecords.value.map(record => {
      const display = props.relation?.displayField ? pickFieldValue(record, props.relation.displayField) : undefined;
      return {
        label: String(display ?? record.id),
        value: String(record.id)
      };
    })
  );

  async function loadRecords() {
    loading.value = true;
    try {
      records.value = await loadRelationRecords(props.relation);
    } catch (error) {
      console.error('[phoenix]加载关联表单数据失败：', error);
      records.value = [];
    } finally {
      loading.value = false;
    }
  }

  /** 选中记录：更新值并按映射把关联字段内容回填到本表单 */
  function handleChange(value: any) {
    emit('update:modelValue', value);
    emit('change', value);
    const mappings = props.relation?.mappings;
    if (!options.backfill && !mappings?.length) return;
    const record = records.value.find(item => String(item.id) === value);
    if (!record) return;
    const target = props.model ?? formData;
    ((mappings ?? []) as any[]).forEach(mapping => {
      if (mapping.target && target) {
        target[mapping.target] = pickFieldValue(record, mapping.field);
      }
    });
  }

  onMounted(loadRecords);

  watch(
    () => props.relation,
    () => {
      loadRecords();
    },
    { deep: true }
  );

  return {
    loading,
    selectOptions,
    handleChange
  };
}
