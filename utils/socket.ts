import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './api-config';

let socket: Socket | null = null;

export const initSocket = (opts?: { token?: string; userId?: number }) => {
  // If socket exists, update its auth payload
  if (socket) {
    socket.auth = { token: opts?.token };

    if (socket.connected) {
      console.log('♻️ Reusing existing socket connection (updated auth)');
      return socket;
    }

    // If we have a socket but it's not connected, close it explicitly before creating a new one
    // to avoid zombie connections or manager reuse issues
    console.log('♻️ Closing disconnected socket before creating new one');
    socket.close();
    socket = null;
  }

  const query: any = {};
  // userId can stay in query for initial connection logging (optional)
  if (opts?.userId) query.userId = opts.userId;

  console.log('🔌 Creating new socket connection with userId:', opts?.userId);
  if (__DEV__) console.log('🔑 Socket Token provided:', opts?.token ? 'Yes' : 'No');

  socket = io(SOCKET_URL, {
    auth: {
      token: opts?.token, // CORRECT: Send token in auth object
    },
    transports: ['polling', 'websocket'],
    upgrade: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    path: '/socket.io/',
    forceNew: true, // Force new connection to ensure auth is applied
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
    if (err.message.includes('token')) {
      console.warn('❗ Auth Error: Token was rejected or missing.');
    }
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
