import { request } from '../../request';

/**
 * AI 模型配置（B5，skill-plan-upgrade §2-B5）+ AI 搭建会话面（B7）。
 * 后端：SystemAiConfigController / SystemAiBuildController / AiArtifactLedgerController。
 */

/** 当前组织模型配置（apiKey 掩码；附数据流向明示） */
export function fetchAiConfigCurrent() {
  return request.get<AiNamespace.AiConfigCurrent>('/system/back/system/ai/ai/config/current');
}

/** 保存模型配置（upsert；apiKey 非空重新加密、空保持不变） */
export function saveAiConfig(data: {
  provider?: string;
  baseUrl: string;
  model?: string;
  temperature?: number | string;
  sessionTokenLimit?: number | string;
  intranetFlag?: string;
  enabled?: string;
  apiKey?: string;
}) {
  return request.post<AiNamespace.AiConfigCurrent>('/system/back/system/ai/ai/config/save', data);
}

/** 启停本组织 AI 能力 */
export function enableAiConfig(enabled: 'Y' | 'N') {
  return request.post<boolean>('/system/back/system/ai/ai/config/enable', null, { params: { enabled } });
}

/** 本会话审计序列（工具调用轨迹 / DENIED 明细） */
export function fetchAiSessionLogs(sessionId: string) {
  return request.get<AiNamespace.AiSessionLog[]>('/system/back/system/ai/ai/build/session/logs', {
    params: { sessionId }
  });
}

/** 生成物台账（按会话过滤给会话产物面板） */
export function fetchAiArtifacts(sessionId?: string) {
  return request.get<AiNamespace.AiArtifact[]>('/dynamic/back/dynamic/ai/artifact/list', {
    params: sessionId ? { sessionId } : {}
  });
}

/** 撤销生成物（FORM=改名+逻辑删；REPORT=删图表） */
export function rollbackAiArtifact(id: string) {
  return request.post<string>(`/dynamic/back/dynamic/ai/artifact/${id}/rollback`, {});
}

/** 读表单最新未发布设计草稿（发布按钮用它拿 logId） */
export function fetchFormDraft(formId: string) {
  return request.get<AiNamespace.FormDraftLog | null>(`/dynamic/back/dynamic/form/draft/${formId}`);
}

/** 发布版本快照（人在界面点发布 → 建表/登记菜单，AI 会话被 Filter 拒绝） */
export function publishFormLog(logId: string) {
  return request.put(`/dynamic/back/dynamic/form/publish/${logId}`);
}

// ---------------- B8 Chat BI M2：问数历史（前端直连后端读，不经编排层） ----------------

/** 问数历史会话侧栏（按组织+用户隔离，最近在前，≤50 条） */
export function fetchAiChatSessions() {
  return request.get<AiNamespace.AiChatSessionSummary[]>('/system/back/system/ai/ai/chat/sessions');
}

/** 按会话回放问数消息（只回本人消息，时间正序） */
export function fetchAiChatMessages(sessionId: string) {
  return request.get<AiNamespace.AiChatMessageRow[]>('/system/back/system/ai/ai/chat/messages', {
    params: { sessionId }
  });
}
