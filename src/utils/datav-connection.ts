/**
 * 大屏投放的连接状态（M6.3 断线重连提示）。
 *
 * 判定只看一件事：**整屏批量请求本身失败**。单个组件报错是它的配置或数据集问题，
 * 不该让整块屏挂「连接中断」——那会把人支去查网络，而真正坏的是一个维度字段。
 *
 * 连续失败到阈值才提示也是故意的：投屏上闪一下又消失的横幅比不提示更糟，
 * 值班的人会开始忽略它，然后真的断了也没人看。
 */

export interface ConnectionState {
  /** 连续整屏失败次数 */
  consecutiveFailures: number;

  /** 第一次失败的时刻（用于「已中断 N 秒」），成功即清空 */
  failedSince: number | null;

  /** 最后一次成功取数的时刻 */
  lastSuccessAt: number | null;
}

export const INITIAL_CONNECTION: ConnectionState = {
  consecutiveFailures: 0,
  failedSince: null,
  lastSuccessAt: null
};

/** 连续几次整屏失败才认定断线：1 次可能是发布重启的一瞬，2 次以上才值得占满观众注意力 */
export const DEGRADED_THRESHOLD = 2;

export function noteFailure(state: ConnectionState, at: number): ConnectionState {
  return {
    consecutiveFailures: state.consecutiveFailures + 1,
    failedSince: state.failedSince ?? at,
    lastSuccessAt: state.lastSuccessAt
  };
}

export function noteSuccess(_state: ConnectionState, at: number): ConnectionState {
  return { consecutiveFailures: 0, failedSince: null, lastSuccessAt: at };
}

export function isDegraded(state: ConnectionState, threshold = DEGRADED_THRESHOLD): boolean {
  return state.consecutiveFailures >= threshold;
}

function clockText(at: number): string {
  const date = new Date(at);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * 横幅文案。必须带上「最后一次成功是什么时候」：
 * 只说「连接中断」，观众不知道屏上这几个数字是 5 秒前的还是 3 小时前的。
 */
export function connectionText(state: ConnectionState, at: number): string {
  if (!isDegraded(state)) return '';
  const held = state.failedSince ? Math.max(0, Math.round((at - state.failedSince) / 1000)) : 0;
  const last = state.lastSuccessAt ? ` · 最后成功 ${clockText(state.lastSuccessAt)}` : ' · 尚无成功取数';
  return `数据连接中断，正在自动重试（已中断 ${held} 秒${last}）`;
}
