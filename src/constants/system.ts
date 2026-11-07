import { $t } from '@/locales';
import { transformObjectToOption } from './_shared';

export const RoleOrg = 'SuperRole';
export const RolePlatform = 'SuperPlatformRole';

// 操作标签的各类，标记子表记录的行为
export const ActionTagDelete = 'DELETE';
export const ActionTagEdit = 'EDIT';
export const ActionTagAdd = 'ADD';

export const loginModuleLabels: Record<UnionKey.LoginModule, string> = {
  'pwd-login': $t('page.login.pwdLogin.title'),
  'bind-wechat': $t('page.login.bindWeChat.title')
};

export const userRoleLabels: Record<Api.Auth.RoleType, string> = {
  SuperPlatformRole: $t('page.login.pwdLogin.superAdmin'),
  SuperRole: $t('page.login.pwdLogin.admin'),
  user: $t('page.login.pwdLogin.user')
};
export const userRoleOptions = transformObjectToOption(userRoleLabels);

/** 用户性别 */
export const genderLabels: Record<SystemUserNamespace.GenderKey, string> = {
  0: '女',
  1: '男',
  2: '未知'
};
export const genderOptions = transformObjectToOption(genderLabels);

/** 用户状态 */
export const userStatusLabels: Record<SystemUserNamespace.UserStatusKey, string> = {
  0: '草稿',
  1: '启用',
  5: '待审核',
  3: '禁用'
};

export const userStatusOptions: { value: number; label: string }[] = [
  { value: 0, label: userStatusLabels['0'] },
  { value: 1, label: userStatusLabels['1'] },
  { value: 5, label: userStatusLabels['5'] },
  { value: 3, label: userStatusLabels['3'] }
];
export const userStatusColors: Record<string, string> = {
  '0': '#4E5969',
  '1': '#00B42A',
  '3': '#F53F3F',
  '5': '#165DFF'
};
// 0 草稿   1  启用【己完成】     2 【进行中】   3  禁用【已取消】
export const dataStatusLabels: Record<number, string> = {
  0: '草稿',
  1: '启用',
  2: '进行中',
  3: '禁用',
  9: '作废'
};

export const dataStatusColors: Record<string, string> = {
  '0': '#4E5969',
  '1': '#00B42A',
  '2': '#165DFF',
  '3': '#F53F3F',
  '9': '#4E5969'
};
export const dataStatusBgColors: Record<string, string> = {
  '0': '#F2F3F5',
  '1': '#E8FFEA',
  '2': '#E8F3FF',
  '3': '#FFECE8',
  '9': '#F2F3F5'
};
export const dataStatusDraft = 0;
export const dataStatusEnableOrFinished = 1;
export const dataStatusProcessing = 2;
export const dataStatusDisableOrCanceled = 3;

/**
 * 流程状态
 */
export const processLabels: Record<number, string> = {
  0: '草稿',
  1: '己完成',
  2: '进行中',
  3: '已取消'
};

/** 路由组件类型（原全局 `AuthRoute.RouteComponentType`，naive 迁移后在本文件内声明） */
type RouteComponentType = 'basic' | 'self' | 'multi' | 'blank';

export const componentTypeLabels: Record<string, string> = {
  basic: '目录',
  self: '页面',
  multi: '多级',
  blank: '空白页面'
};

export const componentTypeOptions: { value: RouteComponentType; label: string }[] = [
  { value: 'basic', label: componentTypeLabels.basic },
  { value: 'self', label: componentTypeLabels.self },
  { value: 'multi', label: componentTypeLabels.multi },
  { value: 'blank', label: componentTypeLabels.blank }
];

export const menuTypeLabels: Record<string, string> = {
  C: '功能',
  M: '目录',
  F: '按钮'
};

export const menuTypeColors: Record<string, string> = {
  C: '#08D500',
  M: '#FF964B',
  F: '#165DFF'
};

export const menuTypeOptions: { value: SystemMenuNamespace.MenuTypeKey; label: string }[] = [
  { value: 'C', label: menuTypeLabels.C },
  { value: 'F', label: menuTypeLabels.F },
  { value: 'M', label: menuTypeLabels.M }
];

export const dataScopeLabels: Record<string, string> = {
  50: '全部',
  30: '本部门及以下',
  20: '本部门',
  10: '仅本人'
};

export const dataScopeOptions: { value: SystemUserServiceOrgNamespace.DataScopeKey; label: string }[] = [
  { value: 50, label: dataScopeLabels['50'] },
  { value: 30, label: dataScopeLabels['30'] },
  { value: 20, label: dataScopeLabels['20'] },
  { value: 10, label: dataScopeLabels['10'] }
];

export const dataRelationLabels: Record<number, string> = {
  1: '是',
  0: '否'
};
export const dataRelationOptions: { value: number; label: string }[] = [
  { value: 1, label: '是' },
  { value: 0, label: '否' }
];

export const dataYesAndNoLabels: Record<string, string> = {
  Y: '是',
  N: '否'
};

export const warehouseOutInLabels: Record<string, string> = {
  IN: '入库',
  OUT: '出库'
};

/** 公共组类型 */
export const commonGroupLabels: Record<string, string> = {
  ROLE: '角色',
  USER_GROUP: '用户组'
};

export const applicationCodeSystem = 'SYSTEM';
export const commonGroupTypeRole = 'ROLE';

export const commonGroupOptions = transformObjectToOption(commonGroupLabels);
