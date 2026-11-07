/**
 * AI 模型配置（B5）与 AI 搭建会话面（B7）的类型。
 * 后端：system_ai_config / system_ai_session_log / system_ai_artifact / dynamic_form_log(DRAFT)。
 */
declare namespace AiNamespace {
  /** AI 模型配置行（apiKey 只回掩码） */
  interface AiConfig {
    id: string;
    organizationId: string;
    provider?: string;
    baseUrl: string;
    apiKeyPrefix?: string;
    apiKeyLast4?: string;
    model?: string;
    temperature?: number;
    sessionTokenLimit?: number;
    intranetFlag: string;
    enabled: string;
  }

  /** GET ai/config/current 的响应 */
  interface AiConfigCurrent {
    config: AiConfig | null;
    dataFlowNotice: string;
  }

  /** 会话审计行 */
  interface AiSessionLog {
    id: string;
    sessionId: string;
    userId?: string;
    userName?: string;
    organizationId?: string;
    action: 'START' | 'CLOSE' | 'ALLOW' | 'DENIED' | 'CONFIG_FETCH';
    httpMethod?: string;
    requestUri?: string;
    denyReason?: string;
    createdTime?: string;
  }

  /** 生成物台账行 */
  interface AiArtifact {
    id: string;
    sessionId: string;
    objectType: 'FORM' | 'REPORT' | 'DASHBOARD' | 'FLOW' | 'APP';
    objectId: string;
    code?: string;
    rolledBack: 'Y' | 'N';
    rollbackNote?: string;
    createdTime?: string;
  }

  /** 表单设计草稿快照（发布按钮取 logId 用） */
  interface FormDraftLog {
    id: string;
    formId: string;
    version: string;
    title?: string;
    logType: 'DRAFT' | 'VERSION';
    createdTime?: string;
  }

  /** 对话消息条目 */
  interface ChatItem {
    key: string;
    role: 'user' | 'assistant';
    text: string;
    streaming?: boolean;
  }

  /** 工具调用轨迹条目 */
  interface ToolTraceItem {
    key: string;
    name: string;
    arguments?: string;
    ok?: boolean;
    resultText?: string;
    running?: boolean;
  }

  /** AI 内联图表（B8 Chat BI）：编排层把取数工具的聚合结果转发为 chart SSE 事件的载荷 */
  interface AiChartSpec {
    reportType: 'bar' | 'line' | 'pie' | 'stat' | 'gauge' | 'ranking' | 'table';
    rows: ReportChartNamespace.AggRow[];
    dimensionAliases?: string[];
    measureAliases?: string[];
    dimensionLabels?: string[];
    measureLabels?: string[];
    datasetCode?: string | null;
    reportCode?: string | null;
    /** 同比/环比对比模式（M3-1），透传给 ChartCard 显示增速徽标 */
    comparison?: 'yoy' | 'mom' | 'prev' | null;
  }

  /** AI 问数历史会话条目（M2：system_ai_chat_message 回放） */
  interface AiChatSessionSummary {
    sessionId: string;
    title?: string;
    createdTime?: string;
    messageCount?: number;
  }

  /** AI 问数历史消息行（M2：system_ai_chat_message；charts 为 chart SSE 事件载荷的 JSON 字符串） */
  interface AiChatMessageRow {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    charts?: string | null;
    createdTime?: string;
  }
}
