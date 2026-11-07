import { request } from '@/service/request';

const BASE = '/system/back/flow';

function ok(data: any, msg = 'ok') {
  return { code: 200, msg, data };
}

/** 动态表单流程统一的类别选项（业务人员无需维护分类） */
const DYNAMIC_CATEGORY = [{ id: 'dynamic', name: '动态表单' }];

/** 当前流程绑定的动态表单编码；节点表单绑定统一按它默认，业务人员无需在属性面板设置 */
let currentFormCode = '';

/**
 * 当前编辑的定义是否已发布：已发布流程再保存时另存为新版本
 * （不带 id 提交，warm-flow 自动 version+1），已跑起来的旧实例继续走旧版本
 */
let currentDefinitionPublished = false;

export function setCurrentFormCode(code: string) {
  currentFormCode = code;
}

export function setCurrentDefinitionPublished(published: boolean) {
  currentDefinitionPublished = published;
}

/**
 * 票签「固定人数」转换：
 * 设计器把固定通过/驳回人数拼成 nodeRatio="passCount=N"（或 rejectCount=N），
 * 后端 DefJson 的 nodeRatio 是数字（百分比），原样提交会反序列化失败。
 * 这里将其移入节点 ext（voteType/voteCount/voteRejectCount），nodeRatio 置 0（或签），
 * 运行时由后端 FlowTaskServiceImpl 按票数统计决定节点完成。
 */
function translateCountVote(node: any) {
  const ratio = node?.nodeRatio;
  if (typeof ratio !== 'string') return;
  const matched = ratio.match(/^(passCount|rejectCount)=(\d+)$/);
  if (!matched) return;
  let extList: Array<{ code: string; value: any }> = [];
  if (typeof node.ext === 'string' && node.ext) {
    try {
      const parsed = JSON.parse(node.ext);
      if (Array.isArray(parsed)) extList = parsed;
    } catch {
      extList = [];
    }
  } else if (Array.isArray(node.ext)) {
    extList = node.ext;
  }
  const others = extList.filter(item => !['voteType', 'voteCount', 'voteRejectCount'].includes(item.code));
  others.push({ code: 'voteType', value: 'count' });
  if (matched[1] === 'passCount') {
    others.push({ code: 'voteCount', value: matched[2] });
  } else {
    others.push({ code: 'voteRejectCount', value: matched[2] });
  }
  node.ext = JSON.stringify(others);
  node.nodeRatio = '0';
}

