import type { ComponentConfigModel } from 'phoenix-designer';
import deptSelectConfig from '../dept-select';

/**
 * 部门多选（对齐 naiveUi 版 dept-multi-select）：
 * 复用部门单选的组件与属性面板，仅默认 schema 不同（multiple: true）。
 */
const deptMultiSelectConfig: ComponentConfigModel = {
  ...deptSelectConfig,
  defaultSchema: {
    ...deptSelectConfig.defaultSchema,
    field: 'departments',
    label: '部门(多选)',
    props: {
      ...(deptSelectConfig.defaultSchema as any).props,
      multiple: true
    },
    type: 'dept-multi-select'
  },
  icon: 'icon--phoenix--dialogs-outline-rounded',
  sort: 980
};

export default deptMultiSelectConfig;
