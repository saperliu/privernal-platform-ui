import type { ComponentConfigModel } from 'phoenix-designer';
import userSelectConfig from '../user-select';

/**
 * 人员多选（对齐 naiveUi 版 user-multi-select）：
 * 复用人员单选的组件与属性面板，仅默认 schema 不同（multiple: true）。
 */
const userMultiSelectConfig: ComponentConfigModel = {
  ...userSelectConfig,
  defaultSchema: {
    ...userSelectConfig.defaultSchema,
    field: 'users',
    label: '人员(多选)',
    props: {
      ...(userSelectConfig.defaultSchema as any).props,
      multiple: true
    },
    type: 'user-multi-select'
  },
  icon: 'icon--phoenix--group',
  sort: 960
};

export default userMultiSelectConfig;
