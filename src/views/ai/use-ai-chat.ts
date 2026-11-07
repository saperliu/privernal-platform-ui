import { computed, nextTick, ref } from 'vue';
import { useAuthStore } from '@/store';
import { getServiceBaseURL } from '@/utils';

/**
 * B7/B8 共用对话编排层客户端：SSE 流式消费、消息状态、预算与模型信息、内联图表。
 * build（/ai/build）与 analyze（/ai/analyze，B8 问数）两页共用；页面差异通过
 * onOpenView / onFinally 回调注入（build 页弹「查看数据」容器+刷新产物面板，
 * analyze 页同样弹容器+不刷产物）。
 *
 * 事件面（privernal-ai-orchestrator）：
 *   session/model/delta/tool/tool_result/budget/error/open_view/chart/done
 *   —— analyze profile 的会话端点不同（/api/ai/analyze/chat），事件结构完全一致。
 */

export interface AiTraceItem {
  key: string;
  name: string;
  arguments: string;
  ok: null | boolean;
  resultText: string;
}

export interface AiChatMessage {
  key: string;
  role: 'user' | 'assistant';
  text: string;
  streaming: boolean;
  traces: AiTraceItem[];
  /** B8 Chat BI：取数工具产生的内联图表（chart SSE 事件按顺序挂到当前助手消息上） */
  charts: AiNamespace.AiChartSpec[];
}

