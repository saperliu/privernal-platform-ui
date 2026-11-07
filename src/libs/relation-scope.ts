import { pluginManager } from 'phoenix-designer';

/** 关联显示数据读取的授权线索 */
export interface RelationScope {
  /** 引用方表单编码；后端按它查关联登记（dynamic_form_relation）判定传递授权 */
  fromTableCode: string;
  /** 流程业务数据id；审批人等流程参与人没有引用方表单权限时按它放行 */
  businessId?: string;
}

/**
 * 给表单里配置了关联组件的节点补上授权线索。
 *
 * 关联下拉与列表翻译要读「被关联表」的记录，而业务用户通常没有那张表的 list 按钮权限，
 * 后端按「引用方表单可用 / 流程参与人」放行，因此需要知道引用方是谁；
 * 设计器内置组件只提交被关联表编码，这里把线索挂到它数据接口地址的查询串上（组件本身不改）。
 * 已改绑自定义数据源（如数据字典表）的关联组件保持原样，不能覆盖客户配置的 dataUrl。
 */
export function applyRelationScope(root: unknown, scope: RelationScope): void {
  const baseUrl = pluginManager.global?.dynamicFormDataUrl as string | undefined;
  if (!root || !baseUrl || !scope.fromTableCode) {
    return;
  }
  const clues = [`fromTableCode=${encodeURIComponent(scope.fromTableCode)}`];
  if (scope.businessId) {
    clues.push(`businessId=${encodeURIComponent(scope.businessId)}`);
  }
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const relation = node.props?.relation || node.componentProps?.relation;
    const dataUrl = relation?.dataUrl;
    const usesDefaultSource = !dataUrl || dataUrl === baseUrl || dataUrl.startsWith(`${baseUrl}?`);
    if (relation?.formCode && usesDefaultSource) {
      relation.dataUrl = `${baseUrl}?tableCode=${encodeURIComponent(relation.formCode)}&${clues.join('&')}`;
    }
    Object.values(node).forEach(visit);
  };
  visit(root);
}
