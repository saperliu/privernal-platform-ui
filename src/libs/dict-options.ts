import { findSystemDictionaryDataList } from '@/service/api';

/**
 * 字典数据源：表单组件（select/radio/checkbox 等）声明 props.dataSource==='dict'
 * 且 props.dictType=<字典类型> 时，渲染前把字典项注入 props.options（label=dictLabel、value=dictValue）。
 *
 * 设计器属性面板的「选项数据源/字典类型」控件由 phoenix EP 包（1.3.15 起）
 * select/radio/checkbox 属性条目 + 本仓 EDictTypeEditor 编辑器提供。
 * 拉取失败保持组件原样（静态 options 或空），不阻断表单渲染。
 */
export async function applyDictOptions(root: unknown): Promise<void> {
  const nodes: Array<Record<string, any>> = [];
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const props = node.props || node.componentProps;
    if (props && props.dataSource === 'dict' && props.dictType) {
      nodes.push(node);
    }
    Object.values(node).forEach(visit);
  };
  visit(root);
  if (!nodes.length) {
    return;
  }
  const dictTypes = [...new Set(nodes.map(node => String((node.props || node.componentProps).dictType)))];
  await Promise.all(
    dictTypes.map(async dictType => {
      try {
        const { data, error } = await findSystemDictionaryDataList({
          dictType,
          pageNum: 1,
          pageSize: 500
        });
        if (error || !data?.list?.length) {
          return;
        }
        const options = data.list.map(item => ({ label: item.dictLabel, value: item.dictValue }));
        nodes
          .filter(node => String((node.props || node.componentProps).dictType) === dictType)
          .forEach(node => {
            const props = node.props || node.componentProps;
            props.options = options;
          });
      } catch (e) {
        window.console.warn('[dict-options] 字典选项拉取失败 dictType=' + dictType, e);
      }
    })
  );
}