export function useAiChat(options: {
  /** 会话端点（不含 base）：build=/api/ai/chat，analyze=/api/ai/analyze/chat */
  chatEndpoint: string;
  /** open_view 事件（open_data_view 工具）的页面行为：弹详情抽屉/列表容器 */
  onOpenView?: (payload: Record<string, any>) => void;
  /** 单条消息流结束（含异常）后的页面行为：build 刷新产物面板 */
  onFinally?: () => void;
}) {
  const authStore = useAuthStore();

  // ---------------- 编排层地址（/proxy-ai → privernal-ai-orchestrator:8700） ----------------
  const isHttpProxy = import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { otherBaseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  // 编排层键 'ai' 由 VITE_OTHER_SERVICE_BASE_URL 提供（见 .env.test），但 App.Service.OtherBaseURLKey
  // 目前只声明了 'demo'，所以按运行期实际存在的键读取（typings/app.d.ts 不在本分片可改范围）
  const orchestratorBase = (otherBaseURL as Record<string, string>).ai;

  // ---------------- 会话状态 ----------------
  const sessionId = ref(`s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const profile = ref<'analyze' | 'build'>('build');
  const chatMessages = ref<AiChatMessage[]>([]);
  const inputText = ref('');
  const streaming = ref(false);
  const modelInfo = ref<{ model?: string; intranetFlag?: string; dataFlowNotice?: string } | null>(null);
  const budget = ref<{ tokensUsed: number; limit: number | null }>({ tokensUsed: 0, limit: null });
  const lastError = ref('');
  const listRef = ref<HTMLElement | null>(null);

  const canSend = computed(() => !streaming.value && inputText.value.trim().length > 0);

  function scrollBottom() {
    nextTick(() => {
      if (listRef.value) {
        listRef.value.scrollTop = listRef.value.scrollHeight;
      }
    });
  }

  function pushAssistant(): AiChatMessage {
    const item: AiChatMessage = {
      key: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'assistant',
      text: '',
      streaming: true,
      traces: [],
      charts: []
    };
    chatMessages.value.push(item);
    return item;
  }

  // ---------------- SSE 消费（fetch 流式读取） ----------------
  /** 单帧解析：event/data 行聚成一条事件；无 data 或坏 JSON 的帧直接丢弃（与旧实现一致） */
  function handleSseFrame(frame: string, assistant: AiChatMessage) {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }
    if (dataLines.length === 0) {
      return;
    }
    let payload: Record<string, any> = {};
    try {
      payload = JSON.parse(dataLines.join('\n'));
    } catch {
      return;
    }
    handleSseEvent(event, payload, assistant);
  }

  /** 消费缓冲区里所有完整帧（\n\n 分隔），返回尚未闭合的半帧 */
  function consumeSseFrames(buffer: string, assistant: AiChatMessage): string {
    let rest = buffer;
    let idx = rest.indexOf('\n\n');
    while (idx >= 0) {
      const frame = rest.slice(0, idx);
      rest = rest.slice(idx + 2);
      handleSseFrame(frame, assistant);
      idx = rest.indexOf('\n\n');
    }
    return rest;
  }

  async function handleSend() {
    const text = inputText.value.trim();
    if (!text || streaming.value) {
      return;
    }
    inputText.value = '';
    lastError.value = '';
    chatMessages.value.push({ key: `u-${Date.now()}`, role: 'user', text, streaming: false, traces: [], charts: [] });
    const assistant = pushAssistant();
    streaming.value = true;
    scrollBottom();

    try {
      const token = authStore.token;
      const resp = await fetch(`${orchestratorBase}${options.chatEndpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-AI-Session': sessionId.value
        },
        body: JSON.stringify({ message: text, sessionId: sessionId.value })
      });
      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`编排层不可达（HTTP ${resp.status}）${errText.slice(0, 200)}`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      // 流式读取只能一块一块等（不能并发）；用闭包递归推进，done 时残留半帧不补处理
      const pump = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (!done) {
          buffer = consumeSseFrames(buffer + decoder.decode(value, { stream: true }), assistant);
          await pump();
        }
      };
      await pump();
    } catch (e: any) {
      lastError.value = e?.message || String(e);
      window.$message?.error(`对话失败：${lastError.value}`);
    } finally {
      assistant.streaming = false;
      streaming.value = false;
      scrollBottom();
      options.onFinally?.();
    }
  }

  function handleToolStart(payload: Record<string, any>, assistant: AiChatMessage) {
    assistant.traces.push({
      key: `t-${assistant.traces.length}-${payload.name}`,
      name: payload.name,
      arguments: payload.arguments || '',
      ok: null,
      resultText: ''
    });
    scrollBottom();
  }

  function handleToolResult(payload: Record<string, any>, assistant: AiChatMessage) {
    const pending = [...assistant.traces].reverse().find(t => t.name === payload.name && t.ok === null);
    if (pending) {
      pending.ok = Boolean(payload.ok);
      pending.resultText = payload.text || '';
    }
  }

  function handleChartEvent(payload: Record<string, any>, assistant: AiChatMessage) {
    // B8 Chat BI：编排层把取数工具的聚合行转发为内联图表，按 reportType 渲染 ChartCard
    if (!payload || !Array.isArray(payload.rows)) {
      return;
    }
    assistant.charts.push({
      reportType: payload.reportType || 'bar',
      rows: payload.rows,
      dimensionAliases: payload.dimensionAliases,
      measureAliases: payload.measureAliases,
      dimensionLabels: payload.dimensionLabels,
      measureLabels: payload.measureLabels,
      datasetCode: payload.datasetCode || null,
      reportCode: payload.reportCode || null,
      comparison: payload.comparison || null
    });
    scrollBottom();
  }

  /** 事件分派表：把 switch 拍平，新增事件只加一行（complexity 守门 ≤20） */
  const EVENT_HANDLERS: Record<string, (payload: Record<string, any>, assistant: AiChatMessage) => void> = {
    session: p => {
      if (p.sessionId) {
        sessionId.value = p.sessionId;
      }
      if (p.profile) {
        profile.value = p.profile;
      }
    },
    model: p => {
      modelInfo.value = p;
    },
    delta: (p, a) => {
      a.text += p.text || '';
      scrollBottom();
    },
    tool: handleToolStart,
    tool_result: handleToolResult,
    budget: p => {
      budget.value = { tokensUsed: p.tokensUsed || 0, limit: p.limit || null };
    },
    error: p => {
      lastError.value = p.message || '未知错误';
    },
    open_view: p => {
      options.onOpenView?.(p);
    },
    chart: handleChartEvent,
    done: (p, a) => {
      if (p.content) {
        a.text += p.content;
      }
    }
  };

  function handleSseEvent(event: string, payload: Record<string, any>, assistant: AiChatMessage) {
    EVENT_HANDLERS[event]?.(payload, assistant);
  }

  async function handleNewSession() {
    if (streaming.value) {
      window.$message?.warning('当前会话处理中，请等待完成');
      return;
    }
    const old = sessionId.value;
    const token = authStore.token;
    fetch(`${orchestratorBase}/api/ai/session/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: old })
    }).catch(() => {});
    sessionId.value = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    chatMessages.value = [];
    budget.value = { tokensUsed: 0, limit: null };
    lastError.value = '';
    modelInfo.value = null;
    options.onFinally?.();
  }

  return {
    orchestratorBase,
    sessionId,
    profile,
    chatMessages,
    inputText,
    streaming,
    modelInfo,
    budget,
    lastError,
    listRef,
    canSend,
    scrollBottom,
    handleSend,
    handleNewSession
  };
}

/** 内联图表标题：多条时带序号，口径标签用维度/度量的中文名拼一条摘要（两页共用） */
export const CHART_TYPE_LABELS: Record<string, string> = {
  bar: '柱状图',
  line: '折线图',
  pie: '饼图',
  stat: '数字卡',
  gauge: '仪表盘',
  ranking: '榜单',
  table: '汇总表'
};

export function chartTitle(chart: AiNamespace.AiChartSpec, index: number) {
  const dim = (chart.dimensionLabels || [])[0] || '';
  const measure = (chart.measureLabels || [])[0] || '';
  const summary = [dim, measure].filter(Boolean).join(' / ');
  const ordinal = index > 0 ? ` ${index + 1}` : '';
  return `${CHART_TYPE_LABELS[chart.reportType] || chart.reportType}${ordinal}${summary ? ` · ${summary}` : ''}`;
}
