/**
 * Namespace DataTable
 *
 * 自研表格类型体系（Element Plus 实现），语义对齐 NaiveUI.DataTableColumns，
 * 业务页面从 `NaiveUI.` 迁移而来（全局替换），列配置写法保持不变。
 */
declare namespace DataTable {
  type ThemeColor = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  type Align = 'left' | 'center' | 'right' | 'start' | 'end';

  /** 普通数据列 */
  interface BaseColumn<T = any> {
    key: string;
    title: string;
    width?: number | string;
    minWidth?: number | string;
    align?: Align;
    fixed?: 'left' | 'right' | boolean;
    /** 溢出省略（等价 el-table show-overflow-tooltip） */
    ellipsis?: boolean | { tooltip: boolean | (() => import('vue').VNodeChild) };
    /** 自定义单元格渲染，返回 VNodeChild（tsx 场景返回 JSX） */
    render?: (row: T, index: number) => import('vue').VNodeChild;
    /** 该列参与排序（受控排序：点击表头触发 update:sorter，由业务侧带参重新查询） */
    sorter?: boolean;
    /** 受控排序的当前方向（业务侧回填，渲染由 el-table 自身的排序态负责） */
    sortOrder?: 'ascend' | 'descend' | false;
    className?: string;
    /** 列显隐（columnChecks 场景由 hook 过滤，一般不用） */
    hide?: boolean;
  }

  /** 多选列 */
  interface SelectionColumn {
    type: 'selection';
    key?: string;
    width?: number | string;
    align?: Align;
    /** 多选是否跨页保留（依赖 rowKey） */
    resizable?: boolean;
  }

  /** 展开列 */
  interface ExpandColumn<T = any> {
    type: 'expand';
    key?: string;
    width?: number | string;
    align?: Align;
    render?: (row: T, index: number) => import('vue').VNodeChild;
  }

  /** 表头分组列（多级表头） */
  interface ColumnGroup<T = any> {
    key?: string;
    title: string;
    align?: Align;
    children: Column<T>[];
  }

  type Column<T = any> = BaseColumn<T> | SelectionColumn | ExpandColumn<T> | ColumnGroup<T>;

  /** 排序状态（update:sorter 的入参，语义对齐 naive DataTable.SortState） */
  interface SortState {
    columnKey: string;
    order: 'ascend' | 'descend' | false;
  }

  /** 分页信息（prefix/suffix 渲染函数的入参，语义对齐 naive PaginationInfo） */
  interface PaginationInfo {
    page: number;
    pageSize: number;
    itemCount?: number;
    pageCount?: number;
  }

  /** 分页配置（语义对齐 naive PaginationProps） */
  interface PaginationProps {
    page?: number;
    pageSize?: number;
    itemCount?: number;
    pageSizes?: number[];
    showSizePicker?: boolean;
    showQuickJumper?: boolean;
    pageSlot?: number;
    simple?: boolean;
    prefix?: (info: PaginationInfo) => import('vue').VNodeChild;
    suffix?: (info: PaginationInfo) => import('vue').VNodeChild;
    onChange?: (page: number) => void;
    onUpdatePage?: (page: number) => void;
    onUpdatePageSize?: (pageSize: number) => void;
    'onUpdate:page'?: (page: number) => void;
    'onUpdate:pageSize'?: (pageSize: number) => void;
  }

  /** 汇总行函数：key -> 显示值（语义对齐 naive summary） */
  type SummaryFn<T = any> = (pageData: T[]) => Record<string, import('vue').VNodeChild>;

  type TableColumnCheck = import('@privernal/hooks').TableColumnCheck;
  type TableDataWithIndex<T> = import('@privernal/hooks').TableDataWithIndex<T>;
  type FlatResponseData<T> = import('@privernal/axios').FlatResponseData<T>;

  /** the custom column key */
  type CustomColumnKey = 'operate';

  type SetTableColumnKey<C, T> = Omit<C, 'key'> & { key: keyof T | CustomColumnKey };

  type TableData = Api.Common.CommonRecord<object>;

  type TableColumn<T = any> = Column<T>;

  type TableColumnWithKey<T> = SetTableColumnKey<BaseColumn<T>, T> | SetTableColumnKey<ColumnGroup<T>, T>;

  type TableApiFn<T = any, R = Api.Common.CommonSearchParams> = (
    params: R
  ) => Promise<FlatResponseData<Api.Common.PaginatingQueryRecord<T>>>;

  /**
   * the type of table operation
   *
   * - add: add table item
   * - edit: edit table item
   */
  type TableOperateType = 'add' | 'edit';

  type GetTableData<A extends TableApiFn> = A extends TableApiFn<infer T> ? T : never;

  type TableConfig<A extends TableApiFn> = Pick<
    import('@/hooks/sa-hooks').TableConfig<A, GetTableData<A>, Column<TableDataWithIndex<GetTableData<A>>>>,
    'apiFn' | 'apiParams' | 'columns' | 'immediate'
  > & {
    /**
     * whether to display the total items count
     *
     * @default false
     */
    showTotal?: boolean;
  };
}
