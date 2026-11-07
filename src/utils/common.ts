import { $t } from '@/locales';

/**
 * Transform record to option
 *
 * @example
 *   ```ts
 *   const record = {
 *     key1: 'label1',
 *     key2: 'label2'
 *   };
 *   const options = transformRecordToOption(record);
 *   // [
 *   //   { value: 'key1', label: 'label1' },
 *   //   { value: 'key2', label: 'label2' }
 *   // ]
 *   ```;
 *
 * @param record
 */
export function transformRecordToOption<T extends Record<string, string>>(record: T) {
  return Object.entries(record).map(([value, label]) => ({
    value,
    label
  })) as CommonType.Option<keyof T>[];
}

/**
 * Translate options
 *
 * @param options
 */
export function translateOptions(options: CommonType.Option<string>[]) {
  return options.map(option => ({
    ...option,
    label: $t(option.label as App.I18n.I18nKey)
  }));
}

/**
 * Toggle html class
 *
 * @param className
 */
export function toggleHtmlClass(className: string) {
  function add() {
    document.documentElement.classList.add(className);
  }

  function remove() {
    document.documentElement.classList.remove(className);
  }

  return {
    add,
    remove
  };
}

/**
 * 策略模式
 * @param actions 每一种可能执行的操作
 */
export function exeStrategyActions(actions: CommonType.StrategyAction[]) {
  actions.some(item => {
    const [flag, action] = item;
    if (flag) {
      action();
    }
    return flag;
  });
}

/**
 * 获取指定长度的随机字符串，首字母大写
 * @param length
 * @param firstToUpper
 */
export function getRandomString(length: number, firstToUpper?: boolean) {
  let str = '';
  const inOptions: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const num = inOptions.length;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < length; i++) {
    if (firstToUpper && i === 1) {
      str += inOptions.charAt(getRandomInteger(0, num)).toUpperCase(); // 首字母大写
    } else {
      str += inOptions.charAt(getRandomInteger(0, num));
    }
  }

  return str;
}

/**
 * 获取指定范围内的随机整数
 * @param min - 开始范围
 * @param max - 结束范围
 */
function getRandomInteger(min: number, max: number) {
  const range = max - min;
  return Math.floor(Math.random() * range) + min;
}

/**
 * 计算页数
 * @param total 总条数
 * @param pageSize 每页条数
 */
export function countPageTotal(total: number, pageSize: number) {
  return (total + pageSize - 1) / pageSize;
}

/**
 * 将毫秒，转换成时间字符串。例如说，xx 分钟
 *
 * @param ms 毫秒
 * @returns {string} 字符串
 */
export function getCnDate(ms: number) {
  const day = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hour = Math.floor(ms / (60 * 60 * 1000) - day * 24);
  const minute = Math.floor(ms / (60 * 1000) - day * 24 * 60 - hour * 60);
  const second = Math.floor(ms / 1000 - day * 24 * 60 * 60 - hour * 60 * 60 - minute * 60);
  if (day > 0) {
    return `${day}天${hour}小时${minute}分钟`;
  }
  if (hour > 0) {
    return `${hour}小时${minute}分钟`;
  }
  if (minute > 0) {
    return `${minute}分钟`;
  }
  if (second > 0) {
    return `${second}秒`;
  }
  return `${0}秒`;
}

/**
 * 格式化时间
 * @param dateInput 时间串或时间对象
 * @param format 格式，例：yyyy-MM-dd
 */
export function formatDate(dateInput: string | Date, format?: string) {
  let date = dateInput;
  let fmt = format || '{y}-{m}-{d} {h}:{i}:{s}';
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const o: Record<string, number> = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'H+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds() // 毫秒
  };
  if (/(y+)/.test(fmt)) {
    // 年份
    fmt = fmt.replace(RegExp.$1, `${date.getFullYear()}`.substr(4 - RegExp.$1.length));
  }
  for (const k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? `${o[k]}` : `00${o[k]}`.substr(`${o[k]}`.length));
    }
  }
  return fmt;
}

