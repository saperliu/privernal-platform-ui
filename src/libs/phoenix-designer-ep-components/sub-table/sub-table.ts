import { type Slots, computed, defineComponent, h, provide, ref, watch } from 'vue';
import { ElButton } from 'element-plus';
import { Delete, Edit, Plus } from '@element-plus/icons-vue';
import { FORM_CONTEXT_KEY, provideBuilderDisabled, usePageManager } from 'phoenix-designer';
import './sub-table.css';

/**
 * 子表（phoenix-designer EP 适配，补齐 naiveUi 版的 sub-table）。
 * 表格化编辑子记录：每行为一条子记录（对象数组存值），
 * 行内子组件通过 FORM_CONTEXT_KEY 提供的行数据读写自身字段。
 * 设计模式下用 slots.edit-node 渲染原型行（拖拽编辑），运行时按行渲染 slots.node。
 */

/** SubTableRowContext：为行内子组件提供当前行数据作为表单上下文 */
const SubTableRowContext = defineComponent({
  name: 'SubTableRowContext',
  props: {
    row: {
      type: Object,
      default: () => ({})
    }
  },
  setup(rowProps, { slots }) {
    provide(FORM_CONTEXT_KEY as any, rowProps.row);
    return () => slots.default?.();
  }
});

/** 由原型行的子组件 schema 生成一行空数据（取 defaultValue） */
function createRowByPrototype(children: any[]) {
  const row: Record<string, any> = {};
  children.forEach(schema => {
    if (schema.field && schema.props && 'defaultValue' in schema.props) {
      row[schema.field] = schema.props.defaultValue;
    }
  });
  return row;
}

export default defineComponent({
  name: 'PhoenixSubTable',
  props: {
    componentSchema: {
      type: Object,
      default: () => ({})
    },
    disabled: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: Array,
      default: undefined
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }: { emit: any; slots: Slots }) {
    const children = computed<any[]>(() => (props.componentSchema as any)?.children ?? []);
    const { isDesignMode } = usePageManager();
    provideBuilderDisabled(computed(() => props.disabled));

    const rows = ref<any[]>([]);
    const tableRef = ref<HTMLElement>();

    watch(
      () => props.modelValue,
      value => {
        rows.value = value ?? [];
      },
      { immediate: true }
    );

    // 行 key：用 WeakMap 给对象分配自增 id，避免重渲染时组件状态丢失
    let rowKeySeed = 0;
    const rowKeyMap = new WeakMap<object, number>();
    function getRowKey(row: object) {
      let key = rowKeyMap.get(row);
      if (key === undefined) {
        rowKeySeed += 1;
        key = rowKeySeed;
        rowKeyMap.set(row, key);
      }
      return key;
    }

    /** 原型行上下文数据（设计模式的默认行） */
    const prototypeRow = ref<Record<string, any>>({});
    watch(
      children,
      () => {
        prototypeRow.value = createRowByPrototype(children.value);
      },
      { immediate: true, deep: true }
    );

    function handleAdd() {
      rows.value.push(createRowByPrototype(children.value));
      emit('update:modelValue', [...rows.value]);
    }

    function handleRemove(index: number) {
      rows.value.splice(index, 1);
      emit('update:modelValue', [...rows.value]);
    }

    /** 添加行后聚焦新行的第一个输入控件 */
    function focusRow(index: number) {
      requestAnimationFrame(() => {
        const rowEl = tableRef.value?.querySelectorAll('.phoenix-sub-table-row')[index + 1];
        const input = rowEl?.querySelector('input, textarea, .el-select__wrapper');
        if (input instanceof HTMLElement) {
          input.focus();
        }
      });
    }

    function renderHead() {
      const cells: any[] = [];
      children.value.forEach(schema => {
        cells.push(h('div', { class: 'phoenix-sub-table-cell' }, schema.label));
      });
      const items: any[] = [];
      if ((props.componentSchema as any)?.props?.showIndex) {
        items.push(h('div', { class: 'phoenix-sub-table-index' }, '序号'));
      }
      items.push(h('div', { class: 'phoenix-sub-table-body' }, cells));
      if (!isDesignMode.value && (props.componentSchema as any)?.props?.removable) {
        items.push(h('div', { class: 'phoenix-sub-table-action' }, '操作'));
      }
      return h('div', { class: 'phoenix-sub-table-row phoenix-sub-table-head' }, items);
    }

    function renderDataRow(row: any, index: number) {
      const schemaProps = (props.componentSchema as any)?.props ?? {};
      const items: any[] = [];
      if (schemaProps.showIndex) {
        items.push(h('div', { class: 'phoenix-sub-table-index' }, String(index + 1)));
      }
      items.push(
        h(
          'div',
          { class: 'phoenix-sub-table-body' },
          children.value.map(schema => slots.node?.({ componentSchema: schema }))
        )
      );
      if (schemaProps.removable && !props.disabled) {
        const actions = [
          h(ElButton, {
            icon: Edit,
            onClick: () => focusRow(index),
            text: true,
            size: 'small',
            type: 'primary'
          }),
          h(ElButton, {
            icon: Delete,
            onClick: () => handleRemove(index),
            text: true,
            size: 'small',
            type: 'danger'
          })
        ];
        items.push(h('div', { class: 'phoenix-sub-table-action phoenix-sub-table-actions' }, actions));
      }
      return h(SubTableRowContext, { key: getRowKey(row), row }, () =>
        h('div', { class: 'phoenix-sub-table-row' }, items)
      );
    }

    return () => {
      const schemaProps = (props.componentSchema as any)?.props ?? {};
      const items: any[] = [renderHead()];

      if (isDesignMode.value) {
        // 设计模式：渲染可拖拽编辑的原型行（edit-node 未提供时回退为按原型渲染）
        items.push(
          h(
            SubTableRowContext,
            { row: prototypeRow.value },
            {
              default: () => {
                const editSlot = slots['edit-node'];
                const content = editSlot
                  ? editSlot({})
                  : children.value.map(schema => slots.node?.({ componentSchema: schema }));
                return h('div', { class: 'phoenix-sub-table-row phoenix-sub-table-edit-row' }, content);
              }
            }
          )
        );
      } else {
        rows.value.forEach((row, index) => {
          items.push(renderDataRow(row, index));
        });
        if (!rows.value.length) {
          items.push(
            h(
              'div',
              { class: 'phoenix-sub-table-empty' },
              schemaProps.addable && !props.disabled ? '暂无数据，点击下方按钮添加' : '暂无数据'
            )
          );
        }
        if (schemaProps.addable && !props.disabled) {
          items.push(
            h(
              'div',
              { class: 'phoenix-sub-table-footer' },
              h(
                ElButton,
                {
                  onClick: () => handleAdd(),
                  plain: true,
                  size: 'small'
                },
                {
                  icon: () => h(Plus),
                  default: () => schemaProps.addText ?? '添加一行'
                }
              )
            )
          );
        }
      }

      return h(
        'div',
        {
          ref: tableRef,
          class: ['phoenix-sub-table phoenix-scoped', { 'phoenix-sub-table--design': isDesignMode.value }],
          style: schemaProps.style
        },
        items
      );
    };
  }
});