export function createFlowDataProvider() {
  return {
    async saveJson(data: any, _onlyNodeSkip?: boolean) {
      // 设计器传入的已是 warm-flow DefJson 结构（含 nodeList/skipList），直接提交后端 /definition/save
      const payload = typeof data === 'string' ? JSON.parse(data) : data;
      // 已发布流程的编辑另存为新版本：去掉 id，后端按 flowCode 递增 version 建新定义；
      // 正在运行的旧实例仍引用旧版本定义（实例创建时已快照 def_json）直到走完
      if (currentDefinitionPublished && payload?.id) {
        delete payload.id;
      }
      // 节点表单绑定无须业务人员设置：自定义表单固定为「是」，表单唯一标识默认本动态表单编码
      if (currentFormCode && Array.isArray(payload?.nodeList)) {
        for (const node of payload.nodeList) {
          node.formCustom = 'Y';
          node.formPath = currentFormCode;
          translateCountVote(node);
        }
      }
      const res = await request.post<any>(`${BASE}/definition/save`, payload);
      if (res.error === null && res.data) {
        return ok({ id: (res.data as any)?.id });
      }
      return ok({ id: undefined });
    },

    async queryDef(id?: string | number) {
      if (!id) {
        return ok({
          flowName: '',
          flowCode: '',
          category: 'dynamic',
          formCustom: 'Y',
          categoryList: DYNAMIC_CATEGORY,
          nodeList: []
        });
      }
      const res = await request.get<any>(`${BASE}/definition/${id}`);
      if (res.error === null && res.data) {
        const data = res.data;
        if (data?.flowDefinition) {
          try {
            data.flowDefinition =
              typeof data.flowDefinition === 'string' ? JSON.parse(data.flowDefinition) : data.flowDefinition;
          } catch {}
        }
        // 类别下拉选项后端不提供，统一补充动态表单分类，保证已保存流程回显正常
        if (!data?.categoryList?.length) {
          data.categoryList = DYNAMIC_CATEGORY;
        }
        return ok(data);
      }
      return ok(null);
    },

    async queryFlowChart(id: string | number) {
      const res = await request.get<any>(`${BASE}/instance/record/${id}`);
      if (res.error === null && res.data) {
        return ok(res.data);
      }
      return ok(null);
    },

    async handlerType() {
      return ok([
        { code: 'USER', name: '指定用户' },
        { code: 'ROLE', name: '角色' },
        { code: 'DEPT', name: '部门' },
        { code: 'DEPT_AND_CHILD', name: '部门及子部门' },
        { code: 'ALL', name: '全员' },
        { code: 'SELF', name: '发起人自己' },
        { code: 'LEADER', name: '直属上级' },
        { code: 'LEADER_AND_CHILD', name: '直属上级及下级' },
        { code: 'ASSIGNEE', name: '上一节点办理人' },
        { code: 'ASSIGNEE_LEADER', name: '上一节点办理人直属上级' }
      ]);
    },

    async handlerResult(query?: Record<string, any>) {
      try {
        const res = await request.get<any>(`${BASE}/task/handler-result`, {
          params: query
        });
        if (res.error === null && res.data) {
          return ok(res.data);
        }
        return ok([]);
      } catch {
        return ok([]);
      }
    },

    async handlerFeedback(query?: Record<string, any>) {
      try {
        const res = await request.get<any>(`${BASE}/task/handler-feedback`, {
          params: query
        });
        if (res.error === null && res.data) {
          return ok(res.data);
        }
        return ok([]);
      } catch {
        return ok([]);
      }
    },

    async handlerDict() {
      try {
        const res = await request.get<any>(`${BASE}/task/handler-dict`);
        if (res.error === null && res.data) {
          return ok(res.data);
        }
        return ok([]);
      } catch {
        return ok([
          { type: 'handler', list: [] },
          { type: 'role', list: [] },
          { type: 'dept', list: [] },
          { type: 'user', list: [] }
        ]);
      }
    },

    async publishedList() {
      try {
        const res = await request.get<any>(`${BASE}/definition/published`);
        if (res.error === null && res.data) {
          return ok(res.data);
        }
        return ok([]);
      } catch {
        return ok([]);
      }
    },

    async nodeExt() {
      // 节点扩展配置（人员/超时/节点规则/抄送标记）由 NodeFormPermPanel 直接写入节点 ext 随流程保存，
      // 不再走设计器内置 ext 分组机制（其数据形状与 Between 面板期望不符，会引发解析错误）
      return ok([]);
    },

    async listenerList() {
      try {
        const res = await request.get<any>(`${BASE}/listener/list`);
        if (res.error === null && res.data) {
          return ok(res.data);
        }
        return ok([]);
      } catch {
        return ok([
          {
            id: 'task_create',
            name: '任务创建监听',
            type: 'TASK_CREATE',
            beanName: 'taskCreateListener',
            description: '任务创建时触发'
          },
          {
            id: 'task_complete',
            name: '任务完成监听',
            type: 'TASK_COMPLETE',
            beanName: 'taskCompleteListener',
            description: '任务完成时触发'
          },
          {
            id: 'task_assign',
            name: '任务分配监听',
            type: 'TASK_ASSIGN',
            beanName: 'taskAssignListener',
            description: '任务分配给办理人时触发'
          },
          {
            id: 'flow_start',
            name: '流程启动监听',
            type: 'FLOW_START',
            beanName: 'flowStartListener',
            description: '流程启动时触发'
          },
          {
            id: 'flow_end',
            name: '流程结束监听',
            type: 'FLOW_END',
            beanName: 'flowEndListener',
            description: '流程结束时触发'
          },
          {
            id: 'flow_timeout',
            name: '流程超时监听',
            type: 'FLOW_TIMEOUT',
            beanName: 'flowTimeoutListener',
            description: '流程超时时触发'
          }
        ]);
      }
    },

    async formList() {
      try {
        const res = await request.get<any>(`${BASE}/form/list`);
        if (res.error === null && res.data) {
          return ok(res.data);
        }
        return ok([]);
      } catch {
        return ok([]);
      }
    },

    async formFieldList(formId: string | number) {
      try {
        const res = await request.get<any>(`${BASE}/form/field/${formId}`);
        if (res.error === null && res.data) {
          return ok(res.data);
        }
        return ok([]);
      } catch {
        return ok([]);
      }
    },

    async config() {
      return ok({
        appName: 'Privernal 工作流设计器',
        logoUrl: '/favicon.svg',
        copyright: 'Privernal Studio',
        icp: ''
      });
    }
  };
}
