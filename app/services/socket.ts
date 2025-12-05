import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../utils/api-config';

let socket: Socket | null = null;

export const initSocket = (opts?: { token?: string; userId?: number }) => {
  // Return existing socket if already connected
  if (socket && socket.connected) {
    console.log('♻️ Reusing existing socket connection');
    return socket;
  }

  const query: any = {};
  if (opts?.token) query.token = opts.token;
  if (opts?.userId) query.userId = opts.userId;

  console.log('🔌 Creating new socket connection with userId:', opts?.userId);

  socket = io(SOCKET_URL, {
    transports: ['polling', 'websocket'],
    upgrade: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    path: '/socket.io/',
    forceNew: false, // Changed to false to allow socket reuse
    query,
  });

  socket.on('connect', () => {
    // eslint-disable-next-line no-console
    console.log('✅ Socket connected', socket?.id, '->', SOCKET_URL);
    console.log('📡 Transport:', socket?.io?.engine?.transport?.name);
  });

  socket.on('disconnect', (reason) => {
    // eslint-disable-next-line no-console
    console.log('❌ Socket disconnected', reason);
  });

  socket.on('connect_error', (err) => {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Socket connect_error:', err.message);
    console.log('🔄 Will retry with polling...');
  });

  socket.io.on('reconnect_attempt', () => {
    console.log('🔄 Attempting to reconnect...');
  });

  socket.io.on('reconnect', (attemptNumber) => {
    console.log('✅ Reconnected after', attemptNumber, 'attempts');
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
