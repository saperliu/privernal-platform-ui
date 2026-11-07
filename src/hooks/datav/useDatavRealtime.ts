/**
 * 大屏实时通道客户端（M6.4）。
 *
 * 分工是刻意切开的：**WS 只送节拍，数据仍然走 HTTP**。
 * 一条聚合结果对谁长什么样，取决于他的行级权限、当前参数与下钻层级——三件事每人不同，
 * 所以服务端不能算一次广播；而由客户端带着自己的登录上下文去取，这三件事天然各算各的。
 * 服务端统一发节拍的价值在于「同一块屏的一百个观众在同一毫秒被叫醒」，
 * 结果缓存（按身份+配置+参数键）于是能把一百次查询收敛成一次。
 *
 * 没有复用 `@/hooks/business/websocket`：那份封装把 url 与 path 都拼成了 HTTP 代理前缀
 * （socket.io 服务在另一个端口上，实际连不通），且没有连接状态、没有订阅/退订，
 * 改它会同时碰到后台通知那条链路。这里独立一份，等后台通知真要用时再合并。
 */
import { onScopeDispose, ref, watch } from 'vue';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/store';

/** off=没配实时组件；connecting=正在连；live=节拍已到；polling=退回定时轮询 */
export type DatavRealtimeStatus = 'off' | 'connecting' | 'live' | 'polling';

export interface DatavRealtimeOptions {
  /** 频道名，约定 datav:{screenCode} */
  channel: () => string;

  /** 期望节拍（秒），服务端会抬到它的下限 */
  intervalSec: () => number;

  /** 有没有需要实时的组件；没有就不该建立连接 */
  enabled: () => boolean;

  /** 每一拍要刷的组件 */
  onTick: () => void;
}

/** 服务端 datav_subscribe 的应答 */
interface SubscribeAck {
  accepted?: boolean;
  intervalSec?: number;
  reason?: string;
}

const TICK_EVENT = 'datav_tick';

const SUBSCRIBE_EVENT = 'datav_subscribe';

const UNSUBSCRIBE_EVENT = 'datav_unsubscribe';

export function useDatavRealtime(options: DatavRealtimeOptions) {
  const status = ref<DatavRealtimeStatus>('off');

  /**
   * 在 setup 里就取好 store，不在回调里取。
   *
   * 更要紧的是下面 watch 把 userId/token 也列进了依赖：路由守卫是**异步**把 userInfo 从
   * localStorage 恢复进 store 的，而投放页的 setup 在那之前就跑完了。早到的那一次连接
   * 带着空 userId 去握手，会被服务端的鉴权直接 401 掉 —— 表现成「实时通道时好时坏」，
   * 冷启动几乎必然连不上。凭据一到就重连，才是这里该有的行为。
   */
  const auth = useAuthStore();

  /** 服务端实际生效的节拍，用于界面说明「多久刷一次」 */
  const grantedIntervalSec = ref(0);

  /** 最近一次收到拍点的时刻，投屏上判断「通道是不是哑了」比看连接状态可靠 */
  const lastTickAt = ref(0);

  const rejectReason = ref('');

  let socket: Socket | null = null;

  let subscribedChannel = '';

  function fallbackToPolling(reason: string) {
    status.value = 'polling';
    rejectReason.value = reason;
  }

  function teardown() {
    if (!socket) return;
    if (subscribedChannel) {
      socket.emit(UNSUBSCRIBE_EVENT, { channel: subscribedChannel });
      subscribedChannel = '';
    }
    socket.removeAllListeners();
    socket.close();
    socket = null;
  }

  function connect() {
    if (!options.enabled()) {
      teardown();
      status.value = 'off';
      return;
    }
    if (socket) return;

    const userId = String(auth.userInfo?.userId || '');
    const token = String(auth.token || '');
    if (userId === '' || token === '') {
      // 不建连接也不放弃：凭据到位后 watch 会再叫一次
      status.value = 'polling';
      rejectReason.value = '未取到登录凭据，暂按轮询刷新';
      return;
    }
    status.value = 'connecting';
    // 同源 + /socket：开发由 Vite 代理到 16001，生产由 nginx 转 ws，两边同一份代码
    socket = io(window.location.origin, {
      // 结尾斜杠是必须的：netty-socketio 按 context 精确匹配路径，
      // 少一个斜杠时它既不回 401 也不回 101，而是把连接吊住，客户端只能等到超时
      path: '/socket/',
      transports: ['websocket'],
      // 投屏是长期无人值守的，重连不能只试三次就放弃；退避上限交给 socket.io 默认策略
      reconnection: true,
      /**
       * 连接超时收紧到 5 秒。默认 20 秒里徽章会一直写着「连接中」，
       * 而这段时间组件其实已经在按兜底间隔轮询了——观众分不清「正在连」与「数已经不新」，
       * 那正是本轮反复踩到的「没人看得出来的旧状态」。
       */
      timeout: 5000,
      query: { userId, token }
    });

    socket.on('connect', () => {
      const channel = options.channel();
      if (!channel) return;
      socket?.emit(SUBSCRIBE_EVENT, { channel, intervalSec: options.intervalSec() }, (ack: SubscribeAck) => {
        if (ack?.accepted) {
          status.value = 'live';
          grantedIntervalSec.value = Number(ack.intervalSec) || 0;
          rejectReason.value = '';
          subscribedChannel = channel;
          // 订阅成功到第一拍之间最多空一个节拍，先补一次，别让屏停在旧数上
          options.onTick();
          return;
        }
        // 被拒（未启用、频道数超限…）时退回轮询，实时组件仍然要动，只是慢一点
        fallbackToPolling(String(ack?.reason || '订阅未获准'));
      });
    });

    socket.on(TICK_EVENT, (payload: { channel?: string }) => {
      if (payload?.channel && payload.channel !== options.channel()) return;
      lastTickAt.value = Date.now();
      options.onTick();
    });

    socket.on('disconnect', () => {
      // 断开不等于停更：退回轮询，观众看到的只是「刷新变慢」，而不是画面冻住
      fallbackToPolling('实时连接已断开');
    });

    socket.on('connect_error', error => {
      // 把真实原因带出去：只写「不可达」的话，路径错、被网关拒、服务端没起三种情况
      // 在界面上长得一模一样，而三者的处置完全不同
      fallbackToPolling(`实时通道不可达：${String((error as Error)?.message || error).slice(0, 80)}`);
      // 放开重连的门：失败后必须允许下一次尝试（凭据到位、网络恢复都要能再连上）
      teardown();
    });
  }

  watch(
    () =>
      [options.enabled(), options.channel(), String(auth.userInfo?.userId || ''), String(auth.token || '')] as const,
    ([live]) => {
      if (!live) {
        teardown();
        status.value = 'off';
        return;
      }
      // 凭据变了就换一条连接：旧连接带着空 userId 会被一直拒
      if (socket) {
        teardown();
      }
      connect();
    },
    { immediate: true }
  );

  onScopeDispose(teardown);

  return { status, grantedIntervalSec, lastTickAt, rejectReason };
}
