import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { getServiceBaseURL } from '@/utils';
import { useAppStore, useAuthStore } from '../../store';
type ListenEvents = {
  update: (id: string, data: { name: string; age: number }) => void;
  platform_message: (data: {
    id?: string;
    mainTitle?: string;
    subTitle?: string;
    messageType?: string;
    detailUrl?: string;
    content?: string;
  }) => void;
};

type EmitEvents = {
  update: (id: string, data: { name: string; age: number }) => void;
};

export function useWebsocket() {
  const app = useAppStore();
  // const { url, urlPattern } = getServiceEnvConfig(import.meta.env);
  const isHttpProxy = import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  const userAuth = useAuthStore();

  const socket: Socket<ListenEvents, EmitEvents> = (app.socket ||
    io(baseURL, {
      transports: ['websocket'],
      reconnectionAttempts: 3,
      path: `${baseURL}/socket`,
      query: {
        userId: userAuth.userInfo.userId,
        token: userAuth.token
      }
    })) as Socket<ListenEvents, EmitEvents>;

  if (!app.socket) {
    app.setSocket(socket);
  }

  function init() {
    window.console.log('[socket.io] connecting...');

    socket.on('connect', () => {
      window.console.log('[socket.io] connected.');
    });

    socket.on('disconnect', () => {
      window.console.log('[socket.io] disconnected.');
    });

    socket.on('update', (id, data) => {
      window.console.log('[socket.io] update', id, data);
    });

    // 站内信实时推送：后端 saveSystemMessage 落库后按收件人定向发送；
    // 弹系统通知并广播 DOM 事件，消息中心/首页卡片可监听后自行刷新未读
    socket.on('platform_message', data => {
      const title = data.subTitle || data.mainTitle || '新消息';
      const message = data.content || '';
      window.$notification?.success({ title, message, duration: 6000 });
      window.dispatchEvent(new CustomEvent('platform-message', { detail: data }));
    });
  }

  function handleUpdate(id: string, data: { name: string; age: number }) {
    socket.emit('update', id, data);
  }

  init();

  return {
    socket,
    handleUpdate
  };
}