/**
 * 时间格式化为 yyyy-MM-dd HH:mm:ss
 * 兼容 Date 对象、毫秒时间戳、ISO 字符串、yyyy-MM-dd HH:mm:ss、yyyy-MM-dd（补 00:00:00）
 * @param value 时间值
 */
export function formatDateTime(value?: string | number | Date | null): string {
  if (value === null || value === undefined || value === '') return '-';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? String(value) : formatDate(value, 'yyyy-MM-dd HH:mm:ss');
  }
  const str = String(value).trim();
  // 毫秒时间戳
  if (typeof value === 'number' || /^\d{13}$/.test(str)) {
    const date = new Date(Number(value));
    return Number.isNaN(date.getTime()) ? str : formatDate(date, 'yyyy-MM-dd HH:mm:ss');
  }
  // 已是 yyyy-MM-dd HH:mm:ss（[:ss] 可缺省补齐）
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?/.test(str)) {
    return str.length === 16 ? `${str}:00` : str.slice(0, 19);
  }
  // 仅日期，补零点
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return `${str} 00:00:00`;
  }
  // 其余（ISO 等）尝试解析
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? str : formatDate(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 驼峰转下划线
 * @param name
 */
export function humpToLine(name: string) {
  return name.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * 数据†able排序
 * @param sorter
 * @param filter
 * @param columns
 */
export function orderByColumn(
  sorter: DataTable.SortState,
  filter: ApiCommon.RequestPage,
  columns: Ref<DataTable.Column[]>
) {
  columns.value.forEach(item => {
    const column = item as DataTable.BaseColumn;
    if (column.key === sorter.columnKey) {
      if (column.sortOrder === 'ascend') {
        column.sortOrder = 'descend';
        filter.direction = 'desc';
      } else {
        column.sortOrder = 'ascend';
        filter.direction = 'asc';
      }
    } else {
      column.sortOrder = false;
    }
  });
  filter.orderBy = humpToLine(sorter.columnKey);
}

/**
 * 动态表单列表排序
 *
 * 动态列表接口只认 orderBys（列编码 → asc/desc），orderBy/direction 会被当作非法查询字段丢弃；
 * 列编码是数据库列名原样（子表列为「子表字段.行内字段」），不能像实体列表那样按驼峰转下划线。
 * naive-ui 只在列声明了 sorter 时渲染排序入口，且受控排序需要同步列的 sortOrder。
 *
 * @param columns 表格列（会被更新 sortOrder）
 * @param sorter  naive-ui 的排序状态（DataTable.SortState 或其数组，取消排序为 null）
 * @return orderBys 查询参数（取消排序时为空对象）
 */
type SorterState = { columnKey?: string | number; order?: 'ascend' | 'descend' | false };

export function dynamicOrderByColumn(columns: any[], sorter: SorterState | SorterState[] | null) {
  const state = Array.isArray(sorter) ? sorter[sorter.length - 1] : sorter;
  const order = state?.order;
  const columnKey = state?.columnKey === undefined || state?.columnKey === null ? '' : String(state.columnKey);
  const sorted = order === 'ascend' || order === 'descend';
  columns.forEach(column => {
    if (!column || column.sorter === undefined) return;
    column.sortOrder = sorted && String(column.key) === columnKey ? order : false;
  });
  return sorted ? { [columnKey]: order === 'ascend' ? 'asc' : 'desc' } : {};
}

/**
 * 表格操作列宽度兜底：按将渲染的文字按钮估算列宽。
 *
 * el-table 单元格 overflow hidden，列宽写死时按钮一多最后一个必被裁切
 * （历史缺陷：固定 250px 导致「删除」只显示一半）。文字按钮宽度 =
 * 字数 × 14px（14px 字号）+ 30px（8px 15px 左右内边距），按钮间 8px 间距，
 * 单元格左右 12px 内边距，外留 12px 缓冲。
 *
 * @param labels 各行最多可能同时出现的按钮文字（传按钮文字最多个数的上限集合）
 */
export function calcTableActionWidth(labels: string[]) {
  if (!labels.length) return 80;
  const content = labels.reduce((sum, label) => sum + label.length * 14 + 30, 0);
  const gaps = (labels.length - 1) * 8;
  return content + gaps + 24 + 12;
}
