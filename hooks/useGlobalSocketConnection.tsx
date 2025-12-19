import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { usePathname } from 'expo-router';
import { useUser } from '@/hooks/user-store';
import { initSocket, getSocket } from '@/utils/socket';
import { messageEventBus } from '@/utils/messageEventBus';

/**
 * Global Socket.IO connection hook
 * Sets up socket connection when user logs in and maintains it across all screens
 * This ensures message notifications work even when Messages tab hasn't been visited
 */
export function useGlobalSocketConnection() {
  const { currentUser } = useUser();
  const pathname = usePathname();
  const socketRef = useRef<ReturnType<typeof initSocket> | null>(null);
  const messageHandlerSet = useRef(false);
  const globalNotificationHandlerSet = useRef(false);

  useEffect(() => {
    // Only initialize socket if user is logged in
    let isMounted = true;
    if (currentUser?.id) {
      // Always get the token before connecting
      const connectWithToken = async () => {
        const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('authToken'));
        if (!isMounted) return;
        if (!token) {
          console.warn('❗ No auth token found, socket will not connect');
          return;
        }
        // Check if socket already exists
        const existingSocket = getSocket();
        if (!existingSocket || !existingSocket.connected) {
          console.log('🌐 Initializing global Socket.IO connection for user:', currentUser.id);
          if (__DEV__) {
            console.log('🔑 Auth token for socket:', token ? 'Found' : 'Not found');
          }
          socketRef.current = initSocket({
            userId: currentUser.id,
            token: token
          });
          const socket = socketRef.current;
          socket.on('connect', () => {
            console.log('🌐 Global socket connected');
            console.log('🌐 Socket ID:', socket.id);
            socket.emit('user:join', currentUser.id);
            console.log('🌐 Joined room: user:' + currentUser.id);
          });
          socket.on('disconnect', () => {
            console.log('🌐 Global socket disconnected');
          });
          socket.on('connect_error', (error) => {
            console.error('🌐 Global socket connection error:', error);
          });
          // Set up SINGLE message handler that emits to event bus
          if (!messageHandlerSet.current) {
            socket.on('message:new', (message: any) => {
              console.log('🌐 [GLOBAL] Received message:new event:', message);

              const isForMe = message.receiver_id === currentUser.id;
              const isSentByMe = message.sender_id === currentUser.id;

              if (isForMe && !isSentByMe) {
                console.log('🌐 [GLOBAL] Message for current user - emitting to event bus');
                messageEventBus.emitNewMessage(message);
              } else if (isSentByMe) {
                console.log('🌐 [GLOBAL] Message sent by me - emitting to event bus for conversation update');
                messageEventBus.emitNewMessage(message);
              }
            });
            messageHandlerSet.current = true;
          }
        } else {
          console.log('🌐 Global socket already connected, reusing existing connection');
          socketRef.current = existingSocket;

          if (existingSocket.connected) {
            console.log('🌐 Joining user room for user:', currentUser.id);
            existingSocket.emit('user:join', currentUser.id);
          }

          if (!messageHandlerSet.current && existingSocket) {
            existingSocket.on('message:new', (message: any) => {
              console.log('🌐 [GLOBAL] Received message:new event:', message);

              const isForMe = message.receiver_id === currentUser.id;
              const isSentByMe = message.sender_id === currentUser.id;

              if (isForMe && !isSentByMe) {
                console.log('🌐 [GLOBAL] Message for current user - emitting to event bus');
                messageEventBus.emitNewMessage(message);
              } else if (isSentByMe) {
                console.log('🌐 [GLOBAL] Message sent by me - emitting to event bus for conversation update');
                messageEventBus.emitNewMessage(message);
              }
            });
            messageHandlerSet.current = true;
          }
        }
      };

      connectWithToken();
    }

    // Cleanup on unmount or user logout
    return () => {
      isMounted = false;
      if (!currentUser?.id && socketRef.current) {
        console.log('🌐 User logged out, cleaning up global socket');
        socketRef.current.off('message:new');
        messageHandlerSet.current = false;
        globalNotificationHandlerSet.current = false;
      }
    };
  }, [currentUser?.id]);

  // Set up global event bus subscriber for fallback notifications (Alert)
  // This shows Alert when user is NOT on Messages tab
  useEffect(() => {
    if (!currentUser || globalNotificationHandlerSet.current) return;

    console.log('🌐 [GLOBAL] Setting up message event bus subscription with Alert fallback');

    const unsubscribe = messageEventBus.onNewMessage((message) => {
      // Check if user is currently on Messages tab
      const isOnMessagesTab = pathname?.includes('/messages');

      // Show Alert as fallback notification ONLY when user is NOT on Messages tab
      // Messages screen will handle notifications when tab is active
      const isForMe = message.receiver_id === currentUser.id;
      const isSentByMe = message.sender_id === currentUser.id;

      if (isForMe && !isSentByMe && !isOnMessagesTab) {
        console.log('🌐 [GLOBAL] User NOT on Messages tab - showing Alert fallback');
        Alert.alert(
          `Nuevo mensaje de ${message.sender_name || 'Usuario'}`,
          message.text,
          [{ text: 'OK' }]
        );
      } else if (isOnMessagesTab) {
        console.log('🌐 [GLOBAL] User IS on Messages tab - skipping Alert, letting Messages screen handle it');
      }

      // Don't return true - this is a fallback handler, it should always run last
      return false;
    });

    globalNotificationHandlerSet.current = true;

    return () => {
      unsubscribe();
      globalNotificationHandlerSet.current = false;
    };
  }, [currentUser, pathname]);

  return socketRef.current;
}
