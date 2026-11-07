// 一些小组件或者方法的存储
export const tableProcessNodeShowType = {
  ProcessPersonName: {
    code: 'PersonPersonName',
    name: '流程节点人员名称'
  },
  ProcessNodeName: {
    code: 'ProcessNodeName',
    name: '流程节点名称'
  }
};

/**
 *
 * @param data 数据
 * @param type 类型
 */
export function tableProcessNodeShow(data: any, type: string) {
  let result = '';

  if (data === null || data === undefined || data.length === 0) {
    return '';
  }
  if (type === tableProcessNodeShowType.ProcessNodeName.code) {
    data.forEach((item: any) => {
      // 原实现的 `if (result != null)` 分支对字符串恒成立，改写为等价的无条件拼接
      result += item.nodeName;
      result += `,${item.nodeName}`;
    });
  } else if (type === tableProcessNodeShowType.ProcessPersonName.code) {
    const PeronsName = new Map();
    data.forEach((item: any) => {
      const currentProcessNode = item.currentProcessNodePersonDTOS;
      if (currentProcessNode !== null && currentProcessNode !== undefined) {
        currentProcessNode.forEach((item1: any) => {
          PeronsName.set(item1.id, item1.name);
        });
      }
    });
    if (PeronsName.size > 0) {
      result = Array.from(PeronsName.values()).join(',');
    }
  }
  return result;
}

/**
 * 增加子表生成的id长度
 */
export const HANDLE_ADD_TABLE_ID_LENGTH = 5;
