import { pluginManager } from 'phoenix-designer';
import { localStg } from '@/utils/storage';
import { getServiceBaseURL } from '@/utils/service';

/**
 * phoenix-designer 全局配置：
 * 人员/部门选择组件的数据接口与登录态请求头。
 *
 * 接口为 privernal-platform 的系统服务（登录态即可调用），
 * 数据范围由后端按当前登录人的组织与数据权限过滤。
 */
export function setupPhoenixDesignerConfig() {
  const isHttpProxy = import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

  pluginManager.global.userListUrl = `${baseURL}/system/back/system/user/list`;
  pluginManager.global.departmentTreeUrl = `${baseURL}/system/back/system/department/tree`;

  // 关联表单组件（relation-attr / relation-backfill）的数据链路：动态表单服务
  // 不配置时组件回落到相对路径 /back/dynamic/form/list，在宿主页面必然 404，
  // 表现为"关联表单下拉为空、只能手动输入表单编码"
  pluginManager.global.dynamicFormListUrl = `${baseURL}/dynamic/back/dynamic/form/list`;
  pluginManager.global.dynamicFormDetailUrl = `${baseURL}/dynamic/back/dynamic/form/code/`;
  // 关联显示数据接口：组件只提交被关联表编码，后端按「谁把它配置成了关联数据源」放行，
  // 用不着给业务角色额外授被关联表的列表权限（data/list 仍要求该表自身的 list 权限）
  pluginManager.global.dynamicFormDataUrl = `${baseURL}/dynamic/dbs/open/dynamic/data/relationList`;

  // 流水号组件的取号接口（系统服务，GET 返回 data=号码）
  pluginManager.global.serialNumberUrl = `${baseURL}/system/back/system/serialNumber/generate`;

  // 图片/附件上传组件：对接平台文件服务单文件上传接口（返回 data.url，与组件响应解析匹配）
  pluginManager.global.uploadFile = `${baseURL}/file/back/file/upload/single`;
  pluginManager.global.uploadImage = `${baseURL}/file/back/file/upload/single`;

  // 请求头使用 getter，组件每次请求时实时读取最新 token
  pluginManager.global.axiosConfig.headers = {
    get Authorization() {
      const token = localStg.get('token');
      return token ? `Bearer ${token}` : '';
    }
  } as Record<string, string>;
}
