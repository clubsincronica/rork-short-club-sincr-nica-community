import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../utils/api-config';

let socket: Socket | null = null;

export const initSocket = (opts?: { token?: string; userId?: number }) => {
  if (socket && socket.connected) return socket;

  const query: any = {};
  if (opts?.token) query.token = opts.token;
  if (opts?.userId) query.userId = opts.userId;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    query,
  });

  socket.on('connect', () => {
    // eslint-disable-next-line no-console
    console.log('Socket connected', socket?.id, '->', SOCKET_URL);
  });

  socket.on('disconnect', (reason) => {
    // eslint-disable-next-line no-console
    console.log('Socket disconnected', reason);
  });

  socket.on('connect_error', (err) => {
    // eslint-disable-next-line no-console
    console.warn('Socket connect_error', err);
  });

  return socket;
};

export const getSocket = () => socket;

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
